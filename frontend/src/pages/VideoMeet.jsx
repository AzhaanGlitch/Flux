// frontend/src/pages/VideoMeet.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Badge, IconButton, TextField, Button } from '@mui/material';
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

const VideoTile = React.memo(({ videoData, index }) => {
    const videoRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Force load if metadata is ready (Fixes infinite loading spinner)
    useEffect(() => {
        const checkReadyState = setInterval(() => {
            if (videoRef.current && videoRef.current.readyState >= 3) {
                setIsLoaded(true);
            }
        }, 500);
        return () => clearInterval(checkReadyState);
    }, []);

    // Standard Video Setup
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || !videoData.stream) return;

        videoElement.srcObject = videoData.stream;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = videoData.isLocal; // Local must be muted to prevent echo

        const onPlaying = () => setIsLoaded(true);
        videoElement.addEventListener('playing', onPlaying);
        
        // Brute force play attempt
        const attemptPlay = async () => {
            try {
                await videoElement.play();
            } catch (e) {
                console.log("Autoplay blocked, waiting for interaction");
            }
        };
        attemptPlay();

        return () => {
            videoElement.removeEventListener('playing', onPlaying);
        };
    }, [videoData.stream, videoData.isLocal]);

    // Audio Level Detection
    useEffect(() => {
        if (!videoData.stream || videoData.type === 'screen' || videoData.isLocal) return;
        
        let audioContext;
        let analyser;
        let animationId;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(videoData.stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setIsSpeaking(volume > 15);
                animationId = requestAnimationFrame(checkVolume);
            };
            checkVolume();
        } catch (e) {
            console.error("Audio Context Error", e);
        }

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            if (audioContext && audioContext.state !== 'closed') audioContext.close();
        };
    }, [videoData.stream, videoData.type, videoData.isLocal]);

    const isScreenShare = videoData.type === 'screen';
    const transform = videoData.isLocal && !isScreenShare ? 'scaleX(-1)' : 'none';

    return (
        <div style={{
            position: 'relative', width: '100%', height: '100%', minHeight: '250px',
            borderRadius: '16px', overflow: 'hidden', backgroundColor: '#1a1a1a',
            border: isScreenShare ? '3px solid #DC143C' : isSpeaking ? '3px solid #10b981' : '2px solid rgba(255, 255, 255, 0.1)',
            gridColumn: isScreenShare ? 'span 2' : 'span 1',
            gridRow: isScreenShare ? 'span 2' : 'span 1',
        }}>
            <video
                ref={videoRef} autoPlay playsInline muted={videoData.isLocal}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform, backgroundColor: '#000' }}
            />
            {!isLoaded && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', color: 'white' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '10px' }}></div>
                    <p>Loading...</p>
                </div>
            )}
            <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.7)', padding: '5px 10px', borderRadius: '15px', color: 'white', fontSize: '0.9rem' }}>
                {videoData.name || 'Unknown'} {videoData.isLocal && '(You)'}
            </div>
        </div>
    );
});
VideoTile.displayName = 'VideoTile';

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
    const roomCode = window.location.pathname.substring(1);

    const { videoStreams, connectionError, socket, peerConnections } = usePeerConnections(
        askForUsername ? null : roomCode, username, localStream
    );
    const { isScreenSharing, startScreenShare, stopScreenShare } = useScreenShare(socket, peerConnections, localStream);

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
                    localVideoRef.current.play().catch(e => console.error(e));
                }
            } catch (error) { alert("Camera access denied."); }
        };
        initMedia();
        return () => {
            if (localStream && streamInitializedRef.current) {
                localStream.getTracks().forEach(t => t.stop());
                streamInitializedRef.current = false;
            }
        };
    }, []);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, askForUsername]);

    useEffect(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = video);
            localStream.getAudioTracks().forEach(t => t.enabled = audio);
        }
    }, [video, audio, localStream]);

    // Chat Logic
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

    const handleEndCall = () => {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        navigate('/home');
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const connect = () => {
        if (username.trim()) setAskForUsername(false);
        else alert('Enter name');
    };

    const getGridColumns = (n) => n <= 1 ? 1 : n <= 4 ? 2 : 3;

    if (askForUsername) {
        return (
            <div style={{ height: '100vh', background: 'linear-gradient(135deg, #000, #1a0000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', width: '90%', maxWidth: '450px' }}>
                    <h2 style={{ color: 'white', marginBottom: '20px' }}>Join Room: <span style={{ color: '#DC143C' }}>{roomCode}</span></h2>
                    <div style={{ height: '250px', background: 'black', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>
                        {mediaReady ? <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} /> : <p style={{color:'white', paddingTop:'100px'}}>Loading Camera...</p>}
                    </div>
                    <TextField fullWidth value={username} onChange={e => setUsername(e.target.value)} placeholder="Your Name" sx={{ input: { color: 'white' }, fieldset: { borderColor: 'rgba(255,255,255,0.3)' }, mb: 2 }} />
                    <Button fullWidth variant="contained" onClick={connect} disabled={!mediaReady || !username} sx={{ bgcolor: '#DC143C', '&:hover': { bgcolor: '#b01030' }, py: 1.5 }}>Join Meeting</Button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ position: 'absolute', top: 0, width: '100%', height: '60px', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 15px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {window.location.href}
                    <IconButton size="small" onClick={handleCopyLink} sx={{ color: copied ? '#4CAF50' : 'white' }}>{copied ? <CheckIcon fontSize="small"/> : <ContentCopyIcon fontSize="small"/>}</IconButton>
                </div>
            </div>
            
            {/* Video Grid */}
            <div style={{ position: 'absolute', top: 60, bottom: 80, width: '100%', display: 'grid', gridTemplateColumns: `repeat(${getGridColumns(videoStreams.length)}, 1fr)`, gap: '15px', padding: '15px', overflowY: 'auto' }}>
                {videoStreams.map((v, i) => <VideoTile key={v.socketId + v.type} videoData={v} index={i} />)}
            </div>

            {/* Chat Modal */}
            {showModal && (
                <div style={{ position: 'absolute', top: 70, right: 20, width: '300px', bottom: 100, background: 'rgba(0,0,0,0.9)', border: '1px solid #333', borderRadius: '10px', display: 'flex', flexDirection: 'column', zIndex: 20 }}>
                    <div style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
                        <span>Chat</span><IconButton size="small" onClick={() => setModal(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ marginBottom: '10px' }}>
                                <span style={{ color: '#DC143C', fontSize: '0.8rem', fontWeight: 'bold' }}>{m.sender}</span>
                                <p style={{ color: '#ddd', margin: 0, fontSize: '0.9rem' }}>{m.data}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                        <TextField size="small" fullWidth value={message} onChange={e => setMessage(e.target.value)} placeholder="Message..." sx={{ input: { color: 'white' }, fieldset: { borderColor: '#555' } }} />
                        <IconButton onClick={sendMessage} sx={{ color: '#DC143C' }}><SendIcon /></IconButton>
                    </div>
                </div>
            )}

            {/* Footer Controls */}
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '80px', background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                <IconButton onClick={() => setVideo(!video)} sx={{ bgcolor: video ? 'rgba(255,255,255,0.1)' : '#DC143C', color: 'white' }}>{video ? <VideocamIcon /> : <VideocamOffIcon />}</IconButton>
                <IconButton onClick={() => setAudio(!audio)} sx={{ bgcolor: audio ? 'rgba(255,255,255,0.1)' : '#DC143C', color: 'white' }}>{audio ? <MicIcon /> : <MicOffIcon />}</IconButton>
                <IconButton onClick={isScreenSharing ? stopScreenShare : startScreenShare} sx={{ bgcolor: isScreenSharing ? '#DC143C' : 'rgba(255,255,255,0.1)', color: 'white' }}>{isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}</IconButton>
                <IconButton onClick={handleEndCall} sx={{ bgcolor: '#DC143C', color: 'white', width: 50, height: 50 }}><CallEndIcon /></IconButton>
                <IconButton onClick={() => { setModal(!showModal); setNewMessages(0); }} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                    <Badge badgeContent={newMessages} color="error"><ChatIcon /></Badge>
                </IconButton>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}