import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { 
    Badge, IconButton, TextField, Button, Tooltip, 
    Snackbar, Alert, Box, Typography 
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import server from '../environment';

const server_url = server;

var connections = {};
var participantNames = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" },
        { "urls": "stun:stun1.l.google.com:19302" },
        { "urls": "stun:stun2.l.google.com:19302" },
        { "urls": "stun:stun3.l.google.com:19302" },
        { "urls": "stun:stun4.l.google.com:19302" }
    ],
    "iceCandidatePoolSize": 10
}

export default function VideoMeetComponent() {
    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState(true);
    let [audio, setAudio] = useState(true);
    let [screen, setScreen] = useState(false);
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState(false);
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");
    
    // NEW: Snackbar for copy notification
    let [showCopySnackbar, setShowCopySnackbar] = useState(false);
    
    const videoRef = useRef([])
    let [videos, setVideos] = useState([])
    
    const originalStreamRef = useRef(null);

    // Get current meeting URL
    const meetingLink = window.location.href;

    // ============ CORE WEBRTC LOGIC - FIXED ============
    
    useEffect(() => {
        console.log('Component mounted, getting permissions...');
        getPermissions();
    }, [])

    const getPermissions = async () => {
        try {
            const userMediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }, 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            console.log('Got media stream:', userMediaStream);
            setVideoAvailable(true);
            setAudioAvailable(true);
            
            window.localStream = userMediaStream;
            originalStreamRef.current = userMediaStream;
            
            if (localVideoref.current) {
                localVideoref.current.srcObject = userMediaStream;
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }
        } catch (error) {
            console.error("Error getting permissions:", error);
            setVideoAvailable(false);
            setAudioAvailable(false);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio])

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    let getUserMediaSuccess = (stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop())
            }
        } catch (e) { console.log(e) }

        window.localStream = stream
        originalStreamRef.current = stream;
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue
            
            const senders = connections[id].getSenders();
            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];
            
            senders.forEach(sender => {
                if (sender.track) {
                    if (sender.track.kind === 'video' && videoTrack) {
                        sender.replaceTrack(videoTrack);
                    } else if (sender.track.kind === 'audio' && audioTrack) {
                        sender.replaceTrack(audioTrack);
                    }
                }
            });
        }
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ 
                video: video ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : false, 
                audio: audio ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : false
            })
                .then(getUserMediaSuccess)
                .catch((e) => console.error('getUserMedia error:', e))
        }
    }

    // ============ SOCKET CONNECTION - CRITICAL FIX ============
    
    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)
        console.log('Signal from', fromId, ':', signal.sdp ? signal.sdp.type : 'ice');

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(() => {
                        if (signal.sdp.type === 'offer') {
                            connections[fromId].createAnswer()
                                .then((description) => {
                                    connections[fromId].setLocalDescription(description)
                                        .then(() => {
                                            socketRef.current.emit('signal', fromId, JSON.stringify({ 
                                                'sdp': connections[fromId].localDescription 
                                            }))
                                        })
                                        .catch(e => console.error('setLocalDescription error:', e))
                                })
                                .catch(e => console.error('createAnswer error:', e))
                        }
                    })
                    .catch(e => console.error('setRemoteDescription error:', e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
                    .catch(e => console.error('addIceCandidate error:', e))
            }
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { 
            secure: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        })
        
        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            console.log('Socket connected:', socketRef.current.id);
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id
            
            socketRef.current.emit('username', username);
            participantNames[socketIdRef.current] = username;
            
            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('username', (id, name) => {
                console.log('Received username:', name, 'from:', id);
                participantNames[id] = name;
                
                setVideos(prevVideos => prevVideos.map(v => 
                    v.socketId === id ? { ...v, name: name } : v
                ));
            });

            socketRef.current.on('user-left', (id) => {
                console.log('User left:', id);
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
                delete participantNames[id];
                
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            })

            socketRef.current.on('user-joined', (id, clients) => {
                console.log('Users in room:', clients);
                
                clients.forEach((socketListId) => {
                    if (socketListId === socketIdRef.current) return;
                    
                    if (!connections[socketListId]) {
                        console.log('Creating peer connection for:', socketListId);
                        connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                        
                        connections[socketListId].onicecandidate = function (event) {
                            if (event.candidate) {
                                console.log('Sending ICE candidate to:', socketListId);
                                socketRef.current.emit('signal', socketListId, JSON.stringify({ 
                                    'ice': event.candidate 
                                }))
                            }
                        }

                        connections[socketListId].onconnectionstatechange = () => {
                            console.log('Connection state with', socketListId, ':', 
                                connections[socketListId].connectionState);
                        }

                        connections[socketListId].oniceconnectionstatechange = () => {
                            console.log('ICE state with', socketListId, ':', 
                                connections[socketListId].iceConnectionState);
                        }

                        // CRITICAL FIX: Proper track handling
                        connections[socketListId].ontrack = (event) => {
                            console.log('📹 TRACK RECEIVED from:', socketListId);
                            console.log('Track kind:', event.track.kind);
                            console.log('Track enabled:', event.track.enabled);
                            console.log('Streams:', event.streams);
                            
                            const remoteStream = event.streams[0];
                            
                            if (remoteStream) {
                                console.log('Stream ID:', remoteStream.id);
                                console.log('Stream tracks:', remoteStream.getTracks().map(t => ({
                                    kind: t.kind,
                                    enabled: t.enabled,
                                    muted: t.muted,
                                    readyState: t.readyState
                                })));
                                
                                setVideos(prevVideos => {
                                    const exists = prevVideos.find(v => v.socketId === socketListId);
                                    
                                    if (!exists) {
                                        console.log('✅ Adding new remote video for:', socketListId);
                                        return [...prevVideos, {
                                            socketId: socketListId,
                                            stream: remoteStream,
                                            autoplay: true,
                                            playsinline: true,
                                            name: participantNames[socketListId] || 'Participant'
                                        }];
                                    } else {
                                        console.log('🔄 Updating existing remote video for:', socketListId);
                                        return prevVideos.map(v => 
                                            v.socketId === socketListId 
                                                ? { ...v, stream: remoteStream }
                                                : v
                                        );
                                    }
                                });
                            } else {
                                console.error('❌ No stream in track event!');
                            }
                        };

                        if (window.localStream) {
                            console.log('Adding local tracks to connection:', socketListId);
                            window.localStream.getTracks().forEach(track => {
                                console.log('Adding track:', track.kind, 'enabled:', track.enabled);
                                try {
                                    connections[socketListId].addTrack(track, window.localStream);
                                } catch (e) {
                                    console.error('Error adding track:', e);
                                }
                            });
                        } else {
                            console.error('❌ No local stream available!');
                        }
                    }
                })

                if (id === socketIdRef.current) {
                    console.log('I am the new joiner, creating offers...');
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        console.log('Creating offer for:', id2);
                        connections[id2].createOffer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        })
                            .then((description) => {
                                return connections[id2].setLocalDescription(description)
                            })
                            .then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ 
                                    'sdp': connections[id2].localDescription 
                                }))
                            })
                            .catch(e => console.error('Error creating offer:', e))
                    }
                }
            })
        })

        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    // ============ CRITICAL FIX: VIDEO ELEMENT RENDERING ============
    
    // This useEffect ensures video elements get their streams properly
    useEffect(() => {
        console.log('Videos state updated:', videos.length, 'videos');
        
        videos.forEach((video, index) => {
            const videoElement = videoRef.current[index];
            if (videoElement && video.stream) {
                console.log(`Setting srcObject for video ${index} (${video.socketId})`);
                
                // CRITICAL: Check if srcObject is already set
                if (videoElement.srcObject !== video.stream) {
                    videoElement.srcObject = video.stream;
                    
                    // Force play after setting srcObject
                    videoElement.play().catch(error => {
                        console.error('Error playing video:', error);
                    });
                }
            }
        });
    }, [videos]);

    // Screen sharing functions
    let getDislayMediaSuccess = (stream) => {
        console.log('Screen share started');
        
        const screenVideoTrack = stream.getVideoTracks()[0];
        
        localVideoref.current.srcObject = stream;
        
        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            
            const senders = connections[id].getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            
            if (videoSender && screenVideoTrack) {
                videoSender.replaceTrack(screenVideoTrack);
            }
        }

        screenVideoTrack.onended = () => {
            console.log('Screen share stopped');
            setScreen(false);
            
            if (originalStreamRef.current) {
                localVideoref.current.srcObject = originalStreamRef.current;
            }
            
            if (originalStreamRef.current) {
                const cameraTrack = originalStreamRef.current.getVideoTracks()[0];
                
                for (let id in connections) {
                    if (id === socketIdRef.current) continue;
                    
                    const senders = connections[id].getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                    
                    if (videoSender && cameraTrack) {
                        videoSender.replaceTrack(cameraTrack);
                    }
                }
            }
        }
    }

    let getDislayMedia = () => {
        if (screen) {
            navigator.mediaDevices.getDisplayMedia({ 
                video: true, 
                audio: false 
            })
                .then(getDislayMediaSuccess)
                .catch((e) => {
                    console.log('Screen share error:', e);
                    setScreen(false);
                })
        }
    }

    let handleVideo = () => setVideo(!video);
    let handleAudio = () => setAudio(!audio);

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])

    let handleScreen = () => setScreen(!screen);

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        
        for (let id in connections) {
            connections[id].close();
        }
        
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        
        window.location.href = "/"
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    let sendMessage = () => {
        if (message.trim()) {
            socketRef.current.emit('chat-message', message, username)
            setMessage("");
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    }

    let connect = () => {
        if (username.trim()) {
            setAskForUsername(false);
            getMedia();
        }
    }

    // NEW: Copy meeting link function
    const copyMeetingLink = () => {
        navigator.clipboard.writeText(meetingLink);
        setShowCopySnackbar(true);
    }

    const localVideoTransform = screen ? 'none' : 'scaleX(-1)';

    // ============ UI RENDERING WITH NEW HEADER ============
    
    return (
        <div>
            {askForUsername ? (
                // LOBBY SCREEN (Keep existing code)
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)',
                    color: 'white',
                    padding: '2rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.1,
                        background: 'radial-gradient(circle at 20% 50%, #8B0000 0%, transparent 50%), radial-gradient(circle at 80% 80%, #DC143C 0%, transparent 50%)',
                        zIndex: 0
                    }} />

                    <div style={{
                        position: 'relative',
                        zIndex: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        padding: '3rem',
                        maxWidth: '500px',
                        width: '100%',
                        border: '1px solid rgba(139, 0, 0, 0.3)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '2rem'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                boxShadow: '0 10px 30px rgba(139, 0, 0, 0.5)'
                            }}>
                                <PersonIcon sx={{ fontSize: '40px', color: 'white' }} />
                            </div>
                            <h2 style={{
                                fontSize: '2rem',
                                fontWeight: 700,
                                marginBottom: '0.5rem',
                                color: 'white'
                            }}>
                                Join Meeting
                            </h2>
                            <p style={{ color: '#9ca3af', margin: 0 }}>
                                Enter your name to get started
                            </p>
                        </div>

                        <video 
                            ref={localVideoref} 
                            autoPlay 
                            muted
                            style={{
                                width: '100%',
                                height: '250px',
                                borderRadius: '16px',
                                objectFit: 'cover',
                                marginBottom: '1.5rem',
                                border: '2px solid rgba(139, 0, 0, 0.3)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                transform: localVideoTransform
                            }}
                        />

                        <TextField 
                            label="Your Name" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && connect()}
                            variant="outlined"
                            fullWidth
                            sx={{
                                marginBottom: '1.5rem',
                                '& .MuiOutlinedInput-root': {
                                    height: '56px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    '& fieldset': {
                                        borderColor: 'rgba(139, 0, 0, 0.5)',
                                        borderWidth: '2px'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(139, 0, 0, 0.7)',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#DC143C',
                                    }
                                },
                                '& .MuiOutlinedInput-input': {
                                    color: 'white',
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#d1d5db'
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#DC143C'
                                }
                            }}
                        />

                        <Button 
                            variant="contained" 
                            onClick={connect} 
                            disabled={!username.trim()}
                            fullWidth
                            sx={{
                                height: '52px',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                fontWeight: 600,
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
                            Join Now
                        </Button>
                    </div>
                </div>
            ) : (
            
            <div style={{
                    position: 'relative',
                    height: '100vh',
                    background: 'linear-gradient(135deg, #000000 0%, #0a0000 100%)',
                    overflow: 'hidden'
                }}>
                    
                    {/* 🆕 NEW: MODERN HEADER WITH MEETING LINK */}
                    <Box sx={{
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
                        justifyContent: 'space-between',
                        px: 3,
                        zIndex: 100
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ 
                                fontWeight: 700, 
                                color: 'white',
                                display: { xs: 'none', sm: 'block' }
                            }}>
                                FLUX Meeting
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                background: 'rgba(255, 255, 255, 0.05)',
                                px: 2,
                                py: 1,
                                borderRadius: '12px',
                                border: '1px solid rgba(139, 0, 0, 0.3)'
                            }}>
                                <LinkIcon sx={{ color: '#DC143C', fontSize: '1.2rem' }} />
                                <Typography variant="body2" sx={{ 
                                    color: '#9ca3af',
                                    maxWidth: { xs: '150px', sm: '300px', md: '400px' },
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {meetingLink}
                                </Typography>
                                <Tooltip title="Copy meeting link" arrow>
                                    <IconButton 
                                        onClick={copyMeetingLink}
                                        size="small"
                                        sx={{
                                            color: '#DC143C',
                                            '&:hover': {
                                                background: 'rgba(220, 20, 60, 0.1)'
                                            }
                                        }}
                                    >
                                        <ContentCopyIcon sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{ 
                            color: '#9ca3af',
                            display: { xs: 'none', md: 'block' }
                        }}>
                            {videos.length + 1} {videos.length === 0 ? 'Participant' : 'Participants'}
                        </Typography>
                    </Box>

                    {/* Snackbar for copy notification */}
                    <Snackbar 
                        open={showCopySnackbar} 
                        autoHideDuration={2000} 
                        onClose={() => setShowCopySnackbar(false)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Alert severity="success" sx={{ width: '100%' }}>
                            Meeting link copied to clipboard!
                        </Alert>
                    </Snackbar>

    {/* Chat Modal (Keep existing) */}
                    {showModal && (
                        <div style={{
                            position: 'absolute',
                            height: 'calc(100vh - 110px)',
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
                                        sx={{
                                            color: '#9ca3af',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                color: '#DC143C',
                                                background: 'rgba(139, 0, 0, 0.1)'
                                            }
                                        }}
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
                                    {messages.length !== 0 ? messages.map((item, index) => (
                                        <div key={index} style={{
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

                                <div style={{
                                    display: 'flex',
                                    gap: '10px',
                                    alignItems: 'flex-end'
                                }}>
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
                                                '& fieldset': {
                                                    borderColor: 'rgba(139, 0, 0, 0.3)'
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'rgba(139, 0, 0, 0.5)'
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#DC143C'
                                                }
                                            },
                                            '& .MuiOutlinedInput-input': {
                                                color: 'white',
                                            },
                                            '& .MuiInputBase-input::placeholder': {
                                                color: '#9ca3af',
                                                opacity: 1
                                            }
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
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
                                                transform: 'translateY(-2px)'
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

                    {/* Main Video Area - ADJUSTED for header */}
                    <div style={{
                        position: 'absolute',
                        top: 70,
                        left: 0,
                        right: 0,
                        bottom: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {videos.length === 0 ? (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(0, 0, 0, 0.3)'
                            }}>
                                <video
                                    ref={localVideoref}
                                    autoPlay
                                    muted
                                    style={{
                                        width: '70%',
                                        height: '70%',
                                        borderRadius: '16px',
                                        objectFit: 'cover',
                                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                                        transform: localVideoTransform
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    flex: 1,
                                    display: 'grid',
                                    gridTemplateColumns: videos.length === 1 ? '1fr' : 
                                                         videos.length <= 4 ? 'repeat(2, 1fr)' : 
                                                         'repeat(3, 1fr)',
                                    padding: '20px',
                                    gap: '20px',
                                    overflow: 'auto'
                                }}>
                                    {videos.map((v, i) => (
                                        <div
                                            key={v.socketId}
                                            style={{
                                                position: 'relative',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                                                minHeight: '200px'
                                            }}
                                        >
                                            <video
                                                ref={el => {
                                                    if (el && !videoRef.current.includes(el)) {
                                                        videoRef.current[i] = el;
                                                    }
                                                }}
                                                autoPlay
                                                playsInline
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    background: '#1a1a1a'
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
                                                fontWeight: 600
                                            }}>
                                                {v.name || 'Unknown'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div style={{
                                    position: 'absolute',
                                    top: 20,
                                    right: 20,
                                    width: '200px',
                                    height: '150px',
                                    zIndex: 50,
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
                                    border: '2px solid rgba(255, 255, 255, 0.2)'
                                }}>
                                    <video
                                        ref={localVideoref}
                                        autoPlay
                                        muted
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transform: localVideoTransform
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 5,
                                        left: 5,
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        fontSize: '0.8rem'
                                    }}>
                                        {username}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Control Buttons (Keep existing) */}
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
                            <IconButton onClick={handleVideo} sx={{
                                background: video ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 0, 0, 0.8)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                width: '60px',
                                height: '60px',
                                color: 'white',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: video ? 'rgba(255, 255, 255, 0.25)' : 'rgba(139, 0, 0, 1)',
                                    transform: 'translateY(-3px)',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
                                }
                            }}>
                                {video ? <VideocamIcon sx={{ fontSize: '2rem' }} /> : <VideocamOffIcon sx={{ fontSize: '2rem' }} />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="End call" arrow>
                            <IconButton onClick={handleEndCall} sx={{
                                background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                                border: '1px solid rgba(220, 20, 60, 0.5)',
                                width: '70px',
                                height: '70px',
                                color: 'white',
                                boxShadow: '0 8px 30px rgba(139, 0, 0, 0.5)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 12px 40px rgba(139, 0, 0, 0.7)'
                                }
                            }}>
                                <CallEndIcon sx={{ fontSize: '2.2rem' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={audio ? "Mute" : "Unmute"} arrow>
                            <IconButton onClick={handleAudio} sx={{
                                background: audio ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 0, 0, 0.8)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                width: '60px',
                                height: '60px',
                                color: 'white',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: audio ? 'rgba(255, 255, 255, 0.25)' : 'rgba(139, 0, 0, 1)',
                                    transform: 'translateY(-3px)',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
                                }
                            }}>
                                {audio ? <MicIcon sx={{ fontSize: '2rem' }} /> : <MicOffIcon sx={{ fontSize: '2rem' }} />}
                            </IconButton>
                        </Tooltip>

                        {screenAvailable && (
                            <Tooltip title={screen ? "Stop sharing" : "Share screen"} arrow>
                                <IconButton onClick={handleScreen} sx={{
                                    background: screen ? 'rgba(139, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    width: '60px',
                                    height: '60px',
                                    color: 'white',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        background: screen ? 'rgba(139, 0, 0, 1)' : 'rgba(255, 255, 255, 0.25)',
                                        transform: 'translateY(-3px)',
                                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
                                    }
                                }}>
                                    {screen ? <StopScreenShareIcon sx={{ fontSize: '2rem' }} /> : <ScreenShareIcon sx={{ fontSize: '2rem' }} />}
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Chat" arrow>
                            <IconButton onClick={openChat} sx={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                width: '60px',
                                height: '60px',
                                color: 'white',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.25)',
                                    transform: 'translateY(-3px)',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
                                }
                            }}>
                                <Badge badgeContent={newMessages} color="error" sx={{ '& .MuiBadge-badge': { backgroundColor: '#DC143C' } }}>
                                    <ChatIcon sx={{ fontSize: '2rem' }} />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    </div>
                </div>
            )}
        </div>
    );
}
