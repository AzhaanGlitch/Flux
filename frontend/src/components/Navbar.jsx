import React, { useState, useEffect, useContext } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext'; 

export default function Navbar() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    
    // Check if user is authenticated by checking localStorage token
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { setUserData } = useContext(AuthContext);

    // Check authentication status on mount and when localStorage changes
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            setIsAuthenticated(!!token);
        };

        checkAuth();

        // Listen for storage changes (in case user logs in/out in another tab)
        window.addEventListener('storage', checkAuth);
        
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    // Detect scroll for glass effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Logout Function
    const handleLogout = () => {
        localStorage.removeItem("token"); 
        setUserData(null); 
        setIsAuthenticated(false);
        navigate('/auth'); 
    };

    return (
        <AppBar 
            position="fixed" 
            sx={{ 
                background: scrolled ? 'rgba(0, 0, 0, 0.4)' : 'transparent',
                backdropFilter: scrolled ? 'blur(15px)' : 'none',
                boxShadow: scrolled ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : 'none',
                border: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                borderRadius: '50px',
                transition: 'all 0.3s ease',
                padding: '10px 0',
                margin: '20px auto',
                maxWidth: '95%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'auto',
                opacity: '1'
            }}
            elevation={0}
        >
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    
                    {/* LEFT SIDE: FLUX LOGO */}
                    <Typography
                        variant="h5"
                        onClick={() => navigate('/')}
                        sx={{
                            fontWeight: 800,
                            letterSpacing: '2px',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #fff 0%, #DC143C 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            '&:hover': { opacity: 0.8 }
                        }}
                    >
                        FLUX
                    </Typography>

                    {/* RIGHT SIDE: CONDITIONAL BUTTONS */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        
                        {isAuthenticated ? (
                            /* LOGGED IN VIEW: History + Logout */
                            <>
                                <Button 
                                    onClick={() => navigate('/history')}
                                    sx={{
                                        color: '#fff',
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        '&:hover': { color: '#DC143C', background: 'transparent' }
                                    }}
                                >
                                    History
                                </Button>

                                <Button 
                                    variant="outlined" 
                                    onClick={handleLogout}
                                    sx={{ 
                                        borderColor: '#DC143C', 
                                        color: '#DC143C',
                                        borderRadius: '20px',
                                        px: 3,
                                        '&:hover': {
                                            borderColor: '#ff4d4d',
                                            background: 'rgba(220, 20, 60, 0.1)'
                                        }
                                    }}
                                >
                                    Logout
                                </Button>
                            </>
                        ) : (
                            /* LOGGED OUT VIEW: Only Sign In */
                            <Button 
                                variant="outlined" 
                                onClick={() => navigate('/auth')}
                                sx={{ 
                                    borderColor: '#DC143C', 
                                    color: '#DC143C',
                                    borderRadius: '20px',
                                    px: 3,
                                    '&:hover': {
                                        borderColor: '#ff4d4d',
                                        background: 'rgba(220, 20, 60, 0.1)'
                                    }
                                }}
                            >
                                Sign In
                            </Button>
                        )}
                    </Box>

                </Toolbar>
            </Container>
        </AppBar>
    );
}