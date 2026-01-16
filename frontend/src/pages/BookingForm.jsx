import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StatusPopup from '../components/StatusPopup';

const BookingForm = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const vehicleId = searchParams.get('vehicleId');
    const vehicleType = searchParams.get('type'); // 'cars', 'bikes', 'scooty'

    // Determine the API endpoint type based on query param
    const getApiType = (type) => {
        if (!type) return 'bikes';
        if (type === 'car' || type === 'cars') return 'cars';
        if (type === 'bike' || type === 'bikes') return 'bikes';
        if (type === 'scooty') return 'scooty';
        return type;
    };

    const [vehicle, setVehicle] = useState(null);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        startDate: '',
        startTime: '',
        duration: 2,
    });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false); // For API calls
    const [bookingId, setBookingId] = useState(null); // Store booking ID for invoice download
    const [formattedBookingId, setFormattedBookingId] = useState(null); // Store formatted ID for display/download
    const [downloadingInvoice, setDownloadingInvoice] = useState(false); // Invoice download state

    // Popup State
    const [popup, setPopup] = useState({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    });

    const apiType = getApiType(vehicleType);

    // Initial Load
    useEffect(() => {
        // Chatbot Auto-Fill: Parse params from URL set by chatbot
        const urlStartDate = searchParams.get('startDate');
        const urlStartTime = searchParams.get('startTime');
        const urlDuration = searchParams.get('duration');

        if (urlStartDate && urlStartTime && urlDuration) {
            setFormData(prev => ({
                ...prev,
                startDate: urlStartDate,
                startTime: urlStartTime,
                duration: parseInt(urlDuration) || 2
            }));
        }

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
                    setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error loading vehicle data' });
                    setTimeout(() => navigate('/'), 2000);
                });
        } else {
            setPopup({ isOpen: true, type: 'error', title: 'Invalid Vehicle', message: 'Invalid vehicle selection' });
            setTimeout(() => navigate('/'), 2000);
        }
    }, [vehicleId, apiType, navigate, searchParams]); // Updated dependencies

    // Auto-Trigger Availability Check if data is present (from Chatbot)
    useEffect(() => {
        // Only run if not loading, vehicle loaded, and form data is present from URL
        if (!loading && vehicle && searchParams.get('startDate') && step === 1) {
            // Check if user is logged in
            const token = localStorage.getItem('token');
            if (!token) {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Login Required',
                    message: 'Please login to complete your booking. Redirecting...'
                });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                // Determine if we should auto-submit availability check
                // We use a small timeout to let state settle
                const timer = setTimeout(() => {
                    // Manually trigger the equivalent of handleCheckAvailability
                    // We can't call the function directly easily due to event param, so strict logic here
                    const check = async () => {
                        setProcessing(true);
                        try {
                            const response = await fetch('/api/bookings/check-availability', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    vehicleId,
                                    startDate: searchParams.get('startDate'), // Use direct URL param to be safe
                                    startTime: searchParams.get('startTime'),
                                    duration: searchParams.get('duration')
                                })
                            });
                            const data = await response.json();
                            if (response.ok) {
                                setStep(2); // Auto-advancing to payment
                            } else {
                                setPopup({
                                    isOpen: true,
                                    type: 'error',
                                    title: 'Not Available',
                                    message: data.message || 'Vehicle not available.'
                                });
                            }
                        } finally {
                            setProcessing(false);
                        }
                    };
                    check();
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [loading, vehicle, searchParams, step, navigate, vehicleId]);


    // Set min date to today
    const today = new Date().toISOString().split('T')[0];

    // Calculations
    const hourlyRate = vehicle ? (parseFloat(vehicle.price) || 0) : 0;
    const duration = parseInt(formData.duration) || 0;
    const totalAmount = hourlyRate * duration;

    // 30% Advance Payment
    const advancePercentage = 30;
    const advancePayment = Math.ceil((totalAmount * advancePercentage) / 100);
    const remainingAmount = totalAmount - advancePayment;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Step 1: Check Availability
    const handleCheckAvailability = async (e) => {
        if (e) e.preventDefault(); // Handle optional event for manual calls

        const token = localStorage.getItem('token');
        if (!token) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Login Required',
                message: 'You must be logged in to book a vehicle.'
            });
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('/api/bookings/check-availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    vehicleId,
                    startDate: formData.startDate,
                    startTime: formData.startTime,
                    duration: formData.duration
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStep(2); // Move to Payment Step
            } else {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Not Available',
                    message: data.message || data.error || 'Vehicle is not available for the selected time.'
                });
            }
        } catch (error) {
            console.error(error);
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to check availability. Please try again.'
            });
        } finally {
            setProcessing(false);
        }
    };

    // Step 2: Handle Payment
    const handlePayment = async () => {
        const token = localStorage.getItem('token');
        setProcessing(true);

        const bookingPayload = {
            vehicleId,
            vehicleType: apiType,
            vehicleName: vehicle?.name,
            ...formData
        };

        // Razorpay / booking logic continues here
        try {
            // 1. Create Order
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: advancePayment,
                    currency: 'INR',
                    receipt: `receipt_${Date.now()}`
                })
            });

            if (!orderRes.ok) {
                const errorData = await orderRes.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.details || errorData.message || `Server Error: ${orderRes.status}`);
            }
            const orderData = await orderRes.json();

            // 2. Open Razorpay
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RvUJ27UN65SU8w", // Use env var in real app
                amount: orderData.amount,
                currency: orderData.currency,
                name: "RentHub",
                description: `Advance for ${vehicle.name}`,
                image: "/photo/logo.png", // Add your logo path
                order_id: orderData.id,
                handler: async function (response) {
                    await confirmBooking(response, token);
                },
                prefill: {
                    name: "User Name", // You could fetch this from user context
                    email: "user@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Payment Failed',
                    message: response.error.description
                });
            });
            rzp1.open();

        } catch (error) {
            console.error(error);
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Payment Error',
                message: `Payment initiation failed: ${error.message}`
            });
        } finally {
            setProcessing(false);
        }
    };

    // Step 3: Confirm Booking (Backend)
    const confirmBooking = async (paymentResponse, token) => {
        setProcessing(true);
        try {
            const bookingPayload = {
                vehicleId,
                vehicleType: apiType,
                ...formData,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpaySignature: paymentResponse.razorpay_signature,
                advancePayment,
                remainingAmount,
                totalAmount
            };

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingPayload)
            });

            const data = await response.json();

            if (response.ok) {
                setBookingId(data.id); // Store booking ID
                setFormattedBookingId(data.booking_id); // Store formatted ID
                setStep(3); // Move to Success Step
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Booking Confirmed!',
                    message: `Booking ${data.booking_id || `#${data.id}`} successful. Check your email for details.`
                });
            } else {
                // Show detailed error if available
                const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'Booking confirmation failed');
                throw new Error(errorMessage);
            }
        } catch (error) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Finalization Error',
                message: error.message
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '2rem' }}>
            <div className="booking-container" style={{
                maxWidth: '800px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div className="booking-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                    <h1 style={{ margin: 0, color: '#333', fontSize: '1.8rem' }}>
                        {step === 1 ? 'Book Vehicle' : step === 2 ? 'Complete Payment' : 'Booking Confirmed'}
                    </h1>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#666', cursor: 'pointer' }}>&times;</button>
                </div>

                {/* Progress Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
                    {['Details', 'Payment', 'Done'].map((label, idx) => (
                        <div key={idx} style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                            <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: step > idx + 1 ? '#28a745' : step === idx + 1 ? '#007bff' : '#dee2e6',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px'
                            }}>
                                {step > idx + 1 ? '✓' : idx + 1}
                            </div>
                            <span style={{ fontSize: '0.9rem', color: step === idx + 1 ? '#007bff' : '#6c757d' }}>{label}</span>
                        </div>
                    ))}
                    <div style={{ position: 'absolute', top: '15px', left: '16%', right: '16%', height: '2px', background: '#dee2e6', zIndex: 0 }}>
                        <div style={{ width: `${(step - 1) * 50}%`, height: '100%', background: '#28a745', transition: 'width 0.3s' }}></div>
                    </div>
                </div>

                {/* Vehicle Summary (Small) */}
                <div className="vehicle-info" style={{ display: 'flex', gap: '1rem', background: '#f8f9fa', padding: '1rem', borderRadius: '4px', marginBottom: '2rem' }}>
                    <img src={vehicle.image_url} alt={vehicle.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{vehicle.name}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>₹{vehicle.price}/hour • {vehicle.fuel_type}</p>
                    </div>
                </div>

                {/* STEP 1: Details */}
                {step === 1 && (
                    <form onSubmit={handleCheckAvailability}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                    <i className="far fa-calendar-alt" style={{ marginRight: '8px', color: '#007bff' }}></i> Start Date
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    min={today}
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        backgroundColor: '#f9fafb',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        color: '#1f2937'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#007bff';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
                                        e.target.style.backgroundColor = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                        e.target.style.backgroundColor = '#f9fafb';
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                    <i className="far fa-clock" style={{ marginRight: '8px', color: '#007bff' }}></i> Start Time
                                </label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        backgroundColor: '#f9fafb',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        color: '#1f2937'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#007bff';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
                                        e.target.style.backgroundColor = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                        e.target.style.backgroundColor = '#f9fafb';
                                    }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                <i className="fas fa-hourglass-half" style={{ marginRight: '8px', color: '#007bff' }}></i> Duration (hours)
                            </label>
                            <input
                                type="number"
                                name="duration"
                                min="1"
                                max="672"
                                value={formData.duration}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    backgroundColor: '#f9fafb',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    color: '#1f2937'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#007bff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
                                    e.target.style.backgroundColor = '#ffffff';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e5e7eb';
                                    e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                    e.target.style.backgroundColor = '#f9fafb';
                                }}
                            />
                        </div>

                        <div className="price-details" style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '4px', margin: '1.5rem 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Total Amount:</span><strong>₹{totalAmount}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#007bff' }}><span>Advance Pay (30%):</span><strong>₹{advancePayment}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bbdefb', paddingTop: '0.5rem' }}><span>Remaining:</span><strong>₹{remainingAmount}</strong></div>
                        </div>

                        <button type="submit" disabled={processing} className="submit-btn" style={{ width: '100%', padding: '1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer' }}>
                            {processing ? 'Checking...' : 'Continue to Pay'}
                        </button>
                    </form>
                )}

                {/* STEP 2: Payment */}
                {step === 2 && (
                    <div>
                        <div style={{ padding: '1.5rem', background: '#fef3c7', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fcd34d' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#92400e' }}>Booking Summary</h3>
                            <p><strong>Date:</strong> {formData.startDate}</p>
                            <p><strong>Time:</strong> {formData.startTime}</p>
                            <p><strong>Duration:</strong> {formData.duration} hours</p>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#92400e' }}>Advance Amount to Pay:</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>₹{advancePayment}</span>
                            </div>
                        </div>

                        <button onClick={handlePayment} disabled={processing} style={{ width: '100%', padding: '1rem', background: '#d97706', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                            {processing ? 'Processing...' : <><i className="fas fa-lock"></i> Pay ₹{advancePayment} Now</>}
                        </button>
                        <button onClick={() => setStep(1)} style={{ width: '100%', marginTop: '1rem', padding: '0.8rem', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Back to Details</button>
                    </div>
                )}

                {/* STEP 3: Success */}
                {step === 3 && (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ width: '80px', height: '80px', background: '#d1e7dd', color: '#0f5132', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2.5rem' }}>
                            <i className="fas fa-check"></i>
                        </div>
                        <h2 style={{ color: '#0f5132' }}>Booking Confirmed!</h2>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>We've sent a confirmation email to you. Your vehicle is reserved.</p>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={async () => {
                                    if (!bookingId) {
                                        setPopup({
                                            isOpen: true,
                                            type: 'error',
                                            title: 'Error',
                                            message: 'Booking ID not found. Please try from My Bookings.'
                                        });
                                        return;
                                    }

                                    setDownloadingInvoice(true);
                                    try {
                                        const token = localStorage.getItem('token');
                                        const response = await fetch(`/api/bookings/${bookingId}/invoice`, {
                                            method: 'GET',
                                            headers: {
                                                'Authorization': `Bearer ${token}`
                                            }
                                        });

                                        if (!response.ok) {
                                            throw new Error('Failed to download invoice');
                                        }

                                        // Create blob from response
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);

                                        // Create temporary link and trigger download
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `invoice_${formattedBookingId || bookingId}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();

                                        // Cleanup
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);

                                        setPopup({
                                            isOpen: true,
                                            type: 'success',
                                            title: 'Success',
                                            message: 'Invoice downloaded successfully!'
                                        });
                                    } catch (error) {
                                        console.error('Error downloading invoice:', error);
                                        setPopup({
                                            isOpen: true,
                                            type: 'error',
                                            title: 'Download Failed',
                                            message: 'Failed to download invoice. Please try again or check My Bookings.'
                                        });
                                    } finally {
                                        setDownloadingInvoice(false);
                                    }
                                }}
                                disabled={downloadingInvoice}
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    background: downloadingInvoice ? '#6c757d' : '#0f5132',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: downloadingInvoice ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1rem',
                                    fontWeight: '500'
                                }}
                            >
                                <i className={downloadingInvoice ? 'fas fa-spinner fa-spin' : 'fas fa-print'}></i>
                                {downloadingInvoice ? 'Downloading...' : 'Print Invoice'}
                            </button>
                            <button onClick={() => navigate('/my-bookings')} style={{ padding: '0.8rem 1.5rem', background: '#0f5132', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>My Bookings</button>
                            <button onClick={() => navigate('/')} style={{ padding: '0.8rem 1.5rem', background: 'none', border: '1px solid #0f5132', color: '#0f5132', borderRadius: '4px', cursor: 'pointer' }}>Home</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Popup */}
            <StatusPopup
                isOpen={popup.isOpen}
                onClose={() => setPopup({ ...popup, isOpen: false })}
                type={popup.type}
                title={popup.title}
                message={popup.message}
            />
        </div>
    );
};

export default BookingForm;
