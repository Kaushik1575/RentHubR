import React from 'react';

const ComingSoonCard = ({
    title = "Feature Name",
    subtitle = "This feature is currently under development.",
    icon = "fas fa-lock",
    onBack,
    children
}) => {
    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '650px', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Background Content - Fully rendered in background, but locked and not accessible */}
            <div style={{
                filter: 'blur(5px) grayscale(15%)',
                opacity: 0.45,
                pointerEvents: 'none',
                userSelect: 'none',
                width: '100%'
            }}>
                {children}
            </div>

            {/* Centered Minimal Coming Soon Card Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                padding: '20px'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                    borderRadius: '24px',
                    padding: '48px 40px',
                    color: '#ffffff',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 35px rgba(59,130,246,0.25)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    maxWidth: '520px',
                    width: '100%',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Glowing Ambient Highlights */}
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 2 }}>
                        {/* Icon */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.2rem',
                            color: '#ffffff',
                            margin: '0 auto 24px',
                            boxShadow: '0 12px 30px rgba(59, 130, 246, 0.45)'
                        }}>
                            <i className={icon}></i>
                        </div>

                        {/* Title & Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.18)', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '6px 16px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 8px #3b82f6' }} />
                            In Development
                        </div>

                        <h2 style={{ margin: '0 0 8px', fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff' }}>
                            Coming Soon
                        </h2>

                        <h3 style={{ margin: '0 0 12px', fontSize: '1.15rem', fontWeight: 700, color: '#93c5fd' }}>
                            {title}
                        </h3>

                        <p style={{ margin: '0 0 32px', fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                            {subtitle}
                        </p>

                        {/* Return button */}
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                style={{
                                    padding: '12px 28px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.92rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'transform 0.2s ease'
                                }}
                            >
                                <i className="fas fa-arrow-left"></i> Return to Dashboard
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComingSoonCard;
