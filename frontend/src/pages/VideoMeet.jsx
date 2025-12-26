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

/**
 * FIXED: Sub-component to handle remote video streams.
 * React cannot pass 'srcObject' as a prop directly to <video>.
 * This component uses a ref and useEffect to attach the stream imperatively.
 */
const VideoCard = ({ stream, name, style }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            ...style
        }}>
            <video
                ref={videoRef}
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
                bottom: 10,
                left: 10,
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 600
            }}>
                {name || 'Participant'}
            </div>
        </div>
    );
};

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

    let [videos, setVideos] = useState([])
    
    const originalStreamRef = useRef(null);

    useEffect(() => {
        getPermissions();
    }, [])

    // Ensure local video keeps its stream after re-renders
    useEffect(() => {
        if (localVideoref.current && window.localStream) {
            localVideoref.current.srcObject = window.localStream;
        }
    });

    const getPermissions = async () => {
        try {
            const userMediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
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
            console.error("Error getting permissions:", error);
            setVideoAvailable(false);
            setAudioAvailable(false);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined && !askForUsername) {
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
        if (localVideoref.current) localVideoref.current.srcObject = stream

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
                video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false, 
                audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false
            })
                .then(getUserMediaSuccess)
                .catch((e) => console.error('getUserMedia error:', e))
        }
    }

    let getDislayMediaSuccess = (stream) => {
        const screenVideoTrack = stream.getVideoTracks()[0];
        if (localVideoref.current) localVideoref.current.srcObject = stream;
        
        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            const senders = connections[id].getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender && screenVideoTrack) {
                videoSender.replaceTrack(screenVideoTrack);
            }
        }

        screenVideoTrack.onended = () => {
            setScreen(false);
            if (originalStreamRef.current) {
                if (localVideoref.current) localVideoref.current.srcObject = originalStreamRef.current;
                const cameraTrack = originalStreamRef.current.getVideoTracks()[0];
                for (let id in connections) {
                    if (id === socketIdRef.current) continue;
                    const senders = connections[id].getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                    if (videoSender && cameraTrack) videoSender.replaceTrack(cameraTrack);
                }
            }
        }
    }

    let getDislayMedia = () => {
        if (screen) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
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
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(() => {
                        if (signal.sdp.type === 'offer') {
                            connections[fromId].createAnswer()
                                .then((description) => {
                                    connections[fromId].setLocalDescription(description)
                                        .then(() => {
                                            socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                                        })
                                })
                        }
                    })
            }
            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.error(e))
            }
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false, reconnection: true })
        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id
            socketRef.current.emit('username', username);
            participantNames[socketIdRef.current] = username;
            
            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('username', (id, name) => {
                participantNames[id] = name;
                setVideos(prevVideos => prevVideos.map(v => v.socketId === id ? { ...v, name: name } : v));
            });

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
                delete participantNames[id];
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    if (socketListId === socketIdRef.current) return;
                    
                    if (!connections[socketListId]) {
                        connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                        
                        connections[socketListId].onicecandidate = (event) => {
                            if (event.candidate) {
                                socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                            }
                        }

                        connections[socketListId].ontrack = (event) => {
                            const remoteStream = event.streams[0];
                            if (remoteStream) {
                                setVideos(prevVideos => {
                                    const exists = prevVideos.find(v => v.socketId === socketListId);
                                    if (!exists) {
                                        return [...prevVideos, {
                                            socketId: socketListId,
                                            stream: remoteStream,
                                            name: participantNames[socketListId] || 'Participant'
                                        }];
                                    }
                                    return prevVideos.map(v => v.socketId === socketListId ? { ...v, stream: remoteStream } : v);
                                });
                            }
                        };

                        if (window.localStream) {
                            window.localStream.getTracks().forEach(track => {
                                connections[socketListId].addTrack(track, window.localStream);
                            });
                        }
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue
                        connections[id2].createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                            .then((description) => connections[id2].setLocalDescription(description))
                            .then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                            })
                    }
                }
            })
        })
    }

    let handleVideo = () => setVideo(!video);
    let handleAudio = () => setAudio(!audio);

    useEffect(() => {
        if (screen !== undefined) getDislayMedia();
    }, [screen])

    let handleScreen = () => setScreen(!screen);

    let handleEndCall = () => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { }
        for (let id in connections) connections[id].close();
        if (socketRef.current) socketRef.current.disconnect();
        window.location.href = "/"
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [...prevMessages, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) setNewMessages((prev) => prev + 1);
    };

    let sendMessage = () => {
        if (message.trim()) {
            socketRef.current.emit('chat-message', message, username)
            setMessage("");
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
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)',
                    color: 'white', padding: '2rem', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '3rem', maxWidth: '500px', width: '100%', border: '1px solid rgba(139, 0, 0, 0.3)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <PersonIcon sx={{ fontSize: '40px', color: 'white' }} />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Join Meeting</h2>
                        </div>
                        <video ref={localVideoref} autoPlay muted style={{ width: '100%', height: '250px', borderRadius: '16px', objectFit: 'cover', marginBottom: '1.5rem', transform: localVideoTransform }} />
                        <TextField label="Your Name" value={username} onChange={e => setUsername(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && connect()} variant="outlined" fullWidth sx={{ marginBottom: '1.5rem', '& .MuiOutlinedInput-root': { color: 'white' } }} />
                        <Button variant="contained" onClick={connect} disabled={!username.trim()} fullWidth sx={{ height: '52px', background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)' }}>Join Now</Button>
                    </div>
                </div>
            ) : (
                <div style={{ position: 'relative', height: '100vh', background: 'linear-gradient(135deg, #000000 0%, #0a0000 100%)', overflow: 'hidden' }}>
                    {showModal && (
                        <div style={{ position: 'absolute', height: 'calc(100vh - 40px)', right: '20px', top: '20px', background: 'rgba(0, 0, 0, 0.95)', width: '380px', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: '16px', border: '1px solid rgba(139, 0, 0, 0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid rgba(139, 0, 0, 0.3)' }}>
                                <h1 style={{ fontSize: '1.5rem', color: 'white', margin: 0 }}>Chat</h1>
                                <IconButton onClick={() => setModal(false)} sx={{ color: '#9ca3af' }}><CloseIcon /></IconButton>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                                {messages.map((item, index) => (
                                    <div key={index} style={{ background: 'rgba(139, 0, 0, 0.1)', padding: '12px', borderRadius: '12px', marginBottom: '12px', color: 'white' }}>
                                        <b style={{ color: '#DC143C' }}>{item.sender}</b>: {item.data}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <TextField value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} fullWidth sx={{ '& .MuiOutlinedInput-root': { color: 'white', background: 'rgba(255, 255, 255, 0.1)' } }} />
                                <IconButton onClick={sendMessage} sx={{ background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)', color: 'white' }}><SendIcon /></IconButton>
                            </div>
                        </div>
                    )}

                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 100, display: 'flex' }}>
                        {videos.length === 0 ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <video ref={localVideoref} autoPlay muted style={{ width: '70%', height: '70%', borderRadius: '16px', objectFit: 'cover', transform: localVideoTransform }} />
                            </div>
                        ) : (
                            <>
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: videos.length > 1 ? '1fr 1fr' : '1fr', gap: '20px', padding: '20px' }}>
                                    {videos.map((v) => (
                                        <VideoCard key={v.socketId} stream={v.stream} name={v.name} />
                                    ))}
                                </div>
                                <div style={{ position: 'absolute', top: 20, right: 20, width: '200px', height: '150px', zIndex: 50 }}>
                                    <video ref={localVideoref} autoPlay muted style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', border: '2px solid white', transform: localVideoTransform }} />
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ position: 'absolute', width: '100%', bottom: '30px', display: 'flex', justifyContent: 'center', gap: '15px', zIndex: 100 }}>
                        <IconButton onClick={handleVideo} sx={{ background: video ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 0, 0, 0.8)', color: 'white', width: '60px', height: '60px' }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} sx={{ background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)', color: 'white', width: '70px', height: '70px' }}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} sx={{ background: audio ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 0, 0, 0.8)', color: 'white', width: '60px', height: '60px' }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        {screenAvailable && (
                            <IconButton onClick={handleScreen} sx={{ background: screen ? 'rgba(139, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.15)', color: 'white', width: '60px', height: '60px' }}>
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        )}
                        <IconButton onClick={() => { setModal(true); setNewMessages(0); }} sx={{ background: 'rgba(255, 255, 255, 0.15)', color: 'white', width: '60px', height: '60px' }}>
                            <Badge badgeContent={newMessages} color="error"><ChatIcon /></Badge>
                        </IconButton>
                    </div>
                </div>
            )}
        </div>
    );
}