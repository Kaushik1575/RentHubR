import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SOSActivate = () => {
    const [searchParams] = useSearchParams();
    const sosToken = searchParams.get('token');
    const bookingId = searchParams.get('bookingId');

    const [status, setStatus] = useState('loading'); // loading, ready, activating, success, error
    const [message, setMessage] = useState('');
    const [locationStats, setLocationStats] = useState('');

    useEffect(() => {
        if (!sosToken || !bookingId) {
            setStatus('error');
            setMessage('Invalid link. Missing token or booking ID.');
        } else {
            setStatus('ready');
        }
    }, [sosToken, bookingId]);

    const activateSOS = async () => {
        setStatus('activating');
        setMessage('Requesting location access... Please click "Allow" if prompted.');

        // 1. Try to get GPS with a reasonable timeout (15 seconds to allow user to click Allow)
        try {
            if (navigator.geolocation) {
                const getPosition = new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            resolve(position);
                        },
                        (error) => {
                            reject(error);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 15000, // 15 seconds - ample time for user to read and click Allow
                            maximumAge: 0
                        }
                    );
                });

                // Additional safety timeout in case the browser API hangs completely (rare but possible on some mobile webviews)
                const safetyTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Location request timed out completely")), 16000)
                );

                const position = await Promise.race([getPosition, safetyTimeout]);

                const gpsLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                setLocationStats(`Location acquired (Accuracy: ${Math.round(position.coords.accuracy)}m)`);
                // Got location, proceed to send
                sendSOS(gpsLocation);

            } else {
                throw new Error("Geolocation not supported by this browser.");
            }
        } catch (e) {
            console.warn("GPS failed", e);
            // Handle specific errors
            let errorMsg = "Could not access location.";

            // GeolocationPositionError codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
            if (e.code === 1) errorMsg = "Location permission was denied. Please enable it for better assistance.";
            if (e.code === 2) errorMsg = "Location signal unavailable. Check your GPS settings.";
            if (e.code === 3 || e.message && e.message.includes('time')) errorMsg = "Location request timed out. Weak signal or permission not granted in time.";

            setMessage(errorMsg);
            setStatus('location_error');
        }
    };

    const sendSOS = async (gpsLocation) => {
        setStatus('activating');
        setMessage('Sending SOS alert...');
        if (!gpsLocation) {
            setLocationStats("User skipped location check.");
        }

        try {
            const res = await fetch('/api/sos-activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: sosToken,
                    bookingId: bookingId,
                    gpsLocation
                })
            });

            const data = await res.json();
            if (res.ok) {
                setStatus('success');
            } else {
                throw new Error(data.error || 'Failed to activate SOS');
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.message);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div style={{
                background: 'white', padding: '40px', borderRadius: '12px',
                width: '100%', maxWidth: '500px', textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                <div style={{ fontSize: '4rem', color: '#dc143c', marginBottom: '20px' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h1 style={{ color: '#333', marginBottom: '10px' }}>SOS Activation</h1>

                {status === 'loading' && <p>Loading details...</p>}

                {status === 'error' && (
                    <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #dc143c' }}>
                        <strong>Error</strong>
                        <p>{message}</p>
                    </div>
                )}

                {status === 'location_error' && (
                    <div style={{ background: '#fff3cd', color: '#856404', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #ffc107', textAlign: 'left' }}>
                        <h3 style={{ marginTop: 0 }}>Location Needed</h3>
                        <p>{message}</p>
                        <br />
                        <p>For faster help, please enable location services.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                            <button
                                onClick={activateSOS}
                                style={{
                                    padding: '12px', background: '#0b5cff', color: 'white',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                ⟳ Retry Location Permission
                            </button>

                            <button
                                onClick={() => sendSOS(null)}
                                style={{
                                    padding: '12px', background: '#6c757d', color: 'white',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer'
                                }}
                            >
                                Send SOS Without Location &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {status === 'ready' && (
                    <>
                        <div style={{ background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '8px', textAlign: 'left', marginBottom: '20px', borderLeft: '4px solid #ffc107' }}>
                            <strong>⚠️ Important</strong>
                            <p>By clicking "Activate SOS", you're requesting immediate assistance. Our team will contact you shortly.</p>
                        </div>
                        <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <p><strong>Booking ID:</strong> {bookingId}</p>
                        </div>
                        <button
                            onClick={activateSOS}
                            style={{
                                width: '100%', padding: '15px', background: '#dc143c', color: 'white',
                                border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                boxShadow: '0 4px 15px rgba(220, 20, 60, 0.4)'
                            }}
                        >
                            <i className="fas fa-phone"></i> Activate SOS
                        </button>
                    </>
                )}

                {status === 'activating' && (
                    <div>
                        <div className="spinner" style={{
                            width: '40px', height: '40px', margin: '0 auto 20px',
                            border: '4px solid #f3f3f3', borderTop: '4px solid #dc143c', borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p>{message}</p>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>{locationStats}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ background: '#d4edda', color: '#155724', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                        <h3 style={{ marginBottom: '10px' }}>✓ SOS Activated</h3>
                        <p>Our team has been notified due to your SOS request. We will contact you immediately at your registered number.</p>
                        <p style={{ marginTop: '10px', fontSize: '0.9em' }}>{locationStats}</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                marginTop: '20px', padding: '10px 20px', background: 'transparent',
                                border: '1px solid #155724', borderRadius: '5px', color: '#155724', cursor: 'pointer'
                            }}
                        >
                            Return to Home
                        </button>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default SOSActivate;
