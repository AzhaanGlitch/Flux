// frontend/src/hooks/usePeerConnections.js - FIXED VERSION (Part 1)
import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import server from '../environment';

const peerConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }, // Added more STUN servers
        { urls: 'stun:stun3.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
};

export const usePeerConnections = (roomCode, username, localStream) => {
    const [videoStreams, setVideoStreams] = useState([]);
    const [connectionError, setConnectionError] = useState(null);
    
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const pendingCandidatesRef = useRef({});
    const localStreamRef = useRef(localStream);
    const remoteStreamsRef = useRef({});
    const participantNamesRef = useRef({});
    const isInitiatorRef = useRef({}); // Track who initiated each connection

    // Keep localStreamRef up to date
    useEffect(() => {
        localStreamRef.current = localStream;
        
        // CRITICAL FIX: Update existing peer connections when local stream changes
        if (localStream && Object.keys(peerConnectionsRef.current).length > 0) {
            console.log('📡 Updating peer connections with new local stream');
            
            Object.entries(peerConnectionsRef.current).forEach(([socketId, pc]) => {
                if (pc.connectionState === 'connected' || pc.connectionState === 'connecting') {
                    // Get all senders
                    const senders = pc.getSenders();
                    
                    // Replace tracks
                    localStream.getTracks().forEach(newTrack => {
                        const sender = senders.find(s => 
                            s.track && s.track.kind === newTrack.kind
                        );
                        
                        if (sender) {
                            sender.replaceTrack(newTrack)
                                .then(() => console.log(`✅ Replaced ${newTrack.kind} track for ${socketId}`))
                                .catch(err => console.error(`❌ Failed to replace track:`, err));
                        } else {
                            // If no sender exists, add the track
                            pc.addTrack(newTrack, localStream);
                            console.log(`➕ Added new ${newTrack.kind} track for ${socketId}`);
                        }
                    });
                }
            });
            
            // Update local video stream in state
            setVideoStreams(prev => prev.map(v => 
                v.isLocal ? { ...v, stream: localStream } : v
            ));
        }
    }, [localStream]);

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

    // frontend/src/hooks/usePeerConnections.js - FIXED VERSION (Part 2)
// Continue from Part 1...

    // CRITICAL FIX: Improved peer connection creation
    const createPeerConnection = useCallback((socketId, isInitiator = false) => {
        if (peerConnectionsRef.current[socketId]) {
            console.warn(`⚠️ Connection already exists for ${socketId}`);
            return peerConnectionsRef.current[socketId];
        }

        console.log(`🔗 Creating ${isInitiator ? 'INITIATOR' : 'RECEIVER'} connection for: ${socketId}`);
        const peerConnection = new RTCPeerConnection(peerConfig);
        peerConnectionsRef.current[socketId] = peerConnection;
        isInitiatorRef.current[socketId] = isInitiator;

        if (!remoteStreamsRef.current[socketId]) {
            remoteStreamsRef.current[socketId] = { camera: null, screen: null };
        }

        // CRITICAL FIX: Better track handling
        peerConnection.ontrack = (event) => {
            console.log(`🎥 Track received from ${socketId}:`, event.track.kind, event.track.id);

            const remoteStream = event.streams[0];
            if (!remoteStream) {
                console.error('❌ No stream in track event!');
                return;
            }

            // Determine stream type based on track count and existing streams
            let streamType = 'camera';
            const existingCamera = remoteStreamsRef.current[socketId].camera;

            // If we have a camera stream and this is a different stream, it's screen share
            if (existingCamera && existingCamera.id !== remoteStream.id) {
                streamType = 'screen';
            }
            
            // Store in ref
            if (streamType === 'camera') {
                remoteStreamsRef.current[socketId].camera = remoteStream;
            } else {
                remoteStreamsRef.current[socketId].screen = remoteStream;
            }

            // Update state with proper naming
            setVideoStreams(prev => {
                const currentName = participantNamesRef.current[socketId] || socketId;
                const displayName = streamType === 'screen' ? `${currentName}'s Screen` : currentName;

                const existingIdx = prev.findIndex(v => 
                    v.socketId === socketId && v.type === streamType
                );
                
                if (existingIdx !== -1) {
                    const updated = [...prev];
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        stream: remoteStream,
                        name: displayName
                    };
                    console.log(`🔄 Updated existing ${streamType} stream for ${socketId}`);
                    return updated;
                } else {
                    console.log(`➕ Added new ${streamType} stream for ${socketId}`);
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

            // Clean up when all tracks end
            remoteStream.getTracks().forEach(track => {
                track.onended = () => {
                    console.log(`🛑 Track ended for ${socketId} (${streamType})`);
                    if (remoteStream.getTracks().every(t => t.readyState === 'ended')) {
                        setVideoStreams(prev => 
                            prev.filter(v => !(v.socketId === socketId && v.type === streamType))
                        );
                        if (streamType === 'camera') {
                            remoteStreamsRef.current[socketId].camera = null;
                        } else {
                            remoteStreamsRef.current[socketId].screen = null;
                        }
                    }
                };
            });
        };

        // ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('signal', socketId, JSON.stringify({
                    ice: event.candidate
                }));
            }
        };

        // Connection state monitoring
        peerConnection.onconnectionstatechange = () => {
            console.log(`📶 ${socketId}: ${peerConnection.connectionState}`);
            
            if (peerConnection.connectionState === 'failed') {
                console.warn('⚠️ Connection failed, attempting restart...');
                peerConnection.restartIce();
            } else if (peerConnection.connectionState === 'disconnected') {
                console.warn('⚠️ Connection disconnected');
            }
        };

        // CRITICAL FIX: Add all local tracks immediately
        if (localStreamRef.current) {
            console.log(`📤 Adding local tracks to ${socketId}`);
            localStreamRef.current.getTracks().forEach(track => {
                try {
                    peerConnection.addTrack(track, localStreamRef.current);
                    console.log(`✅ Added ${track.kind} track`);
                } catch (error) {
                    console.error(`❌ Failed to add ${track.kind} track:`, error);
                }
            });
        } else {
            console.warn('⚠️ No local stream available when creating peer connection');
        }

        return peerConnection;
    }, []);

    // frontend/src/hooks/usePeerConnections.js - FIXED VERSION (Part 3)
