import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import RestoreIcon from '@mui/icons-material/Restore';
import '../styles/Navbar.css';

export default function Navbar({ isAuthenticated = false }) {
    const router = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        router("/auth");
    };

    return (
        <nav className="floatingNavbar">
            <div className="navContent">
                <div className='navHeader'>
                    <h2>Flux</h2>
                </div>
                
                {!isAuthenticated ? (
                    // Not logged in - Show Join as Guest, Register, Login
                    <div className='navlist'>
                        <p onClick={() => router("/guest123")}>
                            Join as Guest
                        </p>
                        <p onClick={() => router("/auth")}>
                            Register
                        </p>
                        <div onClick={() => router("/auth")} role='button' className="loginButton">
                            <p>Login</p>
                        </div>
                    </div>
                ) : (
                    // Logged in - Show History and Logout
                    <div className='navlist'>
                        <Button
                            onClick={() => router("/history")}
                            startIcon={<RestoreIcon />}
                            sx={{
                                color: "#2d3748",
                                textTransform: "none",
                                fontWeight: 600,
                                padding: '0.5rem 1rem',
                                borderRadius: '25px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: "rgba(139, 0, 0, 0.1)",
                                    color: '#8B0000'
                                }
                            }}
                        >
                            History
                        </Button>

                        <Button 
                            onClick={handleLogout}
                            startIcon={<LogoutIcon />}
                            sx={{
                                background: 'linear-gradient(135deg, #8B0000 0%, #600000 100%)',
                                color: "white",
                                textTransform: "none",
                                fontWeight: 600,
                                padding: '0.5rem 1.5rem',
                                borderRadius: '25px',
                                boxShadow: '0 4px 15px rgba(139, 0, 0, 0.4)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: "linear-gradient(135deg, #600000 0%, #8B0000 100%)",
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 20px rgba(139, 0, 0, 0.6)'
                                }
                            }}
                        >
                            Logout
                        </Button>
                    </div>
                )}
            </div>
        </nav>
    );
}