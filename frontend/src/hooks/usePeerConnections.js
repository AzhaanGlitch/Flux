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
    
    // REFS for logic that shouldn't trigger re-renders
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const pendingCandidatesRef = useRef({});
    const localStreamRef = useRef(localStream);
    const remoteStreamsRef = useRef({});
    const participantNamesRef = useRef({}); // Store names in ref to avoid dependency cycles

    // Update local stream ref when it changes
    useEffect(() => {
        localStreamRef.current = localStream;
        
        // Update local stream in existing list if it exists
        if (socketRef.current && localStream) {
            setVideoStreams(prev => prev.map(v => 
                v.isLocal ? { ...v, stream: localStream } : v
            ));
        }
    }, [localStream]);

    // Helper to safely update names in both Ref (for logic) and State (for UI)
    const updateParticipantName = useCallback((id, name) => {
        participantNamesRef.current[id] = name;
        // Also update the display name in the video streams
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

    const createPeerConnection = useCallback((socketId) => {
        console.log(`🔗 Creating peer connection for: ${socketId}`);
        
        const peerConnection = new RTCPeerConnection(peerConfig);
        peerConnectionsRef.current[socketId] = peerConnection;

        // Initialize remote streams tracker for this user
        if (!remoteStreamsRef.current[socketId]) {
            remoteStreamsRef.current[socketId] = {
                camera: null,
                screen: null,
            };
        }

        peerConnection.ontrack = (event) => {
            const remoteStream = event.streams[0];
            if (!remoteStream) return;

            console.log(`📹 TRACK RECEIVED from ${socketId} | Stream ID: ${remoteStream.id} | Kind: ${event.track.kind}`);

            // -----------------------------------------------------------
            // FIXED LOGIC: Determine if this is Camera or Screen Share
            // -----------------------------------------------------------
            let streamType = 'camera';
            const existingCamera = remoteStreamsRef.current[socketId].camera;

            // If we already have a camera stream and this ID is DIFFERENT, it must be screen share
            if (existingCamera && existingCamera.id !== remoteStream.id) {
                streamType = 'screen';
            }
            
            // Assign to ref
            if (streamType === 'camera') {
                remoteStreamsRef.current[socketId].camera = remoteStream;
            } else {
                remoteStreamsRef.current[socketId].screen = remoteStream;
            }

            setVideoStreams(prev => {
                const currentName = participantNamesRef.current[socketId] || socketId;
                const displayName = streamType === 'screen' 
                    ? `${currentName}'s Screen` 
                    : currentName;

                // Check if we already have this stream in state
                const existingIdx = prev.findIndex(
                    v => v.socketId === socketId && v.type === streamType
                );

                if (existingIdx !== -1) {
                    // CRITICAL FIX: Update existing entry but KEEP THE TIMESTAMP.
                    // Changing timestamp causes VideoTile to unmount/remount (flicker/loading loop).
                    const updated = [...prev];
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        stream: remoteStream, // Update stream reference (essential for audio+video sync)
                        name: displayName
                    };
                    return updated;
                } else {
                    // New stream - add with new timestamp
                    console.log(`✅ Adding NEW ${streamType} stream for ${socketId}`);
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
                console.log(`🛑 Track ended from ${socketId}`);
                // Only remove if all tracks in the stream are gone
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
            const state = peerConnection.connectionState;
            console.log(`Connection state with ${socketId}: ${state}`);
            if (state === 'failed') {
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

    const handleSignal = useCallback(async (fromSocketId, message) => {
        const signal = JSON.parse(message);
        let peerConnection = peerConnectionsRef.current[fromSocketId];

        if (!peerConnection) {
            peerConnection = createPeerConnection(fromSocketId);
        }

        try {
            if (signal.sdp) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));

                if (signal.sdp.type === 'offer') {
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    socketRef.current?.emit('signal', fromSocketId, JSON.stringify({
                        sdp: peerConnection.localDescription
                    }));
                }

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

    useEffect(() => {
        if (!roomCode || !username) return;

        console.log('🚀 Initializing socket connection...');
        
        socketRef.current = io(server, {
            secure: true,
            reconnection: true,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
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
            // Store own name
            updateParticipantName(socket.id, username);
            
            socket.emit('join-call', roomCode);
            socket.emit('username', username);
        });

        socket.on('signal', handleSignal);

        socket.on('username', (socketId, name) => {
            updateParticipantName(socketId, name);
        });

        socket.on('user-joined', (joinedSocketId, allParticipants) => {
            console.log(`👤 User joined: ${joinedSocketId}`);
            allParticipants.forEach(async (participantId) => {
                if (participantId === socket.id) return;
                if (peerConnectionsRef.current[participantId]) return;

                console.log(`🤝 Initiating connection with ${participantId}`);
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
            });
        });

        socket.on('user-left', (leftSocketId) => {
            console.log(`👋 User left: ${leftSocketId}`);
            if (peerConnectionsRef.current[leftSocketId]) {
                peerConnectionsRef.current[leftSocketId].close();
                delete peerConnectionsRef.current[leftSocketId];
            }
            delete remoteStreamsRef.current[leftSocketId];
            setVideoStreams(prev => prev.filter(v => v.socketId !== leftSocketId));
        });

        socket.on('screen-share-started', (sharerSocketId) => {
            console.log(`🖥️ ${sharerSocketId} started screen sharing`);
            // We rely on 'ontrack' to actually add the video, but we can log this event
        });

        socket.on('screen-share-stopped', (sharerSocketId) => {
            console.log(`🛑 ${sharerSocketId} stopped screen sharing`);
            setVideoStreams(prev => 
                prev.filter(v => !(v.socketId === sharerSocketId && v.type === 'screen'))
            );
            if (remoteStreamsRef.current[sharerSocketId]) {
                remoteStreamsRef.current[sharerSocketId].screen = null;
            }
        });

        return () => {
            console.log('🧹 Cleaning up connections...');
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