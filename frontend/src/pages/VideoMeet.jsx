// frontend/src/pages/VideoMeet.jsx - COMPLETE FIX

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
// VIDEO TILE COMPONENT - CRITICAL FIX
// ============================================================================
const VideoTile = React.memo(({ videoData, index }) => {
    const videoRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [playError, setPlayError] = useState(null);

    // CRITICAL: Attach stream immediately and force play
    useEffect(() => {
        const videoElement = videoRef.current;
        
        if (!videoElement || !videoData.stream) {
            console.warn('Missing video element or stream');
            return;
        }

        console.log(`🎬 Setting up video for ${videoData.socketId}`);
        
        // Set srcObject
        videoElement.srcObject = videoData.stream;
        
        // Set attributes to ensure playback
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = videoData.isLocal;
        
        // Multiple play strategies
        const attemptPlay = async () => {
            try {
                await videoElement.play();
                console.log('✅ Video playing:', videoData.socketId);
                setIsLoaded(true);
                setPlayError(null);
            } catch (error) {
                console.log('⚠️ Play attempt failed:', error.name);
                setPlayError(error.name);
                
                // Retry after user interaction
                if (error.name === 'NotAllowedError') {
                    const playOnClick = async () => {
                        try {
                            await videoElement.play();
                            setIsLoaded(true);
                            document.removeEventListener('click', playOnClick);
                        } catch (e) {
                            console.error('Play failed after click:', e);
                        }
                    };
                    document.addEventListener('click', playOnClick, { once: true });
                }
            }
        };

        // Event listeners
        const onLoadedMetadata = () => {
            console.log('📊 Metadata loaded:', videoData.socketId);
            attemptPlay();
        };

        const onLoadedData = () => {
            console.log('📦 Data loaded:', videoData.socketId);
            setIsLoaded(true);
        };

        const onCanPlay = () => {
            console.log('▶️ Can play:', videoData.socketId);
            attemptPlay();
        };

        const onPlaying = () => {
            console.log('🎥 Playing:', videoData.socketId);
            setIsLoaded(true);
        };

        videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.addEventListener('loadeddata', onLoadedData);
        videoElement.addEventListener('canplay', onCanPlay);
        videoElement.addEventListener('playing', onPlaying);

        // Immediate play attempt
        attemptPlay();

        // Cleanup
        return () => {
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoElement.removeEventListener('loadeddata', onLoadedData);
            videoElement.removeEventListener('canplay', onCanPlay);
            videoElement.removeEventListener('playing', onPlaying);
        };
    }, [videoData.stream, videoData.socketId, videoData.isLocal]);

    const isScreenShare = videoData.type === 'screen';
    const transform = videoData.isLocal && !isScreenShare ? 'scaleX(-1)' : 'none';

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '250px',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
                boxShadow: isScreenShare
                    ? '0 0 30px rgba(220, 38, 38, 0.5)'
                    : '0 10px 30px rgba(0, 0, 0, 0.3)',
                border: isScreenShare
                    ? '3px solid #DC143C'
                    : '2px solid rgba(255, 255, 255, 0.1)',
                gridColumn: isScreenShare ? 'span 2' : 'span 1',
                gridRow: isScreenShare ? 'span 2' : 'span 1',
            }}
        >
            {/* Video element - CRITICAL STYLES */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={videoData.isLocal}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform,
                    backgroundColor: '#000',
                    display: 'block',
                }}
            />

            {/* Loading overlay */}
            {!isLoaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    zIndex: 10,
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid rgba(255,255,255,0.2)',
                        borderTop: '4px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '12px'
                    }} />
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>
                        {playError === 'NotAllowedError' 
                            ? 'Click anywhere to start video' 
                            : 'Loading video...'}
                    </p>
                </div>
            )}

            {/* Participant label */}
            <div style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                background: 'rgba(0, 0, 0, 0.75)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                zIndex: 20,
            }}>
                {isScreenShare && '🖥️ '}
                {videoData.name || 'Unknown'}
                {videoData.isLocal && ' (You)'}
            </div>

            {/* Screen share badge */}
            {isScreenShare && (
                <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'linear-gradient(135deg, #DC143C, #8B0000)',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.5)',
                    zIndex: 20,
                }}>
                    Screen Share
                </div>
            )}
        </div>
    );
});

