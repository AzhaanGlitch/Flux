import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Container, Alert } from '@mui/material';
import Navbar from '../components/Navbar';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
                setLoading(false);
            } catch (err) {
                setError(true);
                setLoading(false);
            }
        }
        fetchHistory();
    }, []);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f7fafc, #edf2f7)' }}>
            {/* Use common Navbar */}
            <div style={{ paddingTop: '80px' }}>
                <Navbar isAuthenticated={true} />
            </div>

            <Container maxWidth="md" sx={{ py: 6 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                        Meeting History
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#718096' }}>
                        View all your past video meetings
                    </Typography>
                </Box>

                {loading ? (
                    <Typography sx={{ textAlign: 'center', color: '#718096' }}>
                        Loading...
                    </Typography>
                ) : error ? (
                    <Alert severity="error">Failed to load meeting history</Alert>
                ) : meetings.length === 0 ? (
                    <Card sx={{
                        textAlign: 'center',
                        py: 8,
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <VideoCallIcon sx={{ fontSize: 80, color: '#cbd5e0', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#4a5568', mb: 1 }}>
                            No meetings yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', mb: 3 }}>
                            Your meeting history will appear here
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => routeTo("/home")}
                            sx={{
                                textTransform: 'none',
                                background: '#667eea',
                                px: 4,
                                py: 1,
                                borderRadius: '8px',
                                fontWeight: 600
                            }}
                        >
                            Start a Meeting
                        </Button>
                    </Card>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {meetings.map((meeting, index) => (
                            <Card
                                key={index}
                                sx={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Box sx={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: '12px',
                                            p: 1.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <VideoCallIcon sx={{ color: 'white', fontSize: 28 }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748', mb: 0.5 }}>
                                                Meeting Code: {meeting.meetingCode}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CalendarTodayIcon sx={{ fontSize: 16, color: '#718096' }} />
                                                <Typography variant="body2" sx={{ color: '#718096' }}>
                                                    {formatDate(meeting.date)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            onClick={() => routeTo(`/${meeting.meetingCode}`)}
                                            sx={{
                                                textTransform: 'none',
                                                borderColor: '#667eea',
                                                color: '#667eea',
                                                fontWeight: 600,
                                                '&:hover': {
                                                    borderColor: '#5568d3',
                                                    background: 'rgba(102, 126, 234, 0.08)'
                                                }
                                            }}
                                        >
                                            Join Again
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Container>
        </Box>
    )
}