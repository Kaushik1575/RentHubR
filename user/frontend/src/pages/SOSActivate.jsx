import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import getApiUrl from '../config/api';
import './SOSActivate.css';

const SOSActivate = () => {
    const [searchParams] = useSearchParams();
    const sosToken = searchParams.get('token');
    const bookingIdFromUrl = searchParams.get('bookingId');

    const [activeBookingId, setActiveBookingId] = useState(bookingIdFromUrl || '');
    const [activePhone, setActivePhone] = useState('');
    const [inputVal, setInputVal] = useState(bookingIdFromUrl || '');
    const [callInitiated, setCallInitiated] = useState(false);

    const [status, setStatus] = useState('loading'); // loading, ready, activating, active_sos, resolved, escalated, error
    const [message, setMessage] = useState('');
    const [locationStats, setLocationStats] = useState('');
    const [gpsData, setGpsData] = useState(null);
    const [activeIssue, setActiveIssue] = useState('bike_not_starting');
    const [voiceActive, setVoiceActive] = useState(false); // Website voice silent by default so it does not interfere with real phone call
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [sosDataInfo, setSosDataInfo] = useState(null);
    const [nearbyLoading, setNearbyLoading] = useState(false);
    const [nearbySuccessMessage, setNearbySuccessMessage] = useState('');
    const [nearbyPlacesData, setNearbyPlacesData] = useState(null);

    const speechRef = useRef(null);

    const diagnosticGuides = {
        bike_not_starting: {
            title: "Bike Not Starting",
            icon: "fas fa-motorcycle",
            severity: "normal",
            voicePrompt: "Namaste! Agar aapki bike start nahi ho rahi hai, toh kripya yeh chaar steps check kijiye. Pehla, side stand ko poora upar karein. Doosra, right handlebar par red engine kill switch ko RUN position par rakhein. Teesra, fuel knob ko ON ya reserve par check karein. Chautha, clutch daba kar start button press karein. Agar problem solve ho jaye toh Option 1 dabayein, ya mechanic dispatch ke liye Option 2 dabayein.",
            steps: [
                { num: 1, title: "Side-Stand Sensor", desc: "Ensure side stand is fully folded UP. Modern bikes cut off ignition if stand is down." },
                { num: 2, title: "Engine Kill Switch", desc: "Check the RED toggle button on right handlebar. Flip it to the RUN (ON) position." },
                { num: 3, title: "Fuel Valve (Petcock)", desc: "If bike has a manual fuel knob, rotate it to ON or RES (Reserve) position." },
                { num: 4, title: "Clutch & Ignition", desc: "Turn key to ON, pull in the clutch lever completely, and press the start button." }
            ]
        },
        fuel_leakage: {
            title: "Fuel Leakage / Fire Hazard",
            icon: "fas fa-fire-extinguisher",
            severity: "critical",
            voicePrompt: "Emergency Alert! Petrol leak hone par turant bike ka engine aur chaabi band kijiye. Bike start karne ki koshish bilkul mat kijiye. Fuel knob ko OFF kijiye aur exhaust se door khade hoiye. Hum emergency roadside mechanic bhej rahe hain.",
            steps: [
                { num: 1, title: "Turn OFF Ignition Immediately", desc: "Turn off the key switch immediately. Do NOT attempt to crank the engine." },
                { num: 2, title: "Rotate Fuel Knob to OFF", desc: "Locate the petcock valve under fuel tank and turn it to the OFF position." },
                { num: 3, title: "Step Away Safely", desc: "Park on side stand away from traffic. Stay away from the hot exhaust pipe. No smoking nearby." },
                { num: 4, title: "Await Emergency Dispatch", desc: "Do not ride the vehicle. Our emergency mechanic / replacement team is being notified." }
            ]
        },
        flat_tyre: {
            title: "Flat Tyre / Puncture",
            icon: "fas fa-tools",
            severity: "warning",
            voicePrompt: "Tyre puncture hone par bike ko dhere se road ke side par park kijiye aur hazard lights on kijiye. Flat tyre par bike chalana unsafe hai. Niche diye gaye button se nearest puncture mechanic dispatch karein.",
            steps: [
                { num: 1, title: "Safely Pull Over", desc: "Slowly bring the vehicle to a complete stop on the safe shoulder of the road." },
                { num: 2, title: "Park on Main/Side Stand", desc: "Park securely on level ground. Turn on hazard flashers if available." },
                { num: 3, title: "Do NOT Ride on Flat Tyre", desc: "Riding on a flat tyre damages the wheel rim and is unsafe." },
                { num: 4, title: "Dispatch Mobile Puncture Unit", desc: "Click Option 2 below to route our mobile puncture assistant to your GPS pin." }
            ]
        },
        accident_medical: {
            title: "Accident / Medical Emergency",
            icon: "fas fa-ambulance",
            severity: "critical",
            voicePrompt: "Agar koi chot ya accident hua hai, toh kripya pehle 112 ya 108 par call karein. Hamari emergency response team ko alert bhej diya gaya hai.",
            steps: [
                { num: 1, title: "Ensure Personal Safety", desc: "Move to a safe spot away from traffic if you can do so safely." },
                { num: 2, title: "National Emergency Help", desc: "Dial 112 (National Emergency) or 108 (Ambulance) for urgent medical aid." },
                { num: 3, title: "RentHub Emergency Link", desc: "Our 24x7 control room is monitoring your live location and contacting you." }
            ]
        }
    };

    // Text to Speech Helper
    const speakVoicePrompt = (text) => {
        if (!voiceActive) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'hi-IN';
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            speechRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleVoice = () => {
        if (voiceActive) {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            setVoiceActive(false);
            setIsSpeaking(false);
        } else {
            setVoiceActive(true);
            speakVoicePrompt(diagnosticGuides[activeIssue].voicePrompt);
        }
    };

    // Auto-detect booking and registered phone from URL or local storage
    useEffect(() => {
        if (bookingIdFromUrl) {
            setActiveBookingId(bookingIdFromUrl);
            setInputVal(bookingIdFromUrl);
            setStatus('ready');
            return;
        }

        // Try to read logged-in user profile
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed.phone_number) {
                    setActivePhone(String(parsed.phone_number));
                    setInputVal(String(parsed.phone_number));
                }
            }
        } catch (e) {
            console.warn('Could not read user profile:', e);
        }

        // Try to fetch active bookings if user is authenticated
        const authToken = localStorage.getItem('token');
        if (authToken) {
            fetch(getApiUrl('/api/bookings/my-bookings'), {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
                .then(res => res.json())
                .then(data => {
                    const list = Array.isArray(data) ? data : (data?.bookings || []);
                    const activeRide = list.find(b => b.status === 'ride_started' || b.status === 'confirmed');
                    if (activeRide) {
                        const detectedId = activeRide.booking_id || activeRide.id;
                        setActiveBookingId(detectedId);
                        setInputVal(detectedId);
                    }
                })
                .catch(() => {})
                .finally(() => {
                    setStatus('ready');
                });
        } else {
            setStatus('ready');
        }

        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [bookingIdFromUrl]);

    const activateSOS = async () => {
        const trimmedInput = (inputVal || '').trim();
        let targetBooking = activeBookingId;
        let targetPhone = activePhone;

        if (trimmedInput) {
            if (/^\d{10}$/.test(trimmedInput) || trimmedInput.startsWith('+')) {
                targetPhone = trimmedInput;
            } else {
                targetBooking = trimmedInput;
            }
        }

        if (!targetBooking && !targetPhone) {
            alert('Please enter your Booking ID (e.g. RH261101-230) or 10-digit registered phone number to activate SOS.');
            return;
        }

        setStatus('activating');
        setMessage('Acquiring high-accuracy GPS coordinates for roadside dispatch...');

        try {
            if (navigator.geolocation) {
                const getPosition = new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => resolve(position),
                        (error) => reject(error),
                        { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
                    );
                });

                const safetyTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Location request timed out")), 4500)
                );

                const position = await Promise.race([getPosition, safetyTimeout]);
                const gpsLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                setGpsData(gpsLocation);
                setLocationStats(`Live GPS acquired (Accuracy: ${Math.round(position.coords.accuracy)}m)`);
                sendSOS(gpsLocation, targetBooking, targetPhone);

            } else {
                throw new Error("Geolocation not supported by this browser.");
            }
        } catch (e) {
            console.warn("GPS acquisition failed or skipped:", e.message);
            setLocationStats("Proceeding with pickup location fallback.");
            sendSOS(null, targetBooking, targetPhone);
        }
    };

    const sendSOS = async (gpsLocation, targetBooking, targetPhone) => {
        setStatus('activating');
        setMessage('Triggering Retell AI Emergency Outbound Voice Call & Alerting Dispatch...');
        if (!gpsLocation) {
            setLocationStats("GPS skipped. Using pickup location fallback.");
        }

        const bId = targetBooking || activeBookingId || undefined;
        const pNum = targetPhone || activePhone || undefined;

        try {
            const res = await fetch(getApiUrl('/api/sos-activate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: sosToken || 'web_direct',
                    bookingId: bId,
                    phoneNumber: pNum,
                    gpsLocation
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSosDataInfo(data.sosData || null);
                setCallInitiated(!!data.callInitiated);
                setStatus('active_sos');
            } else {
                throw new Error(data.error || 'Failed to activate SOS');
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Could not connect to emergency dispatcher.');
        }
    };

    const handleSelectIssue = (key) => {
        setActiveIssue(key);
        if (voiceActive) {
            speakVoicePrompt(diagnosticGuides[key].voicePrompt);
        }
    };

    // Option 3: Send Nearest Bike Garage & Petrol Pump to Email
    const handleSendNearestLocations = async () => {
        setNearbyLoading(true);
        setNearbySuccessMessage('');

        let liveGps = gpsData;

        if (!liveGps && navigator.geolocation) {
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (p) => resolve(p),
                        (err) => reject(err),
                        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
                    );
                });
                liveGps = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                };
                setGpsData(liveGps);
            } catch (gpsErr) {
                console.warn("Real-time GPS acquisition skipped/denied:", gpsErr.message);
            }
        }

        try {
            const targetBId = activeBookingId || sosDataInfo?.bookingId || bookingIdFromUrl;
            const res = await fetch(getApiUrl('/api/sos-send-nearby'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: targetBId,
                    gpsLocation: liveGps,
                    userEmail: sosDataInfo?.userEmail,
                    userName: sosDataInfo?.userName
                })
            });

            const data = await res.json();
            if (res.ok) {
                setNearbyPlacesData(data.nearbyData || null);
                setNearbySuccessMessage(data.message || `Nearest locations dispatched to ${sosDataInfo?.userEmail || 'your email'}!`);
            } else {
                throw new Error(data.error || 'Failed to dispatch nearest locations');
            }
        } catch (err) {
            alert('Notice: ' + err.message);
        } finally {
            setNearbyLoading(false);
        }
    };

    // Option 1: Problem Solved
    const handleResolve = async () => {
        setFeedbackLoading(true);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        try {
            const targetBId = activeBookingId || sosDataInfo?.bookingId || bookingIdFromUrl;
            const res = await fetch(getApiUrl('/api/sos-feedback'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: targetBId,
                    status: 'resolved',
                    issueType: diagnosticGuides[activeIssue].title
                })
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('resolved');
            } else {
                throw new Error(data.error || 'Failed to submit status');
            }
        } catch (err) {
            alert('Notice: ' + err.message);
        } finally {
            setFeedbackLoading(false);
        }
    };

    // Option 2: Unresolved -> Dispatch Mechanic
    const handleEscalateMechanic = async () => {
        setFeedbackLoading(true);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        try {
            const targetBId = activeBookingId || sosDataInfo?.bookingId || bookingIdFromUrl;
            const res = await fetch(getApiUrl('/api/sos-feedback'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: targetBId,
                    status: 'escalate_mechanic',
                    issueType: diagnosticGuides[activeIssue].title,
                    details: `Customer selected Option 2 (Unresolved) on SOS Dashboard for ${diagnosticGuides[activeIssue].title}`,
                    gpsLocation: gpsData
                })
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('escalated');
            } else {
                throw new Error(data.error || 'Failed to submit status');
            }
        } catch (err) {
            alert('Notice: ' + err.message);
        } finally {
            setFeedbackLoading(false);
        }
    };

    return (
        <div className="sos-container">
            <div className="sos-card">

                {/* Header Icon */}
                <div className="sos-icon-wrapper">
                    <i className="fas fa-satellite-dish sos-icon"></i>
                </div>

                <h1 className="sos-title">RentHub AI SOS Center</h1>
                <p className="sos-description">
                    24x7 Real-Time Emergency Assistance & AI Outbound Diagnostic Calling
                </p>

                {/* State: Loading */}
                {status === 'loading' && (
                    <div className="loading-wrapper">
                        <div className="spinner"></div>
                        <p className="loading-text">Verifying ride details & preparing emergency channels...</p>
                    </div>
                )}

                {/* State: Error */}
                {status === 'error' && (
                    <div className="status-box status-error">
                        <span className="status-title">⚠️ Error</span>
                        <p>{message}</p>
                        <div style={{ marginTop: '16px' }}>
                            <button
                                className="sos-button"
                                style={{ padding: '10px 20px', fontSize: '0.95rem' }}
                                onClick={() => setStatus('ready')}
                            >
                                ⟳ Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* State: Location Permission Error */}
                {status === 'location_error' && (
                    <div className="status-box status-warning">
                        <span className="status-title">📍 Location Notice</span>
                        <p>{message}</p>
                        <p style={{ marginTop: '8px', opacity: 0.8 }}>Proceed without GPS or retry permission.</p>

                        <div className="secondary-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                            <button className="btn-secondary" onClick={activateSOS} style={{ padding: '12px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                ⟳ Retry GPS
                            </button>
                            <button className="btn-secondary" onClick={() => sendSOS(null, activeBookingId, activePhone)} style={{ padding: '12px', background: 'rgba(255,0,0,0.4)', border: '1px solid rgba(255,0,0,0.8)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                                Send Alert Without GPS &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* State: Ready (Initial Screen) */}
                {status === 'ready' && (
                    <>
                        <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '8px' }}>
                                <i className="fas fa-id-card-alt" style={{ marginRight: '6px', color: '#ef4444' }}></i>
                                Booking ID or Registered Mobile Number:
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. RH261101-230 or 9040757683"
                                value={inputVal}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setInputVal(val);
                                    const trimmed = val.trim();
                                    if (/^\d{10}$/.test(trimmed) || trimmed.startsWith('+')) {
                                        setActivePhone(trimmed);
                                    } else {
                                        setActiveBookingId(trimmed);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    fontSize: '1rem',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(239, 68, 68, 0.6)',
                                    outline: 'none',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: '#ffffff',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <small style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginTop: '6px' }}>
                                Enter your active RentHub booking reference or 10-digit mobile number to receive the AI call.
                            </small>
                        </div>

                        <div className="status-box status-warning">
                            <span className="status-title">⚠️ Emergency Protocol</span>
                            <p>Tapping the button below will immediately:</p>
                            <ul style={{ textAlign: 'left', margin: '8px 0 0 15px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                <li>Trigger an <strong>outbound Retell AI voice call</strong> directly to your mobile phone.</li>
                                <li>Transmit your <strong>live GPS pin</strong> to our 24x7 roadside response team.</li>
                                <li>Launch <strong>interactive step-by-step diagnostic assistance</strong>.</li>
                            </ul>
                        </div>

                        <button className="sos-button" onClick={activateSOS}>
                            <i className="fas fa-phone-volume"></i> Initiate AI Emergency Call & Alert
                        </button>
                    </>
                )}

                {/* State: Activating Spinner */}
                {status === 'activating' && (
                    <div className="loading-wrapper">
                        <div className="spinner"></div>
                        <p className="loading-text">{message}</p>
                        {locationStats && <small style={{ display: 'block', marginTop: '5px', opacity: 0.7 }}>{locationStats}</small>}
                    </div>
                )}

                {/* State: ACTIVE SOS - Interactive AI Diagnostic Center */}
                {status === 'active_sos' && (
                    <div className="ai-sos-active-panel">

                        {/* Live Call Banner */}
                        <div className="live-call-banner">
                            <div className="pulse-indicator">
                                <span className="pulse-dot"></span>
                                <span className="pulse-ring"></span>
                            </div>
                            <div className="call-banner-text">
                                <strong>AI Emergency Call Dispatched</strong>
                                <span>
                                    {callInitiated
                                        ? `Calling ${sosDataInfo?.phoneNumber || 'your registered phone'} via Retell AI (Aarohi)...`
                                        : 'Calling your mobile & active on screen'}
                                </span>
                            </div>
                            <button className={`voice-toggle-btn ${voiceActive ? 'active' : ''}`} onClick={toggleVoice} title="Toggle Voice Guidance">
                                <i className={`fas ${voiceActive ? (isSpeaking ? 'fa-volume-up fa-beat' : 'fa-volume-up') : 'fa-volume-mute'}`}></i>
                                <span>{voiceActive ? (isSpeaking ? 'Speaking...' : 'Voice ON') : 'Muted'}</span>
                            </button>
                        </div>

                        {/* Issue Categories Tab */}
                        <div className="issue-tabs-wrapper">
                            <label className="section-label">Select Your Issue for Live Diagnostic:</label>
                            <div className="issue-tabs">
                                {Object.keys(diagnosticGuides).map((key) => {
                                    const guide = diagnosticGuides[key];
                                    const isSelected = activeIssue === key;
                                    return (
                                        <button
                                            key={key}
                                            className={`issue-tab-btn ${isSelected ? 'selected' : ''} ${guide.severity}`}
                                            onClick={() => handleSelectIssue(key)}
                                        >
                                            <i className={guide.icon}></i>
                                            <span>{guide.title}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step-by-Step Diagnostic Steps */}
                        <div className="diagnostic-checklist-card">
                            <div className="diagnostic-header">
                                <h3>
                                    <i className={diagnosticGuides[activeIssue].icon}></i> {diagnosticGuides[activeIssue].title}
                                </h3>
                                <button className="btn-replay-voice" onClick={() => speakVoicePrompt(diagnosticGuides[activeIssue].voicePrompt)}>
                                    <i className="fas fa-redo"></i> Replay Voice
                                </button>
                            </div>

                            <div className="steps-list">
                                {diagnosticGuides[activeIssue].steps.map((step) => (
                                    <div key={step.num} className="step-item">
                                        <div className="step-number">{step.num}</div>
                                        <div className="step-content">
                                            <strong>{step.title}</strong>
                                            <p>{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Option 1, 2 & 3 Action Buttons */}
                        <div className="resolution-actions-wrapper">
                            <p className="resolution-heading">Did the AI guidance solve your issue?</p>
                            
                            <div className="resolution-buttons-grid">
                                <button
                                    className="btn-option btn-option-solved"
                                    onClick={handleResolve}
                                    disabled={feedbackLoading || nearbyLoading}
                                >
                                    <div className="option-badge">[1]</div>
                                    <div className="option-text">
                                        <strong>✅ Issue Solved</strong>
                                        <small>Bike started / Safe to ride</small>
                                    </div>
                                </button>

                                <button
                                    className="btn-option btn-option-unresolved"
                                    onClick={handleEscalateMechanic}
                                    disabled={feedbackLoading || nearbyLoading}
                                >
                                    <div className="option-badge">[2]</div>
                                    <div className="option-text">
                                        <strong>🚨 Still Unresolved</strong>
                                        <small>Dispatch roadside mechanic</small>
                                    </div>
                                </button>

                                <button
                                    className="btn-option btn-option-locations"
                                    onClick={handleSendNearestLocations}
                                    disabled={feedbackLoading || nearbyLoading}
                                >
                                    <div className="option-badge">[3]</div>
                                    <div className="option-text">
                                        <strong>📍 Email Nearest Locations</strong>
                                        <small>{nearbyLoading ? 'Finding & Emailing...' : 'Garages & Petrol Pumps to Inbox'}</small>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* On-Screen Live Nearby Locations Results */}
                        {nearbySuccessMessage && (
                            <div className="nearby-results-panel">
                                <div className="status-box status-success" style={{ marginBottom: '14px' }}>
                                    <span className="status-title">✉️ Locations Dispatched</span>
                                    <p>{nearbySuccessMessage}</p>
                                </div>

                                {nearbyPlacesData && (
                                    <div className="nearby-cards-container">
                                        {/* Nearest Garage Preview */}
                                        {nearbyPlacesData.garages && nearbyPlacesData.garages.length > 0 && (
                                            <div className="nearby-preview-card">
                                                <div className="preview-card-header">
                                                    <span className="preview-type-badge garage-badge">🏍️ Nearest Bike Garage</span>
                                                    <span className="preview-distance">{nearbyPlacesData.garages[0].distanceText}</span>
                                                </div>
                                                <h4 className="preview-name">{nearbyPlacesData.garages[0].name}</h4>
                                                <p className="preview-addr">{nearbyPlacesData.garages[0].address}</p>
                                                <a href={nearbyPlacesData.garages[0].mapUrl} target="_blank" rel="noreferrer" className="btn-preview-map">
                                                    📍 Open Navigation in Maps &rarr;
                                                </a>
                                            </div>
                                        )}

                                        {/* Nearest Petrol Pump Preview */}
                                        {nearbyPlacesData.petrolPumps && nearbyPlacesData.petrolPumps.length > 0 && (
                                            <div className="nearby-preview-card">
                                                <div className="preview-card-header">
                                                    <span className="preview-type-badge fuel-badge">⛽ Nearest Petrol Pump</span>
                                                    <span className="preview-distance">{nearbyPlacesData.petrolPumps[0].distanceText}</span>
                                                </div>
                                                <h4 className="preview-name">{nearbyPlacesData.petrolPumps[0].name}</h4>
                                                <p className="preview-addr">{nearbyPlacesData.petrolPumps[0].address}</p>
                                                <a href={nearbyPlacesData.petrolPumps[0].mapUrl} target="_blank" rel="noreferrer" className="btn-preview-map btn-preview-fuel">
                                                    🧭 Navigate to Fuel Station &rarr;
                                                </a>
                                            </div>
                                        )}

                                        {/* Google Maps Search Buttons */}
                                        <div className="preview-explore-links">
                                            <a href={nearbyPlacesData.mapSearchLinks?.allGarages || '#'} target="_blank" rel="noreferrer" className="btn-explore-link">
                                                🔍 All Garages Near Me
                                            </a>
                                            <a href={nearbyPlacesData.mapSearchLinks?.allPetrolPumps || '#'} target="_blank" rel="noreferrer" className="btn-explore-link">
                                                🔍 All Petrol Pumps Near Me
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Direct Call to Human Helpline */}
                        <div className="direct-call-footer">
                            <span>Need human assistance immediately?</span>
                            <a href="tel:9040757683" className="link-call-support">
                                <i className="fas fa-headset"></i> Call Control Room: 9040757683
                            </a>
                        </div>
                    </div>
                )}

                {/* State: RESOLVED */}
                {status === 'resolved' && (
                    <div className="status-box status-success resolved-panel">
                        <div className="success-check-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <span className="status-title">✓ Problem Solved!</span>
                        <p>Your SOS report has been marked as resolved. We are glad you're back on track!</p>
                        <p style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.8 }}>Please ride safely, wear your helmet, and observe speed limits.</p>

                        <button className="sos-button" style={{ marginTop: '20px', background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' }} onClick={() => window.location.href = '/'}>
                            <i className="fas fa-home"></i> Return to RentHub Home
                        </button>
                    </div>
                )}

                {/* State: ESCALATED (Mechanic Dispatched) */}
                {status === 'escalated' && (
                    <div className="status-box status-warning escalated-panel">
                        <div className="escalate-icon">
                            <i className="fas fa-truck-pickup"></i>
                        </div>
                        <span className="status-title">🚨 Roadside Mechanic Dispatched!</span>
                        <p>Our emergency operations team has received your request and dispatched the nearest roadside assistance technician to your location.</p>
                        
                        {gpsData && (
                            <div className="gps-live-badge">
                                <i className="fas fa-map-marker-alt"></i> Live GPS Transmitted (Lat: {gpsData.latitude.toFixed(4)}, Lng: {gpsData.longitude.toFixed(4)})
                            </div>
                        )}

                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <a href="tel:9040757683" style={{ textDecoration: 'none', width: '100%' }}>
                                <button className="sos-button" style={{ background: 'linear-gradient(135deg, #e53e3e 0%, #dd6b20 100%)' }}>
                                    <i className="fas fa-phone-alt"></i> Speak with Response Team
                                </button>
                            </a>

                            <button className="btn-outline" onClick={() => setStatus('active_sos')}>
                                &larr; Back to AI Diagnostic Screen
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SOSActivate;