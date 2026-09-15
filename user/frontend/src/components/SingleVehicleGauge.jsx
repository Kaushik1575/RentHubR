import React, { useEffect, useRef } from 'react';
import './SingleVehicleGauge.css';

const GAUGE_CONFIGS = {
    bike: {
        title: 'SPORT TACHOMETER',
        unit: 'RPM x1000',
        sub: 'REDLINE 14k',
        ticks: [0, 2, 4, 6, 8, 10, 12, 14],
        dangerIndex: 5,
        primaryColor: '#f97316',
        accentColor: '#dc2626',
        textColor: '#ea580c',
        needleColor: '#ef4444',
        label: 'SPORT DYNAMICS',
        modeDefault: 'GEAR 3',
        odoDefault: 'TRIP 142.8 km'
    },
    scooty: {
        title: 'ECO SPEEDOMETER',
        unit: 'KM/H',
        sub: 'ECO COMMUTE',
        ticks: [0, 10, 20, 30, 40, 50, 60, 70, 80],
        dangerIndex: 7,
        primaryColor: '#10b981',
        accentColor: '#06b6d4',
        textColor: '#047857',
        needleColor: '#10b981',
        label: 'ECO SMART',
        modeDefault: 'ECO ACTIVE',
        odoDefault: 'RANGE 94 km'
    },
    car: {
        title: 'CRUISE SPEEDO',
        unit: 'KM/H',
        sub: 'HIGHWAY CRUISE',
        ticks: [0, 30, 60, 90, 120, 150, 180, 210, 240],
        dangerIndex: 6,
        primaryColor: '#3b82f6',
        accentColor: '#6366f1',
        textColor: '#1d4ed8',
        needleColor: '#2563eb',
        label: 'AUTO COCKPIT',
        modeDefault: 'CRUISE 110',
        odoDefault: 'ODO 38,420 km'
    }
};

