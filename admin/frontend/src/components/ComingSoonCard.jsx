import React, { useState } from 'react';

const ComingSoonCard = ({
    title = "Enterprise Feature",
    subtitle = "This module is currently in active development for the next production milestone.",
    icon = "fas fa-rocket",
    phase = "Phase 2.0 • Q3 2026",
    features = [
        "Automated AI-driven demand & dynamic surge pricing analytics",
        "Direct multi-bank RTGS/NEFT batch payment settlement gateway",
        "Real-time CAN-bus vehicle telemetry and remote engine diagnostics",
        "Automated PDF tax invoicing & GST reconciliation export"
    ],
    onBack,
    children
}) => {
    const [showOverlay, setShowOverlay] = useState(true);

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '600px', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Background Content (Actual Tables, Graphs, and UI) */}
            <div style={{
                filter: showOverlay ? 'blur(4px) grayscale(20%)' : 'none',
                opacity: showOverlay ? 0.45 : 1,
                pointerEvents: showOverlay ? 'none' : 'auto',
                transition: 'all 0.4s ease',
                userSelect: showOverlay ? 'none' : 'auto'
            }}>
                {children}
            </div>

            {/* Frosted Glass Floating Coming Soon Overlay */}
            {showOverlay && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 30,
                    padding: '24px',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%)',
                        borderRadius: '24px',
                        padding: '40px 32px',
                        color: '#ffffff',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 30px rgba(59,130,246,0.2)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        maxWidth: '850px',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Background Ambient Glows */}
                        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

                        <div style={{ position: 'relative', zIndex: 2 }}>
                            {/* Header Badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.18)', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '6px 14px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 8px #3b82f6' }} />
                                    In Active Engineering Pipeline
                                </div>
                                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                                    <i className="fas fa-code-branch" style={{ marginRight: '6px', color: '#a855f7' }}></i>
                                    {phase}
                                </span>
                            </div>

                            {/* Main Hero Icon & Title */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '18px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.8rem',
                                    color: '#ffffff',
                                    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
                                    flexShrink: 0
                                }}>
                                    <i className={icon}></i>
                                </div>
                                <div>
                                    <h2 style={{ margin: '0 0 4px', fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff' }}>
                                        {title}
                                    </h2>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                                        {subtitle}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Indicator */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '22px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                                    <span style={{ color: '#94a3b8' }}>Architectural Readiness</span>
                                    <span style={{ color: '#38bdf8' }}>85% Specification Complete</span>
                                </div>
                                <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #38bdf8)', borderRadius: '4px' }} />
                                </div>
                            </div>

                            {/* Planned Architecture Matrix */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Planned Capabilities & Architecture:
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                                    {features.map((feat, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                            <i className="fas fa-check-circle" style={{ color: '#10b981', marginTop: '2px', fontSize: '0.85rem' }}></i>
                                            <span style={{ fontSize: '0.83rem', color: '#e2e8f0', lineHeight: '1.4' }}>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowOverlay(false)}
                                    style={{
                                        padding: '9px 18px',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <i className="fas fa-eye"></i> View Live Interface Behind
                                </button>

                                {onBack && (
                                    <button
                                        type="button"
                                        onClick={onBack}
                                        style={{
                                            padding: '9px 18px',
                                            borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.08)',
                                            color: '#ffffff',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <i className="fas fa-arrow-left"></i> Return to Dashboard
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating button to re-show overlay when user toggled it off */}
            {!showOverlay && (
                <button
                    type="button"
                    onClick={() => setShowOverlay(true)}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 100,
                        padding: '10px 20px',
                        borderRadius: '50px',
                        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                        color: '#60a5fa',
                        border: '1px solid #3b82f6',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <i className="fas fa-lock"></i> Show Coming Soon Card
                </button>
            )}
        </div>
    );
};

export default ComingSoonCard;

