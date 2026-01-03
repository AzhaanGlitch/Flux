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

// frontend/src/hooks/usePeerConnections.js - DESKTOP FIX (Replace Part 2)
// Continue from Part 1...

    // CRITICAL FIX: Desktop-compatible peer connection creation
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

        // DESKTOP FIX: Enhanced track handling with stream validation
        peerConnection.ontrack = (event) => {
            console.log(`🎥 Track received from ${socketId}:`, {
                kind: event.track.kind,
                id: event.track.id,
                readyState: event.track.readyState,
                muted: event.track.muted,
                enabled: event.track.enabled,
                streams: event.streams.length
            });

            // CRITICAL: Validate track is actually usable
            if (event.track.readyState === 'ended') {
                console.warn('⚠️ Received ended track, ignoring');
                return;
            }

            const remoteStream = event.streams[0];
            if (!remoteStream) {
                console.error('❌ No stream in track event!');
                return;
            }

            // Wait for stream to be fully ready (critical for desktop)
            const ensureStreamReady = () => {
                const tracks = remoteStream.getTracks();
                const allReady = tracks.every(t => t.readyState === 'live' && t.enabled);
                
                console.log(`📊 Stream readiness check:`, {
                    streamId: remoteStream.id,
                    tracks: tracks.map(t => ({
                        kind: t.kind,
                        ready: t.readyState,
                        enabled: t.enabled
                    })),
                    allReady
                });

                return allReady;
            };

            // Determine stream type
            let streamType = 'camera';
            const existingCamera = remoteStreamsRef.current[socketId].camera;

            if (existingCamera && existingCamera.id !== remoteStream.id) {
                streamType = 'screen';
            }
            
            // Store in ref
            if (streamType === 'camera') {
                remoteStreamsRef.current[socketId].camera = remoteStream;
            } else {
                remoteStreamsRef.current[socketId].screen = remoteStream;
            }

            // DESKTOP FIX: Ensure stream is ready before updating UI
            const updateStreamInUI = () => {
                if (!ensureStreamReady()) {
                    console.log('⏳ Waiting for stream to be ready...');
                    setTimeout(updateStreamInUI, 100);
                    return;
                }

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
                            name: displayName,
                            timestamp: Date.now() // Force re-render
                        };
                        console.log(`✅ Updated ${streamType} stream for ${socketId}`);
                        return updated;
                    } else {
                        console.log(`✅ Added new ${streamType} stream for ${socketId}`);
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
            };

            // Start readiness check
            updateStreamInUI();

            // Track cleanup
            remoteStream.getTracks().forEach(track => {
                track.onended = () => {
                    console.log(`🛑 Track ended: ${socketId} (${streamType})`);
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

        // DESKTOP FIX: Enhanced ICE candidate handling
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`🧊 Sending ICE candidate to ${socketId}:`, event.candidate.type);
                socketRef.current?.emit('signal', socketId, JSON.stringify({
                    ice: event.candidate
                }));
            } else {
                console.log(`✅ ICE gathering complete for ${socketId}`);
            }
        };

        // DESKTOP FIX: Better connection state monitoring
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            console.log(`📶 ${socketId}: ${state}`);
            
            switch (state) {
                case 'connected':
                    console.log(`✅ Successfully connected to ${socketId}`);
                    break;
                case 'disconnected':
                    console.warn(`⚠️ Disconnected from ${socketId}, waiting for reconnection...`);
                    break;
                case 'failed':
                    console.error(`❌ Connection failed for ${socketId}, restarting ICE...`);
                    peerConnection.restartIce();
                    break;
                case 'closed':
                    console.log(`🔒 Connection closed for ${socketId}`);
                    break;
            }
        };

        // DESKTOP FIX: Monitor ICE connection state separately
        peerConnection.oniceconnectionstatechange = () => {
            console.log(`🧊 ICE state for ${socketId}: ${peerConnection.iceConnectionState}`);
            
            if (peerConnection.iceConnectionState === 'failed') {
                console.error(`❌ ICE failed for ${socketId}, attempting recovery...`);
                peerConnection.restartIce();
            }
        };

        // CRITICAL: Add tracks BEFORE any negotiation
        if (localStreamRef.current) {
            console.log(`📤 Adding local tracks to ${socketId}...`);
            const tracksAdded = [];
            
            localStreamRef.current.getTracks().forEach(track => {
                try {
                    // Ensure track is active
                    if (track.readyState === 'live') {
                        const sender = peerConnection.addTrack(track, localStreamRef.current);
                        tracksAdded.push({
                            kind: track.kind,
                            id: track.id,
                            enabled: track.enabled
                        });
                        console.log(`✅ Added ${track.kind} track (${track.id})`);
                    } else {
                        console.warn(`⚠️ Skipping ${track.kind} track - not live`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to add ${track.kind} track:`, error);
                }
            });

            console.log(`📊 Total tracks added to ${socketId}:`, tracksAdded);
        } else {
            console.error('❌ No local stream available when creating peer connection!');
        }

        return peerConnection;
    }, []);


// frontend/src/hooks/usePeerConnections.js - DESKTOP FIX (Replace Part 3)
// Continue from improved Part 2...

    // DESKTOP FIX: Robust signaling with proper state machine
    const handleSignal = useCallback(async (fromSocketId, message) => {
        let signal;
        try {
            signal = JSON.parse(message);
        } catch (e) {
            console.error('❌ Failed to parse signal:', e);
            return;
        }

        let peerConnection = peerConnectionsRef.current[fromSocketId];

        try {
            if (signal.sdp) {
                const sdpType = signal.sdp.type;
                console.log(`📩 Received ${sdpType} from ${fromSocketId}`);

                // Create connection if needed (receiving initial offer)
                if (!peerConnection) {
                    console.log(`🆕 Creating new connection for incoming ${sdpType}`);
                    peerConnection = createPeerConnection(fromSocketId, false);
                }

                const currentState = peerConnection.signalingState;
                console.log(`📊 Current signaling state: ${currentState}`);

                if (sdpType === 'offer') {
                    // DESKTOP FIX: Handle offer with proper state checking
                    if (currentState === 'stable' || currentState === 'have-remote-offer') {
                        console.log(`✅ Processing offer in state: ${currentState}`);
                        
                        await peerConnection.setRemoteDescription(
                            new RTCSessionDescription(signal.sdp)
                        );
                        
                        console.log(`✅ Remote description set, creating answer...`);
                        
                        // CRITICAL: Use proper constraints for desktop
                        const answer = await peerConnection.createAnswer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        });
                        
                        await peerConnection.setLocalDescription(answer);
                        
                        socketRef.current?.emit('signal', fromSocketId, JSON.stringify({
                            sdp: peerConnection.localDescription
                        }));
                        
                        console.log(`📤 Sent ANSWER to ${fromSocketId}`);
                    } else {
                        console.warn(`⚠️ Cannot process offer in state: ${currentState}`);
                        
                        // If in wrong state, try rollback and retry
                        if (currentState === 'have-local-offer') {
                            console.log('🔄 Attempting rollback and retry...');
                            try {
                                await peerConnection.setLocalDescription({type: 'rollback'});
                                // Recursive retry
                                setTimeout(() => handleSignal(fromSocketId, message), 100);
                            } catch (rollbackError) {
                                console.error('❌ Rollback failed:', rollbackError);
                            }
                        }
                    }

                } else if (sdpType === 'answer') {
                    // DESKTOP FIX: Only accept answer in correct state
                    if (currentState === 'have-local-offer') {
                        console.log(`✅ Processing answer in state: ${currentState}`);
                        
                        await peerConnection.setRemoteDescription(
                            new RTCSessionDescription(signal.sdp)
                        );
                        
                        console.log(`✅ Answer accepted for ${fromSocketId}`);
                    } else {
                        console.warn(`⚠️ Ignoring answer in wrong state: ${currentState}`);
                    }
                }

                // DESKTOP FIX: Process pending ICE candidates with error handling
                const pendingCandidates = pendingCandidatesRef.current[fromSocketId];
                if (pendingCandidates?.length) {
                    console.log(`📦 Processing ${pendingCandidates.length} queued ICE candidates`);
                    
                    for (const candidate of pendingCandidates) {
                        try {
                            if (peerConnection.remoteDescription) {
                                await peerConnection.addIceCandidate(candidate);
                                console.log(`✅ Added queued ICE candidate`);
                            } else {
                                console.warn('⚠️ Cannot add candidate - no remote description');
                            }
                        } catch (e) {
                            // Desktop browsers can be strict about ICE candidate errors
                            console.warn("⚠️ Error adding queued candidate (non-fatal):", e.message);
                        }
                    }
                    delete pendingCandidatesRef.current[fromSocketId];
                }

            } else if (signal.ice) {
                // DESKTOP FIX: Robust ICE candidate handling
                if (!peerConnection) {
                    console.warn(`⚠️ Received ICE but no peer connection for ${fromSocketId}`);
                    return;
                }

                const candidate = new RTCIceCandidate(signal.ice);
                
                console.log(`🧊 Received ICE candidate:`, {
                    type: candidate.type,
                    protocol: candidate.protocol,
                    address: candidate.address
                });
                
                if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
                    try {
                        await peerConnection.addIceCandidate(candidate);
                        console.log(`✅ Added ICE candidate for ${fromSocketId}`);
                    } catch (e) {
                        // Desktop browsers may reject invalid candidates
                        console.warn(`⚠️ ICE candidate rejected (non-fatal):`, e.message);
                    }
                } else {
                    // Queue for later
                    if (!pendingCandidatesRef.current[fromSocketId]) {
                        pendingCandidatesRef.current[fromSocketId] = [];
                    }
                    pendingCandidatesRef.current[fromSocketId].push(candidate);
                    console.log(`📦 Queued ICE candidate (no remote description yet)`);
                }
            }
        } catch (error) {
            console.error(`❌ Critical signal error from ${fromSocketId}:`, error);
            
            // DESKTOP FIX: More aggressive recovery for desktop browsers
            if (peerConnection) {
                const state = peerConnection.signalingState;
                const connState = peerConnection.connectionState;
                
                console.log(`🔍 Error state: signaling=${state}, connection=${connState}`);
                
                if (state === 'closed' || connState === 'failed' || connState === 'closed') {
                    console.log('🔄 Connection in bad state, recreating...');
                    
                    // Clean up old connection
                    try {
                        peerConnection.close();
                    } catch (e) {
                        console.warn('Error closing bad connection:', e);
                    }
                    
                    delete peerConnectionsRef.current[fromSocketId];
                    delete pendingCandidatesRef.current[fromSocketId];
                    
                    // Create new connection
                    const newPc = createPeerConnection(fromSocketId, false);
                    
                    // If we were the initiator, restart negotiation
                    if (isInitiatorRef.current[fromSocketId]) {
                        console.log('🔄 Restarting negotiation as initiator...');
                        setTimeout(async () => {
                            try {
                                const offer = await newPc.createOffer({
                                    offerToReceiveAudio: true,
                                    offerToReceiveVideo: true,
                                });
                                await newPc.setLocalDescription(offer);
                                socketRef.current?.emit('signal', fromSocketId, JSON.stringify({
                                    sdp: newPc.localDescription
                                }));
                            } catch (e) {
                                console.error('Failed to restart negotiation:', e);
                            }
                        }, 1000);
                    }
                }
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