import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'
import FloatingLines from '../components/FloatingLines'

export default function LandingPage() {
    const router = useNavigate();

    const ACCENT_COLOR = "#8B0000"; 
    const DARK_RED_SHADE = "#600000";

    return (
        <div className='landingPageContainer' style={{ position: 'relative', overflow: 'hidden' }}>
            
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
                    // FIX: Dark Red/Maroon Gradient only
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

            {/* Content Container (z-index 1) */}
            <nav style={{ position: 'relative', zIndex: 1 }}>
                <div className='navHeader'>
                    <h2>Flux</h2>
                </div>
                <div className='navlist'>
                    <p onClick={() => router("/guest123")}>
                        Join as Guest
                    </p>
                    <p onClick={() => router("/auth")}>
                        Register
                    </p>
                    <div onClick={() => router("/auth")} role='button'>
                        <p>Login</p>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer" style={{ position: 'relative', zIndex: 1 }}>
                {/* Text Content */}
                <div>
                    <h1>
                        <span style={{ color: ACCENT_COLOR }}>Connect</span> with Anyone, Anywhere
                    </h1>
                    <p>Experience seamless video calling with Flux</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                
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
                    <img src="/puma.jpeg" alt="Panther wearing headphones" />
                </div>
            </div>
        </div>
    )
}