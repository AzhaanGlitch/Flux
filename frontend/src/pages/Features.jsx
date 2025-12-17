import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { 
    Movie, 
    VideoCall, 
    Groups, 
    Security, 
    ScreenShare, 
    History, 
    Devices, 
    FlashOn 
} from '@mui/icons-material';
const backgroundPath = "url('../features.jpg')"; 

const features = [
    { 
        title: "Watch Parties", 
        desc: "Sync movie playback with friends for a real-time cinema experience.", 
        icon: <Movie sx={{ fontSize: 40, color: '#DC143C' }} /> 
    },
    { 
        title: "HD Video Calls", 
        desc: "Crystal clear video and audio quality for seamless communication.", 
        icon: <VideoCall sx={{ fontSize: 40, color: '#DC143C' }} /> 
    },
    { 
        title: "Live Chat", 
        desc: "Interactive chat features with emojis and reactions while watching.", 
        icon: <Groups sx={{ fontSize: 40, color: '#DC143C' }} /> 
    },
    { 
        title: "Secure Rooms", 
        desc: "Encrypted meeting rooms to ensure your private moments stay private.", 
        icon: <Security sx={{ fontSize: 40, color: '#DC143C' }} /> 
    },
    { 
        title: "Screen Sharing", 
        desc: "Share your screen instantly for presentations or showing content.", 
        icon: <ScreenShare sx={{ fontSize: 40, color: '#DC143C' }} /> 
    },
    { 
        title: "Meeting History", 
        desc: "Keep track of all your past calls and revisit connections.", 
        icon: <History sx={{ fontSize: 40, color: '#DC143C' }} /> 
    },
    { 
        title: "Cross-Platform", 
        desc: "Join from your laptop, tablet, or phone directly via the browser.", 
        icon: <Devices sx={{ fontSize: 40, color: '#DC143C' }} /> 
    },
    { 
        title: "Instant Access", 
        desc: "No downloads required. Just share a link and start connecting.", 
        icon: <FlashOn sx={{ fontSize: 40, color: '#DC143C' }} /> 
    }
];

export default function Features() {
    return (
        <Box sx={{ 
            minHeight: '100vh', 
            py: 10, 
            background: `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(20,0,0,0.9)), ${backgroundPath}`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#fff'
        }}>
            <Container maxWidth="lg">
                <Typography variant="h2" sx={{ 
                    fontWeight: 800, 
                    mb: 2, 
                    textAlign: 'center', 
                    background: 'linear-gradient(135deg, #fff 30%, #DC143C 100%)',
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent' 
                }}>
                    Why Choose FLUX?
                </Typography>
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#9ca3af', mb: 8, maxWidth: '800px', mx: 'auto' }}>
                    Everything you need for work, play, and everything in between.
                </Typography>

                <Grid container spacing={4}>
                    {features.map((f, i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Card sx={{ 
                                height: '100%', 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                backdropFilter: 'blur(10px)', 
                                border: '1px solid rgba(255, 255, 255, 0.1)', 
                                color: '#fff', 
                                borderRadius: '16px',
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                    transform: 'translateY(-10px)', 
                                    borderColor: '#DC143C',
                                    boxShadow: '0 10px 30px rgba(220, 20, 60, 0.2)'
                                }
                            }}>
                                <CardContent sx={{ textAlign: 'center', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: '50%', 
                                        background: 'rgba(220, 20, 60, 0.1)', 
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        {f.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>{f.title}</Typography>
                                    <Typography variant="body2" sx={{ color: '#9ca3af', lineHeight: 1.6 }}>{f.desc}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}