import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteIcon from '@mui/icons-material/Delete';
import { Container, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Navbar from '../components/Navbar';
import FloatingLines from '../components/FloatingLines';
import { deleteMeeting, deleteAllMeetings } from '../utils/history'; // Import new functions

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
    const [meetingToDelete, setMeetingToDelete] = useState(null);
    const routeTo = useNavigate();

    const fetchHistory = async () => {
        try {
            const history = await getHistoryOfUser();
            setMeetings(history);
            setLoading(false);
            setError(false);
            setDeleteError('');
        } catch (err) {
            setError(true);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleSingleDelete = (meetingCode) => {
        setMeetingToDelete(meetingCode);
        setDeleteDialogOpen(true);
    };

    const confirmSingleDelete = async () => {
        if (meetingToDelete) {
            try {
                await deleteMeeting(meetingToDelete);
                fetchHistory(); // Refetch to update UI
            } catch (err) {
                setDeleteError('Failed to delete meeting. Please try again.');
            }
        }
        setDeleteDialogOpen(false);
        setMeetingToDelete(null);
    };

    const handleDeleteAll = () => {
        setDeleteAllDialogOpen(true);
    };

    const confirmDeleteAll = async () => {
        try {
            await deleteAllMeetings();
            fetchHistory(); // Refetch to update UI
        } catch (err) {
            setDeleteError('Failed to delete all meetings. Please try again.');
        }
        setDeleteAllDialogOpen(false);
    };

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #0a0000 50%, #000000 100%)' }}>
            {/* Use common Navbar */}
            <Navbar isAuthenticated={true} />

            {/* Main Content - Full Viewport Height and Positioned Context */}
            <div style={{ 
                position: 'relative', 
                minHeight: 'calc(100vh - 80px)',
                overflow: 'hidden',
                paddingTop: '80px'
            }}>
                {/* Animated Background */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    opacity: 0.3
                }}>
                    <FloatingLines 
                        enabledWaves={['top', 'middle', 'bottom']}
                        lineCount={[12, 18, 24]}
                        lineDistance={[8, 6, 4]}
                        linesGradient={['#8B0000', '#DC143C', '#8B0000']}
                        bendRadius={5.0}
                        bendStrength={-0.5}
                        interactive={true}
                        parallax={true}
                        parallaxStrength={0.15}
                        animationSpeed={0.8}
                        mixBlendMode="normal"
                    />
                </div>

                <Container maxWidth="md" sx={{ py: 6, position: 'relative', zIndex: 2 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                            Meeting History
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#9ca3af' }}>
                            View all your past video meetings
                        </Typography>
                        {meetings.length > 0 && (
                            <Button
                                variant="outlined"
                                onClick={handleDeleteAll}
                                sx={{
                                    mt: 2,
                                    textTransform: 'none',
                                    borderColor: 'rgba(139, 0, 0, 0.5)',
                                    color: '#DC143C',
                                    fontWeight: 600,
                                    borderWidth: '2px',
                                    '&:hover': {
                                        borderColor: '#8B0000',
                                        background: 'rgba(139, 0, 0, 0.1)',
                                    }
                                }}
                                startIcon={<DeleteIcon />}
                            >
                                Delete All
                            </Button>
                        )}
                    </Box>

                    {deleteError && (
                        <Alert 
                            severity="error" 
                            sx={{ 
                                mb: 2,
                                background: 'rgba(255, 255, 255, 0.05)', 
                                color: 'white', 
                                border: '1px solid rgba(139, 0, 0, 0.2)' 
                            }}
                            onClose={() => setDeleteError('')}
                        >
                            {deleteError}
                        </Alert>
                    )}

                    {loading ? (
                        <Typography sx={{ textAlign: 'center', color: '#9ca3af' }}>
                            Loading...
                        </Typography>
                    ) : error ? (
                        <Alert severity="error" sx={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(139, 0, 0, 0.2)' }}>Failed to load meeting history</Alert>
                    ) : meetings.length === 0 ? (
                        <Card sx={{
                            textAlign: 'center',
                            py: 8,
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(139, 0, 0, 0.2)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            color: 'white'
                        }}>
                            <VideoCallIcon sx={{ fontSize: 80, color: '#9ca3af', mb: 2 }} />
                            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                                No meetings yet
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
                                Your meeting history will appear here
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => routeTo("/home")}
                                sx={{
                                    textTransform: 'none',
                                    background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                                    px: 4,
                                    py: 1,
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 20px rgba(139, 0, 0, 0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
                                        boxShadow: '0 6px 30px rgba(139, 0, 0, 0.6)'
                                    }
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
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        backdropFilter: 'blur(20px)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(139, 0, 0, 0.2)',
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                        transition: 'all 0.3s ease',
                                        color: 'white',
                                        '&:hover': {
                                            boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
                                            transform: 'translateY(-2px)',
                                            borderColor: 'rgba(139, 0, 0, 0.4)'
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Box sx={{
                                                background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                                                borderRadius: '12px',
                                                p: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <VideoCallIcon sx={{ color: 'white', fontSize: 28 }} />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5 }}>
                                                    Meeting Code: {meeting.meetingCode}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CalendarTodayIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                                        {formatDate(meeting.date)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                variant="outlined"
                                                onClick={() => routeTo(`/${meeting.meetingCode}`)}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderColor: 'rgba(139, 0, 0, 0.5)',
                                                    color: '#DC143C',
                                                    fontWeight: 600,
                                                    borderWidth: '2px',
                                                    '&:hover': {
                                                        borderColor: '#8B0000',
                                                        background: 'rgba(139, 0, 0, 0.1)',
                                                        color: '#DC143C'
                                                    }
                                                }}
                                            >
                                                Join Again
                                            </Button>
                                            <IconButton
                                                onClick={() => handleSingleDelete(meeting.meetingCode)}
                                                sx={{
                                                    color: '#9ca3af',
                                                    '&:hover': {
                                                        color: '#DC143C',
                                                        background: 'rgba(139, 0, 0, 0.1)'
                                                    }
                                                }}
                                                aria-label="Delete meeting"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}
                </Container>
            </div>

            {/* Single Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ color: 'white', background: 'rgba(139, 0, 0, 0.2)' }}>Confirm Delete</DialogTitle>
                <DialogContent sx={{ background: 'rgba(255, 255, 255, 0.03)', color: 'white' }}>
                    <DialogContentText>
                        Are you sure you want to delete this meeting? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ background: 'rgba(255, 255, 255, 0.03)', color: 'white' }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#9ca3af' }}>
                        Cancel
                    </Button>
                    <Button onClick={confirmSingleDelete} variant="contained" sx={{ background: '#DC143C', color: 'white' }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete All Confirmation Dialog */}
            <Dialog open={deleteAllDialogOpen} onClose={() => setDeleteAllDialogOpen(false)}>
                <DialogTitle sx={{ color: 'white', background: 'rgba(139, 0, 0, 0.2)' }}>Confirm Delete All</DialogTitle>
                <DialogContent sx={{ background: 'rgba(255, 255, 255, 0.03)', color: 'white' }}>
                    <DialogContentText>
                        Are you sure you want to delete all meetings? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ background: 'rgba(255, 255, 255, 0.03)', color: 'white' }}>
                    <Button onClick={() => setDeleteAllDialogOpen(false)} sx={{ color: '#9ca3af' }}>
                        Cancel
                    </Button>
                    <Button onClick={confirmDeleteAll} variant="contained" sx={{ background: '#DC143C', color: 'white' }}>
                        Delete All
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}