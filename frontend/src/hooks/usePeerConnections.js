// frontend/src/hooks/usePeerConnections.js
import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import server from '../environment';

const peerConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
};

export const usePeerConnections = (roomCode, username, localStream) => {
    const [videoStreams, setVideoStreams] = useState([]);
    const [connectionError, setConnectionError] = useState(null);
    
    // REFS (These persist without triggering re-renders)
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const pendingCandidatesRef = useRef({});
    const localStreamRef = useRef(localStream);
    const remoteStreamsRef = useRef({});
    const participantNamesRef = useRef({}); // Using Ref for names to prevent dependency loops

    // Keep localStreamRef up to date
    useEffect(() => {
        localStreamRef.current = localStream;
        if (socketRef.current && localStream) {
            setVideoStreams(prev => prev.map(v => 
                v.isLocal ? { ...v, stream: localStream } : v
            ));
        }
    }, [localStream]);

    // Helper to safely update names without breaking hooks
    const updateParticipantName = useCallback((id, name) => {
        participantNamesRef.current[id] = name;
        setVideoStreams(prev => prev.map(v => {
            if (v.socketId === id) {
                return { 
                    ...v, 
                    name: v.type === 'screen' ? `${name}'s Screen` : name 
                };
            }
            return v;
        }));
    }, []);

    // 1. Create Peer Connection (Dependencies REMOVED to fix infinite loop)
    const createPeerConnection = useCallback((socketId) => {
        // Prevent duplicate connections
        if (peerConnectionsRef.current[socketId]) {
            return peerConnectionsRef.current[socketId];
        }

        console.log(`🔗 Creating connection for: ${socketId}`);
        const peerConnection = new RTCPeerConnection(peerConfig);
        peerConnectionsRef.current[socketId] = peerConnection;

        if (!remoteStreamsRef.current[socketId]) {
            remoteStreamsRef.current[socketId] = { camera: null, screen: null };
        }

        peerConnection.ontrack = (event) => {
            const remoteStream = event.streams[0];
            if (!remoteStream) return;

            let streamType = 'camera';
            const existingCamera = remoteStreamsRef.current[socketId].camera;

            // Distinguish Screen Share vs Camera by Stream ID
            if (existingCamera && existingCamera.id !== remoteStream.id) {
                streamType = 'screen';
            }
            
            if (streamType === 'camera') {
                remoteStreamsRef.current[socketId].camera = remoteStream;
            } else {
                remoteStreamsRef.current[socketId].screen = remoteStream;
            }

            setVideoStreams(prev => {
                const currentName = participantNamesRef.current[socketId] || socketId;
                const displayName = streamType === 'screen' ? `${currentName}'s Screen` : currentName;

                // Update existing or add new
                const existingIdx = prev.findIndex(v => v.socketId === socketId && v.type === streamType);
                
                if (existingIdx !== -1) {
                    const updated = [...prev];
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        stream: remoteStream, // Update stream reference
                        name: displayName
                    };
                    return updated;
                } else {
                    return [...prev, {
                        socketId,
                        stream: remoteStream,
                        type: streamType,
                        name: displayName,
                        isLocal: false,
                        timestamp: Date.now(),
                    }];
                }
            });

            event.track.onended = () => {
                if (remoteStream.getTracks().every(t => t.readyState === 'ended')) {
                     setVideoStreams(prev => 
                        prev.filter(v => !(v.socketId === socketId && v.type === streamType))
                    );
                    if (streamType === 'camera') remoteStreamsRef.current[socketId].camera = null;
                    else remoteStreamsRef.current[socketId].screen = null;
                }
            };
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('signal', socketId, JSON.stringify({
                    ice: event.candidate
                }));
            }
        };

        peerConnection.onconnectionstatechange = () => {
            if (peerConnection.connectionState === 'failed') {
                peerConnection.restartIce();
            }
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        return peerConnection;
    }, []); // Empty dependency array prevents the loop!

    // 2. Handle Signaling
    const handleSignal = useCallback(async (fromSocketId, message) => {
        const signal = JSON.parse(message);
        let peerConnection = peerConnectionsRef.current[fromSocketId];

        if (!peerConnection) {
            peerConnection = createPeerConnection(fromSocketId);
        }

        try {
            if (signal.sdp) {
                // CRITICAL FIX: If we are 'stable' and receive an answer, ignore it to prevent crash
                if (signal.sdp.type === 'answer' && peerConnection.signalingState === 'stable') {
                    console.log('⚠️ Ignoring answer, connection is stable.');
                    return; 
                }

                await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));

                if (signal.sdp.type === 'offer') {
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    socketRef.current?.emit('signal', fromSocketId, JSON.stringify({
                        sdp: peerConnection.localDescription
                    }));
                }

                // Process queued ICE candidates
                if (pendingCandidatesRef.current[fromSocketId]) {
                    for (const candidate of pendingCandidatesRef.current[fromSocketId]) {
                        await peerConnection.addIceCandidate(candidate);
                    }
                    delete pendingCandidatesRef.current[fromSocketId];
                }
            } else if (signal.ice) {
                const candidate = new RTCIceCandidate(signal.ice);
                if (peerConnection.remoteDescription) {
                    await peerConnection.addIceCandidate(candidate);
                } else {
                    if (!pendingCandidatesRef.current[fromSocketId]) {
                        pendingCandidatesRef.current[fromSocketId] = [];
                    }
                    pendingCandidatesRef.current[fromSocketId].push(candidate);
                }
            }
        } catch (error) {
            console.error(`❌ Signal Error from ${fromSocketId}:`, error);
        }
    }, [createPeerConnection]);

    // 3. Main Connection Logic
    useEffect(() => {
        if (!roomCode || !username) return;
        
        // Prevent multiple socket initializations
        if (socketRef.current) return;

        console.log('🚀 Initializing socket...');
        
        socketRef.current = io(server, {
            secure: true,
            reconnection: true,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Connected');
            if (localStreamRef.current) {
                setVideoStreams([{
                    socketId: socket.id,
                    stream: localStreamRef.current,
                    type: 'camera',
                    name: username,
                    isLocal: true,
                    timestamp: Date.now(),
                }]);
            }
            updateParticipantName(socket.id, username);
            socket.emit('join-call', roomCode);
            socket.emit('username', username);
        });

        socket.on('signal', handleSignal);
        socket.on('username', (socketId, name) => updateParticipantName(socketId, name));

        // CRITICAL FIX: The "ID Tie-Breaker"
        socket.on('user-joined', (joinedSocketId, allParticipants) => {
            allParticipants.forEach(async (participantId) => {
                if (participantId === socket.id) return;
                
                // Only the "larger" ID calls the "smaller" ID. 
                // This prevents both sides from calling each other at the same time.
                if (socket.id > participantId) {
                    console.log(`📞 I am initiating call to ${participantId}`);
                    
                    const peerConnection = createPeerConnection(participantId);
                    try {
                        const offer = await peerConnection.createOffer({
                            offerToReceiveAudio: true, offerToReceiveVideo: true,
                        });
                        await peerConnection.setLocalDescription(offer);
                        socket.emit('signal', participantId, JSON.stringify({
                            sdp: peerConnection.localDescription
                        }));
                    } catch (e) {
                        console.error('Error creating offer:', e);
                    }
                }
            });
        });

        socket.on('user-left', (leftSocketId) => {
            if (peerConnectionsRef.current[leftSocketId]) {
                peerConnectionsRef.current[leftSocketId].close();
                delete peerConnectionsRef.current[leftSocketId];
            }
            delete remoteStreamsRef.current[leftSocketId];
            setVideoStreams(prev => prev.filter(v => v.socketId !== leftSocketId));
        });

        socket.on('screen-share-stopped', (sharerSocketId) => {
            setVideoStreams(prev => prev.filter(v => !(v.socketId === sharerSocketId && v.type === 'screen')));
            if (remoteStreamsRef.current[sharerSocketId]) {
                remoteStreamsRef.current[sharerSocketId].screen = null;
            }
        });

        // Cleanup function
        return () => {
            console.log('🧹 Cleanup');
            Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
            peerConnectionsRef.current = {};
            if (socket) socket.disconnect();
            socketRef.current = null;
        };
    }, [roomCode, username, createPeerConnection, handleSignal, updateParticipantName]); 

    return {
        videoStreams,
        connectionError,
        socket: socketRef.current,
        peerConnections: peerConnectionsRef.current,
    };
};