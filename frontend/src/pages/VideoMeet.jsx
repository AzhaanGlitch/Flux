// frontend/src/pages/VideoMeet.jsx - COMPLETE FIXED VERSION

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

import { usePeerConnections } from '../hooks/usePeerConnections';
import { useScreenShare } from '../hooks/useScreenShare';

// ============================================================================
// VIDEO TILE COMPONENT - PROPERLY DEFINED
// ============================================================================
const VideoTile = React.memo(({ videoData, index }) => {
    const videoRef = useRef();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Attach stream to video element
    useEffect(() => {
        if (videoRef.current && videoData.stream) {
            console.log(`🎬 Attaching stream to video element for ${videoData.socketId}`);
            videoRef.current.srcObject = videoData.stream;

            const handleLoadedMetadata = () => {
                console.log('✅ Video metadata loaded for:', videoData.socketId);
                setIsLoaded(true);
                
                // Force play
                videoRef.current.play().catch(err => {
                    console.error('Play error:', err);
                });
            };

            const handleCanPlay = () => {
                console.log('✅ Video can play:', videoData.socketId);
                videoRef.current.play().catch(err => {
                    console.error('Play error:', err);
                });
            };

            videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
            videoRef.current.addEventListener('canplay', handleCanPlay);

            // Immediate play attempt
            videoRef.current.play().catch(err => {
                console.log('Initial play prevented (expected):', err.message);
            });

            return () => {
                if (videoRef.current) {
                    videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
                    videoRef.current.removeEventListener('canplay', handleCanPlay);
                }
            };
        }
    }, [videoData.stream, videoData.socketId]);

    // Audio level detection for speaking indicator
    useEffect(() => {
        if (!videoData.stream || videoData.type === 'screen' || videoData.isLocal) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(videoData.stream);
            
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.8;
            microphone.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let animationId;

            const detectSpeaking = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                
                setIsSpeaking(average > 20);
                
                animationId = requestAnimationFrame(detectSpeaking);
            };

            detectSpeaking();

            return () => {
                cancelAnimationFrame(animationId);
                audioContext.close();
            };
        } catch (error) {
            console.error('Audio analysis error:', error);
        }
    }, [videoData.stream, videoData.type, videoData.isLocal]);

    const isScreenShare = videoData.type === 'screen';
    const transform = videoData.isLocal && !isScreenShare ? 'scaleX(-1)' : 'none';

    return (
        <div
            style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: isScreenShare
                    ? '0 0 30px rgba(220, 38, 38, 0.5), 0 10px 40px rgba(0, 0, 0, 0.4)'
                    : '0 10px 30px rgba(0, 0, 0, 0.3)',
                border: isScreenShare
                    ? '3px solid #DC143C'
                    : isSpeaking 
                        ? '3px solid #10b981'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.5)',
                gridColumn: isScreenShare ? 'span 2' : 'span 1',
                gridRow: isScreenShare ? 'span 2' : 'span 1',
                minHeight: '200px',
                transition: 'all 0.3s ease',
            }}
        >
            {/* Loading indicator */}
            {!isLoaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    zIndex: 1
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid rgba(255,255,255,0.3)',
                            borderTop: '4px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 10px'
                        }} />
                        <p style={{ margin: 0 }}>Loading video...</p>
                    </div>
                </div>
            )}

            {/* Video element */}
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
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    display: 'block',
                }}
            />

            {/* Speaking indicator ring */}
            {isSpeaking && !videoData.isLocal && (
                <div style={{
                    position: 'absolute',
                    inset: '5px',
                    border: '3px solid #10b981',
                    borderRadius: '16px',
                    pointerEvents: 'none',
                    animation: 'pulse 1.5s ease-in-out infinite',
                }} />
            )}

            {/* Participant label */}
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
                backdropFilter: 'blur(10px)',
            }}>
                {isScreenShare && '🖥️ '}
                {videoData.name || 'Unknown'}
                {videoData.isLocal && ' (You)'}
            </div>

            {/* Screen share badge */}
            {isScreenShare && (
                <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'linear-gradient(135deg, #DC143C, #8B0000)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.5)',
                }}>
                    Screen Share
                </div>
            )}
        </div>
    );
});

