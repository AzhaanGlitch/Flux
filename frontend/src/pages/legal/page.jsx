import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Tabs, Tab, Fade } from '@mui/material';
import { Policy, Gavel, Cookie } from '@mui/icons-material';

// Import the separate policy components
import PrivacyPolicy from './privacyPolicy';
import TermsAndConditions from './termsAndConditions';
import CookiePolicy from './cookiePolicy';

export default function Legal() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('privacy');

    // Sync URL with Tab Selection & Scroll to TOP
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const section = params.get('section');
        
        const validSections = ['privacy', 'terms', 'cookie'];
        if (section && validSections.includes(section)) {
            setActiveTab(section);
        }

        // Always scroll to the absolute top of the page when URL changes
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        
    }, [location.search]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        // This updates the URL, which triggers the useEffect above to scroll up
        navigate(`/legal?section=${newValue}`, { replace: true });
    };

    // Render the appropriate component based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'privacy':
                return <PrivacyPolicy />;
            case 'terms':
                return <TermsAndConditions />;
            case 'cookie':
                return <CookiePolicy />;
            default:
                return <PrivacyPolicy />;
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', pb: 10 }}>
            
            {/* 1. HERO SECTION */}
            <Box sx={{ 
                pt: 15, 
                pb: 8, 
                background: 'radial-gradient(circle at 50% 0%, rgba(220, 20, 60, 0.2) 0%, rgba(0,0,0,0) 70%)',
                textAlign: 'center'
            }}>
                <Container maxWidth="md">
                    <Box 
                        component="span" 
                        sx={{ 
                            color: '#DC143C', 
                            fontWeight: 700, 
                            letterSpacing: 2, 
                            fontSize: '0.875rem',
                            textTransform: 'uppercase'
                        }}
                    >
                        LEGAL CENTER
                    </Box>
                    <Box 
                        component="h2" 
                        sx={{ 
                            fontWeight: 800, 
                            mt: 1, 
                            mb: 2,
                            fontSize: { xs: '2rem', md: '3rem' },
                            margin: '1rem 0 1rem 0'
                        }}
                    >
                        Transparency & Trust
                    </Box>
                    <Box 
                        component="p" 
                        sx={{ 
                            color: '#9ca3af', 
                            maxWidth: '600px', 
                            mx: 'auto',
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            margin: '0 auto'
                        }}
                    >
                        Please read our terms and policies carefully to understand how we operate and protect your data.
                    </Box>
                </Container>
            </Box>

            {/* 2. STICKY TABS NAVIGATION */}
            <Box sx={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 100, 
                background: 'rgba(10, 10, 10, 0.95)', 
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                mb: 6,
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Container maxWidth="lg">
                    <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange} 
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            '& .MuiTabs-flexContainer': { 
                                justifyContent: 'center' 
                            },
                            '& .MuiTab-root': { 
                                color: '#9ca3af', 
                                fontWeight: 600,
                                py: 3,
                                minHeight: 'auto',
                                textTransform: 'none',
                                fontSize: '1rem',
                                px: 4
                            },
                            '& .Mui-selected': { color: '#DC143C !important' },
                            '& .MuiTabs-indicator': { backgroundColor: '#DC143C', height: '3px' }
                        }}
                    >
                        <Tab 
                            value="privacy" 
                            label="Privacy Policy" 
                            icon={<Policy sx={{ mb: 0.5, mr: 1 }} />} 
                            iconPosition="start" 
                        />
                        <Tab 
                            value="terms" 
                            label="Terms of Service" 
                            icon={<Gavel sx={{ mb: 0.5, mr: 1 }} />} 
                            iconPosition="start" 
                        />
                        <Tab 
                            value="cookie" 
                            label="Cookie Policy" 
                            icon={<Cookie sx={{ mb: 0.5, mr: 1 }} />} 
                            iconPosition="start" 
                        />
                    </Tabs>
                </Container>
            </Box>

            {/* 3. CONTENT AREA */}
            <Container maxWidth="md">
                <Fade in={true} key={activeTab} timeout={500}>
                    <Paper sx={{ 
                        p: { xs: 4, md: 8 }, 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '24px',
                        minHeight: '60vh'
                    }}>
                        {renderContent()}
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
}