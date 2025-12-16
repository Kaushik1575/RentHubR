import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
                const advancePayment = 100;
                const remainingAmount = totalAmount - advancePayment;

                return {
                    ...booking,
                    vehicleName,
                    vehiclePrice,
                    totalDisplayAmount: totalAmount, // avoid conflict with booking.total_amount if exists
                    remainingDisplayAmount: remainingAmount
                };
            }));

            setBookings(enrichedBookings);
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
        setRefundMethod('upi'); // Reset default
    };

    const handleRefundDetailsClick = (bookingId) => {
        setCurrentBookingId(bookingId);
        setShowRefundDetailsModal(true);
        setRefundMethod('upi'); // Reset default
    };

    const handleConfirmCancel = async () => {
        if (!currentBookingId) return;
        setIsCancelling(true);

        const detailsToSend = { method: refundMethod };
        if (refundMethod === 'upi') {
            detailsToSend.upiId = refundDetails.upiId;
        } else {
            detailsToSend.accountHolder = refundDetails.accountHolder;
            detailsToSend.accountNumber = refundDetails.accountNumber;
            detailsToSend.ifsc = refundDetails.ifsc;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/bookings/${currentBookingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refundDetails: detailsToSend })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to cancel booking');
            }

            const data = await response.json();
            alert(`Booking cancelled successfully!\nRefund Amount: ₹${data.refundAmount}${data.deduction ? '\nDeduction: ₹' + data.deduction : ''}\nRefund will be processed within 1-2 hours.`);
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
                            <p><strong>Start Date:</strong> {booking.start_date || 'N/A'}</p>
                            <p><strong>End Date:</strong> {booking.end_date || 'N/A'}</p>
                            <p><strong>Duration:</strong> {booking.duration || '0'} hours</p>
                            <p><strong>Total Amount:</strong> ₹{booking.totalDisplayAmount || '0'}</p>
                            <p><strong>Advance Payment:</strong> ₹100</p>
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

                            {booking.status === 'confirmed' && (
                                <button className="btn-cancel-booking" onClick={() => handleCancelClick(booking.id)} style={{
                                    backgroundColor: '#f44336', color: 'white', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '5px', cursor: 'pointer', marginTop: '1rem', width: 'fit-content'
                                }}>
                                    <i className="fas fa-times"></i> Cancel Booking
                                </button>
                            )}

                            {booking.status === 'cancelled' && booking.refund_amount && (
                                <div className="refund-info" style={{ marginTop: '0.5rem', color: '#4CAF50', fontWeight: 'bold', padding: '0.5rem', backgroundColor: '#e8f5e9', borderRadius: '5px', fontSize: '0.9rem' }}>
                                    <p><strong>Refund Amount:</strong> ₹{booking.refund_amount}</p>
                                    <p><strong>Refund Status:</strong> {booking.refund_status || 'Processing'}</p>
                                </div>
                            )}

                            {booking.status === 'rejected' && (
                                <div className="refund-info" style={{ marginTop: '0.5rem', color: '#4CAF50', fontWeight: 'bold', padding: '0.5rem', backgroundColor: '#e8f5e9', borderRadius: '5px', fontSize: '0.9rem' }}>
                                    <p><strong>Refund Amount:</strong> ₹{booking.refund_amount || '100'}</p>
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
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Cancellation & Refund</h2>
                            <button onClick={() => setShowCancellationModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <ul className="rules-list" style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>• Cancellation 2 hours before booking: Full refund of advance.</li>
                            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>• Cancellation within 2 hours of/after booking: 50% deduction.</li>
                            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>• No show without cancellation: No refund.</li>
                            <li style={{ padding: '0.5rem 0' }}>• Please provide your refund details below.</li>
                        </ul>
                        <div className="refund-method-options" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <label><input type="radio" name="refundMethod" checked={refundMethod === 'upi'} onChange={() => setRefundMethod('upi')} /> UPI/Payment App</label>
                            <label><input type="radio" name="refundMethod" checked={refundMethod === 'bank'} onChange={() => setRefundMethod('bank')} /> Bank Transfer</label>
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
                            <button onClick={() => setShowCancellationModal(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '5px', border: 'none', cursor: 'pointer', background: '#ccc' }}>Keep Booking</button>
                            <button onClick={handleConfirmCancel} disabled={isCancelling} style={{ padding: '0.8rem 1.5rem', borderRadius: '5px', border: 'none', cursor: 'pointer', background: '#2ecc71', color: 'white' }}>
                                {isCancelling ? 'Cancelling...' : 'Proceed with Cancellation'}
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
        </main>
    );
};

export default MyBookings;
