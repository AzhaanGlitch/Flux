import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { AuthContext } from '../contexts/AuthContext';
import FloatingLines from '../components/FloatingLines';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [copied, setCopied] = useState(false);
    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        if (meetingCode.trim()) {
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode}`);
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleJoinVideoCall();
        }
    }

    const generateMeetingCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setMeetingCode(code);
    }

    const copyToClipboard = () => {
        if (meetingCode) {
            navigator.clipboard.writeText(meetingCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <>
            {/* Modern Navbar */}
            <div style={{
                background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)',
                padding: '1.5rem 3rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(139, 0, 0, 0.3)',
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #8B0000 0%, #600000 100%)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(139, 0, 0, 0.5)'
                    }}>
                        <VideoCallIcon sx={{ color: 'white', fontSize: '24px' }} />
                    </div>
                    <h2 style={{ 
                        background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        margin: 0,
                        fontSize: '1.8rem',
                        fontWeight: 700
                    }}>Flux</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <Button
                        onClick={() => navigate("/history")}
                        startIcon={<RestoreIcon />}
                        sx={{
                            color: "#e5e7eb",
                            textTransform: "none",
                            fontWeight: 600,
                            padding: '0.5rem 1.5rem',
                            borderRadius: '10px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                background: "rgba(139, 0, 0, 0.2)",
                                color: '#DC143C'
                            }
                        }}
                    >
                        History
                    </Button>

                    <Button 
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/auth");
                        }}
                        startIcon={<LogoutIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #8B0000 0%, #600000 100%)',
                            color: "white",
                            textTransform: "none",
                            fontWeight: 600,
                            padding: '0.5rem 1.5rem',
                            borderRadius: '10px',
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
            </div>

            {/* Main Content */}
            <div style={{ 
                position: 'relative', 
                minHeight: 'calc(100vh - 80px)',
                background: 'linear-gradient(135deg, #000000 0%, #0a0000 50%, #000000 100%)',
                overflow: 'hidden'
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

                {/* Content Container */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '4rem 2rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4rem',
                    alignItems: 'center',
                    minHeight: 'calc(100vh - 160px)'
                }}>
                    {/* Left Panel - Meeting Controls */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        padding: '3rem',
                        border: '1px solid rgba(139, 0, 0, 0.2)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    }}>
                        <div style={{
                            marginBottom: '2rem'
                        }}>
                            <h1 style={{
                                fontSize: '2.5rem',
                                fontWeight: 700,
                                color: 'white',
                                marginBottom: '1rem',
                                lineHeight: 1.2
                            }}>
                                Start Your Video
                                <span style={{
                                    display: 'block',
                                    background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    Meeting Now
                                </span>
                            </h1>
                            <p style={{
                                color: '#9ca3af',
                                fontSize: '1.1rem',
                                margin: 0
                            }}>
                                Connect with anyone, anywhere, instantly
                            </p>
                        </div>

                        {/* Meeting Code Input */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                color: '#e5e7eb',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                marginBottom: '0.5rem'
                            }}>
                                Meeting Code
                            </label>
                            <div style={{ position: 'relative' }}>
                                <TextField 
                                    onChange={e => setMeetingCode(e.target.value)} 
                                    onKeyPress={handleKeyPress}
                                    value={meetingCode}
                                    placeholder="Enter or generate code"
                                    variant="outlined"
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            height: '56px',
                                            borderRadius: '12px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: 'white',
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            letterSpacing: '0.05em',
                                            '& fieldset': {
                                                borderColor: 'rgba(139, 0, 0, 0.3)',
                                                borderWidth: '2px'
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(139, 0, 0, 0.6)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#8B0000',
                                            },
                                        },
                                        '& .MuiInputBase-input::placeholder': {
                                            color: '#6b7280',
                                            opacity: 1
                                        }
                                    }}
                                />
                                {meetingCode && (
                                    <IconButton
                                        onClick={copyToClipboard}
                                        sx={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: copied ? '#10b981' : '#9ca3af',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                color: '#8B0000'
                                            }
                                        }}
                                    >
                                        <ContentCopyIcon />
                                    </IconButton>
                                )}
                            </div>
                            {copied && (
                                <p style={{
                                    color: '#10b981',
                                    fontSize: '0.85rem',
                                    marginTop: '0.5rem',
                                    marginBottom: 0
                                }}>
                                    ✓ Code copied to clipboard
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <Button 
                                onClick={generateMeetingCode}
                                variant='outlined'
                                sx={{
                                    height: '52px',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    borderRadius: '12px',
                                    borderColor: 'rgba(139, 0, 0, 0.5)',
                                    color: '#DC143C',
                                    borderWidth: '2px',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        borderColor: '#8B0000',
                                        background: 'rgba(139, 0, 0, 0.1)',
                                        borderWidth: '2px',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                Generate Code
                            </Button>
                            <Button 
                                onClick={handleJoinVideoCall} 
                                variant='contained'
                                disabled={!meetingCode.trim()}
                                sx={{
                                    height: '52px',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                                    boxShadow: '0 4px 20px rgba(139, 0, 0, 0.4)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 30px rgba(139, 0, 0, 0.6)'
                                    },
                                    '&:disabled': {
                                        background: 'rgba(139, 0, 0, 0.3)',
                                        color: 'rgba(255, 255, 255, 0.3)'
                                    }
                                }}
                            >
                                Join Meeting
                            </Button>
                        </div>

                    </div>

                    {/* Right Panel - Illustration */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '600px'
                        }}>
                            {/* Glow Effect */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '80%',
                                height: '80%',
                                background: 'radial-gradient(circle, rgba(139, 0, 0, 0.3) 0%, transparent 70%)',
                                filter: 'blur(60px)',
                                zIndex: 0
                            }} />
                            
                            <img 
                                src='/thor.jpeg' 
                                alt="Flux video calling" 
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    position: 'relative',
                                    zIndex: 1,
                                    filter: 'drop-shadow(0 20px 60px rgba(0, 0, 0, 0.5))',
                                    animation: 'float 6s ease-in-out infinite'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Animation */}
            <style>
                {`
                    @keyframes float {
                        0%, 100% {
                            transform: translateY(0px);
                        }
                        50% {
                            transform: translateY(-20px);
                        }
                    }

                    @media (max-width: 1024px) {
                        .meetContainer > div {
                            grid-template-columns: 1fr !important;
                            gap: 2rem !important;
                            padding: 2rem 1rem !important;
                        }
                    }
                `}
            </style>
        </>
    )
}

export default withAuth(HomeComponent)