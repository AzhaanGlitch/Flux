// hooks/useScreenShare.js
import React, { useState, useEffect } from 'react';

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
                    displaySurface: 'monitor', // Can be 'monitor', 'window', or 'application'
                },
                audio: false, // Set to true if you want to share system audio
            });

            console.log('✅ Screen stream acquired');

            // Store the screen stream
            setScreenStream(stream);
            setIsScreenSharing(true);

            // Label the track so peers can identify it as screen share
            const screenTrack = stream.getVideoTracks()[0];
            screenTrack.contentHint = 'detail'; // Optimize for screen content

            // Add screen track to all existing peer connections
            Object.entries(peerConnections).forEach(([socketId, peerConnection]) => {
                if (!peerConnection || peerConnection.connectionState === 'closed') {
                    console.warn(`⚠️ Skipping closed connection: ${socketId}`);
                    return;
                }

                try {
                    // Add the screen track (creates a new sender)
                    const sender = peerConnection.addTrack(screenTrack, stream);
                    
                    // Store sender reference for cleanup
                    if (!screenSendersRef.current[socketId]) {
                        screenSendersRef.current[socketId] = [];
                    }
                    screenSendersRef.current[socketId].push(sender);

                    console.log(`✅ Added screen track to peer: ${socketId}`);
                } catch (error) {
                    console.error(`❌ Failed to add screen track to ${socketId}:`, error);
                }
            });

            // Notify all peers that screen sharing started
            socket.emit('screen-share-started', socket.id);

            // Handle when user stops sharing via browser UI
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

        // Stop all tracks in the screen stream
        screenStream.getTracks().forEach(track => {
            track.stop();
        });

        // Remove screen tracks from all peer connections
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
                
                // Clear sender references
                delete screenSendersRef.current[socketId];
            }
        });

        // Notify peers that screen sharing stopped
        if (socket) {
            socket.emit('screen-share-stopped', socket.id);
        }

        // Reset state
        setScreenStream(null);
        setIsScreenSharing(false);

        console.log('✅ Screen share stopped successfully');
    }, [screenStream, peerConnections, socket]);

    // Cleanup on unmount
    React.useEffect(() => {
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