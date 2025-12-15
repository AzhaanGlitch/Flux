import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext } from '../contexts/AuthContext';
import FloatingLines from '../components/FloatingLines';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
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

    return (
        <>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>Flux</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
                        onClick={() => navigate("/history")}>
                        <IconButton sx={{ color: "#667eea" }}>
                            <RestoreIcon />
                        </IconButton>
                        <p style={{ margin: 0 }}>History</p>
                    </div>

                    <Button 
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/auth");
                        }}
                        startIcon={<LogoutIcon />}
                        sx={{
                            color: "#4a5568",
                            textTransform: "none",
                            fontWeight: 600,
                            '&:hover': {
                                background: "#f7fafc"
                            }
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Animated Background */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    opacity: 0.15
                }}>
                    <FloatingLines 
                        enabledWaves={['top', 'middle', 'bottom']}
                        lineCount={[8, 12, 16]}
                        lineDistance={[10, 7, 5]}
                        linesGradient={['#667eea', '#764ba2', '#667eea']}
                        bendRadius={5.0}
                        bendStrength={-0.5}
                        interactive={true}
                        parallax={true}
                        parallaxStrength={0.15}
                        animationSpeed={0.8}
                        mixBlendMode="normal"
                    />
                </div>

                {/* Content */}
                <div className="leftPanel" style={{ position: 'relative', zIndex: 1 }}>
                    <div>
                        <h2>Start Your Video Meeting Now</h2>
                        <div style={{ display: 'flex', gap: "1rem", marginTop: "2rem" }}>
                            <TextField 
                                onChange={e => setMeetingCode(e.target.value)} 
                                onKeyPress={handleKeyPress}
                                value={meetingCode}
                                placeholder="Enter meeting code"
                                variant="outlined"
                                fullWidth
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        background: 'white',
                                        '& fieldset': {
                                            borderColor: '#e2e8f0',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#667eea',
                                        },
                                    },
                                }}
                            />
                            <Button 
                                onClick={handleJoinVideoCall} 
                                variant='contained'
                                disabled={!meetingCode.trim()}
                                sx={{
                                    minWidth: '120px',
                                    textTransform: 'none',
                                    fontSize: '1rem'
                                }}
                            >
                                Join
                            </Button>
                        </div>
                    </div>
                </div>

                <div className='rightPanel' style={{ position: 'relative', zIndex: 1 }}>
                    <img src='/logo3.png' alt="Flux video calling" />
                </div>
            </div>
        </>
    )
}

export default withAuth(HomeComponent)