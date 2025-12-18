import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/login.css';
import { GoogleLogin } from '@react-oauth/google'; // Changed from GoogleOAuthProvider
import axios from 'axios'; // Added missing import
import server from '../environment'; // Added missing import

// --- Icons (Lucide React) ---
const ChevronLeftIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);
const AtSignIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { handleLogin, handleRegister } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name || !email || !password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        await handleRegister(name, email, password);
        setError('');
        setIsSignUp(false);
        setName('');
        setEmail('');
        setPassword('');
      } else {
        if (!email || !password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        await handleLogin(email, password);
        navigate("/home"); 
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
        const response = await axios.post(
            `${server}/api/v1/users/google_login`, // Ensure this route exists on backend
            { token: credentialResponse.credential }
        );
        
        if (response.status === 200) {
            localStorage.setItem("token", response.data.token);
            navigate("/home");
        }
    } catch (error) {
        console.error("Google login error:", error);
        setError("Google login failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <div className="left-column">
        <div className="animated-lines-bg">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="line" style={{ '--delay': `${i * 0.3}s`, '--offset': `${(i - 20) * 15}px` }} />
          ))}
        </div>
        <div className="gradient-overlay" />
        <div className="logo-section">
          <span className="logo-text">Flux</span>
        </div>
        <div className="testimonial-section">
          <blockquote className="testimonial-content">
            <p className="testimonial-text">&ldquo;Grab Your Spot in the Spotlight – Sync Up, Sit Back, and Steal the Scene with Friends.&rdquo;</p>
          </blockquote>
        </div>
      </div>

      <div className="right-column">
        <div className="background-image-container">
          <img src="/login-illustration.jpeg" alt="Login" className="background-image" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="dark-overlay" />
        </div>

        <button onClick={() => navigate('/')} className="back-button">
          <ChevronLeftIcon className="back-icon" /> Home
        </button>

        <div className="form-container">
          <div className="header-section">
            <h1 className="main-heading">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
            <p className="sub-heading">{isSignUp ? 'Join Flux to start your video meetings' : 'Login to your Flux account'}</p>
          </div>

          <div className="social-buttons" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={() => setError("Google Login Failed")}
                useOneTap
            />
          </div>

          <div className="separator-container">
            <div className="separator-line" />
            <div className="separator-text-container"><span className="separator-text">Or</span></div>
          </div>

          <form onSubmit={handleEmailLogin} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="input-fields">
              {isSignUp && (
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required={isSignUp} className="input-field" />
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Username</label>
                <div className="input-wrapper">
                  <input type="text" placeholder="your_username" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field input-with-icon" />
                  <div className="input-icon"><AtSignIcon className="icon" /></div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>

            <div className="toggle-form">
              <p className="toggle-text">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="toggle-button">
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}