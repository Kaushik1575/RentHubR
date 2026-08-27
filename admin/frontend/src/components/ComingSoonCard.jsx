import React from 'react';

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
    onBack
}) => {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            borderRadius: '24px',
            padding: '48px 36px',
            color: '#ffffff',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.1)',
            maxWidth: '900px',
            margin: '20px auto',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Ambient Glows */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 2 }}>
                {/* Header Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 14px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 8px #3b82f6' }} />
                        In Active Engineering Pipeline
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                        <i className="fas fa-code-branch" style={{ marginRight: '6px', color: '#a855f7' }}></i>
                        {phase}
                    </span>
                </div>

                {/* Main Hero Icon & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        color: '#ffffff',
                        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
                        flexShrink: 0
                    }}>
                        <i className={icon}></i>
                    </div>
                    <div>
                        <h2 style={{ margin: '0 0 6px', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff' }}>
                            {title}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                            {subtitle}
                        </p>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                        <span style={{ color: '#94a3b8' }}>Architectural Readiness</span>
                        <span style={{ color: '#38bdf8' }}>85% Specification Complete</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #38bdf8)', borderRadius: '4px' }} />
                    </div>
                </div>

                {/* Planned Architecture Matrix */}
                <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: '0.9rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Planned Capabilities & Architecture:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                        {features.map((feat, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <i className="fas fa-check-circle" style={{ color: '#10b981', marginTop: '3px', fontSize: '0.9rem' }}></i>
                                <span style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: '1.4' }}>{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.08)',
                                color: '#ffffff',
                                border: '1px solid rgba(255,255,255,0.15)',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
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
    );
};

export default ComingSoonCard;
