import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import StatusPopup from '../components/StatusPopup'; // Assuming you have this


const TrackBooking = () => {
    const [bookingId, setBookingId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });

    // Auto-load from URL
    useEffect(() => {
        const idFromUrl = searchParams.get('bookingId');
        if (idFromUrl) {
            setBookingId(idFromUrl);
            setTimeout(() => handleCheck(idFromUrl), 100);
        }
    }, [searchParams]);

    // Auto-trigger cancel if action=cancel is present and result status is confirmed
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'cancel' && result && result.status === 'confirmed') {
            // Scroll to cancel button or just trigger it
            handleCancelInitiate();
            // Optional: Clear params to avoid loop if using same page, but we nav away usually
        }
    }, [result, searchParams]);

    const fetchVehicleDetails = async (bookingData) => {
        if (bookingData.vehicle_id && bookingData.vehicle_type) {
            try {
                let typeTable = bookingData.vehicle_type;
                if (bookingData.vehicle_type === 'car') typeTable = 'cars';
                if (bookingData.vehicle_type === 'bike') typeTable = 'bikes';
                if (bookingData.vehicle_type === 'scooty') typeTable = 'scooty';

                const res = await fetch(`/api/vehicles/${typeTable}/${bookingData.vehicle_id}`);
                if (res.ok) {
                    const vehicle = await res.json();
                    return vehicle;
                }
            } catch (e) {
                console.error("Error fetching vehicle details", e);
            }
        }
        return null;
    };

    const handleCheck = async (idOverride) => {
        const idToCheck = idOverride || bookingId;
        if (!idToCheck || !idToCheck.trim()) {
            setError('Please enter a Booking ID');
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(`/api/trackBooking?id=${encodeURIComponent(idToCheck)}`);
            const data = await res.json();

            if (data.success && data.booking) {
                let finalBooking = data.booking;

                // Fetch vehicle details
                const vehicle = await fetchVehicleDetails(finalBooking);

                // Calculate details
                const vehicleName = vehicle ? vehicle.name : 'Unknown Vehicle';
                const vehiclePrice = vehicle ? vehicle.price : 0;
                const duration = parseInt(finalBooking.duration) || 0;
                const totalAmount = duration * vehiclePrice;
                const advancePayment = finalBooking.advance_payment ? parseFloat(finalBooking.advance_payment) : 0;
                const remainingAmount = totalAmount - advancePayment;

                setResult({
                    ...finalBooking,
                    vehicleName,
                    vehiclePrice,
                    totalDisplayAmount: totalAmount,
                    remainingDisplayAmount: remainingAmount,
                    displayAdvancePayment: advancePayment
                });
            } else {
                setError(data.message || 'Booking not found');
            }
        } catch (err) {
            setError('Error checking booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelInitiate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setPopup({
                isOpen: true,
                type: 'warning',
                title: 'Login Required',
                message: 'Please login to cancel this booking. We will redirect you to the Login page.'
            });
            return;
        }

        // Attempt to cancel via API to check ownership/status
        try {
            const bookingId = result.id;
            const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({}) // Empty body initially
            });

            if (res.status === 403) {
                // Ownership mismatch
                const data = await res.json();
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Access Denied',
                    message: data.error || 'This booking ID belongs to a different user account.'
                });
                return;
            }

            if (res.status === 400 && (await res.clone().json()).error?.includes('Refund details')) {
                // Correct User, but Refund Details needed. Redirect to My Bookings.
                setPopup({
                    isOpen: true,
                    type: 'info',
                    title: 'Refund Details Required',
                    message: 'Please complete the cancellation from your dashboard to provide refund details. Redirecting...'
                });
                setTimeout(() => {
                    navigate('/my-bookings');
                }, 2000);
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Cancelled Successfully',
                    message: `Booking cancelled. Refund Amount: ₹${data.refundAmount || 0}`
                });
                // Update UI state
                setResult(prev => ({ ...prev, status: 'cancelled' }));
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Cancellation failed');
            }

        } catch (err) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: err.message
            });
        }
    };

    const handlePopupClose = () => {
        const isLoginRedirect = popup.title === 'Login Required';
        setPopup({ ...popup, isOpen: false });
        if (isLoginRedirect) {
            navigate('/login', { state: { from: location } });
        }
    };

    const handleDownloadInvoice = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setPopup({
                isOpen: true,
                type: 'warning',
                title: 'Login Required',
                message: 'Please login to download this invoice. We will redirect you to the Login page.'
            });
            return;
        }

        try {
            const bookingId = result.id;
            const res = await fetch(`/api/bookings/${bookingId}/invoice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 403) {
                const data = await res.json();
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Access Denied',
                    message: data.error || 'This invoice belongs to a different user account.'
                });
                return;
            }

            if (!res.ok) {
                throw new Error('Failed to download invoice');
            }

            // Create blob and download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice_${result.booking_id || bookingId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Download Failed',
                message: err.message || 'Could not download invoice.'
            });
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
                        onClick={() => handleCheck()}
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
                        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#2c3e50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Booking Details</span>
                            <span style={{
                                fontSize: '0.8em', padding: '4px 10px', borderRadius: '20px',
                                background: result.status === 'confirmed' ? '#e8f5e9' : '#fff3cd',
                                color: result.status === 'confirmed' ? '#2e7d32' : '#856404'
                            }}>
                                {result.status ? result.status.toUpperCase() : 'UNKNOWN'}
                            </span>
                        </h3>

                        <div style={{ display: 'grid', gap: '12px', color: '#555', fontSize: '1rem' }}>
                            <div>
                                <strong>Booking ID:</strong> <span style={{ color: '#333' }}>{result.booking_id || `#${result.id}`}</span>
                            </div>
                            <div>
                                <strong>Vehicle:</strong> <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{result.vehicleName}</span> ({result.vehicle_type})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                                <div><strong>Start:</strong> {result.start_date} ({result.start_time})</div>
                                <div><strong>Duration:</strong> {result.duration}h</div>
                            </div>

                            <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Total Amount:</span>
                                    <strong>₹{result.totalDisplayAmount}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Advance Paid:</span>
                                    <strong style={{ color: '#27ae60' }}>₹{result.displayAdvancePayment}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                                    <span>Remaining to Pay:</span>
                                    <strong style={{ color: '#e67e22' }}>₹{result.remainingDisplayAmount > 0 ? result.remainingDisplayAmount : 0}</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={handleDownloadInvoice}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '10px 20px',
                                    background: '#2196F3', color: 'white', textDecoration: 'none',
                                    border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                <i className="fas fa-file-download" style={{ marginRight: '8px' }}></i>
                                Invoice
                            </button>

                            {/* Cancel Button if Confirmed */}
                            {result.status === 'confirmed' && (
                                <button
                                    onClick={handleCancelInitiate}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', padding: '10px 20px',
                                        background: '#fff', color: '#dc3545', border: '1px solid #dc3545',
                                        borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <StatusPopup
                isOpen={popup.isOpen}
                onClose={handlePopupClose}
                type={popup.type}
                title={popup.title}
                message={popup.message}
            />
        </div>
    );
};

export default TrackBooking;
