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
    
    // REFS
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const pendingCandidatesRef = useRef({});
    const localStreamRef = useRef(localStream);
    const remoteStreamsRef = useRef({});
    const participantNamesRef = useRef({}); 

    // Keep localStreamRef up to date
    useEffect(() => {
        localStreamRef.current = localStream;
        if (socketRef.current && localStream) {
            setVideoStreams(prev => prev.map(v => 
                v.isLocal ? { ...v, stream: localStream } : v
            ));
        }
    }, [localStream]);

    // Helper to update names
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

    // 1. Create Peer Connection
    const createPeerConnection = useCallback((socketId) => {
        // Prevent duplicate connections
        if (peerConnectionsRef.current[socketId]) {
            console.warn(`⚠️ Connection already exists for ${socketId}`);
            return peerConnectionsRef.current[socketId];
        }

        console.log(`🔗 Creating connection for: ${socketId}`);
        const peerConnection = new RTCPeerConnection(peerConfig);
        peerConnectionsRef.current[socketId] = peerConnection;

        if (!remoteStreamsRef.current[socketId]) {
            remoteStreamsRef.current[socketId] = { camera: null, screen: null };
        }

        // --- HANDLE INCOMING TRACKS ---
        peerConnection.ontrack = (event) => {
            console.log(`🎥 Track received from ${socketId}:`, event.track.kind);

            // Robust fallback: if streams[0] is missing, create a new stream from the track
            const remoteStream = event.streams[0] || new MediaStream([event.track]);
            
            // Logic to distinguish Camera vs Screen
            // Note: This relies on the fact that we create separate streams for screen share in useScreenShare.js
            let streamType = 'camera';
            const existingCamera = remoteStreamsRef.current[socketId].camera;

            // If we already have a camera stream and this ID is different, it's likely a screen share
            if (existingCamera && existingCamera.id !== remoteStream.id) {
                streamType = 'screen';
            }
            
            // Store ref
            if (streamType === 'camera') {
                remoteStreamsRef.current[socketId].camera = remoteStream;
            } else {
                remoteStreamsRef.current[socketId].screen = remoteStream;
            }

            // Update State
            setVideoStreams(prev => {
                const currentName = participantNamesRef.current[socketId] || socketId;
                const displayName = streamType === 'screen' ? `${currentName}'s Screen` : currentName;

                // Check if this specific stream (ID + Type) already exists
                const existingIdx = prev.findIndex(v => v.socketId === socketId && v.type === streamType);
                
                if (existingIdx !== -1) {
                    // Update existing
                    const updated = [...prev];
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        stream: remoteStream,
                        name: displayName
                    };
                    return updated;
                } else {
                    // Add new
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

            // Cleanup when track ends
            event.track.onended = () => {
                console.log(`🛑 Track ended for ${socketId} (${streamType})`);
                // Only remove if all tracks in this stream are ended
                if (remoteStream.getTracks().every(t => t.readyState === 'ended')) {
                     setVideoStreams(prev => 
                        prev.filter(v => !(v.socketId === socketId && v.type === streamType))
                    );
                    if (streamType === 'camera') remoteStreamsRef.current[socketId].camera = null;
                    else remoteStreamsRef.current[socketId].screen = null;
                }
            };
        };

        // --- ICE CANDIDATES ---
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('signal', socketId, JSON.stringify({
                    ice: event.candidate
                }));
            }
        };

        // --- CONNECTION STATE ---
        peerConnection.onconnectionstatechange = () => {
            console.log(`📶 Connection state with ${socketId}: ${peerConnection.connectionState}`);
            if (peerConnection.connectionState === 'failed') {
                peerConnection.restartIce();
            }
        };

        // Add local tracks to the connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        return peerConnection;
    }, []);

    // 2. Handle Signaling
    const handleSignal = useCallback(async (fromSocketId, message) => {
        const signal = JSON.parse(message);
        let peerConnection = peerConnectionsRef.current[fromSocketId];

        // Create connection if it doesn't exist (receiving a call)
        if (!peerConnection) {
            peerConnection = createPeerConnection(fromSocketId);
        }

        try {
            if (signal.sdp) {
                console.log(`📩 Received SDP (${signal.sdp.type}) from ${fromSocketId}`);

                // CRITICAL: Avoid setting remote description if state prevents it
                if (signal.sdp.type === 'answer' && peerConnection.signalingState === 'stable') {
                    console.log('⚠️ Ignoring answer, connection is already stable.');
                    return; 
                }

                await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));

                // If we received an OFFER, we must answer (this handles initial calls AND renegotiations)
                if (signal.sdp.type === 'offer') {
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    socketRef.current?.emit('signal', fromSocketId, JSON.stringify({
                        sdp: peerConnection.localDescription
                    }));
                    console.log(`📤 Sent ANSWER to ${fromSocketId}`);
                }

                // Process queued ICE candidates now that remote description is set
                if (pendingCandidatesRef.current[fromSocketId]) {
                    for (const candidate of pendingCandidatesRef.current[fromSocketId]) {
                        try {
                            await peerConnection.addIceCandidate(candidate);
                        } catch (e) {
                            console.error("Error adding queued ICE candidate", e);
                        }
                    }
                    delete pendingCandidatesRef.current[fromSocketId];
                }
            } else if (signal.ice) {
                // Handle ICE Candidate
                const candidate = new RTCIceCandidate(signal.ice);
                if (peerConnection.remoteDescription) {
                    await peerConnection.addIceCandidate(candidate);
                } else {
                    // Queue if remote description not set yet
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
        if (socketRef.current) return; // Prevent double init

        console.log('🚀 Initializing socket...');
        
        socketRef.current = io(server, {
            secure: true,
            reconnection: true,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Connected to Signaling Server');
            // Add local user to grid immediately
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

        // When a new user joins, initiate the call (ID check prevents glare)
        socket.on('user-joined', (joinedSocketId, allParticipants) => {
            console.log(`👋 User joined: ${joinedSocketId}`);
            
            allParticipants.forEach(async (participantId) => {
                if (participantId === socket.id) return;
                
                // Only the "larger" ID calls the "smaller" ID to avoid call collision
                if (socket.id > participantId) {
                    console.log(`📞 Initiating call to ${participantId}`);
                    
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
                }
            });
        });

        socket.on('user-left', (leftSocketId) => {
            console.log(`User left: ${leftSocketId}`);
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

        return () => {
            console.log('🧹 Cleanup Peer Connections');
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