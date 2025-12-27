// pages/VideoMeet.jsx (Refactored - Part 1/3)
import React, { useEffect, useRef, useState } from 'react';
import { Badge, IconButton, TextField, Button, Tooltip } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

import { usePeerConnections } from '../hooks/usePeerConnections';
import { useScreenShare } from '../hooks/useScreenShare';

export default function VideoMeetComponent() {
    const [username, setUsername] = useState('');
    const [askForUsername, setAskForUsername] = useState(true);
    const [localStream, setLocalStream] = useState(null);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [showModal, setModal] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [newMessages, setNewMessages] = useState(0);
    const [copied, setCopied] = useState(false);

    const localVideoRef = useRef();
    const roomCode = window.location.pathname.substring(1);

    // Get peer connections hook
    const {
        videoStreams,
        connectionError,
        socket,
        peerConnections
    } = usePeerConnections(
        askForUsername ? null : roomCode,
        username,
        localStream
    );

    // Get screen share hook
    const {
        isScreenSharing,
        startScreenShare,
        stopScreenShare,
        screenStream,
    } = useScreenShare(socket, peerConnections, localStream);

    // Initialize media on lobby screen
    useEffect(() => {
        const initializeMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });

                setLocalStream(stream);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('❌ Failed to get media:', error);
                alert('Camera/microphone access denied. Please enable permissions.');
            }
        };

        initializeMedia();
    }, []);

    // Update local stream when video/audio toggles
    useEffect(() => {
        if (!localStream) return;

        localStream.getVideoTracks().forEach(track => {
            track.enabled = video;
        });

        localStream.getAudioTracks().forEach(track => {
            track.enabled = audio;
        });
    }, [video, audio, localStream]);

    // Chat handlers
    useEffect(() => {
        if (!socket) return;

        socket.on('chat-message', (data, sender, socketIdSender) => {
            setMessages(prev => [...prev, { sender, data }]);

            if (socketIdSender !== socket.id) {
                setNewMessages(prev => prev + 1);
            }
        });

        return () => socket.off('chat-message');
    }, [socket]);

    const sendMessage = () => {
        if (message.trim() && socket) {
            socket.emit('chat-message', message, username);
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    const handleEndCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }

        window.location.href = '/';
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const connect = () => {
        if (username.trim()) {
            setAskForUsername(false);
        }
    };

    const getGridColumns = (count) => {
        if (count <= 1) return 1;
        if (count <= 4) return 2;
        if (count <= 9) return 3;
        return 4;
    };

    // Render lobby screen (unchanged for brevity - see original code)
    if (askForUsername) {
        return (
            <div style={{/* ... lobby styles ... */ }}>
                {/* Lobby UI - Keep your existing code */}
            </div>
        );
    }

    return (
        <div style={{
            position: 'relative',
            height: '100vh',
            background: 'linear-gradient(135deg, #000000 0%, #0a0000 100%)',
            overflow: 'hidden'
        }}>
            {/* Header with room link */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(139, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 20px',
                zIndex: 200
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    maxWidth: '600px',
                    width: '100%'
                }}>
                    <TextField
                        value={window.location.href}
                        InputProps={{
                            readOnly: true,
                            sx: {
                                borderRadius: '20px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                height: '40px',
                                '& fieldset': { border: 'none' },
                                '& input': { color: 'white', fontSize: '0.9rem' }
                            }
                        }}
                        variant="outlined"
                        fullWidth
                        size="small"
                    />
                    <Tooltip title={copied ? "Copied!" : "Copy link"} arrow>
                        <IconButton
                            onClick={handleCopyLink}
                            sx={{
                                background: copied ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.15)',
                                color: copied ? '#4CAF50' : 'white',
                                width: '40px',
                                height: '40px',
                                '&:hover': {
                                    background: copied ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.25)',
                                }
                            }}
                        >
                            {copied ? <CheckIcon /> : <ContentCopyIcon />}
                        </IconButton>
                    </Tooltip>
                </div>
            </div>

            {/* Connection Error Alert */}
            {connectionError && (
                <div style={{
                    position: 'absolute',
                    top: '90px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 300,
                    background: 'rgba(220, 38, 38, 0.9)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}>
                    ⚠️ {connectionError}
                </div>
            )}

            {/* Video Grid */}
            <div style={{
                position: 'absolute',
                top: 70,
                left: 0,
                right: 0,
                bottom: 100,
                display: 'grid',
                gridTemplateColumns: `repeat(${getGridColumns(videoStreams.length)}, 1fr)`,
                padding: '20px',
                gap: '20px',
                overflow: 'auto'
            }}>
                {videoStreams.map((videoData, index) => (
                    <VideoTile
                        key={`${videoData.socketId}-${videoData.type}`}
                        videoData={videoData}
                        index={index}
                    />
                ))}
            </div>

            {/* Chat Modal */}
            {showModal && (
                <div style={{
                    position: 'absolute',
                    height: 'calc(100vh - 40px)',
                    right: '20px',
                    top: '90px',
                    background: 'rgba(0, 0, 0, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    width: '380px',
                    border: '1px solid rgba(139, 0, 0, 0.3)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 1000
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        padding: '20px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            paddingBottom: '15px',
                            borderBottom: '2px solid rgba(139, 0, 0, 0.3)'
                        }}>
                            <h1 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'white',
                                margin: 0
                            }}>Chat</h1>
                            <IconButton
                                onClick={() => setModal(false)}
                                sx={{ color: '#9ca3af', '&:hover': { color: '#DC143C' } }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </div>

                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            marginBottom: '20px',
                            paddingRight: '10px'
                        }}>
                            {messages.length > 0 ? messages.map((item, idx) => (
                                <div key={idx} style={{
                                    background: 'rgba(139, 0, 0, 0.1)',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    marginBottom: '12px',
                                    border: '1px solid rgba(139, 0, 0, 0.2)'
                                }}>
                                    <p style={{
                                        fontWeight: 600,
                                        color: '#DC143C',
                                        marginBottom: '4px',
                                        fontSize: '0.9rem',
                                        margin: '0 0 4px 0'
                                    }}>{item.sender}</p>
                                    <p style={{
                                        color: '#e5e7eb',
                                        margin: 0,
                                        wordWrap: 'break-word'
                                    }}>{item.data}</p>
                                </div>
                            )) : (
                                <p style={{
                                    textAlign: 'center',
                                    color: '#6b7280',
                                    marginTop: '2rem'
                                }}>No messages yet</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                            <TextField
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                variant="outlined"
                                size="small"
                                fullWidth
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        '& fieldset': { borderColor: 'rgba(139, 0, 0, 0.3)' },
                                        '&:hover fieldset': { borderColor: 'rgba(139, 0, 0, 0.5)' },
                                        '&.Mui-focused fieldset': { borderColor: '#DC143C' }
                                    },
                                    '& input': { color: 'white' },
                                    '& input::placeholder': { color: '#9ca3af', opacity: 1 }
                                }}
                            />
                            <IconButton
                                onClick={sendMessage}
                                disabled={!message.trim()}
                                sx={{
                                    background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                                    color: 'white',
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
                                    },
                                    '&:disabled': {
                                        background: 'rgba(139, 0, 0, 0.3)',
                                        color: 'rgba(255, 255, 255, 0.3)'

                                    }
                                }}
                            >
                                <SendIcon />
                            </IconButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Control Buttons */}
            <div style={{
                position: 'absolute',
                width: '100%',
                bottom: '30px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '15px',
                zIndex: 100
            }}>
                <Tooltip title={video ? "Turn off camera" : "Turn on camera"} arrow>
                    <IconButton
                        onClick={() => setVideo(!video)}
                        sx={{
                            background: video ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 0, 0, 0.8)',
                            width: '60px',
                            height: '60px',
                            color: 'white',
                            '&:hover': {
                                background: video ? 'rgba(255, 255, 255, 0.25)' : 'rgba(139, 0, 0, 1)',
                            }
                        }}
                    >
                        {video ? <VideocamIcon sx={{ fontSize: '2rem' }} /> : <VideocamOffIcon sx={{ fontSize: '2rem' }} />}
                    </IconButton>
                </Tooltip>

                <Tooltip title="End call" arrow>
                    <IconButton
                        onClick={handleEndCall}
                        sx={{
                            background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                            width: '70px',
                            height: '70px',
                            color: 'white',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
                            }
                        }}
                    >
                        <CallEndIcon sx={{ fontSize: '2.2rem' }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title={audio ? "Mute" : "Unmute"} arrow>
                    <IconButton
                        onClick={() => setAudio(!audio)}
                        sx={{
                            background: audio ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 0, 0, 0.8)',
                            width: '60px',
                            height: '60px',
                            color: 'white',
                            '&:hover': {
                                background: audio ? 'rgba(255, 255, 255, 0.25)' : 'rgba(139, 0, 0, 1)',
                            }
                        }}
                    >
                        {audio ? <MicIcon sx={{ fontSize: '2rem' }} /> : <MicOffIcon sx={{ fontSize: '2rem' }} />}
                    </IconButton>
                </Tooltip>

                <Tooltip title={isScreenSharing ? "Stop sharing" : "Share screen"} arrow>
                    <IconButton
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                        sx={{
                            background: isScreenSharing ? 'rgba(139, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.15)',
                            width: '60px',
                            height: '60px',
                            color: 'white',
                            '&:hover': {
                                background: isScreenSharing ? 'rgba(139, 0, 0, 1)' : 'rgba(255, 255, 255, 0.25)',
                            }
                        }}
                    >
                        {isScreenSharing ? <StopScreenShareIcon sx={{ fontSize: '2rem' }} /> : <ScreenShareIcon sx={{ fontSize: '2rem' }} />}
                    </IconButton>
                </Tooltip>

                <Tooltip title="Chat" arrow>
                    <IconButton
                        onClick={() => {
                            setModal(true);
                            setNewMessages(0);
                        }}
                        sx={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            width: '60px',
                            height: '60px',
                            color: 'white',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.25)',
                            }
                        }}
                    >
                        <Badge badgeContent={newMessages} color="error">
                            <ChatIcon sx={{ fontSize: '2rem' }} />
                        </Badge>
                    </IconButton>
                </Tooltip>
            </div>
        </div>
    );

}

// Video Tile Component with Animations
const VideoTile = ({ videoData, index }) => {
    const videoRef = useRef();
    useEffect(() => {
        if (videoRef.current && videoData.stream) {
            videoRef.current.srcObject = videoData.stream;
        }
    }, [videoData.stream]);

    const isScreenShare = videoData.type === 'screen';
    const transform = videoData.isLocal && !isScreenShare ? 'scaleX(-1)' : 'none';

    return (
        <div
            style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                border: isScreenShare ? '3px solid #DC143C' : '2px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.3)',
                animation: 'fadeIn 0.5s ease-in-out',
                // Make screen shares larger
                gridColumn: isScreenShare ? 'span 2' : 'span 1',
                gridRow: isScreenShare ? 'span 2' : 'span 1',
            }}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={videoData.isLocal}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform,
                }}
            />
            <div style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
            }}>
                {isScreenShare && '🖥️ '}
                {videoData.name || 'Unknown'}
            </div>
        </div>
    );
};