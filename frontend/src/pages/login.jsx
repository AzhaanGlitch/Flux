import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/login.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// --- Icons (Lucide React) ---
const ChevronLeftIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);
const AtSignIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>
);
const GoogleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669 C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62 c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401 c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" /></svg>
);

// --- Main Login Page Component ---
export default function Login() {
  const navigate = useNavigate();
  const { handleLogin, handleRegister } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Handle Email/Password Login
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

  // Handle Google Login (placeholder)
  const handleGoogleLogin = async (credentialResponse) => {
    try {
        const response = await axios.post(
            `${server}/api/v1/auth/google`,
            { token: credentialResponse.credential }
        );
        
        if (response.status === 200) {
            localStorage.setItem("token", response.data.token);
            navigate("/home");
        }
    } catch (error) {
        console.error("Google login error:", error);
        setError("Google login failed. Please try again.");
    }
};

  return (
    <main className="login-container">
      
      {/* --- Left Column: Art & Testimonials --- */}
      <div className="left-column">
        
        {/* Animated Background Lines */}
        <div className="animated-lines-bg">
          {[...Array(40)].map((_, i) => (
            <div 
              key={i} 
              className="line" 
              style={{
                '--delay': `${i * 0.3}s`,
                '--offset': `${(i - 20) * 15}px`
              }}
            />
          ))}
        </div>

        {/* Gradient Overlay */}
        <div className="gradient-overlay" />
        
        {/* Logo */}
        <div className="logo-section">
          <span className="logo-text">Flux</span>
        </div>

        {/* Testimonial */}
        <div className="testimonial-section">
          <blockquote className="testimonial-content">
            <p className="testimonial-text">
              &ldquo;Grab Your Spot in the Spotlight – Sync Up, Sit Back, and Steal the Scene with Friends.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>

      {/* --- Right Column: Auth Form --- */}
      <div className="right-column">
        
        {/* Background Image */}
        <div className="background-image-container">
          <img
            src="/login-illustration.jpeg"
            alt="Login Illustration"
            className="background-image" 
            onError={(e) => { 
                e.target.style.display = 'none'; 
            }}
          />
          <div className="dark-overlay" />
        </div>

        {/* Background Glow Effects */}
        <div aria-hidden="true" className="glow-effects">
          <div className="glow-purple" />
          <div className="glow-blue" />
        </div>

        {/* Back to Home Button */}
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          <ChevronLeftIcon className="back-icon" />
          Home
        </button>

        {/* Form Container */}
        <div className="form-container">
          
          {/* Mobile Logo */}
          <div className="mobile-logo">
             <span className="mobile-logo-text">Flux</span>
          </div>

          {/* Headers */}
          <div className="header-section">
            <h1 className="main-heading">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="sub-heading">
              {isSignUp ? 'Join Flux to start your video meetings' : 'Login to your Flux account'}
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="social-buttons">
            <button 
              onClick={handleGoogleLogin}
              className="google-button"
              type="button"
            >
              <GoogleIcon className="google-icon" />
              Continue with Google
            </button>
          </div>

          {/* Separator */}
          <div className="separator-container">
            <div className="separator-line" />
            <div className="separator-text-container">
              <span className="separator-text">Or</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="auth-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="input-fields">
              {isSignUp && (
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Username</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="your_username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field input-with-icon"
                  />
                  <div className="input-icon">
                    <AtSignIcon className="icon" />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-wrapper">
                   <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>

            <div className="toggle-form">
              <p className="toggle-text">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setName('');
                    setEmail('');
                    setPassword('');
                  }}
                  className="toggle-button"
                >
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