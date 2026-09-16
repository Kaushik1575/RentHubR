import React from 'react';

const RegisterHeroContent = () => {
    return (
        <div className="reg-hero-content-wrapper">
            {/* Pill Tag */}
            <div className="reg-hero-badge">
                <span className="reg-hero-badge-star">✨</span>
                <span>Join a Smarter Way to Travel!</span>
            </div>

            {/* Main Headline */}
            <h1 className="reg-hero-title">
                Create an Account <br />
                and Unlock <span className="reg-hero-cursive-accent">New Journeys</span>
            </h1>

            {/* Subtitle / Description */}
            <p className="reg-hero-desc">
                Sign up now and rent bikes, scooters, cars and more —<br className="desktop-break" />
                easily, safely and at the best price.
            </p>

        </div>
    );
};

export default RegisterHeroContent;
