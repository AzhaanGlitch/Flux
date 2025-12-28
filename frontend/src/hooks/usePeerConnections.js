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
    
    // Refs for state that shouldn't trigger re-renders
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const pendingCandidatesRef = useRef({});
    const localStreamRef = useRef(localStream);
    const remoteStreamsRef = useRef({});
    const participantNamesRef = useRef({});

    // Update local stream ref when it changes
    useEffect(() => {
        localStreamRef.current = localStream;
        if (socketRef.current && localStream) {
            setVideoStreams(prev => prev.map(v => 
                v.isLocal ? { ...v, stream: localStream } : v
            ));
        }
    }, [localStream]);

    // Update participant names safely
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

    // Create Peer Connection
    const createPeerConnection = useCallback((socketId) => {
        // Prevent duplicate connections
        if (peerConnectionsRef.current[socketId]) {
            console.log(`⚠️ Connection already exists for ${socketId}`);
            return peerConnectionsRef.current[socketId];
        }

        console.log(`🔗 Creating peer connection for: ${socketId}`);
        const peerConnection = new RTCPeerConnection(peerConfig);
        peerConnectionsRef.current[socketId] = peerConnection;

        if (!remoteStreamsRef.current[socketId]) {
            remoteStreamsRef.current[socketId] = { camera: null, screen: null };
        }

        // Handle Incoming Tracks
        peerConnection.ontrack = (event) => {
            const remoteStream = event.streams[0];
            if (!remoteStream) return;

            let streamType = 'camera';
            const existingCamera = remoteStreamsRef.current[socketId].camera;

            // Simple Logic: If we already have a camera stream ID, this must be screen
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

                // Check if this stream is already in the list to avoid flickering
                const existingIdx = prev.findIndex(v => v.socketId === socketId && v.type === streamType);

                if (existingIdx !== -1) {
                    const updated = [...prev];
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        stream: remoteStream,
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

            // Handle track removal
            event.track.onended = () => {
                const allEnded = remoteStream.getTracks().every(t => t.readyState === 'ended');
                if (allEnded) {
                     setVideoStreams(prev => 
                        prev.filter(v => !(v.socketId === socketId && v.type === streamType))
                    );
                    if (streamType === 'camera') remoteStreamsRef.current[socketId].camera = null;
                    else remoteStreamsRef.current[socketId].screen = null;
                }
            };
        };

        // Handle ICE Candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('signal', socketId, JSON.stringify({
                    ice: event.candidate
                }));
            }
        };

        // Add Local Tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        return peerConnection;
    }, []); 

    // Handle Signaling Messages (Offer/Answer/ICE)
    const handleSignal = useCallback(async (fromSocketId, message) => {
        const signal = JSON.parse(message);
        
        // Ensure connection exists
        let peerConnection = peerConnectionsRef.current[fromSocketId];
        if (!peerConnection) {
            // Passive connection creation (we received an offer)
            peerConnection = createPeerConnection(fromSocketId);
        }

        try {
            if (signal.sdp) {
                // GUARD: If we receive an offer but we are already 'stable', it might be a renegotiation or error.
                // But generally, we just proceed.
                // The critical guard is stopping collisions before they start (done in user-joined).
                
                // If we get an answer but we aren't waiting for one (stable), ignore it to prevent crash.
                if (signal.sdp.type === 'answer' && peerConnection.signalingState === 'stable') {
                    console.log('⚠️ Ignoring answer, state is already stable.');
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

    // Main Socket Logic
    useEffect(() => {
        if (!roomCode || !username) return;

        socketRef.current = io(server, {
            secure: true,
            reconnection: true,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Connected to server');
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

        // THE CRITICAL FIX: "ID Tie-Breaker"
        socket.on('user-joined', (joinedSocketId, allParticipants) => {
            // Iterate through all users in the room
            allParticipants.forEach(async (participantId) => {
                if (participantId === socket.id) return; // Don't call myself

                // Determine who calls whom based on Socket ID
                // Only the "larger" ID initiates the call.
                // The "smaller" ID just waits for the offer.
                if (socket.id > participantId) {
                    console.log(`📞 I am initiating call to ${participantId} (My ID is larger)`);
                    
                    const peerConnection = createPeerConnection(participantId);
                    try {
                        const offer = await peerConnection.createOffer({
                            offerToReceiveAudio: true, 
                            offerToReceiveVideo: true,
                        });
                        await peerConnection.setLocalDescription(offer);
                        socket.emit('signal', participantId, JSON.stringify({
                            sdp: peerConnection.localDescription
                        }));
                    } catch (e) {
                        console.error('Error creating offer:', e);
                    }
                } else {
                     console.log(`⏳ Waiting for call from ${participantId} (My ID is smaller)`);
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

        return () => {
            Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
            peerConnectionsRef.current = {};
            socket.disconnect();
        };
    }, [roomCode, username, createPeerConnection, handleSignal, updateParticipantName]); 

    return {
        videoStreams,
        connectionError,
        socket: socketRef.current,
        peerConnections: peerConnectionsRef.current,
    };
};