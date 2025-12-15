import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const BookingForm = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const vehicleId = searchParams.get('vehicleId');
    const vehicleType = searchParams.get('type'); // 'cars', 'bikes', 'scooty'

    // Determine the API endpoint type based on query param (which might be 'car', 'bike' etc from cards)
    const getApiType = (type) => {
        if (!type) return 'bikes';
        if (type === 'car' || type === 'cars') return 'cars';
        if (type === 'bike' || type === 'bikes') return 'bikes';
        if (type === 'scooty') return 'scooty';
        return type;
    };

    const [vehicle, setVehicle] = useState(null);
    const [formData, setFormData] = useState({
        startDate: '',
        startTime: '',
        duration: 2,
        transactionId: ''
    });
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const apiType = getApiType(vehicleType);

    useEffect(() => {
        if (vehicleId && apiType) {
            fetch(`/api/vehicles/${apiType}/${vehicleId}`)
                .then(res => {
                    if (!res.ok) throw new Error('Vehicle not found');
                    return res.json();
                })
                .then(data => {
                    setVehicle(data);
                    setLoading(false);
                })
                .catch(err => {
                    alert('Error loading vehicle data');
                    navigate('/');
                });
        } else {
            alert('Invalid vehicle selection');
            navigate('/');
        }
    }, [vehicleId, apiType, navigate]);

    // Set min date to today
    const today = new Date().toISOString().split('T')[0];

    // Calculations
    const hourlyRate = vehicle ? (vehicle.price || 0) : 0;
    const duration = parseInt(formData.duration) || 0;
    const totalAmount = hourlyRate * duration;
    const advancePayment = 100;
    const remainingAmount = totalAmount - advancePayment;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!termsAccepted) {
            alert('Please accept the Terms and Conditions to proceed.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('You must be logged in to book a vehicle.');
            navigate('/login');
            return;
        }

        const bookingPayload = {
            vehicleId,
            vehicleType: apiType, // Ensure consistency with Backend expectation
            ...formData
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingPayload)
            });

            if (response.ok) {
                alert('Booking Accepted! Please wait and check your Registered email for confirmation and further details.');
                navigate('/my-bookings');
            } else {
                const data = await response.json();
                alert(data.error || "Vehicle is already Booked! Please choose another vehicle or time.");
            }
        } catch (error) {
            alert('An error occurred while trying to book. Please try again.');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '2rem' }}>
            <div className="booking-container" style={{
                maxWidth: '800px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div className="booking-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                    <h1 style={{ margin: 0, color: '#333', fontSize: '1.8rem' }}>Book Vehicle</h1>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#666', cursor: 'pointer' }}>&times;</button>
                </div>

                <div className="vehicle-info" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', marginBottom: '2rem' }}>
                    <h2 style={{ margin: '0 0 1rem 0', color: '#333' }}>Vehicle Details</h2>
                    <div className="vehicle-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        <p><strong>Name:</strong> {vehicle.name}</p>
                        <p><strong>Engine:</strong> {vehicle.engine || 'Standard'}</p>
                        <p><strong>Fuel Type:</strong> {vehicle.fuel_type || 'Standard'}</p>
                        <p><strong>Price per hour:</strong> ₹{vehicle.price}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>Start Date</label>
                        <input type="date" name="startDate" min={today} value={formData.startDate} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>Start Time</label>
                        <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>Duration (hours)</label>
                        <input type="number" name="duration" min="1" max="672" value={formData.duration} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>

                    <div className="price-details" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', margin: '1.5rem 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Duration:</span>
                            <span>{duration} hours</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total Amount:</span>
                            <span>₹{totalAmount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Advance Payment:</span>
                            <span>₹{advancePayment}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid #ddd', fontWeight: 'bold' }}>
                            <span>Remaining Amount:</span>
                            <span>₹{remainingAmount > 0 ? remainingAmount : 0}</span>
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="form-group">
                        <h2 style={{ color: '#1976d2', textAlign: 'center', marginBottom: '1rem' }}>
                            💰 Payment Options - Advance: <span style={{ color: '#009688' }}>₹100</span>
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                            <div style={{ flex: '1 1 200px', minWidth: '200px', background: '#f5fff5', borderRadius: '8px', padding: '16px', border: '1px solid #b2dfdb', textAlign: 'center' }}>
                                <h3 style={{ color: '#388e3c', marginBottom: '8px' }}>QR Code Payment</h3>
                                <img src="/photo/QR.jpeg" alt="QR Code" style={{ maxWidth: '120px', margin: '8px auto', display: 'block', border: '1px solid #ccc', borderRadius: '8px' }} />
                                <div style={{ color: '#388e3c', fontWeight: '500', marginTop: '8px' }}>Quick & Easy</div>
                            </div>
                            <div style={{ flex: '1 1 200px', minWidth: '200px', background: '#fff8f5', borderRadius: '8px', padding: '16px', border: '1px solid #ffcdd2', textAlign: 'center' }}>
                                <h3 style={{ color: '#d84315', marginBottom: '8px' }}>UPI Payment</h3>
                                <div style={{ fontSize: '1.1em', color: '#d84315', background: '#fff3e0', padding: '8px 0', borderRadius: '4px', fontWeight: '600' }}>UPI ID: 90407576830@ibl</div>
                                <div style={{ color: '#d84315', fontWeight: '500', marginTop: '8px' }}>Instant Transfer</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', background: '#f3f7fa', borderRadius: '8px', padding: '16px', border: '1px solid #90caf9' }}>
                            <h3 style={{ color: '#1565c0', marginBottom: '8px', textAlign: 'center' }}>🏦 Bank Transfer</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div><strong>Account Holder:</strong> Kaushik Das</div>
                                <div><strong>Account Number:</strong> 5350101111111384</div>
                                <div><strong>IFSC Code:</strong> SBIN50004500</div>
                                <div><strong>Bank:</strong> State Bank of India</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', textAlign: 'center', color: '#1976d2' }}>
                            <b>Choose any payment method above. After payment, enter Transaction ID below.</b>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>Transaction ID</label>
                        <input type="text" name="transactionId" placeholder="Enter UPI transaction ID" value={formData.transactionId} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>

                    <div className="terms-wrapper" style={{ background: '#ffffff', border: '1px solid #e1e5e9', borderRadius: '8px', padding: '20px', margin: '20px 0', transition: 'all 0.3s ease' }}>
                        <div className="checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setShowTermsModal(true)}>
                            <div style={{
                                width: '20px', height: '20px', border: '2px solid #d1d5db', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: termsAccepted ? '#007bff' : 'white', borderColor: termsAccepted ? '#007bff' : '#d1d5db'
                            }}>
                                {termsAccepted && <i className="fas fa-check" style={{ color: 'white', fontSize: '12px' }}></i>}
                            </div>
                            <span style={{ color: '#374151', fontSize: '14px' }}>I agree to the <span style={{ color: '#007bff', fontWeight: '600' }}>Terms and Conditions</span></span>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" style={{ width: '100%', padding: '1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>Confirm Booking</button>
                </form>
            </div>

            {/* Terms Modal */}
            {showTermsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                            <h2>Terms and Conditions</h2>
                            <button onClick={() => setShowTermsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                <h3 style={{ marginTop: 0, color: '#1e40af' }}>1. 📋 Booking Confirmation</h3>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li>Advance booking is confirmed only after successful payment of the advance amount.</li>
                                    <li>A confirmation message/email will be sent once the booking is verified.</li>
                                </ul>
                            </div>
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#ecfdf5', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                <h3 style={{ marginTop: 0, color: '#047857' }}>2. 💰 Advance Payment</h3>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li>A minimum of ₹100/- of the total rental amount must be paid in advance to secure your booking.</li>
                                    <li>The remaining amount must be paid at the time of pickup.</li>
                                </ul>
                            </div>
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#fffbeb', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                                <h3 style={{ marginTop: 0, color: '#92400e' }}>3. ⏰ Cancellation Policy</h3>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li>Cancellation 2 hours before the booking time → Full refund of advance.</li>
                                    <li>Cancellation within 2 hours of/after booking time → 50% of the advance will be deducted.</li>
                                    <li>No show without cancellation → No refund.</li>
                                </ul>
                            </div>
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#ecfeff', borderRadius: '8px', borderLeft: '4px solid #06b6d4' }}>
                                <h3 style={{ marginTop: 0, color: '#0e7490' }}>4. 📄 Required Documents</h3>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li>Valid Aadhar Card proof must be shown at the time of pickup.</li>
                                    <li>The booking will be cancelled if valid documents are not presented.</li>
                                </ul>
                            </div>
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#fef2f2', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                                <h3 style={{ marginTop: 0, color: '#b91c1c' }}>5. 🚲 Vehicle Usage</h3>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li>The vehicle should be used only by the registered renter.</li>
                                    <li>Sub-renting or transfer of booking is strictly prohibited.</li>
                                    <li>Any damage or traffic violation fines during the rental period are the renter's responsibility.</li>
                                </ul>
                            </div>
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#fff7ed', borderRadius: '8px', borderLeft: '4px solid #f97316' }}>
                                <h3 style={{ marginTop: 0, color: '#c2410c' }}>6. ⏱️ Late Return</h3>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li>Delay beyond the scheduled return time will incur late fees per hour.</li>
                                </ul>
                            </div>
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#ecfdf5', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                <h3 style={{ marginTop: 0, color: '#047857' }}>7. 💳 Refund Policy</h3>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li>Refunds (if applicable) will be processed within 3–5 working days after cancellation.</li>
                                </ul>
                            </div>
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #6b7280' }}>
                                <h3 style={{ marginTop: 0, color: '#374151' }}>8. 🏢 Company Rights</h3>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li>The company reserves the right to cancel any booking due to unforeseen issues (vehicle unavailability, technical problems, or policy violations).</li>
                                    <li>In such cases, a full refund of the advance will be provided.</li>
                                </ul>
                            </div>
                        </div>
                        <div style={{ padding: '24px 32px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setShowTermsModal(false)} style={{ padding: '12px 24px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Decline</button>
                            <button onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Accept</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingForm;
