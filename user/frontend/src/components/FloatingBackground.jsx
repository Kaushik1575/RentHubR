import React, { useEffect, useRef } from 'react';
import './FloatingBackground.css';

// Meter Type Configurations for Distinct Automotive Instrument Clusters
const getMeterConfigs = (type) => {
    switch (type) {
        case 'bike':
            return {
                left: {
                    title: 'SPEEDOMETER',
                    unit: 'KM/H',
                    sub: 'ODO 18,420 KM',
                    ticks: [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220],
                    grad: 'neonSpeedoGrad',
                    face: 'dialLightSpeedoFace',
                    color: '#10b981',
                    textColor: '#064e3b',
                    dangerIndex: 9,
                    needleColor: '#10b981'
                },
                right: {
                    title: 'SUPERBIKE TACHO',
                    unit: 'RPM x1000',
                    sub: 'REDLINE 14k',
                    ticks: [0, 2, 4, 6, 8, 10, 12, 14],
                    grad: 'neonRpmGrad',
                    face: 'dialLightRpmFace',
                    color: '#f97316',
                    textColor: '#7c2d12',
                    dangerIndex: 5,
                    needleColor: '#ef4444'
                }
            };
        case 'scooty':
            return {
                left: {
                    title: 'ECO SPEEDOMETER',
                    unit: 'KM/H',
                    sub: 'ECO COMMUTE',
                    ticks: [0, 10, 20, 30, 40, 50, 60, 70, 80],
                    grad: 'neonEcoGrad',
                    face: 'dialLightEcoFace',
                    color: '#10b981',
                    textColor: '#047857',
                    dangerIndex: 7,
                    needleColor: '#10b981'
                },
                right: {
                    title: 'BATTERY SoC',
                    unit: 'EV BATTERY',
                    sub: 'RANGE 98 KM',
                    ticks: ['0%', '20%', '40%', '60%', '80%', '100%'],
                    grad: 'neonPowerGrad',
                    face: 'dialLightPowerFace',
                    color: '#06b6d4',
                    textColor: '#0e7490',
                    dangerIndex: -1,
                    needleColor: '#0891b2'
                }
            };
        case 'car':
            return {
                left: {
                    title: 'CRUISE SPEEDO',
                    unit: 'KM/H',
                    sub: 'HIGHWAY CRUISE',
                    ticks: [0, 30, 60, 90, 120, 150, 180, 210, 240],
                    grad: 'neonSpeedoGrad',
                    face: 'dialLightSpeedoFace',
                    color: '#3b82f6',
                    textColor: '#1d4ed8',
                    dangerIndex: 6,
                    needleColor: '#2563eb'
                },
                right: {
                    title: 'TURBO BOOST',
                    unit: 'BOOST BAR',
                    sub: 'TWIN-TURBO CHARGE',
                    ticks: ['-1.0', '-0.5', '0.0', '+0.5', '+1.0', '+1.5', '+2.0', '+2.5'],
                    grad: 'neonTurboGrad',
                    face: 'dialLightTurboFace',
                    color: '#0284c7',
                    textColor: '#0369a1',
                    dangerIndex: 6,
                    needleColor: '#0284c7'
                }
            };
        case 'turbo':
            return {
                left: {
                    title: 'TURBO BOOST',
                    unit: 'BOOST BAR',
                    sub: 'TWIN-TURBO CHARGE',
                    ticks: ['-1.0', '-0.5', '0.0', '+0.5', '+1.0', '+1.5', '+2.0', '+2.5'],
                    grad: 'neonTurboGrad',
                    face: 'dialLightTurboFace',
                    color: '#0284c7',
                    textColor: '#0369a1',
                    dangerIndex: 6,
                    needleColor: '#0284c7'
                },
                right: {
                    title: 'ECO REGEN',
                    unit: 'ECO REGEN',
                    sub: 'KINETIC HARVEST',
                    ticks: [0, 20, 40, 60, 80, 100],
                    grad: 'neonEcoGrad',
                    face: 'dialLightEcoFace',
                    color: '#10b981',
                    textColor: '#047857',
                    dangerIndex: -1,
                    needleColor: '#10b981'
                }
            };
        case 'telemetry':
            return {
                left: {
                    title: 'LEAN ANGLE',
                    unit: 'LEAN ANGLE',
                    sub: 'CORNERING APEX',
                    ticks: ['-45°', '-30°', '-15°', '0°', '+15°', '+30°', '+45°'],
                    grad: 'neonTelemetryGrad',
                    face: 'dialLightTelemetryFace',
                    color: '#8b5cf6',
                    textColor: '#6d28d9',
                    dangerIndex: 5,
                    needleColor: '#8b5cf6'
                },
                right: {
                    title: 'TIRE PRESSURE',
                    unit: 'PSI TPMS',
                    sub: 'FRONT 33 • REAR 36',
                    ticks: [20, 25, 30, 35, 40, 45, 50],
                    grad: 'neonTpmsGrad',
                    face: 'dialLightTpmsFace',
                    color: '#f59e0b',
                    textColor: '#b45309',
                    dangerIndex: 5,
                    needleColor: '#ea580c'
                }
            };
        case 'thermal':
            return {
                left: {
                    title: 'COOLANT TEMP',
                    unit: 'COOLANT',
                    sub: 'OPTIMAL TEMP 90°C',
                    ticks: ['40°', '60°', '80°', '100°', '120°'],
                    grad: 'neonCoolantGrad',
                    face: 'dialLightCoolantFace',
                    color: '#06b6d4',
                    textColor: '#0e7490',
                    dangerIndex: 4,
                    needleColor: '#0891b2'
                },
                right: {
                    title: 'OIL PRESSURE',
                    unit: 'OIL BAR',
                    sub: '14.2V CHARGING',
                    ticks: [0, 2, 4, 6, 8, 10],
                    grad: 'neonOilGrad',
                    face: 'dialLightOilFace',
                    color: '#d97706',
                    textColor: '#92400e',
                    dangerIndex: -1,
                    needleColor: '#f59e0b'
                }
            };
        case 'power':
            return {
                left: {
                    title: 'BATTERY SoC',
                    unit: 'EV BATTERY',
                    sub: 'RANGE 420 KM',
                    ticks: ['0%', '20%', '40%', '60%', '80%', '100%'],
                    grad: 'neonSpeedoGrad',
                    face: 'dialLightSpeedoFace',
                    color: '#10b981',
                    textColor: '#047857',
                    dangerIndex: -1,
                    needleColor: '#10b981'
                },
                right: {
                    title: 'MOTOR POWER',
                    unit: 'POWER OUT',
                    sub: 'TORQUE 320 Nm',
                    ticks: ['0', '30', '60', '90', '120', '150'],
                    grad: 'neonPowerGrad',
                    face: 'dialLightPowerFace',
                    color: '#6366f1',
                    textColor: '#4338ca',
                    dangerIndex: 4,
                    needleColor: '#4f46e5'
                }
            };
        case 'compass':
            return {
                left: {
                    title: 'GYRO HEADING',
                    unit: 'HEADING NE',
                    sub: 'WAYPOINT LOCK',
                    ticks: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
                    grad: 'neonCompassGrad',
                    face: 'dialLightCompassFace',
                    color: '#0284c7',
                    textColor: '#0369a1',
                    dangerIndex: -1,
                    needleColor: '#ef4444'
                },
                right: {
                    title: 'ALTIMETER',
                    unit: 'ALTITUDE',
                    sub: 'MOUNTAIN PASS',
                    ticks: ['0', '500', '1k', '1.5k', '2k', '2.5k', '3k'],
                    grad: 'neonAltGrad',
                    face: 'dialLightAltFace',
                    color: '#10b981',
                    textColor: '#047857',
                    dangerIndex: -1,
                    needleColor: '#10b981'
                }
            };
        case 'none':
            return null;
        case 'speedo':
        default:
            return {
                left: {
                    title: 'SPEEDOMETER',
                    unit: 'KM/H',
                    sub: 'ODO 48,924 KM',
                    ticks: [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220],
                    grad: 'neonSpeedoGrad',
                    face: 'dialLightSpeedoFace',
                    color: '#10b981',
                    textColor: '#064e3b',
                    dangerIndex: 9,
                    needleColor: '#10b981'
                },
                right: {
                    title: 'TACHOMETER',
                    unit: 'GEAR 1',
                    sub: 'FUEL 100% • 12.8V',
                    ticks: [0, 2, 4, 6, 8, 10, 12],
                    grad: 'neonRpmGrad',
                    face: 'dialLightRpmFace',
                    color: '#f59e0b',
                    textColor: '#78350f',
                    dangerIndex: 5,
                    needleColor: '#ef4444'
                }
            };
    }
};

