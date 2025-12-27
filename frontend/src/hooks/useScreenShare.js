// hooks/useScreenShare.js
import { useRef, useCallback, useState, useEffect } from 'react';

export const useScreenShare = (socket, peerConnections, localStream) => {
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenStream, setScreenStream] = useState(null);
    const screenSendersRef = useRef({}); // Track screen track senders per peer

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

            Object.entries(peerConnections).forEach(([socketId, peerConnection]) => {
                if (!peerConnection || peerConnection.connectionState === 'closed') {
                    console.warn(`⚠️ Skipping closed connection: ${socketId}`);
                    return;
                }

                try {
                    const sender = peerConnection.addTrack(screenTrack, stream);
                    
                    if (!screenSendersRef.current[socketId]) {
                        screenSendersRef.current[socketId] = [];
                    }
                    screenSendersRef.current[socketId].push(sender);

                    console.log(`✅ Added screen track to peer: ${socketId}`);
                } catch (error) {
                    console.error(`❌ Failed to add screen track to ${socketId}:`, error);
                }
            });

            socket.emit('screen-share-started', socket.id);

            screenTrack.onended = () => {
                console.log('🛑 Screen share stopped by user');
                stopScreenShare();
            };

        } catch (error) {
            console.error('❌ Screen share error:', error);
            
            if (error.name === 'NotAllowedError') {
                alert('Screen sharing permission denied');
            } else if (error.name === 'NotFoundError') {
                alert('No screen available to share');
            } else {
                alert('Failed to start screen sharing: ' + error.message);
            }
            
            setIsScreenSharing(false);
        }
    }, [socket, peerConnections]);

    const stopScreenShare = useCallback(() => {
        if (!screenStream) {
            console.log('⚠️ No screen stream to stop');
            return;
        }

        console.log('🛑 Stopping screen share...');

        screenStream.getTracks().forEach(track => {
            track.stop();
        });

        Object.entries(peerConnections).forEach(([socketId, peerConnection]) => {
            if (!peerConnection || peerConnection.connectionState === 'closed') {
                return;
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
            }
        });

        if (socket) {
            socket.emit('screen-share-stopped', socket.id);
        }

        setScreenStream(null);
        setIsScreenSharing(false);

        console.log('✅ Screen share stopped successfully');
    }, [screenStream, peerConnections, socket]);

    // Cleanup on unmount - FIXED: Removed "React." prefix
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