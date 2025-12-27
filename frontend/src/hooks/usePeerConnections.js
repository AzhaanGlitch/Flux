// hooks/usePeerConnections.js (Enhanced Version - Part 1/2)
import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import server from '../environment';

const peerConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // PRODUCTION: Add TURN servers
        // { 
        //   urls: 'turn:your-turn-server.com:3478',
        //   username: 'user',
        //   credential: 'password'
        // }
    ],
    iceCandidatePoolSize: 10,
};

export const usePeerConnections = (roomCode, username, localStream) => {
    const [videoStreams, setVideoStreams] = useState([]);
    const [connectionError, setConnectionError] = useState(null);
    const [participantNames, setParticipantNames] = useState({}); // Map socketId to username
    
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const pendingCandidatesRef = useRef({});
    const localStreamRef = useRef(localStream);
    const remoteStreamsRef = useRef({}); // Track all streams per peer

    useEffect(() => {
        localStreamRef.current = localStream;
    }, [localStream]);

    // Helper: Detect if a track is screen share
    const isScreenShareTrack = (track) => {
        // Multiple detection methods for reliability
        const label = track.label.toLowerCase();
        
        return (
            label.includes('screen') ||
            label.includes('monitor') ||
            label.includes('window') ||
            label.includes('display') ||
            track.contentHint === 'detail' ||
            track.contentHint === 'text'
        );
    };

    const createPeerConnection = useCallback((socketId) => {
        console.log(`🔗 Creating peer connection for: ${socketId}`);
        
        const peerConnection = new RTCPeerConnection(peerConfig);
        peerConnectionsRef.current[socketId] = peerConnection;

        // Initialize stream tracking for this peer
        if (!remoteStreamsRef.current[socketId]) {
            remoteStreamsRef.current[socketId] = {
                camera: null,
                screen: null,
            };
        }

        // CRITICAL: ontrack handler with screen share detection
        peerConnection.ontrack = (event) => {
            console.log(`📹 TRACK RECEIVED from ${socketId}:`, {
                kind: event.track.kind,
                label: event.track.label,
                contentHint: event.track.contentHint,
                streams: event.streams.length,
            });

            const remoteStream = event.streams[0];
            if (!remoteStream) {
                console.error('❌ No stream in track event');
                return;
            }

            const track = event.track;
            const isScreen = isScreenShareTrack(track);

            console.log(`🔍 Track classified as: ${isScreen ? 'SCREEN SHARE' : 'CAMERA'}`);

            // Update stream tracking
            if (isScreen) {
                remoteStreamsRef.current[socketId].screen = remoteStream;
            } else {
                remoteStreamsRef.current[socketId].camera = remoteStream;
            }

            // Update video streams state
            setVideoStreams(prev => {
                const streamType = isScreen ? 'screen' : 'camera';
                const existingIndex = prev.findIndex(
                    v => v.socketId === socketId && v.type === streamType
                );

                const participantName = participantNames[socketId] || socketId;
                const displayName = isScreen 
                    ? `${participantName}'s Screen` 
                    : participantName;

                const newStreamData = {
                    socketId,
                    stream: remoteStream,
                    type: streamType,
                    name: displayName,
                    isLocal: false,
                    timestamp: Date.now(), // For animation timing
                };

                if (existingIndex !== -1) {
                    // Update existing
                    const updated = [...prev];
                    updated[existingIndex] = newStreamData;
                    console.log(`🔄 Updated ${streamType} stream for ${socketId}`);
                    return updated;
                } else {
                    // Add new with animation
                    console.log(`✅ Added new ${streamType} stream for ${socketId}`);
                    return [...prev, newStreamData];
                }
            });

            // Handle track ending (e.g., screen share stopped)
            track.onended = () => {
                console.log(`🛑 Track ended from ${socketId}, type: ${isScreen ? 'screen' : 'camera'}`);
                
                if (isScreen) {
                    remoteStreamsRef.current[socketId].screen = null;
                }

                // Remove from video streams
                setVideoStreams(prev => 
                    prev.filter(v => !(v.socketId === socketId && v.type === (isScreen ? 'screen' : 'camera')))
                );
            };
        };

        // ICE candidate handling
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`🧊 Sending ICE candidate to ${socketId}`);
                socketRef.current?.emit('signal', socketId, JSON.stringify({
                    ice: event.candidate
                }));
            }
        };

        // Connection state monitoring
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            console.log(`Connection state with ${socketId}: ${state}`);
            
            if (state === 'connected') {
                setConnectionError(null);
            } else if (state === 'failed' || state === 'disconnected') {
                console.warn(`⚠️ Connection issue with ${socketId}`);
                setConnectionError(`Connection lost with participant`);
                
                // Attempt reconnection after 2 seconds
                setTimeout(() => {
                    if (peerConnection.connectionState === 'failed') {
                        console.log(`🔄 Attempting to restart ICE for ${socketId}`);
                        peerConnection.restartIce();
                    }
                }, 2000);
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log(`ICE state with ${socketId}: ${peerConnection.iceConnectionState}`);
        };

        // Add local stream tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                console.log(`➕ Adding local ${track.kind} track to ${socketId}`);
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        return peerConnection;
    }, [participantNames]);

    // Handle incoming signaling messages
    const handleSignal = useCallback(async (fromSocketId, message) => {
        const signal = JSON.parse(message);
        console.log(`📨 Signal from ${fromSocketId}:`, signal.sdp?.type || 'ice-candidate');

        let peerConnection = peerConnectionsRef.current[fromSocketId];

        if (!peerConnection) {
            console.log(`⚠️ Creating late peer connection for ${fromSocketId}`);
            peerConnection = createPeerConnection(fromSocketId);
        }

        try {
            // Handle SDP
            if (signal.sdp) {
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(signal.sdp)
                );

                if (signal.sdp.type === 'offer') {
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    
                    socketRef.current?.emit('signal', fromSocketId, JSON.stringify({
                        sdp: peerConnection.localDescription
                    }));
                }

                // Add pending ICE candidates
                if (pendingCandidatesRef.current[fromSocketId]) {
                    console.log(`Adding ${pendingCandidatesRef.current[fromSocketId].length} pending candidates`);
                    
                    for (const candidate of pendingCandidatesRef.current[fromSocketId]) {
                        await peerConnection.addIceCandidate(candidate);
                    }
                    
                    delete pendingCandidatesRef.current[fromSocketId];
                }
            }

            // Handle ICE candidates
            if (signal.ice) {
                if (peerConnection.remoteDescription) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
                } else {
                    if (!pendingCandidatesRef.current[fromSocketId]) {
                        pendingCandidatesRef.current[fromSocketId] = [];
                    }
                    pendingCandidatesRef.current[fromSocketId].push(new RTCIceCandidate(signal.ice));
                }
            }
        } catch (error) {
            console.error(`❌ Error handling signal from ${fromSocketId}:`, error);
            setConnectionError(`Failed to establish connection`);
        }
    }, [createPeerConnection]);

    // Continue to Part 2...
