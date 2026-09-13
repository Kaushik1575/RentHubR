import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import StatusPopup from '../components/StatusPopup';
import TermsPopup from '../components/TermsPopup';
import './BookingTimeline.css';

// Helper function to format schedule dates and calculate return time
const getFormattedSchedule = (startDate, startTime, durationHours) => {
    if (!startDate) {
        return {
            pickup: 'Please select date & time',
            returnTime: 'Calculated once slot is chosen',
            durationText: `${durationHours || 2} Hours`
        };
    }

    try {
        const dateObj = new Date(startDate + 'T00:00:00');
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const dateFormatted = dateObj.toLocaleDateString('en-US', options);

        let pickupFormatted = dateFormatted;
        if (startTime) {
            const [h, m] = startTime.split(':');
            const hour = parseInt(h, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            pickupFormatted = `${dateFormatted} • ${hour12}:${m} ${ampm}`;
        }

        let returnFormatted = 'Select time & duration to calculate';
        if (startTime && durationHours) {
            const [h, m] = startTime.split(':');
            const startDateTime = new Date(startDate + `T${h}:${m}:00`);
            if (!isNaN(startDateTime.getTime())) {
                const returnDateTime = new Date(startDateTime.getTime() + durationHours * 3600000);
                const returnDateStr = returnDateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                const retHour = returnDateTime.getHours();
                const retM = String(returnDateTime.getMinutes()).padStart(2, '0');
                const retAmpm = retHour >= 12 ? 'PM' : 'AM';
                const retHour12 = retHour % 12 || 12;
                returnFormatted = `${returnDateStr} • ${retHour12}:${retM} ${retAmpm}`;
            }
        }

        const days = Math.floor(durationHours / 24);
        const remHours = durationHours % 24;
        let durationText = `${durationHours} Hours`;
        if (days > 0) {
            durationText = remHours > 0 ? `${days}d ${remHours}h` : `${days} Days`;
        }

        return {
            pickup: pickupFormatted,
            returnTime: returnFormatted,
            durationText
        };
    } catch (e) {
        return {
            pickup: startDate || 'Select date',
            returnTime: 'Calculated at checkout',
            durationText: `${durationHours || 2} Hours`
        };
    }
};

const BookingForm = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

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
    const [showTermsPopup, setShowTermsPopup] = useState(false); // State for custom Terms Popup

    // Loyalty Rewards
    const [rewards, setRewards] = useState([]);
    const [selectedReward, setSelectedReward] = useState(null);
    const [appliedOffer, setAppliedOffer] = useState(null); // For general offers
    const [couponInput, setCouponInput] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Fetch Rewards
            fetch('/api/user/rewards', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setRewards(data.rewards || []))
                .catch(err => console.error(err));

            // Loyalty nudge removed as per user request
        }
    }, []);

    const apiType = getApiType(vehicleType);

    // Initial Load
    useEffect(() => {
        // Auto-Fill from Availability Search or Chatbot
        const urlStartDate = searchParams.get('startDate');
        const urlStartTime = searchParams.get('startTime');
        const urlDuration = searchParams.get('duration');

        if (urlStartDate || urlStartTime || urlDuration) {
            setFormData(prev => ({
                ...prev,
                ...(urlStartDate ? { startDate: urlStartDate } : {}),
                ...(urlStartTime ? { startTime: urlStartTime } : {}),
                ...(urlDuration ? { duration: parseInt(urlDuration) || prev.duration } : {})
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

        // Auto-fill from Profile Return
        if (location.state?.autoApplyCode) {
            setCouponInput(location.state.autoApplyCode);
            // Optionally auto-click apply? For now, just pre-fill is safer/cleaner.
            // Or better: Simulate apply via effect?
            // Actually, waiting for user to click Apply is fine, or we can useEffect to apply it.
        }
    }, [vehicleId, apiType, navigate, searchParams, location.state]); // Updated dependencies

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
                setTimeout(() => navigate('/login', { state: { from: location } }), 2000);
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
    // Calculations with Reward
    const hourlyRate = vehicle ? (parseFloat(vehicle.price) || 0) : 0;
    const duration = parseInt(formData.duration) || 0;

    let baseTotal = hourlyRate * duration;
    let discountAmount = 0;

    // Handle Loyalty Rewards (e.g., RHD...)
    if (selectedReward && selectedReward.reward_type === 'FREE_2_HOUR_RIDE') {
        // First 2 hours are free, user pays for the rest
        discountAmount = Math.min(baseTotal, hourlyRate * 2);
    } 
    // Handle General Offers (e.g., SUMMER20)
    else if (appliedOffer) {
        if (appliedOffer.discount_percentage) {
            discountAmount = (baseTotal * appliedOffer.discount_percentage) / 100;
            if (appliedOffer.max_discount && discountAmount > appliedOffer.max_discount) {
                discountAmount = appliedOffer.max_discount;
            }
        } else if (appliedOffer.flat_discount) {
            discountAmount = Math.min(baseTotal, appliedOffer.flat_discount);
        }
    }

    let finalTotal = Math.max(0, baseTotal - discountAmount);

    // 30% Advance Payment
    const advancePercentage = 30;
    const advancePayment = Math.ceil((finalTotal * advancePercentage) / 100);
    const remainingAmount = finalTotal - advancePayment;

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
            setTimeout(() => navigate('/login', { state: { from: location } }), 2000);
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

        if (!termsAccepted) {
            setPopup({
                isOpen: true,
                type: 'warning',
                title: 'Terms & Conditions',
                message: 'Please accept the Terms and Conditions to proceed.'
            });
            return;
        }

        // Validation: Prevent booking less than 4 hours with free ride coupon
        if (selectedReward && selectedReward.reward_type === 'FREE_2_HOUR_RIDE' && duration < 4) {
            setPopup({
                isOpen: true,
                type: 'warning',
                title: '⚠️ Minimum 4 Hours Required',
                message: 'To use your Free 2-Hour Ride coupon, you must book for at least 4 hours. You\'ll get the first 2 hours FREE and pay for the remaining 2 hours!',
                customActions: (
                    <div style={{ marginTop: '15px', textAlign: 'center' }}>
                        <button
                            onClick={() => {
                                setFormData({ ...formData, duration: 4 });
                                setPopup({ ...popup, isOpen: false });
                            }}
                            style={{
                                padding: '12px 30px',
                                background: '#E57373',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}
                        >
                            Okay, Got it
                        </button>
                    </div>
                )
            });
            setProcessing(false);
            return;
        }

        setProcessing(true);

        const bookingPayload = {
            vehicleId,
            vehicleType: apiType,
            vehicleName: vehicle?.name,
            ...formData,
            rewardId: selectedReward ? selectedReward.id : null,
            // If strictly 0, send actualAdvancePayment as 0 to avoid validation check fail? 
            // The controller recalculates anyway.
        };

        // If amount is 0, skip Razorpay
        if (advancePayment === 0) {
            await confirmBooking({
                razorpay_payment_id: 'FREE_RIDE',
                razorpay_order_id: 'FREE_RIDE',
                razorpay_signature: 'FREE_RIDE'
            }, token, bookingPayload); // Pass payload explicitly to merge logic if needed
            return;
        }

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

            // Retrieve user details for prefill
            let userDetails = {};
            try {
                userDetails = JSON.parse(localStorage.getItem('user') || '{}');
                console.warn("Existing LocalStorage User:", userDetails); // Debugging (Warn for visibility)
            } catch (e) {
                console.warn("Failed to parse user details for Razorpay prefill");
            }

            const prefillData = {
                name: userDetails.fullName || userDetails.name || "User Name",
                email: userDetails.email || "user@example.com",
                contact: userDetails.phoneNumber || userDetails.phone || userDetails.contact || userDetails.mobile || "9999999999"
            };
            console.warn("Razorpay Prefill Data:", prefillData); // Debugging (Warn for visibility)

            // 2. Open Razorpay
            const options = {
                key: orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_S4F1Tr5A1dzGUj",
                amount: orderData.amount,
                currency: orderData.currency,
                name: "RentHub",
                description: `Advance for ${vehicle.name}`,
                image: "https://placehold.co/128x128.png?text=RentHub", // Use HTTPS placeholder to check if it fixes blocking
                order_id: orderData.id,
                handler: async function (response) {
                    await confirmBooking(response, token);
                },
                prefill: prefillData,
                modal: {
                    ondismiss: function () {
                        // Handle modal dismissal if needed
                        setProcessing(false);
                    },
                    escape: false,
                    backdropclose: false,
                    confirm_close: false
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
                rewardId: selectedReward ? selectedReward.id : null,
                couponCode: appliedOffer ? appliedOffer.code : null, // Pass the general coupon code
                advancePayment,
                remainingAmount,
                totalAmount: finalTotal
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

                // CRITICAL FIX: Add delay before changing state to allow Razorpay modal to close properly
                // This prevents "NotFoundError: Failed to execute 'removeChild' on 'Node'"
                setTimeout(() => {
                    setStep(3); // Move to Success Step
                    setPopup({
                        isOpen: true,
                        type: 'success',
                        title: 'Booking Confirmed!',
                        message: `Booking ${data.booking_id || `#${data.id}`} successful. Check your email for details.`
                    });
                }, 1500);
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

    const scheduleInfo = useMemo(() => {
        return getFormattedSchedule(formData.startDate, formData.startTime, formData.duration);
    }, [formData.startDate, formData.startTime, formData.duration]);

    if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#0f172a', fontWeight: '600' }}>Loading vehicle details...</div>;

    return (
        <div className="booking-page-wrapper">
            {/* Ambient Floating Decorative Glows */}
            <div className="ambient-blob blob-emerald" aria-hidden="true"></div>
            <div className="ambient-blob blob-purple" aria-hidden="true"></div>

            {/* Added 'notranslate' class to prevent Google Translate from breaking React DOM updates */}
            <div className="booking-master-card notranslate">
                
                {/* ================================================================= */}
                {/* LEFT PANEL: INTERACTIVE TIMELINE & RIDE INTELLIGENCE              */}
                {/* ================================================================= */}
                <div className="booking-timeline-panel">
                    <div>
                        {/* Vehicle Identity Card with Floating Hover Effect */}
                        <div className="timeline-vehicle-card">
                            <div className="timeline-vehicle-img-wrap">
                                <img
                                    src={vehicle.image_url}
                                    alt={vehicle.name}
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80?text=Vehicle'; }}
                                    className="timeline-vehicle-img"
                                />
                            </div>
                            <div className="timeline-vehicle-meta">
                                <div className="timeline-vehicle-badge-row">
                                    <span className="timeline-type-pill">
                                        {apiType === 'cars' ? '🚗 Car' : apiType === 'scooty' ? '🛵 Scooty' : '🏍️ Bike'}
                                    </span>
                                    <span className="timeline-rating-pill">
                                        <i className="fas fa-star"></i> 4.9
                                    </span>
                                </div>
                                <h3 className="timeline-vehicle-name" title={vehicle.name}>{vehicle.name}</h3>
                                <p className="timeline-vehicle-price">
                                    <span className="timeline-price-accent">₹{vehicle.price}</span> / hr
                                    {vehicle.fuel_type && <span>• {vehicle.fuel_type}</span>}
                                </p>
                            </div>
                        </div>

                        {/* Timeline Header */}
                        <div className="timeline-section-header">
                            <span className="timeline-section-title">
                                <i className="fas fa-route"></i> Journey Timeline
                            </span>
                            <span className="timeline-step-indicator">
                                <span className="indicator-pulse-dot"></span>
                                {step === 1 ? 'Step 1: Timing' : step === 2 ? 'Step 2: Payment' : 'Step 3: Confirmed ✓'}
                            </span>
                        </div>

                        {/* Vertical Timeline Stream - Pure, Animated & Vibrant */}
                        <div className="booking-timeline-stream">
                            
                            {/* STEP 1: Schedule & Timing */}
                            <div className={`timeline-node ${step > 1 ? 'node-completed' : 'node-active'} node-theme-emerald`}>
                                <div className="timeline-node-icon-wrap node-color-emerald">
                                    <i className={step > 1 ? "fas fa-check" : "far fa-calendar-alt"}></i>
                                </div>
                                <div className="timeline-node-content">
                                    <span className="timeline-node-step-tag tag-emerald">STEP 01</span>
                                    <h4 className="timeline-node-title">Schedule & Timing</h4>
                                    <p className="timeline-node-desc">Pick start date, time & rental duration</p>
                                    <span className={`timeline-node-badge ${step > 1 ? 'badge-completed' : 'badge-emerald'}`}>
                                        {step > 1 ? '✓ Configured' : '● In Progress'}
                                    </span>
                                </div>
                            </div>

                            {/* STEP 2: Token Advance & Pricing */}
                            <div className={`timeline-node ${step === 3 ? 'node-completed' : step === 2 ? 'node-active' : 'node-upcoming'} node-theme-amber`}>
                                <div className="timeline-node-icon-wrap node-color-amber">
                                    <i className={step === 3 ? "fas fa-check" : "fas fa-wallet"}></i>
                                </div>
                                <div className="timeline-node-content">
                                    <span className="timeline-node-step-tag tag-amber">STEP 02</span>
                                    <h4 className="timeline-node-title">Advance Token (30%)</h4>
                                    <p className="timeline-node-desc">Lock your vehicle with secure token</p>
                                    <span className={`timeline-node-badge ${step === 3 ? 'badge-completed' : step === 2 ? 'badge-active' : 'badge-amber'}`}>
                                        {step === 3 ? '✓ Paid' : step === 2 ? '● Ready to Pay' : '🔒 30% Token'}
                                    </span>
                                </div>
                            </div>

                            {/* STEP 3: Safety & Verification */}
                            <div className={`timeline-node ${step === 3 ? 'node-completed' : 'node-active'} node-theme-blue`}>
                                <div className="timeline-node-icon-wrap node-color-blue">
                                    <i className={step === 3 ? "fas fa-check" : "fas fa-shield-alt"}></i>
                                </div>
                                <div className="timeline-node-content">
                                    <span className="timeline-node-step-tag tag-blue">STEP 03</span>
                                    <h4 className="timeline-node-title">Protection & Verification</h4>
                                    <p className="timeline-node-desc">Valid Driving License & 24/7 AI SOS included</p>
                                    <span className="timeline-node-badge badge-blue">
                                        🛡️ Guaranteed
                                    </span>
                                </div>
                            </div>

                            {/* STEP 4: Handover & QR Gate-Pass */}
                            <div className={`timeline-node ${step === 3 ? 'node-completed' : 'node-upcoming'} node-theme-purple`}>
                                <div className="timeline-node-icon-wrap node-color-purple">
                                    <i className={step === 3 ? "fas fa-check" : "fas fa-qrcode"}></i>
                                </div>
                                <div className="timeline-node-content">
                                    <span className="timeline-node-step-tag tag-purple">STEP 04</span>
                                    <h4 className="timeline-node-title">Instant Digital Pass</h4>
                                    <p className="timeline-node-desc">Contactless hub check-in & deed invoice</p>
                                    <span className={`timeline-node-badge ${step === 3 ? 'badge-completed' : 'badge-purple'}`}>
                                        {step === 3 ? '✓ Issued' : '⚡ Instant At Hub'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Guarantees Footer */}
                    <div className="timeline-guarantees-footer">
                        <div className="timeline-guarantee-item">
                            <div className="timeline-guarantee-icon icon-bolt"><i className="fas fa-bolt"></i></div>
                            <span>Instant booking confirmation & contactless handover</span>
                        </div>
                        <div className="timeline-guarantee-item">
                            <div className="timeline-guarantee-icon icon-support"><i className="fas fa-headset"></i></div>
                            <span>RentHub 24x7 Roadside Voice AI SOS ('Aarohi')</span>
                        </div>
                    </div>
                </div>

                {/* ================================================================= */}
                {/* RIGHT PANEL: ACTIONS, FORMS & PAYMENT GATEWAY                     */}
                {/* ================================================================= */}
                <div className="booking-form-panel">
                    <div>
                        {/* Top Navigation */}
                        <div className="booking-panel-top-nav">
                            <h1 className="booking-form-header-title">
                                <i className={step === 1 ? "far fa-calendar-check" : step === 2 ? "fas fa-lock" : "fas fa-badge-check"} style={{ color: '#059669' }}></i>
                                {step === 1 ? 'Configure Rental Slot' : step === 2 ? 'Complete Payment' : 'Booking Confirmed!'}
                            </h1>
                            <button onClick={() => navigate(-1)} className="booking-close-btn" title="Back to vehicle">&times;</button>
                        </div>

                        {/* Top Stepper */}
                        <div className="booking-top-stepper">
                            <div 
                                className="booking-top-stepper-progress" 
                                style={{ width: `${(step - 1) * 50}%` }}
                            ></div>
                            {[
                                { num: 1, label: 'Trip Timing' },
                                { num: 2, label: 'Secure Token' },
                                { num: 3, label: 'Ready & Pass' }
                            ].map((s) => (
                                <div 
                                    key={s.num} 
                                    className={`stepper-item ${step > s.num ? 'stepper-completed' : step === s.num ? 'stepper-active' : ''}`}
                                >
                                    <div className="stepper-circle">
                                        {step > s.num ? '✓' : s.num}
                                    </div>
                                    <span className="stepper-label">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* STEP 1: Details */}
                        {step === 1 && (
                            <form onSubmit={handleCheckAvailability}>
                                <div className="booking-datetime-grid">
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.92rem' }}>
                                            <i className="far fa-calendar-alt" style={{ marginRight: '8px', color: '#059669' }}></i> Pickup Date
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            min={today}
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            required
                                            className="booking-input-field"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.92rem' }}>
                                            <i className="far fa-clock" style={{ marginRight: '8px', color: '#059669' }}></i> Pickup Time
                                        </label>
                                        <input
                                            type="time"
                                            name="startTime"
                                            value={formData.startTime}
                                            onChange={handleChange}
                                            required
                                            className="booking-input-field"
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.92rem', margin: 0 }}>
                                            <i className="fas fa-hourglass-half" style={{ marginRight: '8px', color: '#059669' }}></i> Rental Duration (hours)
                                        </label>
                                        <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '500' }}>
                                            {scheduleInfo.durationText}
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        name="duration"
                                        min="1"
                                        max="672"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        required
                                        className="booking-input-field"
                                    />
                                    
                                    {/* Quick Duration Preset Pills */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                        {[2, 4, 8, 12, 24, 48].map((h) => (
                                            <button
                                                key={h}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, duration: h })}
                                                className={`preset-pill-btn preset-pill-${h} ${Number(formData.duration) === h ? 'active' : ''}`}
                                            >
                                                {h < 24 ? `${h} hrs` : `${h / 24} days`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Coupon / Offers Box */}
                                <div className="booking-summary-box">
                                    <div style={{ marginBottom: '14px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1e293b', fontSize: '0.88rem' }}>
                                            <i className="fas fa-tag" style={{ marginRight: '6px', color: '#059669' }}></i> Have a Coupon Code?
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                placeholder="e.g. SUMMER20 or RHD..."
                                                value={couponInput}
                                                onChange={(e) => {
                                                    setCouponInput(e.target.value.toUpperCase());
                                                    if (e.target.value === '') setSelectedReward(null);
                                                }}
                                                style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', flex: 1, textTransform: 'uppercase', fontSize: '0.9rem', outline: 'none', background: '#ffffff' }}
                                            />
                                            <button
                                                type="button"
                                                disabled={processing}
                                                onClick={async () => {
                                                    const code = couponInput.trim();
                                                    if (!code) return;

                                                    setProcessing(true);
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        
                                                        if (!token) {
                                                            setPopup({ 
                                                                isOpen: true, 
                                                                type: 'error', 
                                                                title: 'Login Required', 
                                                                message: 'Please login to apply coupons and view your rewards.',
                                                                isLoginNudge: true 
                                                            });
                                                            setProcessing(false);
                                                            return;
                                                        }

                                                        // 1. Try General Offers first
                                                        const offerRes = await fetch('/api/offers/validate', {
                                                            method: 'POST',
                                                            headers: { 
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ 
                                                                code, 
                                                                bookingDetails: {
                                                                    duration, 
                                                                    vehicleCategory: apiType,
                                                                    totalAmount: baseTotal,
                                                                    startDate: formData.startDate,
                                                                    startTime: formData.startTime
                                                                }
                                                            })
                                                        });

                                                        const offerData = await offerRes.json();

                                                        if (offerRes.ok && offerData.success) {
                                                            const offer = offerData.offer;
                                                            setAppliedOffer(offer);
                                                            setSelectedReward(null);
                                                            
                                                            let successMsg = `Coupon '${offer.code}' applied successfully!`;
                                                            if (offer.usage_limit_per_user === 1) {
                                                                successMsg += " (Note: This is a one-time use offer)";
                                                            }
                                                            
                                                            setPopup({ isOpen: true, type: 'success', title: 'Applied!', message: successMsg });
                                                        } else {
                                                            // 2. Fallback to Loyalty Rewards
                                                            const reward = rewards.find(r => r.coupon_code === code && !r.is_used);
                                                            
                                                            if (reward) {
                                                                if (reward.reward_type === 'FREE_2_HOUR_RIDE') {
                                                                    if (duration < 4) {
                                                                        setPopup({
                                                                            isOpen: true,
                                                                            type: 'warning',
                                                                            title: '⚠️ Minimum 4 Hours Required',
                                                                            message: 'To use your Free 2-Hour Ride coupon, you must book for at least 4 hours.',
                                                                            customActions: (
                                                                                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setFormData({ ...formData, duration: 4 });
                                                                                            setSelectedReward(reward);
                                                                                            setAppliedOffer(null);
                                                                                            setPopup({ isOpen: false });
                                                                                        }}
                                                                                        style={{ padding: '12px 30px', background: '#E57373', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}
                                                                                    >
                                                                                        Okay, Got it
                                                                                    </button>
                                                                                </div>
                                                                            )
                                                                        });
                                                                    } else {
                                                                        setSelectedReward(reward);
                                                                        setAppliedOffer(null);
                                                                        setPopup({ isOpen: true, type: 'success', title: 'Applied!', message: 'Coupon Applied: Free 2-Hour Ride' });
                                                                    }
                                                                } else {
                                                                    setPopup({ isOpen: true, type: 'error', title: 'Invalid', message: 'This coupon is not applicable.' });
                                                                }
                                                            } else {
                                                                const isLimit = offerData.error?.includes('used this coupon once');
                                                                const isExpired = offerData.error?.toLowerCase().includes('expired');
                                                                setPopup({ 
                                                                    isOpen: true, 
                                                                    type: 'error', 
                                                                    title: isExpired ? 'Offer Expired' : (isLimit ? 'Offer Limit Reached' : 'Offer Not Applicable'), 
                                                                    message: offerData.error || 'Invalid or used coupon code.' 
                                                                });
                                                            }
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to validate coupon.' });
                                                    } finally {
                                                        setProcessing(false);
                                                    }
                                                }}
                                                style={{ padding: '8px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: processing ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.88rem', transition: 'all 0.15s ease' }}
                                            >
                                                {processing ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                        {selectedReward && <small style={{ color: '#059669', fontWeight: '700', marginTop: '6px', display: 'block' }}>✅ Reward '{selectedReward.coupon_code}' Applied!</small>}
                                        {appliedOffer && <small style={{ color: '#059669', fontWeight: '700', marginTop: '6px', display: 'block' }}>✅ Offer '{appliedOffer.code}' Applied!</small>}
                                    </div>

                                    {/* Financial Breakdown */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.96rem', color: '#475569' }}>
                                        <span>Base Total ({duration} hrs):</span>
                                        <strong style={{ color: '#0f172a', fontSize: '1.02rem' }}>
                                            {selectedReward ? <s style={{ color: '#94a3b8', marginRight: '6px' }}>₹{baseTotal}</s> : null}
                                            ₹{finalTotal}
                                        </strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', color: '#065f46', background: '#ecfdf5', padding: '9px 14px', borderRadius: '10px', border: '1px solid #a7f3d0', fontSize: '0.98rem' }}>
                                        <span style={{ fontWeight: 700 }}>Advance Token (30% to reserve):</span>
                                        <strong style={{ fontSize: '1.12rem', color: '#047857' }}>₹{advancePayment}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', color: '#64748b', fontSize: '0.92rem' }}>
                                        <span>Remaining at Pickup Hub (70%):</span>
                                        <strong style={{ color: '#334155' }}>₹{remainingAmount}</strong>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="btn-primary-action"
                                >
                                    {processing ? 'Checking Availability...' : <>Continue to Payment <i className="fas fa-arrow-right" style={{ fontSize: '0.9rem' }}></i></>}
                                </button>
                            </form>
                        )}

                        {/* STEP 2: Payment */}
                        {step === 2 && (
                            <div>
                                <div style={{ padding: '1.5rem', background: '#fffbeb', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #fef3c7' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#92400e', fontSize: '1.1rem' }}>
                                        <i className="fas fa-clipboard-check" style={{ marginRight: '8px' }}></i> Booking Summary
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem', color: '#451a03' }}>
                                        <p style={{ margin: 0 }}><strong>Date:</strong> {formData.startDate}</p>
                                        <p style={{ margin: 0 }}><strong>Time:</strong> {formData.startTime}</p>
                                        <p style={{ margin: 0 }}><strong>Duration:</strong> {scheduleInfo.durationText}</p>
                                        <p style={{ margin: 0 }}><strong>Est. Return:</strong> {scheduleInfo.returnTime}</p>
                                    </div>
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#92400e', fontWeight: 600 }}>Advance Amount to Pay:</span>
                                        <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#d97706' }}>₹{advancePayment}</span>
                                    </div>
                                </div>

                                <div style={{
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px',
                                    background: '#f8fafc',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <input
                                        type="checkbox"
                                        id="termsCheckbox"
                                        checked={termsAccepted}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setShowTermsPopup(true);
                                            } else {
                                                setTermsAccepted(false);
                                            }
                                        }}
                                        style={{
                                            marginTop: '3px',
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer',
                                            accentColor: '#059669'
                                        }}
                                    />
                                    <label
                                        htmlFor="termsCheckbox"
                                        style={{ fontSize: '0.9rem', color: '#334155', cursor: 'pointer', lineHeight: '1.5' }}
                                        onClick={(e) => {
                                            if (!termsAccepted) {
                                                e.preventDefault();
                                                setShowTermsPopup(true);
                                            }
                                        }}
                                    >
                                        I agree to the <span
                                            style={{ color: '#059669', textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}
                                        >Terms and Conditions</span>. I confirm that I possess a valid driving license for pickup verification.
                                    </label>
                                </div>

                                {/* Terms Popup */}
                                <TermsPopup
                                    isOpen={showTermsPopup}
                                    onClose={() => setShowTermsPopup(false)}
                                    onAccept={() => {
                                        setTermsAccepted(true);
                                        setShowTermsPopup(false);
                                    }}
                                    onDecline={() => {
                                        setTermsAccepted(false);
                                        setShowTermsPopup(false);
                                    }}
                                />

                                <button
                                    onClick={handlePayment}
                                    disabled={processing}
                                    className="btn-primary-action"
                                >
                                    {processing ? 'Processing Payment...' : <><i className="fas fa-lock"></i> Pay ₹{advancePayment} Advance Now</>}
                                </button>
                                
                                <button
                                    onClick={() => setStep(1)}
                                    style={{
                                        width: '100%',
                                        marginTop: '0.8rem',
                                        padding: '0.75rem',
                                        background: 'none',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    ← Back to Details
                                </button>
                            </div>
                        )}

                        {/* STEP 3: Success */}
                        {step === 3 && (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                                <div style={{
                                    width: '76px',
                                    height: '76px',
                                    background: '#dcfce7',
                                    color: '#16a34a',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.25rem',
                                    fontSize: '2.4rem',
                                    boxShadow: '0 0 20px rgba(22, 163, 74, 0.2)'
                                }}>
                                    <i className="fas fa-check"></i>
                                </div>
                                <h2 style={{ color: '#166534', margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: '800' }}>
                                    Booking Confirmed!
                                </h2>
                                <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                    We've dispatched confirmation details to your email. Your vehicle is reserved.
                                </p>

                                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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

                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);

                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `invoice_${formattedBookingId || bookingId}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();

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
                                            padding: '0.8rem 1.4rem',
                                            background: downloadingInvoice ? '#64748b' : '#166534',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: downloadingInvoice ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.95rem',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <i className={downloadingInvoice ? 'fas fa-spinner fa-spin' : 'fas fa-print'}></i>
                                        {downloadingInvoice ? 'Downloading...' : 'Print Deed & Invoice'}
                                    </button>
                                    <button onClick={() => navigate('/my-bookings')} style={{ padding: '0.8rem 1.4rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>My Bookings</button>
                                    <button onClick={() => navigate('/')} style={{ padding: '0.8rem 1.4rem', background: 'none', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>Home</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Status Popup */}
            <StatusPopup
                isOpen={popup.isOpen}
                onClose={() => setPopup({ ...popup, isOpen: false })}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                // Custom Actions for Smart Nudge
                customActions={popup.isNudge || popup.isLoginNudge ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {popup.isLoginNudge ? (
                            <button
                                onClick={() => navigate('/login', { state: { returnUrl: location.pathname + location.search } })}
                                style={{ padding: '10px 20px', background: '#d97706', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', flex: 1, minWidth: '120px' }}
                            >
                                Login Now
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/rewards', { state: { returnUrl: location.pathname + location.search } })}
                                style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', flex: 1, minWidth: '120px' }}
                            >
                                Go to Rewards & Redeem
                            </button>
                        )}
                        <button onClick={() => setPopup({ ...popup, isOpen: false })} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', flex: 1, minWidth: '120px' }}>
                            Maybe Later
                        </button>
                    </div>
                ) : null}
            />
        </div >
    );
};

export default BookingForm;
