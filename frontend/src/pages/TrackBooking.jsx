import React, { useState } from 'react';

const TrackBooking = () => {
    const [bookingId, setBookingId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCheck = async () => {
        if (!bookingId.trim()) {
            setError('Please enter a Booking ID');
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(`/api/trackBooking?id=${encodeURIComponent(bookingId)}`);
            const data = await res.json();

            if (data.success && data.booking) {
                setResult(data.booking);
            } else {
                setError(data.message || 'Booking not found');
            }
        } catch (err) {
            setError('Error checking booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '80vh', padding: '2rem', background: '#f8f9fa',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
            <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>Track Your Booking</h1>

            <div style={{
                background: 'white', padding: '2rem', borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px'
            }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value.toUpperCase())}
                        placeholder="Enter Booking ID (e.g. BK-12345)"
                        style={{
                            flex: 1, padding: '12px', border: '1px solid #ddd',
                            borderRadius: '6px', fontSize: '1rem'
                        }}
                    />
                    <button
                        onClick={handleCheck}
                        disabled={loading}
                        style={{
                            padding: '12px 24px', background: '#3498db', color: 'white',
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        {loading ? 'Checking...' : 'Check'}
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem', background: '#fee', color: '#c0392b',
                        borderRadius: '6px', marginBottom: '1rem', border: '1px solid #fcc'
                    }}>
                        {error}
                    </div>
                )}

                {result && (
                    <div style={{
                        border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem',
                        background: '#fff'
                    }}>
                        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#2c3e50' }}>
                            Booking Details
                        </h3>
                        <div style={{ display: 'grid', gap: '10px', color: '#555' }}>
                            <p><strong>Status:</strong>
                                <span style={{
                                    marginLeft: '8px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.9em',
                                    background: result.status === 'confirmed' ? '#d4edda' : '#fff3cd',
                                    color: result.status === 'confirmed' ? '#155724' : '#856404'
                                }}>{result.status.toUpperCase()}</span>
                            </p>
                            <p><strong>Vehicle:</strong> {result.vehicle_name || 'N/A'}</p>
                            <p><strong>Start:</strong> {result.start_date} at {result.start_time}</p>
                            <p><strong>Duration:</strong> {result.duration} hours</p>
                            <p><strong>Advance Paid:</strong> ₹{result.advance_payment}</p>
                        </div>
                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <a
                                href={`/invoices/booking_invoice_${result.id}.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-block', padding: '10px 20px',
                                    background: '#27ae60', color: 'white', textDecoration: 'none',
                                    borderRadius: '5px'
                                }}
                            >
                                <i className="fas fa-file-download" style={{ marginRight: '8px' }}></i>
                                Download Invoice
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackBooking;