VideoTile.displayName = 'VideoTile';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
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
    const [mediaReady, setMediaReady] = useState(false);

    const localVideoRef = useRef(null);
    const streamInitializedRef = useRef(false);
    const roomCode = window.location.pathname.substring(1);

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

    // Initialize media
    useEffect(() => {
        if (streamInitializedRef.current) return;

        const initMedia = async () => {
            try {
                console.log('🎥 Requesting media...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });

                console.log('✅ Media granted:', stream.getTracks().map(t => t.kind));
                streamInitializedRef.current = true;
                setLocalStream(stream);
                setMediaReady(true);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.play().catch(console.log);
                }
            } catch (error) {
                console.error('❌ Media error:', error);
                alert('Camera/microphone access denied. Please enable and reload.');
            }
        };

        initMedia();

        return () => {
            if (localStream && streamInitializedRef.current) {
                localStream.getTracks().forEach(t => t.stop());
                streamInitializedRef.current = false;
            }
        };
    }, []);

    // Re-attach local video
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(console.log);
        }
    }, [localStream, askForUsername]);

    // Toggle tracks
    useEffect(() => {
        if (!localStream) return;

        localStream.getVideoTracks().forEach(t => { t.enabled = video; });
        localStream.getAudioTracks().forEach(t => { t.enabled = audio; });
    }, [video, audio, localStream]);

    // Chat
    useEffect(() => {
        if (!socket) return;
        const handleChat = (data, sender, socketIdSender) => {
            setMessages(prev => [...prev, { sender, data }]);
            if (socketIdSender !== socket.id) setNewMessages(prev => prev + 1);
        };
        socket.on('chat-message', handleChat);
        return () => socket.off('chat-message', handleChat);
    }, [socket]);

    const sendMessage = useCallback(() => {
        if (message.trim() && socket) {
            socket.emit('chat-message', message, username);
            setMessage('');
        }
    }, [message, socket, username]);

    const handleEndCall = useCallback(() => {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        window.location.href = '/home';
    }, [localStream]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const connect = useCallback(() => {
        if (username.trim()) {
            console.log('👤 Joining:', username);
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

    // LOBBY
    if (askForUsername) {
        return (
            <div style={{
                height: '100vh',
                background: 'linear-gradient(135deg, #000 0%, #1a0000 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '3rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    maxWidth: '500px',
                    width: '90%',
                }}>
                    <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>
                        Join Meeting
                    </h1>
                    <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
                        Room: <span style={{ color: '#DC143C' }}>{roomCode}</span>
                    </p>

                    <div style={{
                        position: 'relative',
                        marginBottom: '2rem',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: '#000',
                        minHeight: '300px',
                    }}>
                        {!mediaReady ? (
                            <div style={{
                                height: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                            }}>
                                <div>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '4px solid rgba(255,255,255,0.3)',
                                        borderTop: '4px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        margin: '0 auto 10px'
                                    }} />
                                    <p>Loading camera...</p>
                                </div>
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
                                    background: video ? 'rgba(255,255,255,0.2)' : 'rgba(220,20,60,0.8)',
                                    color: 'white',
                                    width: 50,
                                    height: 50,
                                    '&:hover': { background: video ? 'rgba(255,255,255,0.3)' : 'rgba(220,20,60,1)' }
                                }}
                            >
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>

                            <IconButton
                                onClick={() => setAudio(!audio)}
                                disabled={!mediaReady}
                                sx={{
                                    background: audio ? 'rgba(255,255,255,0.2)' : 'rgba(220,20,60,0.8)',
                                    color: 'white',
                                    width: 50,
                                    height: 50,
                                    '&:hover': { background: audio ? 'rgba(255,255,255,0.3)' : 'rgba(220,20,60,1)' }
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
                        fullWidth
                        autoFocus
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                '&.Mui-focused fieldset': { borderColor: '#DC143C' }
                            }
                        }}
                    />

                    <Button
                        onClick={connect}
                        fullWidth
                        disabled={!username.trim() || !mediaReady}
                        sx={{
                            height: '56px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #8B0000, #DC143C)',
                            color: 'white',
                            fontWeight: 600,
                            '&:hover': { background: 'linear-gradient(135deg, #DC143C, #8B0000)' },
                            '&:disabled': { background: 'rgba(139,0,0,0.3)' }
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
            background: '#0a0a0a',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                background: 'rgba(0,0,0,0.8)',
                borderBottom: '1px solid rgba(139,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 20px',
                zIndex: 200
            }}>
                <TextField
                    value={window.location.href}
                    InputProps={{
                        readOnly: true,
                        sx: {
                            borderRadius: '20px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            height: '40px',
                            '& fieldset': { border: 'none' }
                        }
                    }}
                    size="small"
                    sx={{ flex: 1, maxWidth: '600px' }}
                />
                <IconButton
                    onClick={handleCopyLink}
                    sx={{
                        ml: 1,
                        background: copied ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.15)',
                        color: copied ? '#4CAF50' : 'white',
                        width: 40,
                        height: 40,
                    }}
                >
                    {copied ? <CheckIcon /> : <ContentCopyIcon />}
                </IconButton>
            </div>

            {/* Error */}
            {connectionError && (
                <div style={{
                    position: 'absolute',
                    top: '90px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 300,
                    background: 'rgba(220,38,38,0.9)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
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
                gridAutoRows: 'minmax(250px, 1fr)',
                padding: '20px',
                gap: '20px',
                overflow: 'auto'
            }}>
                {videoStreams.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
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
                    videoStreams.map((videoData) => (
                        <VideoTile
                            key={`${videoData.socketId}-${videoData.type}-${videoData.timestamp}`}
                            videoData={videoData}
                        />
                    ))
                )}
            </div>

            {/* Chat */}
            {showModal && (
                <div style={{
                    position: 'absolute',
                    height: 'calc(100vh - 170px)',
                    right: '20px',
                    top: '90px',
                    background: 'rgba(0,0,0,0.95)',
                    borderRadius: '16px',
                    width: '380px',
                    border: '1px solid rgba(139,0,0,0.3)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1000
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '20px',
                        paddingBottom: '15px',
                        borderBottom: '2px solid rgba(139,0,0,0.3)'
                    }}>
                        <h1 style={{ color: 'white', fontSize: '1.5rem', margin: 0 }}>Chat</h1>
                        <IconButton onClick={() => setModal(false)} sx={{ color: '#9ca3af' }}>
                            <CloseIcon />
                        </IconButton>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                        {messages.map((item, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(139,0,0,0.1)',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                marginBottom: '12px',
                                border: '1px solid rgba(139,0,0,0.2)'
                            }}>
                                <p style={{ color: '#DC143C', fontWeight: 600, margin: '0 0 4px 0' }}>
                                    {item.sender}
                                </p>
                                <p style={{ color: '#e5e7eb', margin: 0 }}>{item.data}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <TextField
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type message..."
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(139,0,0,0.3)' },
                                    '&.Mui-focused fieldset': { borderColor: '#DC143C' }
                                }
                            }}
                        />
                        <IconButton
                            onClick={sendMessage}
                            disabled={!message.trim()}
                            sx={{
                                background: 'linear-gradient(135deg, #8B0000, #DC143C)',
                                color: 'white',
                                width: 44,
                                height: 44,
                                borderRadius: '12px',
                                '&:disabled': { background: 'rgba(139,0,0,0.3)' }
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div style={{
                position: 'absolute',
                width: '100%',
                bottom: '30px',
                display: 'flex',
                justifyContent: 'center',
                gap: '15px',
                zIndex: 100
            }}>
                <IconButton
                    onClick={() => setVideo(!video)}
                    sx={{
                        background: video ? 'rgba(255,255,255,0.15)' : 'rgba(139,0,0,0.8)',
                        width: 60,
                        height: 60,
                        color: 'white',
                    }}
                >
                    {video ? <VideocamIcon sx={{ fontSize: '2rem' }} /> : <VideocamOffIcon sx={{ fontSize: '2rem' }} />}
                </IconButton>

                <IconButton
                    onClick={handleEndCall}
                    sx={{
                        background: 'linear-gradient(135deg, #8B0000, #DC143C)',
                        width: 70,
                        height: 70,
                        color: 'white',
                    }}
                >
                    <CallEndIcon sx={{ fontSize: '2.2rem' }} />
                </IconButton>

                <IconButton
                    onClick={() => setAudio(!audio)}
                    sx={{
                        background: audio ? 'rgba(255,255,255,0.15)' : 'rgba(139,0,0,0.8)',
                        width: 60,
                        height: 60,
                        color: 'white',
                    }}
                >
                    {audio ? <MicIcon sx={{ fontSize: '2rem' }} /> : <MicOffIcon sx={{ fontSize: '2rem' }} />}
                </IconButton>

                <IconButton
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    sx={{
                        background: isScreenSharing ? 'rgba(139,0,0,0.8)' : 'rgba(255,255,255,0.15)',
                        width: 60,
                        height: 60,
                        color: 'white',
                    }}
                >
                    {isScreenSharing ? <StopScreenShareIcon sx={{ fontSize: '2rem' }} /> : <ScreenShareIcon sx={{ fontSize: '2rem' }} />}
                </IconButton>

                <IconButton
                    onClick={() => { setModal(true); setNewMessages(0); }}
                    sx={{
                        background: 'rgba(255,255,255,0.15)',
                        width: 60,
                        height: 60,
                        color: 'white',
                    }}
                >
                    <Badge badgeContent={newMessages} color="error">
                        <ChatIcon sx={{ fontSize: '2rem' }} />
                    </Badge>
                </IconButton>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}