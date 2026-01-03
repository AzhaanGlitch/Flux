// frontend/src/pages/VideoMeet.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Badge, IconButton, TextField, Button, Box, Typography } from '@mui/material';
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
import { useNavigate } from 'react-router-dom';

import { usePeerConnections } from '../hooks/usePeerConnections';
import { useScreenShare } from '../hooks/useScreenShare';

// In VideoMeet.jsx 

const VideoTile = React.memo(({ videoData, isSmall }) => {
    const videoRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // DESKTOP FIX: Robust video element setup
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || !videoData.stream) {
            console.log('⏳ Waiting for video element or stream...');
            return;
        }

        console.log(`🎬 Setting up video for ${videoData.socketId}:`, {
            streamId: videoData.stream.id,
            tracks: videoData.stream.getTracks().map(t => ({
                kind: t.kind,
                enabled: t.enabled,
                readyState: t.readyState
            }))
        });

        // CRITICAL: Ensure stream has active tracks
        const activeTracks = videoData.stream.getTracks().filter(t => 
            t.readyState === 'live' && t.enabled
        );

        if (activeTracks.length === 0) {
            console.warn(`⚠️ No active tracks for ${videoData.socketId}`);
            return;
        }

        // DESKTOP FIX: Set srcObject and configure element
        videoElement.srcObject = videoData.stream;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = videoData.isLocal; // Mute local to avoid feedback

        // DESKTOP FIX: Multiple play attempts with retry logic
        const attemptPlay = async (attempt = 0) => {
            try {
                // Clear any previous errors
                videoElement.load();
                
                console.log(`▶️ Attempt ${attempt + 1} to play ${videoData.socketId}`);
                await videoElement.play();
                
                console.log(`✅ Video playing for ${videoData.socketId}`);
                setIsLoaded(true);
                setRetryCount(0);
                
            } catch (error) {
                console.warn(`⚠️ Play attempt ${attempt + 1} failed for ${videoData.socketId}:`, error.name);
                
                if (attempt < 5) {
                    // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
                    const delay = 100 * Math.pow(2, attempt);
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    
                    setTimeout(() => {
                        setRetryCount(attempt + 1);
                        attemptPlay(attempt + 1);
                    }, delay);
                } else {
                    console.error(`❌ Failed to play video after ${attempt + 1} attempts`);
                    setIsLoaded(false);
                }
            }
        };

        // DESKTOP FIX: Wait for stream to be fully ready
        const checkAndPlay = () => {
            const tracks = videoData.stream.getTracks();
            const allReady = tracks.every(t => t.readyState === 'live');
            
            if (allReady) {
                console.log(`✅ All tracks ready for ${videoData.socketId}, attempting play`);
                attemptPlay();
            } else {
                console.log(`⏳ Waiting for tracks to be ready...`);
                setTimeout(checkAndPlay, 100);
            }
        };

        checkAndPlay();

        // DESKTOP FIX: Handle track events
        const handleTrackEnded = () => {
            console.log(`🛑 Track ended for ${videoData.socketId}`);
            setIsLoaded(false);
        };

        videoData.stream.getTracks().forEach(track => {
            track.addEventListener('ended', handleTrackEnded);
        });

        // Cleanup
        return () => {
            console.log(`🧹 Cleaning up video for ${videoData.socketId}`);
            videoData.stream.getTracks().forEach(track => {
                track.removeEventListener('ended', handleTrackEnded);
            });
            
            if (videoElement.srcObject) {
                videoElement.srcObject = null;
            }
        };
    }, [videoData.stream, videoData.socketId, videoData.isLocal, retryCount]);

    // Audio level detection (simplified for stability)
    useEffect(() => {
        if (!videoData.stream || videoData.isLocal || videoData.type === 'screen') return;
        
        let audioContext, analyser, animationId;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            
            const audioTracks = videoData.stream.getAudioTracks();
            if (audioTracks.length === 0) {
                console.log(`ℹ️ No audio tracks for ${videoData.socketId}`);
                return;
            }
            
            const source = audioContext.createMediaStreamSource(videoData.stream);
            source.connect(analyser);
            
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const detectVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setIsSpeaking(volume > 15);
                animationId = requestAnimationFrame(detectVolume);
            };
            
            detectVolume();
            
        } catch (error) {
            console.warn('Audio analysis not available:', error);
        }

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close().catch(e => console.warn('Error closing audio context:', e));
            }
        };
    }, [videoData.stream, videoData.isLocal, videoData.type, videoData.socketId]);

    const isScreenShare = videoData.type === 'screen';
    const transform = videoData.isLocal && !isScreenShare ? 'scaleX(-1)' : 'none';

    return (
        <div style={{
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            backgroundColor: '#000',
            border: isSpeaking ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }}>
            {!isLoaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#1a1a1a',
                    color: '#666',
                    fontSize: '0.9rem'
                }}>
                    Loading video{retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}...
                </div>
            )}
            
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={videoData.isLocal}
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: isScreenShare ? 'contain' : 'cover', 
                    transform, 
                    background: 'black',
                    display: isLoaded ? 'block' : 'none'
                }}
            />
            
            <div style={{ 
                position: 'absolute', 
                bottom: 8, 
                left: 8, 
                background: 'rgba(0,0,0,0.7)', 
                padding: '4px 10px', 
                borderRadius: '8px', 
                color: 'white', 
                fontSize: isSmall ? '0.7rem' : '0.9rem', 
                pointerEvents: 'none',
                backdropFilter: 'blur(5px)'
            }}>
                {isScreenShare ? '🖥️ ' : ''}{videoData.name || 'Unknown'} {videoData.isLocal && '(You)'}
            </div>
        </div>
    );
});

