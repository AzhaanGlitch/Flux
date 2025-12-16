import React from 'react'
import "../App.css"
import { Link } from 'react-router-dom'
import FloatingLines from '../components/FloatingLines'
import Navbar from '../components/Navbar'

export default function LandingPage() {
    const ACCENT_COLOR = "#8B0000"; 
    const DARK_RED_SHADE = "#600000";

    return (
        <div className='landingPageContainer' style={{ position: 'relative', overflow: 'hidden' }}>
            
            {/* Use common Navbar with isAuthenticated=false */}
            <Navbar isAuthenticated={false} />
            
            {/* Animated Background Container */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0,
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

            {/* Main Content Container */}
            <div className="landingMainContainer" style={{ position: 'relative', zIndex: 1 }}>
                {/* Puma Image */}
                <div 
                    className="pumaImageContainer" 
                    style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        zIndex: 2, 
                        pointerEvents: 'none' 
                    }}
                >
                    <img 
                        src="/puma.jpeg" 
                        alt="Panther wearing headphones" 
                        style={{
                            animation: 'float 6s ease-in-out infinite',
                            marginBottom: '-30px', 
                        }}
                    />
                </div>

                {/* Text Content - Right Side */}
                <div className="landingTextContent">
                    <h1>
                        <span style={{ color: ACCENT_COLOR }}>FLUX</span>
                        where Video Chats Turn into Shared Movie Magic
                    </h1>
                    <p>Popcorn Not Included!</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
            </div>

            {/* Floating Animation Keyframe */}
            <style>
                {`
                    @keyframes float {
                        0%, 100% {
                            transform: translateY(0px);
                        }
                        50% {
                            transform: translateY(-20px);
                        }
                    }
                `}
            </style>
        </div>
    )
}