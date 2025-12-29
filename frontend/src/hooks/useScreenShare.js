// hooks/useScreenShare.js
import { useRef, useCallback, useState, useEffect } from 'react';

export const useScreenShare = (socket, peerConnections, localStream) => {
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenStream, setScreenStream] = useState(null);
    const screenSendersRef = useRef({}); // Track screen track senders per peer

    // --- MOVED UP: Define stopScreenShare FIRST ---
    const stopScreenShare = useCallback(async () => {
        if (!screenStream) {
            console.log('⚠️ No screen stream to stop');
            return;
        }

        console.log('🛑 Stopping screen share...');

        screenStream.getTracks().forEach(track => {
            track.stop();
        });

        // Iterate over peers to remove track and renegotiate
        for (const [socketId, peerConnection] of Object.entries(peerConnections)) {
            if (!peerConnection || peerConnection.connectionState === 'closed') {
                continue;
            }

            const senders = screenSendersRef.current[socketId];
            if (senders && senders.length > 0) {
                senders.forEach(sender => {
                    try {
                        peerConnection.removeTrack(sender);
                        console.log(`✅ Removed screen track from peer: ${socketId}`);
                    } catch (error) {
                        console.error(`❌ Error removing track from ${socketId}:`, error);
                    }
                });
                delete screenSendersRef.current[socketId];

                // RENEGOTIATE: Send offer to reflect removed track
                try {
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    socket.emit('signal', socketId, JSON.stringify({
                        sdp: peerConnection.localDescription
                    }));
                    console.log(`📡 Sent stop-share negotiation to ${socketId}`);
                } catch (err) {
                    console.error("Renegotiation failed", err);
                }
            }
        }

        if (socket) {
            socket.emit('screen-share-stopped', socket.id);
        }

        setScreenStream(null);
        setIsScreenSharing(false);

        console.log('✅ Screen share stopped successfully');
    }, [screenStream, peerConnections, socket]);

    // --- MOVED DOWN: Now startScreenShare can safely reference stopScreenShare ---
    const startScreenShare = useCallback(async () => {
        if (!socket || !peerConnections) {
            console.error('❌ Socket or peer connections not ready');
            return;
        }

        try {
            console.log('🖥️ Starting screen share...');

            // Get screen share stream
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor',
                },
                audio: false,
            });

            console.log('✅ Screen stream acquired');

            setScreenStream(stream);
            setIsScreenSharing(true);

            const screenTrack = stream.getVideoTracks()[0];
            screenTrack.contentHint = 'detail';

            // Iterate over all connected peers
            for (const [socketId, peerConnection] of Object.entries(peerConnections)) {
                if (!peerConnection || peerConnection.connectionState === 'closed') {
                    console.warn(`⚠️ Skipping closed connection: ${socketId}`);
                    continue;
                }

                try {
                    // 1. Add Track
                    const sender = peerConnection.addTrack(screenTrack, stream);
                    
                    if (!screenSendersRef.current[socketId]) {
                        screenSendersRef.current[socketId] = [];
                    }
                    screenSendersRef.current[socketId].push(sender);

                    console.log(`✅ Added screen track to peer: ${socketId}`);

                    // 2. RENEGOTIATE: Create and Send Offer
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    
                    socket.emit('signal', socketId, JSON.stringify({
                        sdp: peerConnection.localDescription
                    }));
                    console.log(`📡 Sent renegotiation offer to ${socketId}`);

                } catch (error) {
                    console.error(`❌ Failed to add/negotiate screen track to ${socketId}:`, error);
                }
            }

            socket.emit('screen-share-started', socket.id);

            screenTrack.onended = () => {
                console.log('🛑 Screen share stopped by user');
                stopScreenShare();
            };

        } catch (error) {
            console.error('❌ Screen share error:', error);
            if (error.name !== 'NotAllowedError') {
                alert('Failed to start screen sharing: ' + error.message);
            }
            setIsScreenSharing(false);
        }
    }, [socket, peerConnections, stopScreenShare]); // This dependency is now safe

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [screenStream]);

    return {
        isScreenSharing,
        screenStream,
        startScreenShare,
        stopScreenShare,
    };
};