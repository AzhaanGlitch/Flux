import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Tabs, Tab, Fade } from '@mui/material';
import { Policy, Gavel, Cookie } from '@mui/icons-material';

// Dummy Data
const legalContent = {
    privacy: {
        title: "Privacy Policy",
        lastUpdated: "December 14, 2025",
        content: `
            1. Introduction
            Welcome to FLUX. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.

            2. Data We Collect
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows: Identity Data, Contact Data, Technical Data, and Usage Data.

            3. How We Use Your Data
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances: Where we need to perform the contract we are about to enter into or have entered into with you.
        `
    },
    terms: {
        title: "Terms and Conditions",
        lastUpdated: "November 20, 2025",
        content: `
            1. Agreement to Terms
            By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.

            2. Intellectual Property
            The Service and its original content, features and functionality are and will remain the exclusive property of FLUX and its licensors.

            3. User Accounts
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.
        `
    },
    cookie: {
        title: "Cookie Policy",
        lastUpdated: "October 10, 2025",
        content: `
            1. What Are Cookies
            Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you.

            2. How We Use Cookies
            When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes: to enable certain functions of the Service, to provide analytics, to store your preferences.
        `
    }
};

export default function Legal() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('privacy');

    // Sync URL with Tab Selection & Scroll to TOP
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const section = params.get('section');
        
        if (section && legalContent[section]) {
            setActiveTab(section);
        }

        // FIX: Always scroll to the absolute top of the page when URL changes
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        
    }, [location.search]); // Triggers whenever ?section= changes

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        // This updates the URL, which triggers the useEffect above to scroll up
        navigate(`/legal?section=${newValue}`, { replace: true });
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
                    <Typography variant="overline" sx={{ color: '#DC143C', fontWeight: 700, letterSpacing: 2 }}>
                        LEGAL CENTER
                    </Typography>
                    <Typography variant="h2" sx={{ fontWeight: 800, mt: 1, mb: 2 }}>
                        Transparency & Trust
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#9ca3af', maxWidth: '600px', mx: 'auto' }}>
                        Please read our terms and policies carefully to understand how we operate and protect your data.
                    </Typography>
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
                display: 'flex',            // Added to help centering
                justifyContent: 'center'    // Added to help centering
            }}>
                <Container maxWidth="lg">
                    <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange} 
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            // FORCE CENTER ALIGNMENT FOR TABS
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
                                px: 4 // Add horizontal padding to separate tabs visually
                            },
                            '& .Mui-selected': { color: '#DC143C !important' },
                            '& .MuiTabs-indicator': { backgroundColor: '#DC143C', height: '3px' }
                        }}
                    >
                        <Tab value="privacy" label="Privacy Policy" icon={<Policy sx={{ mb: 0.5, mr: 1 }} />} iconPosition="start" />
                        <Tab value="terms" label="Terms of Service" icon={<Gavel sx={{ mb: 0.5, mr: 1 }} />} iconPosition="start" />
                        <Tab value="cookie" label="Cookie Policy" icon={<Cookie sx={{ mb: 0.5, mr: 1 }} />} iconPosition="start" />
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff' }}>
                                    {legalContent[activeTab].title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 1 }}>
                                    Last Updated: {legalContent[activeTab].lastUpdated}
                                </Typography>
                            </Box>
                        </Box>

                        <Typography component="div" sx={{ 
                            color: '#d1d5db', 
                            lineHeight: 1.8, 
                            whiteSpace: 'pre-line',
                            fontSize: '1.05rem',
                            '& h1, & h2, & h3': { color: '#fff', mt: 4, mb: 2 },
                        }}>
                            {legalContent[activeTab].content}
                        </Typography>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
}