export default function VideoMeetComponent() {
    const navigate = useNavigate();
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
    
    // Get Room ID from URL
    const roomCode = window.location.pathname.substring(1);

    // --- HOOKS ---
    const { videoStreams, connectionError, socket, peerConnections } = usePeerConnections(
        askForUsername ? null : roomCode, 
        username, 
        localStream
    );
    
    const { isScreenSharing, startScreenShare, stopScreenShare } = useScreenShare(
        socket, 
        peerConnections, 
        localStream
    );

    // --- Media Init ---
    useEffect(() => {
        if (streamInitializedRef.current) return;
        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 1280, height: 720 }, 
                    audio: { echoCancellation: true, noiseSuppression: true } 
                });
                streamInitializedRef.current = true;
                setLocalStream(stream);
                setMediaReady(true);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (error) { 
                console.error("Media Error:", error);
                alert("Could not access camera/microphone. Please check permissions."); 
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

    // Toggle Tracks
    useEffect(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = video);
            localStream.getAudioTracks().forEach(t => t.enabled = audio);
        }
    }, [video, audio, localStream]);

    // Chat
    useEffect(() => {
        if (!socket) return;
        const handleChat = (data, sender, socketIdSender) => {
            setMessages(prev => [...prev, { sender, data }]);
            if (socketIdSender !== socket.id && !showModal) setNewMessages(prev => prev + 1);
        };
        socket.on('chat-message', handleChat);
        return () => socket.off('chat-message', handleChat);
    }, [socket, showModal]);

    const sendMessage = () => {
        if (message.trim() && socket) {
            socket.emit('chat-message', message, username);
            setMessages(prev => [...prev, { sender: "You", data: message }]);
            setMessage('');
        }
    };

    const handleEndCall = () => {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (socket) socket.disconnect();
        navigate('/home');
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const connect = () => {
        if (username.trim()) setAskForUsername(false);
        else alert('Please enter your name');
    };

    // --- SEPARATE STREAMS LOGIC ---
    // 1. Identify active screen shares
    const screenShares = useMemo(() => {
        return videoStreams.filter(v => v.type === 'screen');
    }, [videoStreams]);

    // 2. Identify camera feeds (including local)
    const cameraFeeds = useMemo(() => {
        return videoStreams.filter(v => v.type === 'camera');
    }, [videoStreams]);

    // 3. Determine Mode
    const isScreenShareActive = screenShares.length > 0;
    const activeScreenShare = isScreenShareActive ? screenShares[screenShares.length - 1] : null; // Show latest

    // --- RENDER ---
    if (askForUsername) {
        return (
            <div style={{ height: '100vh', background: 'linear-gradient(135deg, #000, #1a0000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', width: '90%', maxWidth: '450px' }}>
                    <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>Join Room: <span style={{ color: '#DC143C' }}>{roomCode}</span></Typography>
                    <div style={{ height: '250px', background: 'black', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #333' }}>
                        {mediaReady ? 
                            <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} /> 
                            : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#666'}}>Initializing Camera...</div>
                        }
                    </div>
                    <TextField fullWidth value={username} onChange={e => setUsername(e.target.value)} placeholder="Your Name" sx={{ input: { color: 'white' }, fieldset: { borderColor: 'rgba(255,255,255,0.3)' }, mb: 2 }} />
                    <Button fullWidth variant="contained" onClick={connect} disabled={!mediaReady || !username} sx={{ bgcolor: '#DC143C', '&:hover': { bgcolor: '#b01030' }, py: 1.5 }}>Join Meeting</Button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', background: '#0a0a0a', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ height: '60px', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 15px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {window.location.href}
                    <IconButton size="small" onClick={handleCopyLink} sx={{ color: copied ? '#4CAF50' : 'white' }}>{copied ? <CheckIcon fontSize="small"/> : <ContentCopyIcon fontSize="small"/>}</IconButton>
                </div>
            </div>
            
            {/* Main Stage */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
                
                {isScreenShareActive ? (
                     // --- SCREEN SHARE MODE ---
                    <>
                        {/* Left: Main Screen Share */}
                        <div style={{ flex: 3, padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                            <div style={{ width: '100%', height: '100%', maxWidth: '1400px', maxHeight:'90vh' }}>
                                <VideoTile videoData={activeScreenShare} />
                            </div>
                        </div>

                        {/* Right: Vertical Strip of Cameras */}
                        <div style={{ 
                            flex: 1, 
                            maxWidth: '300px', 
                            minWidth: '200px',
                            background: '#111', 
                            padding: '15px', 
                            overflowY: 'auto',
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '15px',
                            borderLeft: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {cameraFeeds.map(v => (
                                <div key={v.socketId + v.type} style={{ height: '180px', flexShrink: 0 }}>
                                    <VideoTile videoData={v} isSmall={true} />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    // --- GRID MODE (Default) ---
                    <div style={{ 
                        width: '100%', 
                        padding: '20px', 
                        display: 'grid', 
                        gridTemplateColumns: `repeat(auto-fit, minmax(350px, 1fr))`, 
                        gridAutoRows: 'minmax(250px, 1fr)',
                        gap: '20px', 
                        overflowY: 'auto' 
                    }}>
                        {cameraFeeds.map(v => (
                            <VideoTile key={v.socketId + v.type} videoData={v} />
                        ))}
                    </div>
                )}

            </div>

            {/* Chat Modal */}
            {showModal && (
                <div style={{ position: 'absolute', top: 70, right: 20, width: '320px', bottom: 100, background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', display: 'flex', flexDirection: 'column', zIndex: 50, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: 600 }}>
                        <span>Meeting Chat</span><IconButton size="small" onClick={() => setModal(false)} sx={{ color: '#aaa' }}><CloseIcon /></IconButton>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {messages.length === 0 && <Typography variant="caption" sx={{color:'#666', textAlign:'center', mt: 2}}>No messages yet</Typography>}
                        {messages.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.sender === 'You' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                <Typography variant="caption" sx={{ color: '#DC143C', fontWeight: 700, ml: 1 }}>{m.sender}</Typography>
                                <div style={{ background: m.sender === 'You' ? '#DC143C' : '#333', color: 'white', padding: '8px 12px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                    {m.data}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '15px', display: 'flex', gap: '8px', borderTop: '1px solid #333' }}>
                        <TextField 
                            size="small" fullWidth 
                            value={message} 
                            onChange={e => setMessage(e.target.value)} 
                            onKeyPress={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..." 
                            sx={{ input: { color: 'white' }, fieldset: { borderColor: '#444' } }} 
                        />
                        <IconButton onClick={sendMessage} sx={{ color: '#DC143C', bgcolor: 'rgba(220, 20, 60, 0.1)' }}><SendIcon /></IconButton>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div style={{ height: '80px', background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <IconButton onClick={() => setVideo(!video)} sx={{ bgcolor: video ? '#333' : '#DC143C', color: 'white', '&:hover': { bgcolor: video ? '#444' : '#b01030' } }}>{video ? <VideocamIcon /> : <VideocamOffIcon />}</IconButton>
                <IconButton onClick={() => setAudio(!audio)} sx={{ bgcolor: audio ? '#333' : '#DC143C', color: 'white', '&:hover': { bgcolor: audio ? '#444' : '#b01030' } }}>{audio ? <MicIcon /> : <MicOffIcon />}</IconButton>
                <IconButton onClick={isScreenSharing ? stopScreenShare : startScreenShare} sx={{ bgcolor: isScreenSharing ? '#DC143C' : '#333', color: 'white', '&:hover': { bgcolor: isScreenSharing ? '#b01030' : '#444' } }}>{isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}</IconButton>
                <IconButton onClick={handleEndCall} sx={{ bgcolor: '#DC143C', color: 'white', width: 56, height: 56, '&:hover': { bgcolor: '#b01030' } }}><CallEndIcon /></IconButton>
                <IconButton onClick={() => { setModal(!showModal); setNewMessages(0); }} sx={{ bgcolor: '#333', color: 'white', '&:hover': { bgcolor: '#444' } }}>
                    <Badge badgeContent={newMessages} color="error"><ChatIcon /></Badge>
                </IconButton>
            </div>
        </div>
    );
}