const SingleVehicleGauge = ({ type = 'bike' }) => {
    const needleRef = useRef(null);
    const arcRef = useRef(null);
    const digitalRef = useRef(null);
    const modeRef = useRef(null);
    const odoRef = useRef(null);

    const cfg = GAUGE_CONFIGS[type] || GAUGE_CONFIGS.bike;

    useEffect(() => {
        let animationFrameId;
        let lastTime = performance.now();
        let simTime = 0;

        const render = () => {
            const now = performance.now();
            const dt = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;
            simTime += dt;

            let ratio = 0;
            let displayVal = '0';
            let modeVal = cfg.modeDefault;
            let odoVal = cfg.odoDefault;

            if (type === 'bike') {
                // High-revving 7s motorcycle acceleration loop
                const cycle = simTime % 7.5;
                let rpm = 2.0;
                let gear = '2';
                if (cycle < 2.0) {
                    const p = cycle / 2.0;
                    rpm = 2.0 + Math.pow(p, 1.4) * 8.5;
                    gear = '2';
                } else if (cycle < 2.4) {
                    rpm = 6.2;
                    gear = '3';
                } else if (cycle < 4.6) {
                    const p = (cycle - 2.4) / 2.2;
                    rpm = 6.2 + Math.pow(p, 1.2) * 6.6;
                    gear = '3';
                } else if (cycle < 5.0) {
                    rpm = 8.5;
                    gear = '4';
                } else {
                    const p = (cycle - 5.0) / 2.5;
                    rpm = 2.0 + (1 - p) * 9.5;
                    gear = p > 0.7 ? 'N' : '4';
                }
                ratio = Math.max(0, Math.min(1, rpm / 14));
                displayVal = `${rpm.toFixed(1)}k`;
                modeVal = `GEAR ${gear}`;
                const trip = 142.8 + (simTime * 0.035);
                odoVal = `TRIP ${trip.toFixed(1)} km`;
            } else if (type === 'scooty') {
                // Smooth urban scooter cruising cycle (0 - 58 km/h)
                const cycle = simTime % 8.0;
                let speed = 25;
                if (cycle < 3.5) {
                    const p = cycle / 3.5;
                    speed = 10 + Math.sin(p * Math.PI * 0.5) * 44;
                } else if (cycle < 5.5) {
                    speed = 54 + Math.sin(cycle * 2) * 4;
                } else {
                    const p = (cycle - 5.5) / 2.5;
                    speed = 10 + (1 - p) * 44;
                }
                ratio = Math.max(0, Math.min(1, speed / 80));
                displayVal = `${Math.round(speed)}`;
                modeVal = speed > 45 ? 'POWER DRIVE' : 'ECO ACTIVE';
                const bat = 94 - ((simTime % 20) * 0.2);
                odoVal = `BAT ${Math.round(bat)}% • 98km`;
            } else {
                // Highway cruiser car cycle (60 - 150 km/h)
                const cycle = simTime % 9.0;
                let speed = 80;
                if (cycle < 4.0) {
                    const p = cycle / 4.0;
                    speed = 60 + Math.pow(p, 1.3) * 75;
                } else if (cycle < 6.5) {
                    speed = 135 + Math.sin(cycle * 1.5) * 5;
                } else {
                    const p = (cycle - 6.5) / 2.5;
                    speed = 60 + (1 - p) * 75;
                }
                ratio = Math.max(0, Math.min(1, speed / 240));
                displayVal = `${Math.round(speed)}`;
                modeVal = speed > 110 ? 'CRUISE 120' : 'DRIVE AUTO';
                const totalKm = 38420 + Math.floor(simTime * 0.05);
                odoVal = `ODO ${totalKm.toLocaleString()} km`;
            }

            // Update Needle
            if (needleRef.current) {
                const angle = -120 + ratio * 240;
                needleRef.current.style.transform = `rotate(${angle}deg)`;
            }

            // Update Glowing Arc
            if (arcRef.current) {
                arcRef.current.style.strokeDashoffset = `${326.7 * (1 - ratio)}`;
            }

            // Update Digital Readouts
            if (digitalRef.current) {
                digitalRef.current.textContent = displayVal;
            }
            if (modeRef.current) {
                modeRef.current.textContent = modeVal;
            }
            if (odoRef.current) {
                odoRef.current.textContent = odoVal;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [type, cfg]);

    const gradId = `svgGrad_${type}`;
    const bezelId = `svgBezel_${type}`;

    return (
        <div className={`single-vehicle-gauge gauge-${type}`}>
            <svg viewBox="0 0 240 240" className="single-gauge-svg">
                <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={cfg.accentColor} />
                        <stop offset="60%" stopColor={cfg.primaryColor} />
                        <stop offset="100%" stopColor={cfg.primaryColor} />
                    </linearGradient>

                    <linearGradient id={bezelId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="25%" stopColor="#cbd5e1" />
                        <stop offset="50%" stopColor="#f8fafc" />
                        <stop offset="75%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#e2e8f0" />
                    </linearGradient>

                    <radialGradient id={`face_${type}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="70%" stopColor="#f8fafc" />
                        <stop offset="100%" stopColor="#f1f5f9" />
                    </radialGradient>
                </defs>

                {/* Outer Platinum Rim */}
                <circle cx="120" cy="120" r="114" fill="#ffffff" stroke={`url(#${bezelId})`} strokeWidth="4.5" />
                <circle cx="120" cy="120" r="107" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.8" strokeDasharray="3 3" />

                {/* Precision Perimeter Bolts */}
                {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const bx = 120 + Math.cos(rad) * 105;
                    const by = 120 + Math.sin(rad) * 105;
                    return (
                        <g key={`bolt-${deg}`}>
                            <circle cx={bx} cy={by} r="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
                            <circle cx={bx} cy={by} r="1.3" fill="#475569" />
                        </g>
                    );
                })}

                {/* Dial Face */}
                <circle cx="120" cy="120" r="98" fill={`url(#face_${type})`} stroke={cfg.primaryColor} strokeWidth="1.5" strokeOpacity="0.4" />
                <circle cx="120" cy="120" r="88" fill="none" stroke={cfg.primaryColor} strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3 4" />

                {/* Gauge Background Track */}
                <path
                    d="M 52.45 159 A 78 78 0 1 1 187.55 159"
                    stroke={cfg.primaryColor}
                    strokeOpacity="0.14"
                    strokeWidth="9"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Live Animated LED Progress Arc */}
                <path
                    ref={arcRef}
                    d="M 52.45 159 A 78 78 0 1 1 187.55 159"
                    stroke={`url(#${gradId})`}
                    strokeWidth="9"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="326.7"
                    strokeDashoffset="326.7"
                    style={{ filter: `drop-shadow(0 2px 7px ${cfg.primaryColor}88)` }}
                />

                {/* Tick Marks & Numbers */}
                {cfg.ticks.map((val, idx) => {
                    const deg = -120 + (idx / (cfg.ticks.length - 1)) * 240;
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const isDanger = cfg.dangerIndex >= 0 && idx >= cfg.dangerIndex;
                    const x1 = 120 + Math.cos(rad) * 73;
                    const y1 = 120 + Math.sin(rad) * 73;
                    const x2 = 120 + Math.cos(rad) * 83;
                    const y2 = 120 + Math.sin(rad) * 83;
                    const lx = 120 + Math.cos(rad) * 60;
                    const ly = 120 + Math.sin(rad) * 60;

                    return (
                        <g key={`tick-${val}`}>
                            <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={isDanger ? '#dc2626' : (idx % 2 === 0 ? cfg.primaryColor : '#64748b')}
                                strokeWidth={idx % 2 === 0 ? '2.4' : '1.4'}
                            />
                            <text
                                x={lx}
                                y={ly + 3.5}
                                textAnchor="middle"
                                fill={isDanger ? '#dc2626' : cfg.textColor}
                                fontSize="9"
                                fontWeight="900"
                                fontFamily="system-ui, -apple-system, sans-serif"
                            >
                                {val}
                            </text>
                        </g>
                    );
                })}

                {/* Central Digital HUD Housing */}
                <rect
                    x="84"
                    y="130"
                    width="72"
                    height="32"
                    rx="7"
                    fill="#ffffff"
                    stroke={cfg.primaryColor}
                    strokeWidth="1.8"
                    style={{ filter: `drop-shadow(0 3px 10px ${cfg.primaryColor}33)` }}
                />
                <line x1="90" y1="131" x2="150" y2="131" stroke={cfg.primaryColor} strokeWidth="1" strokeLinecap="round" />

                {/* Hero Digital Metric */}
                <text
                    ref={digitalRef}
                    x="120"
                    y="151"
                    textAnchor="middle"
                    fill={cfg.textColor}
                    fontSize="16"
                    fontWeight="900"
                    fontFamily="'JetBrains Mono', 'Courier New', monospace"
                >
                    0
                </text>

                {/* Unit Label */}
                <text
                    x="120"
                    y="172"
                    textAnchor="middle"
                    fill={cfg.textColor}
                    fontSize="8.5"
                    fontWeight="900"
                    letterSpacing="1.2"
                >
                    {cfg.unit}
                </text>

                {/* Mode & Gear Status */}
                <text
                    ref={modeRef}
                    x="120"
                    y="184"
                    textAnchor="middle"
                    fill={cfg.primaryColor}
                    fontSize="7.5"
                    fontWeight="800"
                    letterSpacing="0.6"
                >
                    {cfg.modeDefault}
                </text>

                {/* Odometer Ribbon */}
                <text
                    ref={odoRef}
                    x="120"
                    y="195"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="6.8"
                    fontWeight="700"
                    letterSpacing="0.4"
                >
                    {cfg.odoDefault}
                </text>

                {/* Precision Needle Assembly */}
                <g ref={needleRef} style={{ transformOrigin: '120px 120px', transform: 'rotate(-120deg)' }}>
                    <line x1="120" y1="120" x2="120" y2="44" stroke="rgba(15, 23, 42, 0.2)" strokeWidth="4.5" strokeLinecap="round" transform="translate(2, 3)" />
                    <line x1="120" y1="120" x2="120" y2="42" stroke={cfg.needleColor} strokeWidth="3.6" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${cfg.needleColor}aa)` }} />
                    <line x1="120" y1="120" x2="120" y2="54" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="120" y1="120" x2="120" y2="136" stroke={cfg.primaryColor} strokeWidth="3" strokeLinecap="round" />
                    <circle cx="120" cy="120" r="13" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.4" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }} />
                    <circle cx="120" cy="120" r="8" fill={cfg.primaryColor} stroke="#ffffff" strokeWidth="1" />
                    <circle cx="120" cy="120" r="3.5" fill="#ffffff" />
                </g>

                {/* Optical Curved Glass Sheen */}
                <path d="M 46 85 Q 120 22 194 85 A 98 98 0 0 0 46 85 Z" fill="rgba(255, 255, 255, 0.65)" pointerEvents="none" />
            </svg>
        </div>
    );
};

export default SingleVehicleGauge;