// Continue from Part 2...

    // CRITICAL FIX: Improved signaling with better state management
    const handleSignal = useCallback(async (fromSocketId, message) => {
        const signal = JSON.parse(message);
        let peerConnection = peerConnectionsRef.current[fromSocketId];

        try {
            if (signal.sdp) {
                console.log(`📩 Received ${signal.sdp.type} from ${fromSocketId}`);

                // Create connection if it doesn't exist (receiving initial offer)
                if (!peerConnection) {
                    peerConnection = createPeerConnection(fromSocketId, false);
                }

                const currentState = peerConnection.signalingState;
                console.log(`Current signaling state: ${currentState}`);

                // Handle different signaling states
                if (signal.sdp.type === 'offer') {
                    // Always process offers (handles renegotiation)
                    await peerConnection.setRemoteDescription(
                        new RTCSessionDescription(signal.sdp)
                    );
                    
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    
                    socketRef.current?.emit('signal', fromSocketId, JSON.stringify({
                        sdp: peerConnection.localDescription
                    }));
                    console.log(`📤 Sent ANSWER to ${fromSocketId}`);

                } else if (signal.sdp.type === 'answer') {
                    // Only set answer if we're in the right state
                    if (currentState === 'have-local-offer') {
                        await peerConnection.setRemoteDescription(
                            new RTCSessionDescription(signal.sdp)
                        );
                        console.log(`✅ Set remote answer for ${fromSocketId}`);
                    } else {
                        console.warn(`⚠️ Ignoring answer, wrong state: ${currentState}`);
                    }
                }

                // Process any queued ICE candidates
                if (pendingCandidatesRef.current[fromSocketId]?.length) {
                    console.log(`📦 Processing ${pendingCandidatesRef.current[fromSocketId].length} queued candidates`);
                    for (const candidate of pendingCandidatesRef.current[fromSocketId]) {
                        try {
                            await peerConnection.addIceCandidate(candidate);
                        } catch (e) {
                            console.error("Error adding queued candidate:", e);
                        }
                    }
                    delete pendingCandidatesRef.current[fromSocketId];
                }

            } else if (signal.ice) {
                // Handle ICE candidate
                if (!peerConnection) {
                    console.warn(`⚠️ Received ICE but no peer connection for ${fromSocketId}`);
                    return;
                }

                const candidate = new RTCIceCandidate(signal.ice);
                
                if (peerConnection.remoteDescription) {
                    await peerConnection.addIceCandidate(candidate);
                } else {
                    // Queue if remote description not set yet
                    if (!pendingCandidatesRef.current[fromSocketId]) {
                        pendingCandidatesRef.current[fromSocketId] = [];
                    }
                    pendingCandidatesRef.current[fromSocketId].push(candidate);
                    console.log(`📦 Queued ICE candidate for ${fromSocketId}`);
                }
            }
        } catch (error) {
            console.error(`❌ Signal error from ${fromSocketId}:`, error);
            
            // If connection is in a bad state, recreate it
            if (peerConnection && 
                (peerConnection.signalingState === 'closed' || 
                 peerConnection.connectionState === 'failed')) {
                console.log('🔄 Recreating failed connection...');
                delete peerConnectionsRef.current[fromSocketId];
                createPeerConnection(fromSocketId, false);
            }
        }
    }, [createPeerConnection]);

    // frontend/src/hooks/usePeerConnections.js - FIXED VERSION (Part 4 - FINAL)
