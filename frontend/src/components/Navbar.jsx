import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar() {
    const router = useNavigate();

    return (
        <nav className="floatingNavbar">
            <div className="navContent">
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
                    <div onClick={() => router("/auth")} role='button' className="loginButton">
                        <p>Login</p>
                    </div>
                </div>
            </div>
        </nav>
    );
}