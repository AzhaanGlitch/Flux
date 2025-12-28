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
    const [participantNames, setParticipantNames] = useState({});
    
    // REFS
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const pendingCandidatesRef = useRef({});
    const localStreamRef = useRef(localStream);
    const remoteStreamsRef = useRef({});
    
    // CRITICAL FIX: Use ref for names to avoid dependency cycles in callbacks
    const participantNamesRef = useRef({});

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

    // Helper to determine if a track is screen share
    const isScreenShareTrack = (track) => {
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

    // Helper to safely update names in both Ref (for logic) and State (for UI)
    const updateParticipantName = useCallback((id, name) => {
        participantNamesRef.current[id] = name;
        setParticipantNames(prev => ({ ...prev, [id]: name }));
    }, []);

    // 1. Create Peer Connection
    // Removed 'participantNames' from dependency array to prevent infinite loop
    const createPeerConnection = useCallback((socketId) => {
        console.log(`🔗 Creating peer connection for: ${socketId}`);
        
        const peerConnection = new RTCPeerConnection(peerConfig);
        peerConnectionsRef.current[socketId] = peerConnection;

        if (!remoteStreamsRef.current[socketId]) {
            remoteStreamsRef.current[socketId] = {
                camera: null,
                screen: null,
            };
        }

        peerConnection.ontrack = (event) => {
            console.log(`📹 TRACK RECEIVED from ${socketId}:`, {
                kind: event.track.kind,
                label: event.track.label,
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

            if (isScreen) {
                remoteStreamsRef.current[socketId].screen = remoteStream;
            } else {
                remoteStreamsRef.current[socketId].camera = remoteStream;
            }

            setVideoStreams(prev => {
                const streamType = isScreen ? 'screen' : 'camera';
                const existingIndex = prev.findIndex(
                    v => v.socketId === socketId && v.type === streamType
                );

                // FIX: Use Ref for name lookup to avoid stale closures or dependency cycles
                const currentName = participantNamesRef.current[socketId] || socketId;
                const displayName = isScreen 
                    ? `${currentName}'s Screen` 
                    : currentName;

                const newStreamData = {
                    socketId,
                    stream: remoteStream,
                    type: streamType,
                    name: displayName,
                    isLocal: false,
                    timestamp: Date.now(),
                };

                if (existingIndex !== -1) {
                    const updated = [...prev];
                    updated[existingIndex] = newStreamData;
                    return updated;
                } else {
                    return [...prev, newStreamData];
                }
            });

            track.onended = () => {
                console.log(`🛑 Track ended from ${socketId}`);
                if (isScreen) {
                    remoteStreamsRef.current[socketId].screen = null;
                }
                setVideoStreams(prev => 
                    prev.filter(v => !(v.socketId === socketId && v.type === (isScreen ? 'screen' : 'camera')))
                );
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
                console.warn(`⚠️ Connection failed with ${socketId}, restarting ICE`);
                peerConnection.restartIce();
            }
        };

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        return peerConnection;
    }, []); // Empty dependency array is safe now because we use refs

    // 2. Handle Signaling
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

                // Process pending candidates
                if (pendingCandidatesRef.current[fromSocketId]) {
                    for (const candidate of pendingCandidatesRef.current[fromSocketId]) {
                        await peerConnection.addIceCandidate(candidate);
                    }
                    delete pendingCandidatesRef.current[fromSocketId];
                }
            }

            if (signal.ice) {
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

    // 3. Main Socket Connection Logic
    useEffect(() => {
        if (!roomCode || !username) return;

        console.log('🚀 Initializing socket connection...');
        
        // Initialize Socket
        socketRef.current = io(server, {
            secure: true,
            reconnection: true,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            
            // Add self to video streams immediately
            if (localStreamRef.current) {
                setVideoStreams([{
                    socketId: socket.id,
                    stream: localStreamRef.current,
                    type: 'camera',
                    name: username, // Use prop directly
                    isLocal: true,
                    timestamp: Date.now(),
                }]);
            }

            // Update self name in ref
            updateParticipantName(socket.id, username);

            socket.emit('join-call', roomCode);
            socket.emit('username', username);
        });

        socket.on('signal', handleSignal);

        socket.on('username', (socketId, name) => {
            console.log(`📝 Received username: ${name} for ${socketId}`);
            updateParticipantName(socketId, name);
            
            // Update display names in existing video streams
            setVideoStreams(prev => prev.map(v => 
                v.socketId === socketId 
                    ? { ...v, name: v.type === 'screen' ? `${name}'s Screen` : name }
                    : v
            ));
        });

        socket.on('user-joined', (joinedSocketId, allParticipants) => {
            console.log(`👤 User joined: ${joinedSocketId}`);
            
            // Initiate connection to all other participants
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
            // Don't delete from participantNamesRef immediately to avoid UI flicker if they rejoin fast
            
            setVideoStreams(prev => prev.filter(v => v.socketId !== leftSocketId));
        });

        socket.on('screen-share-stopped', (sharerSocketId) => {
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