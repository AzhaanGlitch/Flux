import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion'; // npm install framer-motion
const VideoTile = ({ videoData, index }) => {
const videoRef = useRef();
const [isLoaded, setIsLoaded] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);
useEffect(() => {
    if (videoRef.current && videoData.stream) {
        videoRef.current.srcObject = videoData.stream;
        setIsLoaded(true);
    }
}, [videoData.stream]);

// Audio level detection (optional - for speaking indicator)
useEffect(() => {
    if (!videoData.stream || videoData.type === 'screen') return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(videoData.stream);
    
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    microphone.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId;

    const detectSpeaking = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        setIsSpeaking(average > 20); // Adjust threshold as needed
        
        animationId = requestAnimationFrame(detectSpeaking);
    };

    detectSpeaking();

    return () => {
        cancelAnimationFrame(animationId);
        audioContext.close();
    };
}, [videoData.stream, videoData.type]);

const isScreenShare = videoData.type === 'screen';
const transform = videoData.isLocal && !isScreenShare ? 'scaleX(-1)' : 'none';

// Animation variants
const variants = {
    hidden: { 
        opacity: 0, 
        scale: 0.8,
        y: isScreenShare ? 0 : 50,
        x: isScreenShare ? 50 : 0,
    },
    visible: { 
        opacity: 1, 
        scale: 1,
        y: 0,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
            delay: index * 0.1, // Stagger animation
        }
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.3 }
    }
};

return (
    <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={isScreenShare ? 'screenShareTile' : 'cameraTile'}
        style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: isScreenShare 
                ? '0 0 30px rgba(220, 38, 38, 0.5), 0 10px 40px rgba(0, 0, 0, 0.4)'
                : '0 10px 30px rgba(0, 0, 0, 0.3)',
            border: isScreenShare 
                ? '3px solid #DC143C' 
                : '2px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.3)',
            // Make screen shares larger
            gridColumn: isScreenShare ? 'span 2' : 'span 1',
            gridRow: isScreenShare ? 'span 2' : 'span 1',
        }}
    >
        {/* Loading Placeholder */}
        {!isLoaded && (
            <div 
                className="videoLoadingPlaceholder"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                }}
            />
        )}

        {/* Video Element */}
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={videoData.isLocal}
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform,
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
            }}
        />

        {/* Speaking Indicator */}
        {!videoData.isLocal && videoData.type === 'camera' && isSpeaking && (
            <div className="speakingIndicator" />
        )}

        {/* Participant Label */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="participantLabel"
            style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backdropFilter: 'blur(10px)',
            }}
        >
            {isScreenShare && '🖥️ '}
            {videoData.name || 'Unknown'}
            {videoData.isLocal && ' (You)'}
        </motion.div>

        {/* Screen Share Badge */}
        {isScreenShare && (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.4 }}
                style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'linear-gradient(135deg, #DC143C, #8B0000)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.5)',
                }}
            >
                Screen Share
            </motion.div>
        )}
    </motion.div>
);
};
export default VideoTile;