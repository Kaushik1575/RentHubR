import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import StatusPopup from '../components/StatusPopup';
import FloatingBackground from '../components/FloatingBackground';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname ? (location.state.from.pathname + location.state.from.search) : null;

    // User Form State
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [showUserPassword, setShowUserPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Audio for click sound
    const playClickSound = () => {
        try {
            const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3");
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed', e));
        } catch (e) {
            console.log('Audio init failed', e);
        }
    };

    // Robot Check / CAPTCHA State (Preserved)
    const [isUserRobotChecked, setIsUserRobotChecked] = useState(false);

    // Modal Status Popup State
    const [popup, setPopup] = useState({
        isOpen: false,
        type: 'error',
        title: '',
        message: '',
        onConfirm: null,
        confirmText: '',
        cancelText: ''
    });

    const handleUserLogin = async (e, forceLogin = false) => {
        if (e && e.preventDefault) e.preventDefault();

        // Validate Robot Check / CAPTCHA
        if (!isUserRobotChecked) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Verification Required',
                message: 'Please confirm you are not a robot'
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, password: userPassword, forceLogin })
            });
            const data = await response.json();

            if (response.status === 409) {
                // Concurrent session detected
                setIsLoading(false);
                setPopup({
                    isOpen: true,
                    type: 'confirm',
                    title: 'Security Alert',
                    message: 'Your account is already logged in on another device.\n\nDo you want to log in here? This will log out the other device.',
                    confirmText: 'Yes, Login',
                    cancelText: 'No, Cancel',
                    onConfirm: () => {
                        setPopup(prev => ({ ...prev, isOpen: false }));
                        handleUserLogin(null, true); // Retrying with forceLogin = true
                    }
                });
                return;
            }

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Login Successful',
                    message: 'Welcome back! Redirecting you...'
                });
            } else {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Login Failed',
                    message: data.error || 'Invalid credentials'
                });
            }
        } catch (error) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Network Error',
                message: 'An error occurred. Please check your connection.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="renthub-login-page">
            {/* Quick Return to Home Link */}
            <Link to="/" className="login-back-home" title="Back to Home">
                <i className="fas fa-arrow-left"></i>
                <span>Home</span>
            </Link>

            {/* ==================================================
                DESKTOP HERO SECTION (LEFT 53%)
                Features user-selected artwork with signature organic wave cut
            ================================================== */}
            <aside className="renthub-hero-section" aria-label="RentHub Hero Showcase">
                <div className="renthub-hero-artwork-wrapper">
                    <img
                        src="/renthub_user_hero_2x.jpg"
                        alt="RentHub - Your Next Ride Is Just a Login Away. Safe & Trusted, Quick Booking, Multiple Locations, 24/7 Support."
                        className="renthub-hero-img"
                        onError={(e) => {
                            // Fallback to 1024x1024 version
                            e.currentTarget.src = '/renthub_user_hero.jpg';
                        }}
                    />

                    {/* Signature Organic Wave Cut carving into the photo edge with gold accent line */}
                    <div className="hero-wave-divider" aria-hidden="true">
                        <svg viewBox="0 0 100 1000" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="waveGoldStroke" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#F5B82E" stopOpacity="0.1" />
                                    <stop offset="45%" stopColor="#F5B82E" stopOpacity="0.85" />
                                    <stop offset="80%" stopColor="#F5B82E" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#EDB026" stopOpacity="0.4" />
                                </linearGradient>
                            </defs>
                            {/* Wave body filled with login background */}
                            <path d="M 100,0 L 45,0 C 95,220 15,480 65,700 C 90,840 35,940 100,1000 L 100,1000 Z" fill="#F4F7FC" />
                            {/* Gold curve accent stroke */}
                            <path d="M 45,0 C 95,220 15,480 65,700 C 90,840 35,940 100,1000" fill="none" stroke="url(#waveGoldStroke)" strokeWidth="3.5" />
                        </svg>
                    </div>
                </div>
            </aside>

            {/* ==================================================
                LOGIN FORM SECTION (RIGHT 47%)
            ================================================== */}
            <main className="renthub-login-section">
                {/* Interactive Physics & Floating Particles Animation Layer */}
                <FloatingBackground density={14} meterType="none" enableRipples={true} />

                {/* Ambient Radial Glow */}
                <div className="login-ambient-glow" aria-hidden="true" />

                {/* Decorative Bottom Golden Wave */}
                <div className="login-ambient-wave-bottom" aria-hidden="true">
                    <svg viewBox="0 0 520 160" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M0,120 C150,155 300,80 520,130 L520,160 L0,160 Z" fill="url(#goldWaveGradFinal)" />
                        <path d="M70,135 C220,160 340,110 520,145 L520,160 L70,160 Z" fill="rgba(245, 184, 46, 0.14)" />
                        <defs>
                            <linearGradient id="goldWaveGradFinal" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#F5B82E" stopOpacity="0.28" />
                                <stop offset="60%" stopColor="#EDB026" stopOpacity="0.14" />
                                <stop offset="100%" stopColor="#F5B82E" stopOpacity="0.04" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Mobile Brand Header (Visible only on <= 768px screens) */}
                <div className="mobile-brand-header">
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <img
                            src="/renthub-logo.png"
                            alt="RentHub"
                            className="mobile-brand-logo-img"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="mobile-brand-name">
                            Rent<span>Hub</span>
                        </div>
                        <div className="mobile-brand-tagline">
                            Ride • Drive • Explore
                        </div>
                    </Link>
                </div>

                {/* Floating White Login Card (Slightly larger & more spacious) */}
                <div className="renthub-login-card">
                    {/* Top Accent Gold Bar */}
                    <div className="card-top-accent" aria-hidden="true" />

                    <div className="card-inner-padding">
                        {/* Card Header */}
                        <div className="login-card-header">
                            <div className="welcome-badge">
                                <span>Welcome Back 👋</span>
                            </div>
                            <h1 className="login-card-title">
                                Login to Rent<span className="gold-accent">Hub</span>
                            </h1>
                            <p className="login-card-subtitle">
                                Enter your details to continue your journey.
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleUserLogin} noValidate>
                            {/* Email Address Input */}
                            <div className="renthub-form-group">
                                <label htmlFor="user-email-input" className="renthub-label">
                                    Email Address
                                </label>
                                <div className="renthub-input-wrapper">
                                    <i className="fas fa-envelope input-icon-prefix" aria-hidden="true"></i>
                                    <input
                                        id="user-email-input"
                                        type="email"
                                        value={userEmail}
                                        onChange={(e) => setUserEmail(e.target.value)}
                                        required
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        className="renthub-input"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="renthub-form-group">
                                <label htmlFor="user-password-input" className="renthub-label">
                                    Password
                                </label>
                                <div className="renthub-input-wrapper">
                                    <i className="fas fa-lock input-icon-prefix" aria-hidden="true"></i>
                                    <input
                                        id="user-password-input"
                                        type={showUserPassword ? "text" : "password"}
                                        value={userPassword}
                                        onChange={(e) => setUserPassword(e.target.value)}
                                        required
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        className="renthub-input"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowUserPassword(!showUserPassword)}
                                        aria-label={showUserPassword ? "Hide password" : "Show password"}
                                        title={showUserPassword ? "Hide password" : "Show password"}
                                    >
                                        <i className={`fas ${showUserPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                                    </button>
                                </div>

                                {/* Forgot Password Link */}
                                <div className="forgot-password-row">
                                    <Link to="/forgot-password" className="forgot-password-link">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            {/* Preserved Robot Check / CAPTCHA */}
                            <div className="renthub-captcha-wrapper">
                                <div
                                    className="captcha-check-group"
                                    onClick={() => {
                                        playClickSound();
                                        setIsUserRobotChecked(!isUserRobotChecked);
                                    }}
                                    role="checkbox"
                                    aria-checked={isUserRobotChecked}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === ' ' || e.key === 'Enter') {
                                            e.preventDefault();
                                            playClickSound();
                                            setIsUserRobotChecked(!isUserRobotChecked);
                                        }
                                    }}
                                >
                                    <div className={`captcha-checkbox ${isUserRobotChecked ? 'checked' : ''}`}>
                                        {isUserRobotChecked && (
                                            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" style={{ position: 'absolute', top: '-5px', left: '-2px' }}>
                                                <path d="M20 34L10 24L12.83 21.17L20 28.34L37.17 11.17L40 14L20 34Z" fill="#0F9D58" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="captcha-text">I'm not a robot</span>
                                </div>

                                <div className="captcha-badge">
                                    <img
                                        src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                                        alt="reCAPTCHA"
                                        className="captcha-badge-logo"
                                    />
                                    <div className="captcha-badge-text">reCAPTCHA</div>
                                    <div className="captcha-badge-links">Privacy - Terms</div>
                                </div>
                            </div>

                            {/* Submit Button (56px) */}
                            <button
                                type="submit"
                                className="renthub-login-btn"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="btn-spinner" aria-hidden="true"></span>
                                        <span>Logging in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Login</span>
                                        <i className="fas fa-arrow-right btn-arrow-icon" aria-hidden="true"></i>
                                    </>
                                )}
                            </button>

                            {/* Registration Link */}
                            <div className="login-card-footer">
                                <span>Don't have an account?</span>
                                <Link to="/register-user" className="signup-link">
                                    Sign Up
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Security Trust Badge */}
                <div className="login-trust-badge">
                    <i className="fas fa-shield-alt" aria-hidden="true"></i>
                    <span>256-Bit SSL Encrypted &amp; Verified Vehicle Fleet</span>
                </div>
            </main>

            {/* Preserved Status Popup Modal */}
            <StatusPopup
                isOpen={popup.isOpen}
                onClose={() => {
                    setPopup(prev => ({ ...prev, isOpen: false }));
                    if (popup.type === 'success') {
                        const sessionRedirect = sessionStorage.getItem('redirectAfterLogin');
                        const params = new URLSearchParams(window.location.search);
                        const redirectUrl = params.get('redirect');

                        if (sessionRedirect) {
                            sessionStorage.removeItem('redirectAfterLogin');
                            navigate(sessionRedirect);
                        } else if (from) {
                            navigate(from, { replace: true });
                        } else if (redirectUrl) {
                            navigate(redirectUrl);
                        } else {
                            navigate('/');
                        }
                        window.dispatchEvent(new Event('storage'));
                    }
                }}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                onConfirm={popup.onConfirm}
                confirmText={popup.confirmText}
                cancelText={popup.cancelText}
            />
        </div>
    );
};

export default Login;
