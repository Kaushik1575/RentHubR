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
        setMessage('Accessing location...');

        // 1. Try to get GPS
        let gpsLocation = null;
        try {
            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });
                gpsLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                setLocationStats(`Location acquired (Accuracy: ${Math.round(position.coords.accuracy)}m)`);
            }
        } catch (e) {
            console.warn("GPS failed", e);
            setLocationStats("GPS unavailable, sending activation without precise location.");
        }

        setMessage('Sending SOS alert...');

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
