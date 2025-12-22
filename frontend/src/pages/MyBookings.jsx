import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPopup from '../components/StatusPopup';


const MyBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [showCancellationModal, setShowCancellationModal] = useState(false);
    const [showRefundDetailsModal, setShowRefundDetailsModal] = useState(false);
    const [currentBookingId, setCurrentBookingId] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    // Success Popup State
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Refund Form States
    const [refundMethod, setRefundMethod] = useState('upi'); // 'upi' or 'bank'
    const [refundDetails, setRefundDetails] = useState({
        upiId: '',
        accountHolder: '',
        accountNumber: '',
        ifsc: ''
    });

    useEffect(() => {
        fetchUserBookings();
    }, []);

    const fetchUserBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('/api/bookings/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch bookings');

            const bookingsData = await response.json();

            // Enrich bookings with vehicle data
            const enrichedBookings = await Promise.all(bookingsData.map(async booking => {
                let vehicleName = 'N/A';
                let vehiclePrice = 0;

                if (booking.vehicle_id && booking.vehicle_type) {
                    try {
                        let typeTable = booking.vehicle_type;
                        if (booking.vehicle_type === 'car') typeTable = 'cars';
                        if (booking.vehicle_type === 'bike') typeTable = 'bikes';
                        if (booking.vehicle_type === 'scooty') typeTable = 'scooty';

                        const res = await fetch(`/api/vehicles/${typeTable}/${booking.vehicle_id}`);
                        if (res.ok) {
                            const vehicle = await res.json();
                            vehicleName = vehicle.name || 'N/A';
                            vehiclePrice = vehicle.price || 0;
                        }
                    } catch (e) {
                        console.error("Error fetching vehicle details", e);
                    }
                }

                // Calculate display amounts
                const duration = parseInt(booking.duration) || 0;
                const totalAmount = duration * vehiclePrice;
                const advancePayment = booking.advance_payment ? parseFloat(booking.advance_payment) : Math.ceil(totalAmount * 0.3);
                const remainingAmount = totalAmount - advancePayment;

                return {
                    ...booking,
                    vehicleName,
                    vehiclePrice,
                    totalDisplayAmount: totalAmount, // avoid conflict with booking.total_amount if exists
                    remainingDisplayAmount: remainingAmount,
                    displayAdvancePayment: advancePayment
                };
            }));

            // Filter out bookings ONLY if they are effectively in the past (Start Time + 12 Hours)
            // User Logic: "Completed" means started. Disappear 12h after START.
            const activeBookings = enrichedBookings.filter(booking => {
                // Determine the start time
                let startDateTime;

                if (booking.start_date) {
                    startDateTime = new Date(`${booking.start_date}T${booking.start_time || '00:00'}`);
                } else {
                    // Fallback if data missing - keep it visible
                    return true;
                }

                // Rule: Disappear 12 hours after START time
                const disappearTime = new Date(startDateTime.getTime() + (12 * 60 * 60 * 1000));

                const now = new Date();

                // If we are PAST the disappear time, hide it
                if (now > disappearTime) {
                    return false;
                }

                return true;
            });

            // Format dates for display
            const formattedBookings = activeBookings.map(booking => {
                let startDisplay = 'N/A';
                let endDisplay = 'N/A';

                if (booking.start_date && booking.start_time) {
                    // Start Date
                    startDisplay = `${booking.start_date} (${booking.start_time})`;

                    // Calculate End Date
                    try {
                        const [year, month, day] = booking.start_date.split('-').map(Number);
                        const [hours, minutes] = booking.start_time.split(':').map(Number);
                        const startDateObj = new Date(year, month - 1, day, hours, minutes);

                        const durationHours = parseInt(booking.duration) || 0;
                        const endDateObj = new Date(startDateObj.getTime() + (durationHours * 60 * 60 * 1000));

                        const endYear = endDateObj.getFullYear();
                        const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
                        const endDay = String(endDateObj.getDate()).padStart(2, '0');
                        const endHours = String(endDateObj.getHours()).padStart(2, '0');
                        const endMinutes = String(endDateObj.getMinutes()).padStart(2, '0');

                        endDisplay = `${endYear}-${endMonth}-${endDay} (${endHours}:${endMinutes})`;
                    } catch (e) {
                        console.error("Error calculating end date", e);
                    }
                }

                return {
                    ...booking,
                    displayStartDate: startDisplay,
                    displayEndDate: endDisplay
                };
            });

            setBookings(formattedBookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setError('Error loading bookings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (bookingId) => {
        setCurrentBookingId(bookingId);
        setShowCancellationModal(true);
    };

    const handleRefundDetailsClick = (bookingId) => {
        setCurrentBookingId(bookingId);
        setShowRefundDetailsModal(true);
    };

    const handleDownloadInvoice = async (bookingId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/bookings/${bookingId}/invoice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to download invoice');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice_${bookingId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Could not download invoice. Please try again.');
        }
    };

    const handleConfirmCancel = async () => {
        if (!currentBookingId) return;
        setIsCancelling(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/bookings/${currentBookingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to cancel booking');
            }

            const data = await response.json();

            // Format success message with refund details
            const msg = (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    <p style={{ margin: 0 }}>Booking cancelled successfully!</p>

                    <div style={{
                        background: '#f8f9fa',
                        padding: '10px 15px',
                        borderRadius: '8px',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        border: '1px solid #e9ecef'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '1.1rem' }}>
                            <span style={{ color: '#555' }}>Refund Amount:</span>
                            <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>₹{data.refundAmount}</span>
                        </div>
                        {data.deduction > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.95rem' }}>
                                <span style={{ color: '#666' }}>Deduction:</span>
                                <span style={{ color: '#d32f2f' }}>-₹{data.deduction}</span>
                            </div>
                        )}
                    </div>

                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#888' }}>
                        Your refund will be processed automatically to your original payment method within 5-7 business days.
                    </p>
                </div>
            );

            setSuccessMessage(msg);
            setShowSuccessPopup(true);

            setShowCancellationModal(false);
            fetchUserBookings();
        } catch (error) {
            alert(error.message || 'Error cancelling booking.');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleSubmitRefundDetails = async () => {
        if (!currentBookingId) return;

        const detailsToSend = { method: refundMethod };
        if (refundMethod === 'upi') {
            if (!refundDetails.upiId) return alert('Please enter UPI ID.');
            detailsToSend.upiId = refundDetails.upiId;
        } else {
            if (!refundDetails.accountHolder || !refundDetails.accountNumber || !refundDetails.ifsc) return alert('Please fill all bank details.');
            detailsToSend.accountHolder = refundDetails.accountHolder;
            detailsToSend.accountNumber = refundDetails.accountNumber;
            detailsToSend.ifsc = refundDetails.ifsc;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/bookings/${currentBookingId}/refund-details`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refundDetails: detailsToSend })
            });

            if (!response.ok) throw new Error('Failed to submit refund details');

            alert('Refund details submitted successfully!');
            setShowRefundDetailsModal(false);
            fetchUserBookings();
        } catch (error) {
            alert(error.message);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading bookings...</div>;

    return (
        <main>
            <section className="my-bookings-header" style={{ padding: '8rem 5% 2rem', backgroundColor: '#f8f9fa', textAlign: 'center' }}>
                <h1>My Bookings</h1>
                <p>View and manage your vehicle rentals</p>
            </section>

            <section className="bookings-list" style={{ padding: '2rem 5%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                {bookings.length === 0 ? (
                    <p className="no-bookings" style={{ textAlign: 'center', padding: '3rem', background: '#f5f5f5', borderRadius: '10px', margin: '2rem auto', maxWidth: '600px', color: '#666' }}>
                        You have no active or past bookings.
                    </p>
                ) : (
                    bookings.map(booking => (
                        <div key={booking.id} className="booking-card" style={{ background: '#fff', padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <h3 style={{ margin: 0, color: '#2ecc71', fontSize: '1.2rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Booking ID: {booking.id}</h3>
                            <p><strong>Vehicle:</strong> {booking.vehicleName} ({booking.vehicle_type})</p>
                            <p><strong>Start Date:</strong> {booking.displayStartDate}</p>
                            <p><strong>End Date:</strong> {booking.displayEndDate}</p>
                            <p><strong>Duration:</strong> {booking.duration || '0'} hours</p>
                            <p><strong>Total Amount:</strong> ₹{booking.totalDisplayAmount || '0'}</p>
                            <p><strong>Advance Payment:</strong> ₹{booking.displayAdvancePayment || '0'}</p>
                            <p><strong>Remaining Amount:</strong> ₹{booking.remainingDisplayAmount >= 0 ? booking.remainingDisplayAmount : '0'}</p>
                            <p><strong>Transaction ID:</strong> {booking.transaction_id || 'N/A'}</p>

                            <span className={`booking-status status-${booking.status}`} style={{
                                fontWeight: 'bold', padding: '0.5rem 1rem', borderRadius: '5px', display: 'inline-block', marginTop: '0.5rem', color: 'white', textAlign: 'center', width: 'fit-content',
                                backgroundColor: booking.status === 'confirmed' ? '#4CAF50' :
                                    booking.status === 'pending' ? '#ffa726' :
                                        booking.status === 'cancelled' ? '#f44336' :
                                            booking.status === 'completed' ? '#2196F3' : '#9e9e9e'
                            }}>
                                {booking.status ? booking.status.toUpperCase() : 'N/A'}
                            </span>

                            {(booking.status === 'confirmed' || booking.status === 'completed') && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                    <button onClick={() => handleDownloadInvoice(booking.id)} style={{
                                        backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}>
                                        <span>📄</span> Download Invoice
                                    </button>

                                    {booking.status === 'confirmed' && (
                                        <button className="btn-cancel-booking" onClick={() => handleCancelClick(booking.id)} style={{
                                            backgroundColor: '#f44336', color: 'white', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '5px', cursor: 'pointer'
                                        }}>
                                            <i className="fas fa-times"></i> Cancel Booking
                                        </button>
                                    )}
                                </div>
                            )}

                            {booking.status === 'cancelled' && booking.refund_amount && (
                                <div className="refund-info" style={{ marginTop: '0.5rem', color: '#4CAF50', fontWeight: 'bold', padding: '0.5rem', backgroundColor: '#e8f5e9', borderRadius: '5px', fontSize: '0.9rem' }}>
                                    <p><strong>Refund Amount:</strong> ₹{booking.refund_amount}</p>
                                    <p><strong>Refund Status:</strong> {booking.refund_status || 'Processing'}</p>
                                </div>
                            )}

                            {booking.status === 'rejected' && (
                                <div className="refund-info" style={{ marginTop: '0.5rem', color: '#4CAF50', fontWeight: 'bold', padding: '0.5rem', backgroundColor: '#e8f5e9', borderRadius: '5px', fontSize: '0.9rem' }}>
                                    <p><strong>Refund Amount:</strong> ₹{booking.refund_amount || booking.displayAdvancePayment || '0'}</p>
                                    <p><strong>Refund Status:</strong> {booking.refund_status || 'Completed'}</p>
                                    {booking.refund_details?.original_tx && (
                                        <p style={{ fontSize: '0.85em', color: '#666' }}>Ref Tx: {booking.refund_details.original_tx}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </section>

            {/* Cancellation Modal */}
            {showCancellationModal && (
                <div className="modal" style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
                    <div className="modal-content" style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: 'white', padding: '2rem', borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Cancel Booking</h2>
                            <button onClick={() => setShowCancellationModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>📋 Cancellation & Refund Policy</h3>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>Cancellation within 2 hours of booking: <strong>Full refund</strong></li>
                                <li style={{ marginBottom: '0.5rem' }}>Cancellation after 2 hours: <strong>70% refund</strong> (30% deduction)</li>
                                <li style={{ marginBottom: '0.5rem' }}>Refund will be processed automatically to your original payment method</li>
                                <li>Refund timeline: <strong>5-7 business days</strong></li>
                            </ul>
                        </div>

                        <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: '1.5rem' }}>
                            Are you sure you want to cancel this booking? Your refund will be processed automatically via Razorpay.
                        </p>

                        <div className="modal-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem' }}>
                            <button onClick={() => setShowCancellationModal(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '5px', border: 'none', cursor: 'pointer', background: '#ccc' }}>Keep Booking</button>
                            <button onClick={handleConfirmCancel} disabled={isCancelling} style={{ padding: '0.8rem 1.5rem', borderRadius: '5px', border: 'none', cursor: isCancelling ? 'not-allowed' : 'pointer', background: '#f44336', color: 'white', opacity: isCancelling ? 0.6 : 1 }}>
                                {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Details Modal (Rejected) - reusing similar logic */}
            {showRefundDetailsModal && (
                <div className="modal" style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
                    <div className="modal-content" style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: 'white', padding: '2rem', borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Submit Refund Details</h2>
                            <button onClick={() => setShowRefundDetailsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <p>Your booking was rejected. Please provide details for refund.</p>

                        <div className="refund-method-options" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
                            <label><input type="radio" name="refundMethodRejected" checked={refundMethod === 'upi'} onChange={() => setRefundMethod('upi')} /> UPI/Payment App</label>
                            <label><input type="radio" name="refundMethodRejected" checked={refundMethod === 'bank'} onChange={() => setRefundMethod('bank')} /> Bank Transfer</label>
                        </div>

                        {refundMethod === 'upi' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label>UPI ID</label>
                                <input type="text" placeholder="e.g. yourname@upi" value={refundDetails.upiId} onChange={e => setRefundDetails({ ...refundDetails, upiId: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '5px' }} />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label>Account Holder Name</label>
                                <input type="text" value={refundDetails.accountHolder} onChange={e => setRefundDetails({ ...refundDetails, accountHolder: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '5px' }} />
                                <label>Account Number</label>
                                <input type="text" value={refundDetails.accountNumber} onChange={e => setRefundDetails({ ...refundDetails, accountNumber: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '5px' }} />
                                <label>IFSC Code</label>
                                <input type="text" value={refundDetails.ifsc} onChange={e => setRefundDetails({ ...refundDetails, ifsc: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '5px' }} />
                            </div>
                        )}

                        <div className="modal-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1.5rem', marginTop: '1rem' }}>
                            <button onClick={handleSubmitRefundDetails} style={{ padding: '0.8rem 1.5rem', borderRadius: '5px', border: 'none', cursor: 'pointer', background: '#2ecc71', color: 'white' }}>
                                Submit Refund Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <StatusPopup
                isOpen={showSuccessPopup}
                onClose={() => setShowSuccessPopup(false)}
                type="success"
                title="Cancellation Successful"
                message={successMessage}
            />
        </main>
    );
};

export default MyBookings;
