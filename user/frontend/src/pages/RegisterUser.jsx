import React from 'react';
import RegistrationCard from '../components/registration/RegistrationCard';
import RegisterHeroContent from '../components/registration/RegisterHeroContent';
import FloatingBackground from '../components/FloatingBackground';
import '../components/registration/registration.css';

const RegisterUser = () => {
    return (
        <div className="renthub-split-register-page">
            {/* ==================================================
                LEFT HERO SECTION (HALF-WIDTH LIKE LOGIN PAGE)
            ================================================== */}
            <aside className="reg-split-hero-section" aria-label="RentHub Register Hero">
                <div className="reg-split-artwork-wrapper">
                    <img
                        src="/renthub_register_hero.jpg"
                        alt="RentHub - Create an Account and Unlock New Journeys"
                        className="reg-split-hero-img"
                    />

                    {/* Left Hero Promotional Content Overlay */}
                    <div className="reg-split-hero-content-overlay">
                        <RegisterHeroContent />
                    </div>

                    {/* Signature Organic Wave Cut carving into the photo edge with gold accent line (Identical to Login Page) */}
                    <div className="hero-wave-divider" aria-hidden="true">
                        <svg viewBox="0 0 100 1000" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="waveGoldStrokeReg" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#F5B82E" stopOpacity="0.1" />
                                    <stop offset="45%" stopColor="#F5B82E" stopOpacity="0.85" />
                                    <stop offset="80%" stopColor="#F5B82E" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#EDB026" stopOpacity="0.4" />
                                </linearGradient>
                            </defs>
                            {/* Wave body filled with right-side background color */}
                            <path d="M 100,0 L 45,0 C 95,220 15,480 65,700 C 90,840 35,940 100,1000 L 100,1000 Z" fill="#F4F7FC" />
                            {/* Gold curve accent stroke */}
                            <path d="M 45,0 C 95,220 15,480 65,700 C 90,840 35,940 100,1000" fill="none" stroke="url(#waveGoldStrokeReg)" strokeWidth="3.5" />
                        </svg>
                    </div>
                </div>
            </aside>

            {/* ==================================================
                RIGHT REGISTRATION SECTION (HALF-WIDTH LIKE LOGIN PAGE)
            ================================================== */}
            <main className="reg-split-form-section">
                {/* Interactive Physics & Floating Particles Animation Layer */}
                <FloatingBackground density={10} meterType="none" enableRipples={true} />

                {/* Ambient Radial Glow Behind Card */}
                <div className="login-ambient-glow" aria-hidden="true" />

                {/* Decorative Bottom Golden Wave */}
                <div className="login-ambient-wave-bottom" aria-hidden="true">
                    <svg viewBox="0 0 520 160" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M0,120 C150,155 300,80 520,130 L520,160 L0,160 Z" fill="url(#goldWaveGradReg)" />
                        <path d="M70,135 C220,160 340,110 520,145 L520,160 L70,160 Z" fill="rgba(245, 184, 46, 0.14)" />
                        <defs>
                            <linearGradient id="goldWaveGradReg" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#F5B82E" stopOpacity="0.28" />
                                <stop offset="60%" stopColor="#EDB026" stopOpacity="0.14" />
                                <stop offset="100%" stopColor="#F5B82E" stopOpacity="0.04" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Centered Registration Card */}
                <div className="reg-split-card-wrapper">
                    <RegistrationCard />
                </div>
            </main>
        </div>
    );
};

export default RegisterUser;