// Continue from Part 3...

    // Main connection logic
    useEffect(() => {
        if (!roomCode || !username) {
            console.log('⏳ Waiting for roomCode and username...');
            return;
        }
        
        if (socketRef.current) {
            console.log('⚠️ Socket already initialized, skipping...');
            return;
        }

        console.log('🚀 Initializing socket connection...');
        
        socketRef.current = io(server, {
            secure: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Connected to server with ID:', socket.id);
            
            // CRITICAL FIX: Add local stream first, then join room
            if (localStreamRef.current) {
                setVideoStreams([{
                    socketId: socket.id,
                    stream: localStreamRef.current,
                    type: 'camera',
                    name: username,
                    isLocal: true,
                    timestamp: Date.now(),
                }]);
            } else {
                console.warn('⚠️ No local stream on connect!');
            }
            
            updateParticipantName(socket.id, username);
            socket.emit('join-call', roomCode);
            socket.emit('username', username);
        });

        socket.on('signal', handleSignal);
        socket.on('username', (socketId, name) => {
            console.log(`👤 Received username: ${socketId} = ${name}`);
            updateParticipantName(socketId, name);
        });

        // CRITICAL FIX: Better user-joined handling
        socket.on('user-joined', async (joinedSocketId, allParticipants) => {
            console.log(`👋 User ${joinedSocketId} joined. Total participants:`, allParticipants);
            
            for (const participantId of allParticipants) {
                if (participantId === socket.id) continue;
                
                // FIXED: Only initiate if we don't already have a connection
                if (!peerConnectionsRef.current[participantId]) {
                    // Use stable ordering: lexicographic comparison
                    const shouldInitiate = socket.id > participantId;
                    
                    if (shouldInitiate) {
                        console.log(`📞 Initiating call to ${participantId}`);
                        
                        // Small delay to reduce race conditions
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        const peerConnection = createPeerConnection(participantId, true);
                        
                        try {
                            const offer = await peerConnection.createOffer({
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: true,
                            });
                            
                            await peerConnection.setLocalDescription(offer);
                            
                            socket.emit('signal', participantId, JSON.stringify({
                                sdp: peerConnection.localDescription
                            }));
                            
                            console.log(`✅ Sent offer to ${participantId}`);
                        } catch (error) {
                            console.error(`❌ Failed to create offer for ${participantId}:`, error);
                        }
                    } else {
                        console.log(`⏳ Waiting for offer from ${participantId}`);
                    }
                }
            }
        });

        socket.on('user-left', (leftSocketId) => {
            console.log(`👋 User left: ${leftSocketId}`);
            
            const pc = peerConnectionsRef.current[leftSocketId];
            if (pc) {
                pc.close();
                delete peerConnectionsRef.current[leftSocketId];
            }
            
            delete remoteStreamsRef.current[leftSocketId];
            delete participantNamesRef.current[leftSocketId];
            delete pendingCandidatesRef.current[leftSocketId];
            
            setVideoStreams(prev => prev.filter(v => v.socketId !== leftSocketId));
        });

        socket.on('screen-share-stopped', (sharerSocketId) => {
            console.log(`🛑 Screen share stopped: ${sharerSocketId}`);
            setVideoStreams(prev => 
                prev.filter(v => !(v.socketId === sharerSocketId && v.type === 'screen'))
            );
            if (remoteStreamsRef.current[sharerSocketId]) {
                remoteStreamsRef.current[sharerSocketId].screen = null;
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            setConnectionError(error.message);
        });

        return () => {
            console.log('🧹 Cleanup: Closing all connections');
            
            Object.values(peerConnectionsRef.current).forEach(pc => {
                if (pc) pc.close();
            });
            
            peerConnectionsRef.current = {};
            remoteStreamsRef.current = {};
            participantNamesRef.current = {};
            pendingCandidatesRef.current = {};
            
            if (socket) {
                socket.removeAllListeners();
                socket.disconnect();
            }
            
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