VideoTile.displayName = 'VideoTile';

// ============================================================================
// MAIN VIDEO MEET COMPONENT
// ============================================================================
export default function VideoMeetComponent() {
    // State management
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
    const [mediaReady, setMediaReady] = useState(false);

    // Refs
    const localVideoRef = useRef();
    const streamInitializedRef = useRef(false);
    const roomCode = window.location.pathname.substring(1);

    // Hooks - Initialize after username is set
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

    const {
        isScreenSharing,
        startScreenShare,
        stopScreenShare,
    } = useScreenShare(socket, peerConnections, localStream);

    // Initialize media ONCE on component mount
    useEffect(() => {
        if (streamInitializedRef.current) return;

        const initializeMedia = async () => {
            try {
                console.log('🎥 Requesting media access...');
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

                console.log('✅ Media access granted:', stream.getTracks());
                streamInitializedRef.current = true;
                setLocalStream(stream);
                setMediaReady(true);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.play().catch(err => {
                        console.log('Autoplay prevented (expected):', err);
                    });
                }
            } catch (error) {
                console.error('❌ Failed to get media:', error);
                alert('Camera/microphone access denied. Please enable permissions and reload the page.');
            }
        };

        initializeMedia();

        return () => {
            console.log('🧹 Component unmounting - cleaning up media');
            if (localStream && streamInitializedRef.current) {
                localStream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Stopped track:', track.kind);
                });
                streamInitializedRef.current = false;
            }
        };
    }, []);

    // Re-attach video element when switching screens
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            console.log('Re-attaching local stream to video element');
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(err => {
                console.log('Play prevented:', err);
            });
        }
    }, [localStream, askForUsername]);

    // Update track enabled state
    useEffect(() => {
        if (!localStream) return;

        console.log('Updating tracks - Video:', video, 'Audio:', audio);

        localStream.getVideoTracks().forEach(track => {
            track.enabled = video;
            console.log('Video track enabled:', track.enabled);
        });

        localStream.getAudioTracks().forEach(track => {
            track.enabled = audio;
            console.log('Audio track enabled:', track.enabled);
        });
    }, [video, audio, localStream]);

    // Chat message handler
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (data, sender, socketIdSender) => {
            setMessages(prev => [...prev, { sender, data }]);

            if (socketIdSender !== socket.id) {
                setNewMessages(prev => prev + 1);
            }
        };

        socket.on('chat-message', handleChatMessage);

        return () => socket.off('chat-message', handleChatMessage);
    }, [socket]);

    // Event handlers
    const sendMessage = useCallback(() => {
        if (message.trim() && socket) {
            socket.emit('chat-message', message, username);
            setMessage('');
        }
    }, [message, socket, username]);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') sendMessage();
    }, [sendMessage]);

    const handleEndCall = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        window.location.href = '/home';
    }, [localStream]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const connect = useCallback(() => {
        if (username.trim()) {
            console.log('👤 Joining meeting with username:', username);
            setAskForUsername(false);
        } else {
            alert('Please enter your name');
        }
    }, [username]);

    const getGridColumns = (count) => {
        if (count <= 1) return 1;
        if (count <= 4) return 2;
        if (count <= 9) return 3;
        return 4;
    };

    // LOBBY SCREEN
    if (askForUsername) {
        return (
            <div style={{
                position: 'relative',
                height: '100vh',
                background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 50% 50%, rgba(220, 20, 60, 0.1) 0%, transparent 70%)',
                    zIndex: 0
                }} />

                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '3rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    maxWidth: '500px',
                    width: '90%',
                    textAlign: 'center'
                }}>
                    <h1 style={{
                        color: 'white',
                        fontSize: '2rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem'
                    }}>
                        Join Meeting
                    </h1>
                    <p style={{
                        color: '#9ca3af',
                        marginBottom: '2rem',
                        fontSize: '0.95rem'
                    }}>
                        Room: <span style={{ color: '#DC143C', fontWeight: 600 }}>{roomCode}</span>
                    </p>

                    <div style={{
                        position: 'relative',
                        marginBottom: '2rem',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: '#000'
                    }}>
                        {!mediaReady ? (
                            <div style={{
                                width: '100%',
                                height: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                color: 'white',
                                gap: '1rem'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '4px solid rgba(255,255,255,0.3)',
                                    borderTop: '4px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                <p>Loading camera...</p>
                            </div>
                        ) : (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{
                                    width: '100%',
                                    height: '300px',
                                    objectFit: 'cover',
                                    transform: 'scaleX(-1)'
                                }}
                            />
                        )}

                        <div style={{
                            position: 'absolute',
                            bottom: '15px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '10px'
                        }}>
                            <IconButton
                                onClick={() => setVideo(!video)}
                                disabled={!mediaReady}
                                sx={{
                                    background: video ? 'rgba(255, 255, 255, 0.2)' : 'rgba(220, 20, 60, 0.8)',
                                    color: 'white',
                                    width: '50px',
                                    height: '50px',
                                    '&:hover': {
                                        background: video ? 'rgba(255, 255, 255, 0.3)' : 'rgba(220, 20, 60, 1)',
                                    },
                                    '&:disabled': {
                                        opacity: 0.5
                                    }
                                }}
                            >
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>

                            <IconButton
                                onClick={() => setAudio(!audio)}
                                disabled={!mediaReady}
                                sx={{
                                    background: audio ? 'rgba(255, 255, 255, 0.2)' : 'rgba(220, 20, 60, 0.8)',
                                    color: 'white',
                                    width: '50px',
                                    height: '50px',
                                    '&:hover': {
                                        background: audio ? 'rgba(255, 255, 255, 0.3)' : 'rgba(220, 20, 60, 1)',
                                    },
                                    '&:disabled': {
                                        opacity: 0.5
                                    }
                                }}
                            >
                                {audio ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                        </div>
                    </div>

                    <TextField
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && connect()}
                        placeholder="Enter your name"
                        variant="outlined"
                        fullWidth
                        autoFocus
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                '&.Mui-focused fieldset': { borderColor: '#DC143C' }
                            },
                            '& input': { color: 'white' },
                            '& input::placeholder': { color: '#9ca3af', opacity: 1 }
                        }}
                    />

                    <Button
                        onClick={connect}
                        variant="contained"
                        fullWidth
                        disabled={!username.trim() || !mediaReady}
                        sx={{
                            height: '56px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                            fontWeight: 600,
                            fontSize: '1rem',
                            textTransform: 'none',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
                            },
                            '&:disabled': {
                                background: 'rgba(139, 0, 0, 0.3)',
                                color: 'rgba(255, 255, 255, 0.3)'
                            }
                        }}
                    >
                        {!mediaReady ? 'Loading...' : 'Join Meeting'}
                    </Button>
                </div>
            </div>
        );
    }

    // MEETING ROOM
    return (
        <div style={{
            position: 'relative',
            height: '100vh',
            background: 'linear-gradient(135deg, #000000 0%, #0a0000 100%)',
            overflow: 'hidden'
        }}>
            {/* Header */}
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

            {/* Connection error */}
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

            {/* Video grid */}
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
                {videoStreams.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.2rem'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                border: '4px solid rgba(255,255,255,0.3)',
                                borderTop: '4px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 20px'
                            }} />
                            <p>Connecting to meeting...</p>
                        </div>
                    </div>
                ) : (
                    videoStreams.map((videoData, index) => (
                        <VideoTile
                            key={`${videoData.socketId}-${videoData.type}-${videoData.timestamp}`}
                            videoData={videoData}
                            index={index}
                        />
                    ))
                )}
            </div>

            {/* Chat modal */}
            {showModal && (
                <div style={{
                    position: 'absolute',
                    height: 'calc(100vh - 170px)',
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

            {/* Control buttons */}
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

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }
            `}</style>
        </div>
    );
}