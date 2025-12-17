import React from 'react';
import { Link } from 'react-router-dom';
import "../App.css";

// Component Imports
import FloatingLines from '../components/FloatingLines';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LandingPage() {
    const ACCENT_COLOR = "#8B0000"; 
    const DARK_RED_SHADE = "#600000";

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'black' }}>
            <Navbar isAuthenticated={false} />
            
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                
                {/* 1. BACKGROUND INTERACTION LAYER 
                    zIndex 1: Placed at the bottom.
                    We don't need pointer-events: none here because it's the bottom layer.
                */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 1, 
                    opacity: 0.8 
                }}>
                    <FloatingLines 
                        enabledWaves={['top', 'middle', 'bottom']}
                        lineCount={[10, 15, 20]}
                        lineDistance={[8, 6, 4]}
                        linesGradient={[ACCENT_COLOR, DARK_RED_SHADE, ACCENT_COLOR]} 
                        bendRadius={5.0}
                        bendStrength={-0.5}
                        interactive={true} 
                        parallax={true}
                        parallaxStrength={0.2}
                        animationSpeed={1}
                        mixBlendMode="normal"
                    />
                </div>

                {/* 2. VISUAL CONTENT LAYER 
                    zIndex 2: Above the lines.
                    pointerEvents: 'none' is the MAGIC FIX. 
                    It allows your mouse to "pass through" this container to interact with the lines.
                */}
                <div className="landingMainContainer" style={{ 
                    position: 'relative', 
                    zIndex: 2, 
                    minHeight: 'calc(100vh - 80px)',
                    pointerEvents: 'none' 
                }}>
                    
                    {/* Puma Image - Also set to none so it doesn't block the mouse */}
                    <div className="pumaImageContainer" style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        zIndex: 3, 
                        pointerEvents: 'none' 
                    }}>
                        <img 
                            src="/puma.jpeg" 
                            alt="Panther" 
                            style={{ animation: 'float 6s ease-in-out infinite', marginBottom: '-30px' }} 
                        />
                    </div>

                    {/* 3. CLICKABLE UI ELEMENTS 
                        zIndex 10: Highest layer.
                        pointerEvents: 'auto' RESTORES clicking functionality for your button.
                    */}
                    <div className="landingTextContent" style={{ 
                        zIndex: 10, 
                        position: 'relative',
                        pointerEvents: 'auto' 
                    }}>
                        <h1 style={{ color: 'white'}}>
                            <span style={{ color: ACCENT_COLOR }}>FLUX</span>
                            <br />
                            where Video Chats Turn into Shared Movie Magic
                        </h1>
                        <p style={{ color: 'white'}}>Popcorn Not Included!</p>
                        <div role='button'>
                            <Link to={"/auth"} style={{ textDecoration: 'none', color: 'inherit' }}>
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                {`@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }`}
            </style>
        </div>
    )
}