// hooks/usePeerConnections.js (Enhanced Version - Part 2/2)

    // Initialize socket connection
    useEffect(() => {
        if (!roomCode || !username) return;

        console.log('🚀 Initializing socket connection...');
        
        socketRef.current = io(server, {
            secure: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            
            // Add local stream to state
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

            // Store own username
            setParticipantNames(prev => ({ ...prev, [socket.id]: username }));

            // Join room and broadcast username
            socket.emit('join-call', roomCode);
            socket.emit('username', username);
        });

        socket.on('signal', handleSignal);

        // Handle username broadcasts
        socket.on('username', (socketId, name) => {
            console.log(`📝 Received username: ${name} for ${socketId}`);
            setParticipantNames(prev => ({ ...prev, [socketId]: name }));
            
            // Update existing video streams with correct name
            setVideoStreams(prev => prev.map(v => 
                v.socketId === socketId 
                    ? { ...v, name: v.type === 'screen' ? `${name}'s Screen` : name }
                    : v
            ));
        });

        socket.on('user-joined', async (joinedSocketId, allParticipants) => {
            console.log(`👤 User joined: ${joinedSocketId}. Total:`, allParticipants);

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
                } catch (error) {
                    console.error(`❌ Error creating offer for ${participantId}:`, error);
                }
            });
        });

        socket.on('user-left', (leftSocketId) => {
            console.log(`👋 User left: ${leftSocketId}`);

            // Close and remove peer connection
            if (peerConnectionsRef.current[leftSocketId]) {
                peerConnectionsRef.current[leftSocketId].close();
                delete peerConnectionsRef.current[leftSocketId];
            }

            // Clean up stream tracking
            delete remoteStreamsRef.current[leftSocketId];
            delete participantNames[leftSocketId];

            // Remove all streams from this user (camera + screen)
            setVideoStreams(prev => prev.filter(v => v.socketId !== leftSocketId));
        });

        // NEW: Screen share events
        socket.on('screen-share-started', (sharerSocketId) => {
            console.log(`🖥️ ${sharerSocketId} started screen sharing`);
            // The actual stream will arrive via ontrack
            // This event can be used for UI notifications if needed
        });

        socket.on('screen-share-stopped', (sharerSocketId) => {
            console.log(`🛑 ${sharerSocketId} stopped screen sharing`);
            
            // Remove screen stream for this user
            setVideoStreams(prev => 
                prev.filter(v => !(v.socketId === sharerSocketId && v.type === 'screen'))
            );
            
            if (remoteStreamsRef.current[sharerSocketId]) {
                remoteStreamsRef.current[sharerSocketId].screen = null;
            }
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            setConnectionError('Failed to connect to server');
        });

        // Cleanup
        return () => {
            console.log('🧹 Cleaning up connections...');
            
            Object.values(peerConnectionsRef.current).forEach(pc => {
                if (pc.connectionState !== 'closed') {
                    pc.close();
                }
            });
            
            socket.disconnect();
            
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [roomCode, username, createPeerConnection, handleSignal]);

    return {
        videoStreams,
        connectionError,
        socket: socketRef.current,
        peerConnections: peerConnectionsRef.current,
    };
};