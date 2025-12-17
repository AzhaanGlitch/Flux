import React from 'react';
import { Box, Typography, Stack, Divider, IconButton } from '@mui/material';
import { AutoAwesome, Groups, Speed } from '@mui/icons-material';
const backgroundPath = "url('../about.jpg')"; 

export default function About() {
    return (
        <Box sx={{ 
            width: '100%',
            minHeight: '100vh', 
            
            // BACKGROUND IMAGE CONFIGURATION
            backgroundImage: backgroundPath, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            
            display: 'flex', 
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            position: 'relative'
        }}>
            
            {/* LEFT SIDEBAR CONTAINER */}
            <Box sx={{ 
                width: { xs: '100%', md: '45%', lg: '35%' }, 
                minHeight: '100vh',
                
                // Glassy/Dark look for text readability
                background: 'rgba(10, 10, 10, 0.9)', 
                backdropFilter: 'blur(15px)',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',

                // ROUNDED BORDERS ADDED HERE
                borderTopRightRadius: '40px',
                borderBottomRightRadius: '40px',
                
                // Inner Spacing
                p: { xs: 4, md: 6 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center', // Centers content vertically
                boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
            }}>
                
                <Typography variant="overline" sx={{ color: '#DC143C', fontWeight: 700, letterSpacing: 3, mb: 1 }}>
                    Who We Are
                </Typography>
                
                <Typography variant="h2" sx={{ 
                    fontWeight: 900, 
                    mb: 4, 
                    color: '#fff',
                    lineHeight: 0.9
                }}>
                    ABOUT <br />
                    <span style={{ color: 'transparent', WebkitTextStroke: '1px #fff' }}>FLUX</span>
                </Typography>

                <Typography variant="h6" sx={{ color: '#e5e7eb', lineHeight: 1.6, mb: 4, fontWeight: 300 }}>
                    Redefining connection through shared experiences.
                </Typography>

                <Typography variant="body1" sx={{ color: '#9ca3af', lineHeight: 1.8, mb: 6 }}>
                    FLUX connects you with your loved ones not just through conversation, but through shared moments. We integrate high-performance video conferencing with synchronized media playback, creating a virtual space that feels like you're on the same couch.
                </Typography>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 6 }} />

                {/* Feature List */}
                <Stack spacing={4}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <AutoAwesome sx={{ color: '#DC143C', fontSize: 28 }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>Sync Playback</Typography>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>Watch movies in perfect harmony.</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Groups sx={{ color: '#DC143C', fontSize: 28 }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>Real-time Interaction</Typography>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>Laugh, gasp, and chat together.</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Speed sx={{ color: '#DC143C', fontSize: 28 }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>Low Latency</Typography>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>High-quality video and audio.</Typography>
                        </Box>
                    </Box>
                </Stack>

            </Box>
        </Box>
    );
}