const FloatingBackground = ({ density = 18, meterType = 'speedo', enableRipples = true }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // DOM Refs for 60 FPS zero-overhead speedometer animation
    const leftNeedleRef = useRef(null);
    const leftArcRef = useRef(null);
    const leftDigitalRef = useRef(null);

    const rightNeedleRef = useRef(null);
    const rightArcRef = useRef(null);
    const rightDigitalRef = useRef(null);
    const rightGearRef = useRef(null);

    const configs = getMeterConfigs(meterType);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId;
        const parent = container?.parentElement || document.body;
        let width = (canvas.width = parent.offsetWidth || window.innerWidth);
        let height = (canvas.height = parent.offsetHeight || 800);

        const updateDimensions = () => {
            if (!canvas) return;
            const p = container?.parentElement || document.body;
            const newW = p.offsetWidth || window.innerWidth;
            const newH = p.offsetHeight || 800;
            if (newW > 0 && newH > 0) {
                width = canvas.width = newW;
                height = canvas.height = newH;
            }
        };

        window.addEventListener('resize', updateDimensions);
        const timerId = setTimeout(updateDimensions, 150);

        // Mouse Spotlight Tracking
        const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, radius: 160 };
        const handleMouseMove = (e) => {
            if (!container) return;
            const rect = container.getBoundingClientRect();
            mouse.targetX = e.clientX - rect.left;
            mouse.targetY = e.clientY - rect.top;

            container.style.setProperty('--mouse-x', `${mouse.targetX}px`);
            container.style.setProperty('--mouse-y', `${mouse.targetY}px`);
        };

        const shouldDisableRipples = !enableRipples || meterType === 'bike' || meterType === 'scooty' || meterType === 'car';

        // Continuous Ambient & Interactive Concentric Ripple Wave System
        const rippleRings = [];

        const spawnConcentricRipples = (x, y, count = 5, maxR = 250, baseColor = '16, 185, 129') => {
            if (shouldDisableRipples) return; // Prevent ripples when disabled
            for (let r = 0; r < count; r++) {
                rippleRings.push({
                    x,
                    y,
                    radius: 8,
                    delay: r * 15, // Stagger rings so they radiate out in 5 concentric circles
                    currentAge: 0,
                    speed: 2.2,
                    maxRadius: maxR + (r * 25),
                    peakAlpha: 0.65,
                    color: baseColor
                });
            }
        };

        // Interactive Click Ripple: spawns an energetic burst of 5 concentric rings
        const handleClick = (e) => {
            if (shouldDisableRipples) return;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            if (sx >= -80 && sx <= width + 80 && sy >= -80 && sy <= height + 80) {
                spawnConcentricRipples(sx, sy, 5, 240, '16, 185, 129');
            }
        };

        let autoRippleTimer = 0;
        let ambientBeaconIndex = 0;

        // Seed initial ripples for sections with ripples enabled
        if (!shouldDisableRipples) {
            spawnConcentricRipples(width * 0.22, height * 0.42, 5, 230, '16, 185, 129');
            spawnConcentricRipples(width * 0.78, height * 0.58, 5, 230, '6, 182, 212');
        }

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('click', handleClick);

        // Chit Colors
        const chitColors = [
            { front: '#ffffff', back: '#f0fdf4', border: '#10b981' },
            { front: '#ffffff', back: '#eff6ff', border: '#3b82f6' },
            { front: '#ffffff', back: '#fefce8', border: '#eab308' },
            { front: '#ffffff', back: '#fff7ed', border: '#f97316' },
            { front: '#ffffff', back: '#faf5ff', border: '#a855f7' }
        ];

        // Falling / Tumbling Hologram Chits
        const chits = [];
        for (let i = 0; i < density; i++) {
            const colorSet = chitColors[Math.floor(Math.random() * chitColors.length)];
            chits.push({
                x: Math.random() * width,
                y: Math.random() * height,
                z: 0.6 + Math.random() * 0.8,
                w: 20 + Math.random() * 12,
                h: 13 + Math.random() * 7,
                vx: (Math.random() - 0.5) * 0.35,
                vy: -(0.3 + Math.random() * 0.45),
                angle: Math.random() * Math.PI * 2,
                vAngle: (Math.random() - 0.5) * 0.015,
                flipX: Math.random() * Math.PI * 2,
                vFlipX: 0.012 + Math.random() * 0.02,
                flipY: Math.random() * Math.PI * 2,
                vFlipY: 0.008 + Math.random() * 0.015,
                colors: colorSet
            });
        }

        // Constellation Nodes
        const nodes = [];
        for (let i = 0; i < 8; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.3,
                radius: 2 + Math.random() * 1.8,
                color: i % 2 === 0 ? '#10b981' : '#f59e0b'
            });
        }

        // Cinematic Embers
        const embers = [];
        for (let i = 0; i < 14; i++) {
            embers.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 1.4 + Math.random() * 1.8,
                vy: -(0.35 + Math.random() * 0.45),
                vx: (Math.random() - 0.5) * 0.25,
                opacity: 0.3 + Math.random() * 0.4,
                pulse: Math.random() * Math.PI * 2,
                vPulse: 0.03 + Math.random() * 0.04
            });
        }

        // Physics acceleration loop tracking
        let lastTime = performance.now();
        let simTime = 0;

        // Main 60 FPS Animation & Engine Loop
        const render = () => {
            ctx.clearRect(0, 0, width, height);

            mouse.x += (mouse.targetX - mouse.x) * 0.12;
            mouse.y += (mouse.targetY - mouse.y) * 0.12;

            const now = performance.now();
            const dt = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;
            simTime += dt;

            // 8.8s 3-Gear Acceleration & Coast Cycle
            const loopT = simTime % 8.8;
            let speed = 0;
            let rpm = 1.2;
            let gear = '1';

            if (loopT < 1.8) {
                const p = loopT / 1.8;
                const ease = Math.pow(p, 1.35);
                speed = ease * 58;
                rpm = 1.2 + Math.pow(p, 1.15) * 7.3;
                gear = '1';
            } else if (loopT < 2.2) {
                const p = (loopT - 1.8) / 0.4;
                speed = 58 + p * 3;
                rpm = 8.5 - p * 3.5;
                gear = '2';
            } else if (loopT < 4.0) {
                const p = (loopT - 2.2) / 1.8;
                const ease = Math.pow(p, 1.2);
                speed = 61 + ease * 61;
                rpm = 5.0 + ease * 4.8;
                gear = '2';
            } else if (loopT < 4.4) {
                const p = (loopT - 4.0) / 0.4;
                speed = 122 + p * 3;
                rpm = 9.8 - p * 3.6;
                gear = '3';
            } else if (loopT < 6.5) {
                const p = (loopT - 4.4) / 2.1;
                const ease = Math.pow(p, 1.1);
                speed = 125 + ease * 90;
                rpm = 6.2 + ease * 5.4;
                gear = '3';
            } else {
                const p = (loopT - 6.5) / 2.3;
                const ease = Math.pow(1 - p, 2.2);
                speed = ease * 215;
                rpm = 1.2 + ease * 10.4;
                gear = p > 0.8 ? 'N' : '2';
            }

            speed = Math.max(0, Math.min(220, speed));
            rpm = Math.max(0, Math.min(12, rpm));

            // Compute dynamic values per meterType
            if (configs) {
                let leftRatio = 0, leftDisplay = '', rightRatio = 0, rightDisplay = '', rightGearText = '';

                switch (meterType) {
                    case 'bike':
                        leftRatio = speed / 220;
                        leftDisplay = `${Math.round(speed)}`;
                        rightRatio = rpm / 14;
                        rightDisplay = `${rpm.toFixed(1)}k`;
                        rightGearText = `GEAR ${gear}`;
                        break;
                    case 'scooty': {
                        const sSpeed = 10 + (speed / 220) * 60;
                        leftRatio = Math.max(0, Math.min(1, sSpeed / 80));
                        leftDisplay = `${Math.round(sSpeed)}`;
                        const bat = 96 - ((simTime % 15) * 0.25);
                        rightRatio = Math.max(0, Math.min(1, bat / 100));
                        rightDisplay = `${Math.round(bat)}%`;
                        rightGearText = 'ECO REGEN';
                        break;
                    }
                    case 'car': {
                        const carSpd = speed * 1.05;
                        leftRatio = Math.max(0, Math.min(1, carSpd / 240));
                        leftDisplay = `${Math.round(carSpd)}`;
                        const boost = -0.4 + (rpm / 12) * 2.4;
                        rightRatio = Math.max(0, Math.min(1, (boost + 1.0) / 3.5));
                        rightDisplay = `${boost > 0 ? '+' : ''}${boost.toFixed(1)}`;
                        rightGearText = carSpd > 100 ? 'CRUISE 120' : 'DRIVE AUTO';
                        break;
                    }
                    case 'turbo':
                        leftRatio = Math.max(0, Math.min(1, ((-0.4 + (rpm / 12) * 2.4) + 1.0) / 3.5));
                        leftDisplay = `${(-0.4 + (rpm / 12) * 2.4) > 0 ? '+' : ''}${(-0.4 + (rpm / 12) * 2.4).toFixed(1)}`;
                        rightRatio = Math.max(0, Math.min(1, (45 + Math.sin(loopT * 1.5) * 35) / 100));
                        rightDisplay = `${Math.round(45 + Math.sin(loopT * 1.5) * 35)}%`;
                        rightGearText = 'ECO REGEN';
                        break;
                    case 'telemetry':
                        leftRatio = Math.max(0, Math.min(1, (Math.sin(loopT * 1.2) * 42 + 45) / 90));
                        leftDisplay = `${Math.abs(Math.round(Math.sin(loopT * 1.2) * 42))}° ${Math.sin(loopT * 1.2) < 0 ? 'L' : 'R'}`;
                        rightRatio = Math.max(0, Math.min(1, ((33.2 + (speed / 220) * 2.8) - 20) / 30));
                        rightDisplay = `${(33.2 + (speed / 220) * 2.8).toFixed(1)}`;
                        rightGearText = 'PSI TPMS';
                        break;
                    case 'thermal':
                        leftRatio = Math.max(0, Math.min(1, ((84 + (rpm / 12) * 14) - 40) / 80));
                        leftDisplay = `${Math.round(84 + (rpm / 12) * 14)}°C`;
                        rightRatio = Math.max(0, Math.min(1, (2.8 + (rpm / 12) * 4.2) / 10));
                        rightDisplay = `${(2.8 + (rpm / 12) * 4.2).toFixed(1)}`;
                        rightGearText = 'OIL BAR';
                        break;
                    case 'power':
                        leftRatio = Math.max(0, Math.min(1, (96 - ((simTime % 10) * 0.3)) / 100));
                        leftDisplay = `${Math.round(96 - ((simTime % 10) * 0.3))}%`;
                        rightRatio = Math.max(0, Math.min(1, (12 + (speed / 220) * 118) / 150));
                        rightDisplay = `${Math.round(12 + (speed / 220) * 118)} kW`;
                        rightGearText = 'POWER OUT';
                        break;
                    case 'compass':
                        leftRatio = Math.max(0, Math.min(1, (((45 + Math.sin(loopT * 0.8) * 35) + 360) % 360) / 360));
                        leftDisplay = `${Math.round(((45 + Math.sin(loopT * 0.8) * 35) + 360) % 360).toString().padStart(3, '0')}°`;
                        rightRatio = Math.max(0, Math.min(1, (1250 + Math.sin(loopT * 0.5) * 320) / 3000));
                        rightDisplay = `${Math.round(1250 + Math.sin(loopT * 0.5) * 320)} M`;
                        rightGearText = 'ALTITUDE';
                        break;
                    case 'speedo':
                    default:
                        leftRatio = speed / 220;
                        leftDisplay = `${Math.round(speed)}`;
                        rightRatio = rpm / 12;
                        rightDisplay = `${rpm.toFixed(1)}k`;
                        rightGearText = `GEAR ${gear}`;
                        break;
                }

                // Update Left Needle & Arc
                if (leftNeedleRef.current) {
                    const angle = -120 + leftRatio * 240;
                    leftNeedleRef.current.style.transform = `rotate(${angle}deg)`;
                    if (leftArcRef.current) {
                        leftArcRef.current.style.strokeDashoffset = `${326.7 * (1 - leftRatio)}`;
                    }
                    if (leftDigitalRef.current) {
                        leftDigitalRef.current.textContent = leftDisplay;
                    }
                }

                // Update Right Needle & Arc
                if (rightNeedleRef.current) {
                    const angle = -120 + rightRatio * 240;
                    rightNeedleRef.current.style.transform = `rotate(${angle}deg)`;
                    if (rightArcRef.current) {
                        rightArcRef.current.style.strokeDashoffset = `${326.7 * (1 - rightRatio)}`;
                    }
                    if (rightDigitalRef.current) {
                        rightDigitalRef.current.textContent = rightDisplay;
                    }
                    if (rightGearRef.current) {
                        rightGearRef.current.textContent = rightGearText;
                    }
                }
            }

            // Auto-emit continuous concentric ripples by default in background across other sections (disabled when ripples are disabled)
            if (!shouldDisableRipples) {
                autoRippleTimer++;
                if (autoRippleTimer >= 85) { // Periodic pulse every ~1.4 seconds
                    autoRippleTimer = 0;
                    const beaconLocations = [
                        { x: width * 0.18, y: height * 0.40, color: '16, 185, 129' },
                        { x: width * 0.82, y: height * 0.60, color: '6, 182, 212' },
                        { x: width * 0.50, y: height * 0.48, color: '16, 185, 129' },
                        { x: width * 0.28, y: height * 0.72, color: '16, 185, 129' },
                        { x: width * 0.74, y: height * 0.26, color: '6, 182, 212' }
                    ];
                    const target = beaconLocations[ambientBeaconIndex % beaconLocations.length];
                    const driftX = (Math.random() - 0.5) * (width * 0.08);
                    const driftY = (Math.random() - 0.5) * (height * 0.08);

                    spawnConcentricRipples(
                        Math.max(50, Math.min(width - 50, target.x + driftX)),
                        Math.max(50, Math.min(height - 50, target.y + driftY)),
                        5, // 5 concentric rings (exactly matching the user screenshot)
                        240 + Math.random() * 60,
                        target.color
                    );
                    ambientBeaconIndex++;
                }
            }

            // Draw Continuous & Interactive Concentric Ripples
            for (let i = rippleRings.length - 1; i >= 0; i--) {
                const ring = rippleRings[i];
                ring.currentAge++;

                // Wait for staggered concentric delay
                if (ring.currentAge < ring.delay) continue;

                ring.radius += ring.speed;
                const progress = ring.radius / ring.maxRadius;
                const currentAlpha = Math.max(0, (1 - progress) * ring.peakAlpha);

                if (currentAlpha > 0.01 && ring.radius <= ring.maxRadius) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${ring.color}, ${currentAlpha})`;
                    ctx.lineWidth = 1.6;
                    ctx.stroke();

                    // Subtle soft outer glow
                    ctx.beginPath();
                    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${ring.color}, ${currentAlpha * 0.28})`;
                    ctx.lineWidth = 3.2;
                    ctx.stroke();

                    // Center pulse core blip when rings are young
                    if (ring.radius < 45) {
                        ctx.beginPath();
                        ctx.arc(ring.x, ring.y, Math.max(1, 3.5 * (1 - ring.radius / 45)), 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${ring.color}, ${currentAlpha * 0.75})`;
                        ctx.fill();
                    }
                    ctx.restore();
                } else if (ring.radius > ring.maxRadius || currentAlpha <= 0.01) {
                    rippleRings.splice(i, 1);
                }
            }

            // Draw Constellation Nodes & Connecting Lines
            ctx.lineWidth = 0.8;
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0) n.x = width;
                if (n.x > width) n.x = 0;
                if (n.y < 0) n.y = height;
                if (n.y > height) n.y = 0;

                for (let j = i + 1; j < nodes.length; j++) {
                    const n2 = nodes[j];
                    const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - dist / 130) * 0.16})`;
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(n2.x, n2.y);
                        ctx.stroke();
                    }
                }

                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
                ctx.fillStyle = n.color;
                ctx.fill();
            }

            // Draw Cinematic Embers
            embers.forEach((em) => {
                em.y += em.vy;
                em.x += em.vx;
                em.pulse += em.vPulse;
                if (em.y < 0) { em.y = height + 10; em.x = Math.random() * width; }
                if (em.x < 0) em.x = width;
                if (em.x > width) em.x = 0;

                const currentOpacity = em.opacity * (0.6 + 0.4 * Math.sin(em.pulse));
                ctx.beginPath();
                ctx.arc(em.x, em.y, em.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(245, 158, 11, ${currentOpacity})`;
                ctx.shadowColor = '#f59e0b';
                ctx.shadowBlur = 4;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // Draw Falling Chits
            chits.forEach((c) => {
                c.y += c.vy;
                c.x += c.vx;
                c.angle += c.vAngle;
                c.flipX += c.vFlipX;
                c.flipY += c.vFlipY;

                if (c.y < -40) {
                    c.y = height + 40;
                    c.x = Math.random() * width;
                }
                if (c.x < -40) c.x = width + 40;
                if (c.x > width + 40) c.x = -40;

                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(c.angle);

                const cosX = Math.cos(c.flipX);
                const cosY = Math.cos(c.flipY);
                const scaleX = cosX * c.z;
                const scaleY = cosY * c.z;
                const isFront = cosX * cosY > 0;

                ctx.scale(scaleX, scaleY);
                ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
                ctx.shadowBlur = 8 * c.z;
                ctx.shadowOffsetX = -cosX * 4;
                ctx.shadowOffsetY = 5 * c.z;

                const w = c.w;
                const h = c.h;
                const paperGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
                if (isFront) {
                    paperGrad.addColorStop(0, '#ffffff');
                    paperGrad.addColorStop(0.6, c.colors.front);
                    paperGrad.addColorStop(1, '#e2e8f0');
                } else {
                    paperGrad.addColorStop(0, c.colors.back);
                    paperGrad.addColorStop(1, '#cbd5e1');
                }

                ctx.fillStyle = paperGrad;
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(-w / 2, -h / 2, w, h, 3);
                } else {
                    ctx.rect(-w / 2, -h / 2, w, h);
                }
                ctx.fill();

                ctx.shadowColor = 'transparent';
                ctx.strokeStyle = c.colors.border;
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            clearTimeout(timerId);
            window.removeEventListener('resize', updateDimensions);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            cancelAnimationFrame(animationFrameId);
        };
    }, [density, meterType, enableRipples]);

    return (
        <div ref={containerRef} className="floating-bg-layer" aria-hidden="true">
            {/* Interactive Mouse Flashlight Spotlight */}
            <div className="floating-mouse-spotlight"></div>

            {/* Matrix Blueprint Grid */}
            <div className="floating-bg-grid"></div>

            {/* Ambient Blurred Glow Pods */}
            <div className="floating-ambient-glow glow-emerald-top"></div>
            <div className="floating-ambient-glow glow-amber-bottom"></div>

            {/* SVG Filter & Gradient Definitions */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <defs>
                    {/* Dial Face Gradients */}
                    <radialGradient id="dialLightSpeedoFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#ecfdf5" />
                        <stop offset="100%" stopColor="#d1fae5" />
                    </radialGradient>

                    <radialGradient id="dialLightRpmFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#fffbeb" />
                        <stop offset="100%" stopColor="#fef3c7" />
                    </radialGradient>

                    <radialGradient id="dialLightTurboFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#f0f9ff" />
                        <stop offset="100%" stopColor="#e0f2fe" />
                    </radialGradient>

                    <radialGradient id="dialLightEcoFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#f7fee7" />
                        <stop offset="100%" stopColor="#ecfccb" />
                    </radialGradient>

                    <radialGradient id="dialLightTelemetryFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#faf5ff" />
                        <stop offset="100%" stopColor="#f3e8ff" />
                    </radialGradient>

                    <radialGradient id="dialLightTpmsFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#fff7ed" />
                        <stop offset="100%" stopColor="#ffedd5" />
                    </radialGradient>

                    <radialGradient id="dialLightCoolantFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#ecfeff" />
                        <stop offset="100%" stopColor="#cffafe" />
                    </radialGradient>

                    <radialGradient id="dialLightOilFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#fefce8" />
                        <stop offset="100%" stopColor="#fef9c3" />
                    </radialGradient>

                    <radialGradient id="dialLightPowerFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#eef2ff" />
                        <stop offset="100%" stopColor="#e0e7ff" />
                    </radialGradient>

                    <radialGradient id="dialLightCompassFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#f0fdf4" />
                        <stop offset="100%" stopColor="#dcfce7" />
                    </radialGradient>

                    <radialGradient id="dialLightAltFace" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="68%" stopColor="#f8fafc" />
                        <stop offset="92%" stopColor="#f0fdfa" />
                        <stop offset="100%" stopColor="#ccfbf1" />
                    </radialGradient>

                    {/* Machined Platinum & Brushed Chrome Bezel */}
                    <linearGradient id="bezelChromeLight" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="18%" stopColor="#cbd5e1" />
                        <stop offset="42%" stopColor="#f8fafc" />
                        <stop offset="65%" stopColor="#94a3b8" />
                        <stop offset="85%" stopColor="#e2e8f0" />
                        <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>

                    {/* Optical Glass Sheen */}
                    <linearGradient id="glassSheenLight" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
                        <stop offset="45%" stopColor="rgba(255, 255, 255, 0.25)" />
                        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </linearGradient>

                    {/* Live Neon Progress Arc Gradients */}
                    <linearGradient id="neonSpeedoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                    </linearGradient>

                    <linearGradient id="neonRpmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="70%" stopColor="#ea580c" />
                        <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>

                    <linearGradient id="neonTurboGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="60%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#0369a1" />
                    </linearGradient>

                    <linearGradient id="neonEcoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a3e635" />
                        <stop offset="60%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                    </linearGradient>

                    <linearGradient id="neonTelemetryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="60%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6d28d9" />
                    </linearGradient>

                    <linearGradient id="neonTpmsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="60%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>

                    <linearGradient id="neonCoolantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="60%" stopColor="#0891b2" />
                        <stop offset="100%" stopColor="#0e7490" />
                    </linearGradient>

                    <linearGradient id="neonOilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="60%" stopColor="#d97706" />
                        <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>

                    <linearGradient id="neonPowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="60%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#4338ca" />
                    </linearGradient>

                    <linearGradient id="neonCompassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="60%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>

                    <linearGradient id="neonAltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2dd4bf" />
                        <stop offset="60%" stopColor="#0d9488" />
                        <stop offset="100%" stopColor="#047857" />
                    </linearGradient>

                </defs>
            </svg>

            {/* =========================================================
                RENDER THE TWIN GAUGES FOR CURRENT METER TYPE
                ========================================================= */}
            {configs && (
                <>
                    {/* LEFT GAUGE */}
                    <div className="twin-speedometer twin-speedometer-left">
                        <svg viewBox="0 0 240 240" width="100%" height="100%">
                            <circle cx="120" cy="120" r="114" fill="#ffffff" stroke="url(#bezelChromeLight)" strokeWidth="4" />
                            <circle cx="120" cy="120" r="107" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3 3" />

                            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                                const rad = (deg * Math.PI) / 180;
                                const bx = 120 + Math.cos(rad) * 105;
                                const by = 120 + Math.sin(rad) * 105;
                                return (
                                    <g key={`bolt-l-${deg}`}>
                                        <circle cx={bx} cy={by} r="3.2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
                                        <circle cx={bx} cy={by} r="1.4" fill="#475569" />
                                    </g>
                                );
                            })}

                            <circle cx="120" cy="120" r="98" fill={`url(#${configs.left.face})`} stroke={configs.left.color} strokeWidth="1.6" strokeOpacity="0.45" />
                            <circle cx="120" cy="120" r="88" fill="none" stroke={configs.left.color} strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3 4" />
                            <circle cx="120" cy="120" r="54" fill="none" stroke={configs.left.color} strokeOpacity="0.12" strokeWidth="0.8" />

                            <path
                                d="M 52.45 159 A 78 78 0 1 1 187.55 159"
                                stroke={configs.left.color}
                                strokeOpacity="0.16"
                                strokeWidth="9"
                                fill="none"
                                strokeLinecap="round"
                            />

                            <path
                                ref={leftArcRef}
                                d="M 52.45 159 A 78 78 0 1 1 187.55 159"
                                stroke={`url(#${configs.left.grad})`}
                                strokeWidth="9"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray="326.7"
                                strokeDashoffset="326.7"
                                style={{ filter: `drop-shadow(0 2px 8px ${configs.left.color}88)`, transition: 'stroke-dashoffset 0.04s linear' }}
                            />

                            {configs.left.ticks.map((val, idx) => {
                                const deg = -120 + (idx / (configs.left.ticks.length - 1)) * 240;
                                const rad = ((deg - 90) * Math.PI) / 180;
                                const isDanger = configs.left.dangerIndex >= 0 && idx >= configs.left.dangerIndex;
                                const x1 = 120 + Math.cos(rad) * 73;
                                const y1 = 120 + Math.sin(rad) * 73;
                                const x2 = 120 + Math.cos(rad) * 83;
                                const y2 = 120 + Math.sin(rad) * 83;
                                const lx = 120 + Math.cos(rad) * 60;
                                const ly = 120 + Math.sin(rad) * 60;

                                return (
                                    <g key={`tl-${val}`}>
                                        <line 
                                            x1={x1} 
                                            y1={y1} 
                                            x2={x2} 
                                            y2={y2} 
                                            stroke={isDanger ? '#dc2626' : (idx % 2 === 0 ? configs.left.color : configs.left.textColor)} 
                                            strokeWidth={idx % 2 === 0 ? '2.4' : '1.4'} 
                                        />
                                        <text 
                                            x={lx} 
                                            y={ly + 3.5} 
                                            textAnchor="middle" 
                                            fill={isDanger ? '#dc2626' : configs.left.textColor} 
                                            fontSize="9.5" 
                                            fontWeight="900" 
                                            fontFamily="system-ui, -apple-system, sans-serif"
                                        >
                                            {val}
                                        </text>
                                    </g>
                                );
                            })}

                            <rect 
                                x="84" 
                                y="130" 
                                width="72" 
                                height="29" 
                                rx="8" 
                                fill="#ffffff" 
                                stroke={configs.left.color} 
                                strokeWidth="1.8" 
                                style={{ filter: `drop-shadow(0 4px 12px ${configs.left.color}33)` }} 
                            />
                            <line x1="90" y1="131" x2="150" y2="131" stroke={configs.left.color} strokeWidth="1" strokeLinecap="round" />
                            <text 
                                ref={leftDigitalRef} 
                                x="120" 
                                y="151" 
                                textAnchor="middle" 
                                fill={configs.left.textColor} 
                                fontSize="17" 
                                fontWeight="900" 
                                fontFamily="'Courier New', monospace"
                            >
                                0
                            </text>
                            <text x="120" y="174" textAnchor="middle" fill={configs.left.textColor} fontSize="9.5" fontWeight="900" letterSpacing="1.6">
                                {configs.left.unit}
                            </text>
                            <rect 
                                x="60" 
                                y="179" 
                                width="120" 
                                height="15" 
                                rx="4" 
                                fill="#090d16" 
                                stroke={configs.left.color} 
                                strokeWidth="0.8" 
                                strokeOpacity="0.4" 
                            />
                            <text 
                                x="120" 
                                y="190" 
                                textAnchor="middle" 
                                fill={configs.left.color} 
                                fontSize="7.8" 
                                fontWeight="900" 
                                letterSpacing="0.8" 
                                fontFamily="'Courier New', monospace"
                            >
                                {configs.left.sub}
                            </text>

                            <g ref={leftNeedleRef} style={{ transformOrigin: '120px 120px', transform: 'rotate(-120deg)' }}>
                                <line x1="120" y1="120" x2="120" y2="44" stroke="rgba(15, 23, 42, 0.25)" strokeWidth="4.5" strokeLinecap="round" transform="translate(2, 4)" />
                                <line x1="120" y1="120" x2="120" y2="42" stroke={configs.left.needleColor} strokeWidth="3.8" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${configs.left.needleColor}99)` }} />
                                <line x1="120" y1="120" x2="120" y2="54" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                                <line x1="120" y1="120" x2="120" y2="136" stroke={configs.left.color} strokeWidth="3.2" strokeLinecap="round" />
                                <circle cx="120" cy="120" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }} />
                                <circle cx="120" cy="120" r="9" fill={configs.left.color} stroke="#ffffff" strokeWidth="1" />
                                <circle cx="120" cy="120" r="4" fill="#ffffff" />
                            </g>

                            <path d="M 46 85 Q 120 22 194 85 A 98 98 0 0 0 46 85 Z" fill="url(#glassSheenLight)" opacity="0.65" pointerEvents="none" />
                        </svg>
                    </div>

                    {/* RIGHT GAUGE */}
                    <div className="twin-speedometer twin-speedometer-right">
                        <svg viewBox="0 0 240 240" width="100%" height="100%">
                            <circle cx="120" cy="120" r="114" fill="#ffffff" stroke="url(#bezelChromeLight)" strokeWidth="4" />
                            <circle cx="120" cy="120" r="107" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3 3" />

                            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                                const rad = (deg * Math.PI) / 180;
                                const bx = 120 + Math.cos(rad) * 105;
                                const by = 120 + Math.sin(rad) * 105;
                                return (
                                    <g key={`bolt-r-${deg}`}>
                                        <circle cx={bx} cy={by} r="3.2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
                                        <circle cx={bx} cy={by} r="1.4" fill="#475569" />
                                    </g>
                                );
                            })}

                            <circle cx="120" cy="120" r="98" fill={`url(#${configs.right.face})`} stroke={configs.right.color} strokeWidth="1.6" strokeOpacity="0.45" />
                            <circle cx="120" cy="120" r="88" fill="none" stroke={configs.right.color} strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3 4" />
                            <circle cx="120" cy="120" r="54" fill="none" stroke={configs.right.color} strokeOpacity="0.12" strokeWidth="0.8" />

                            <path
                                d="M 52.45 159 A 78 78 0 1 1 187.55 159"
                                stroke={configs.right.color}
                                strokeOpacity="0.16"
                                strokeWidth="9"
                                fill="none"
                                strokeLinecap="round"
                            />

                            {configs.right.dangerIndex >= 0 && (
                                <path
                                    d="M 159 52.45 A 78 78 0 0 1 187.55 159"
                                    stroke="rgba(239, 68, 68, 0.22)"
                                    strokeWidth="11"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                            )}

                            <path
                                ref={rightArcRef}
                                d="M 52.45 159 A 78 78 0 1 1 187.55 159"
                                stroke={`url(#${configs.right.grad})`}
                                strokeWidth="9"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray="326.7"
                                strokeDashoffset="326.7"
                                style={{ filter: `drop-shadow(0 2px 8px ${configs.right.color}88)`, transition: 'stroke-dashoffset 0.04s linear' }}
                            />

                            {configs.right.ticks.map((val, idx) => {
                                const deg = -120 + (idx / (configs.right.ticks.length - 1)) * 240;
                                const rad = ((deg - 90) * Math.PI) / 180;
                                const isDanger = configs.right.dangerIndex >= 0 && idx >= configs.right.dangerIndex;
                                const x1 = 120 + Math.cos(rad) * 73;
                                const y1 = 120 + Math.sin(rad) * 73;
                                const x2 = 120 + Math.cos(rad) * 83;
                                const y2 = 120 + Math.sin(rad) * 83;
                                const lx = 120 + Math.cos(rad) * 60;
                                const ly = 120 + Math.sin(rad) * 60;

                                return (
                                    <g key={`tr-${val}`}>
                                        <line 
                                            x1={x1} 
                                            y1={y1} 
                                            x2={x2} 
                                            y2={y2} 
                                            stroke={isDanger ? '#dc2626' : configs.right.color} 
                                            strokeWidth={isDanger ? '2.6' : '2.2'} 
                                        />
                                        <text 
                                            x={lx} 
                                            y={ly + 3.5} 
                                            textAnchor="middle" 
                                            fill={isDanger ? '#dc2626' : configs.right.textColor} 
                                            fontSize="10" 
                                            fontWeight="900" 
                                            fontFamily="system-ui, -apple-system, sans-serif"
                                        >
                                            {val}
                                        </text>
                                    </g>
                                );
                            })}

                            <rect 
                                x="84" 
                                y="130" 
                                width="72" 
                                height="29" 
                                rx="8" 
                                fill="#ffffff" 
                                stroke={configs.right.color} 
                                strokeWidth="1.8" 
                                style={{ filter: `drop-shadow(0 4px 12px ${configs.right.color}33)` }} 
                            />
                            <line x1="90" y1="131" x2="150" y2="131" stroke={configs.right.color} strokeWidth="1" strokeLinecap="round" />
                            <text 
                                ref={rightDigitalRef} 
                                x="120" 
                                y="151" 
                                textAnchor="middle" 
                                fill={configs.right.textColor} 
                                fontSize="17" 
                                fontWeight="900" 
                                fontFamily="'Courier New', monospace"
                            >
                                0
                            </text>
                            <text ref={rightGearRef} x="120" y="174" textAnchor="middle" fill={configs.right.textColor} fontSize="9.5" fontWeight="900" letterSpacing="1.6">
                                {configs.right.unit}
                            </text>
                            <rect 
                                x="60" 
                                y="179" 
                                width="120" 
                                height="15" 
                                rx="4" 
                                fill="#090d16" 
                                stroke={configs.right.color} 
                                strokeWidth="0.8" 
                                strokeOpacity="0.4" 
                            />
                            <text 
                                x="120" 
                                y="190" 
                                textAnchor="middle" 
                                fill={configs.right.color} 
                                fontSize="7.8" 
                                fontWeight="900" 
                                letterSpacing="0.8" 
                                fontFamily="'Courier New', monospace"
                            >
                                {configs.right.sub}
                            </text>

                            <g ref={rightNeedleRef} style={{ transformOrigin: '120px 120px', transform: 'rotate(-120deg)' }}>
                                <line x1="120" y1="120" x2="120" y2="44" stroke="rgba(15, 23, 42, 0.25)" strokeWidth="4.5" strokeLinecap="round" transform="translate(2, 4)" />
                                <line x1="120" y1="120" x2="120" y2="42" stroke={configs.right.needleColor} strokeWidth="3.8" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${configs.right.needleColor}99)` }} />
                                <line x1="120" y1="120" x2="120" y2="54" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                                <line x1="120" y1="120" x2="120" y2="136" stroke={configs.right.color} strokeWidth="3.2" strokeLinecap="round" />
                                <circle cx="120" cy="120" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }} />
                                <circle cx="120" cy="120" r="9" fill={configs.right.color} stroke="#ffffff" strokeWidth="1" />
                                <circle cx="120" cy="120" r="4" fill="#ffffff" />
                            </g>

                            <path d="M 46 85 Q 120 22 194 85 A 98 98 0 0 0 46 85 Z" fill="url(#glassSheenLight)" opacity="0.65" pointerEvents="none" />
                        </svg>
                    </div>
                </>
            )}

            {/* Interactive Physics Canvas */}
            <canvas ref={canvasRef} className="floating-bg-canvas"></canvas>
        </div>
    );
};

export default FloatingBackground;
