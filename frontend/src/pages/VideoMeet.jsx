import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button, Tooltip } from '@mui/material';
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
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" },
        { "urls": "stun:stun1.l.google.com:19302" }
    ]
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

    const videoRef = useRef([])
    let [videos, setVideos] = useState([])
    
    // Store original stream to restore after screen share
    const originalStreamRef = useRef(null);

    useEffect(() => {
        getPermissions();
    }, [])

    const getPermissions = async () => {
        try {
            const userMediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
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
            console.log("Error getting permissions:", error);
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

        // Replace tracks for all existing connections
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
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e))
        }
    }

    let getDislayMediaSuccess = (stream) => {
        console.log('Screen share started');
        
        const screenVideoTrack = stream.getVideoTracks()[0];
        
        // Add screen share as separate video
        setVideos(prevVideos => {
            const screenExists = prevVideos.find(v => v.socketId === `${socketIdRef.current}-screen`);
            
            if (!screenExists) {
                return [...prevVideos, {
                    socketId: `${socketIdRef.current}-screen`,
                    stream: stream,
                    autoplay: true,
                    playsinline: true,
                    isScreen: true
                }];
            }
            return prevVideos;
        });

        // Send screen track to all peers
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
            
            // Remove screen video
            setVideos(prevVideos => prevVideos.filter(v => v.socketId !== `${socketIdRef.current}-screen`));
            
            // Restore camera
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

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })
        
        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            console.log('Socket connected:', socketRef.current.id);
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id
            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                console.log('User left:', id);
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
                
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            })

            socketRef.current.on('user-joined', (id, clients) => {
                console.log('Users in room:', clients);
                
                clients.forEach((socketListId) => {
                    if (!connections[socketListId]) {
                        console.log('Creating connection for:', socketListId);
                        connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                        
                        connections[socketListId].onicecandidate = function (event) {
                            if (event.candidate != null) {
                                socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                            }
                        }

                        connections[socketListId].ontrack = (event) => {
                            console.log('Received remote track from:', socketListId);
                            const remoteStream = event.streams[0];
                            
                            if (remoteStream) {
                                console.log('Stream tracks:', remoteStream.getTracks());
                                
                                setVideos(prevVideos => {
                                    const exists = prevVideos.find(v => v.socketId === socketListId);
                                    
                                    if (!exists) {
                                        console.log('Adding new remote video');
                                        return [...prevVideos, {
                                            socketId: socketListId,
                                            stream: remoteStream,
                                            autoplay: true,
                                            playsinline: true
                                        }];
                                    } else {
                                        console.log('Updating existing remote video');
                                        return prevVideos.map(v => 
                                            v.socketId === socketListId 
                                                ? { ...v, stream: remoteStream }
                                                : v
                                        );
                                    }
                                });
                            }
                        };

                        // Add local stream
                        if (window.localStream) {
                            console.log('Adding local tracks to connection');
                            window.localStream.getTracks().forEach(track => {
                                console.log('Adding track:', track.kind);
                                connections[socketListId].addTrack(track, window.localStream);
                            });
                        }
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        console.log('Creating offer for:', id2);
                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
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

    const localVideoTransform = screen ? 'none' : 'scaleX(-1)';

    return (
        <div>
            {askForUsername ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)',
                    color: 'white',
                    padding: '2rem'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        padding: '3rem',
                        maxWidth: '500px',
                        width: '100%',
                        border: '1px solid rgba(139, 0, 0, 0.3)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <PersonIcon sx={{ fontSize: '40px', color: 'white' }} />
                            </div>
                            <h2>Join Meeting</h2>
                            <p style={{ color: '#9ca3af' }}>Enter your name to get started</p>
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
                            sx={{ marginBottom: '1.5rem' }}
                        />

                        <Button 
                            variant="contained" 
                            onClick={connect} 
                            disabled={!username.trim()}
                            fullWidth
                            sx={{
                                height: '52px',
                                background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)'
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
                    {/* Chat Modal */}
                    {showModal && (
                        <div style={{
                            position: 'absolute',
                            height: 'calc(100vh - 40px)',
                            right: '20px',
                            top: '20px',
                            background: 'rgba(0, 0, 0, 0.95)',
                            borderRadius: '16px',
                            width: '380px',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h1 style={{ color: 'white' }}>Chat</h1>
                                <IconButton onClick={() => setModal(false)} sx={{ color: 'white' }}>
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                                {messages.map((item, index) => (
                                    <div key={index} style={{
                                        background: 'rgba(139, 0, 0, 0.1)',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        marginBottom: '12px'
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
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    fullWidth
                                    size="small"
                                />
                                <IconButton onClick={sendMessage} disabled={!message.trim()}>
                                    <SendIcon />
                                </IconButton>
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
                        gap: '15px',
                        zIndex: 100
                    }}>
                        <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
                            <IconButton onClick={handleVideo} sx={{
                                background: video ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 0, 0, 0.8)',
                                color: 'white',
                                width: '60px',
                                height: '60px'
                            }}>
                                {video ? <VideocamIcon sx={{ fontSize: '2rem' }} /> : <VideocamOffIcon sx={{ fontSize: '2rem' }} />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="End call">
                            <IconButton onClick={handleEndCall} sx={{
                                background: '#DC143C',
                                color: 'white',
                                width: '70px',
                                height: '70px'
                            }}>
                                <CallEndIcon sx={{ fontSize: '2.2rem' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={audio ? "Mute" : "Unmute"}>
                            <IconButton onClick={handleAudio} sx={{
                                background: audio ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 0, 0, 0.8)',
                                color: 'white',
                                width: '60px',
                                height: '60px'
                            }}>
                                {audio ? <MicIcon sx={{ fontSize: '2rem' }} /> : <MicOffIcon sx={{ fontSize: '2rem' }} />}
                            </IconButton>
                        </Tooltip>

                        {screenAvailable && (
                            <Tooltip title={screen ? "Stop sharing" : "Share screen"}>
                                <IconButton onClick={handleScreen} sx={{
                                    background: screen ? 'rgba(139, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.15)',
                                    color: 'white',
                                    width: '60px',
                                    height: '60px'
                                }}>
                                    {screen ? <StopScreenShareIcon sx={{ fontSize: '2rem' }} /> : <ScreenShareIcon sx={{ fontSize: '2rem' }} />}
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Chat">
                            <Badge badgeContent={newMessages} color='error'>
                                <IconButton onClick={() => setModal(!showModal)} sx={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    color: 'white',
                                    width: '60px',
                                    height: '60px'
                                }}>
                                    <ChatIcon sx={{ fontSize: '2rem' }} />
                                </IconButton>
                            </Badge>
                        </Tooltip>
                    </div>

                    {/* Local Video */}
                    <video 
                        ref={localVideoref} 
                        autoPlay 
                        muted
                        style={{
                            position: 'absolute',
                            bottom: '120px',
                            left: '20px',
                            height: '200px',
                            width: '280px',
                            borderRadius: '16px',
                            objectFit: 'cover',
                            zIndex: 10,
                            transform: localVideoTransform,
                            border: '3px solid rgba(139, 0, 0, 0.5)'
                        }}
                    />

                    {/* Remote Videos Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '20px',
                        padding: '20px',
                        height: 'calc(100vh - 140px)',
                        overflowY: 'auto'
                    }}>
                        {videos.map((video) => (
                            <div key={video.socketId} style={{
                                position: 'relative',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                background: 'rgba(0, 0, 0, 0.5)',
                                border: '2px solid rgba(139, 0, 0, 0.3)',
                                minHeight: '300px'
                            }}>
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '15px',
                                    left: '15px',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}>
                                    {video.isScreen ? 'Screen Share' : 'Participant'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}