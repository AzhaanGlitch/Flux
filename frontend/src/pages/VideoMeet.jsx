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
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {
    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState([]);
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    const videoRef = useRef([])
    let [videos, setVideos] = useState([])

    useEffect(() => {
        getPermissions();
    }, [])

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: videoAvailable, 
                    audio: audioAvailable 
                });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
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
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue
            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }

    let getDislayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue
            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream
            getUserMedia()
        })
    }

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => console.log(e))
            }
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
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id
            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

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

    return (
        <div>
            {askForUsername ? (
                // LOBBY SCREEN
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
                    {/* Background Pattern */}
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
                                marginBottom: '0.5rem'
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
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
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
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'white',
                                    '& fieldset': {
                                        borderColor: 'rgba(139, 0, 0, 0.3)',
                                        borderWidth: '2px'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(139, 0, 0, 0.6)',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#8B0000',
                                    }
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#9ca3af'
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
                // MEETING SCREEN
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
                                            border: '1px solid rgba(139, 0, 0, 0.2)',
                                            animation: 'slideIn 0.3s ease'
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
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                color: 'white',
                                                '& fieldset': {
                                                    borderColor: 'rgba(139, 0, 0, 0.3)'
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'rgba(139, 0, 0, 0.5)'
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#8B0000'
                                                }
                                            },
                                            '& .MuiInputBase-input::placeholder': {
                                                color: '#6b7280',
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
                                onClick={handleVideo}
                                sx={{
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
                                }}
                            >
                                <CallEndIcon sx={{ fontSize: '2.2rem' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={audio ? "Mute" : "Unmute"} arrow>
                            <IconButton 
                                onClick={handleAudio}
                                sx={{
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
                                }}
                            >
                                {audio ? <MicIcon sx={{ fontSize: '2rem' }} /> : <MicOffIcon sx={{ fontSize: '2rem' }} />}
                            </IconButton>
                        </Tooltip>

                        {screenAvailable && (
                            <Tooltip title={screen ? "Stop sharing" : "Share screen"} arrow>
                                <IconButton 
                                    onClick={handleScreen}
                                    sx={{
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
                                    }}
                                >
                                    {screen ? <StopScreenShareIcon sx={{ fontSize: '2rem' }} /> : <ScreenShareIcon sx={{ fontSize: '2rem' }} />}
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Chat" arrow>
                            <Badge badgeContent={newMessages} max={99} color='error'>
                                <IconButton 
                                    onClick={() => setModal(!showModal)}
                                    sx={{
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
                                    }}
                                >
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
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                            border: '3px solid rgba(139, 0, 0, 0.5)',
                            zIndex: 10
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
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                                border: '2px solid rgba(139, 0, 0, 0.3)',
                                transition: 'all 0.3s ease',
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
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                                {/* Participant Indicator */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '15px',
                                    left: '15px',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    backdropFilter: 'blur(10px)',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    border: '1px solid rgba(139, 0, 0, 0.3)'
                                }}>
                                    Participant
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Animations */}
            <style>
                {`
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    /* Custom Scrollbar */
                    ::-webkit-scrollbar {
                        width: 8px;
                    }

                    ::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                    }

                    ::-webkit-scrollbar-thumb {
                        background: rgba(139, 0, 0, 0.5);
                        border-radius: 10px;
                    }

                    ::-webkit-scrollbar-thumb:hover {
                        background: rgba(139, 0, 0, 0.7);
                    }

                    /* Responsive Design */
                    @media (max-width: 768px) {
                        /* Adjust grid for mobile */
                        div[style*="grid-template-columns"] {
                            grid-template-columns: 1fr !important;
                            padding: 10px !important;
                        }

                        /* Smaller local video on mobile */
                        video[style*="bottom: 120px"] {
                            width: 150px !important;
                            height: 120px !important;
                            bottom: 100px !important;
                        }

                        /* Smaller control buttons on mobile */
                        button[style*="width: 60px"] {
                            width: 50px !important;
                            height: 50px !important;
                        }

                        button[style*="width: 70px"] {
                            width: 60px !important;
                            height: 60px !important;
                        }

                        /* Full width chat on mobile */
                        div[style*="width: 380px"] {
                            width: 100% !important;
                            height: 100% !important;
                            right: 0 !important;
                            top: 0 !important;
                            border-radius: 0 !important;
                        }
                    }
                `}
            </style>
        </div>
    )
}