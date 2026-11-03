import React, { useState, useEffect, useRef } from 'react';

const SettlementQRModal = ({ isOpen, onClose, bookingId, initialData, onPaymentSuccess }) => {
    const effectiveBookingId = bookingId || initialData?.bookingId || initialData?.id || initialData?.paymentQr?.bookingId || '';
    
    const [qrData, setQrData] = useState(initialData?.paymentQr || null);
    const [amount, setAmount] = useState(
        initialData?.paymentQr?.amount || initialData?.totalPayable || initialData?.balance || 0
    );
    const [isPaid, setIsPaid] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [txnId, setTxnId] = useState('');
    const pollIntervalRef = useRef(null);

    // Sync props whenever modal opens or initialData changes
    useEffect(() => {
        if (!isOpen) return;

        if (initialData?.paymentQr) {
            setQrData(initialData.paymentQr);
            setAmount(initialData.paymentQr.amount || initialData.totalPayable || initialData.balance || 0);
        }

        if (!effectiveBookingId) return;

        let active = true;

        // Fetch fresh QR data if not already passed in
        if (!initialData?.paymentQr) {
            fetch('/api/payment/settlement-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: effectiveBookingId })
            })
                .then(res => res.json())
                .then(data => {
                    if (!active) return;
                    if (data.isPaid) {
                        setIsPaid(true);
                    } else if (data.paymentQr) {
                        setQrData(data.paymentQr);
                        setAmount(data.remainingAmount || data.paymentQr.amount);
                    }
                })
                .catch(err => {
                    if (active) setErrorMsg('Could not load QR code: ' + err.message);
                });
        }

        // Live polling to detect when customer completes payment on their UPI app
        pollIntervalRef.current = setInterval(() => {
            fetch(`/api/payment/settlement-status/${effectiveBookingId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.isPaid) {
                        setIsPaid(true);
                        clearInterval(pollIntervalRef.current);
                        if (onPaymentSuccess) onPaymentSuccess(data);
                    }
                })
                .catch(() => {});
        }, 2500);

        return () => {
            active = false;
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [isOpen, effectiveBookingId, initialData]);

    const handleCopyUpi = () => {
        const link = qrData?.upiIntentUrl || qrData?.paymentLinkUrl || qrData?.qrImageUrl;
        if (link) {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleManualVerify = async () => {
        setVerifying(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/payment/verify-settlement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: effectiveBookingId,
                    orderId: qrData?.orderId || qrData?.qrId
                })
            });
            const data = await res.json();
            if (data.isPaid) {
                setIsPaid(true);
                setTxnId(data.transactionId || 'UPI_SETTLED');
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                if (onPaymentSuccess) onPaymentSuccess(data);
            } else {
                setErrorMsg(data.message || 'Payment not detected yet. Please complete UPI payment.');
            }
        } catch (e) {
            setErrorMsg('Verification check failed: ' + e.message);
        } finally {
            setVerifying(false);
        }
    };

    const handleSimulatePayment = async () => {
        setVerifying(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/payment/verify-settlement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: effectiveBookingId,
                    orderId: qrData?.orderId || qrData?.qrId || 'test_order',
                    paymentId: 'pay_test_' + Date.now().toString(36),
                    simulate: true
                })
            });
            const data = await res.json();
            if (data.isPaid) {
                setIsPaid(true);
                setTxnId(data.transactionId || 'SIMULATED_TEST_PAYMENT');
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                if (onPaymentSuccess) onPaymentSuccess(data);
            } else {
                setErrorMsg('Simulation could not complete: ' + (data.message || 'unknown error'));
            }
        } catch (e) {
            setErrorMsg('Simulation failed: ' + e.message);
        } finally {
            setVerifying(false);
        }
    };

    if (!isOpen) return null;

    // Use cleanQrImageUrl (high-res pure QR) if available, otherwise direct Razorpay qrImageUrl
    const qrImageSource = qrData?.cleanQrImageUrl || qrData?.qrImageUrl;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
            boxSizing: 'border-box'
        }}>
            <style>{`
                @keyframes pulseDot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.35; transform: scale(0.85); }
                }
                .renthub-qr-modal-body::-webkit-scrollbar {
                    width: 6px;
                }
                .renthub-qr-modal-body::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 8px;
                }
                .renthub-qr-modal-body::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 8px;
                }
                .renthub-qr-modal-body::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>

            {/* Modal Card */}
            <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '440px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* 1. Fixed Header (Never Scrolls) */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                    padding: '16px 20px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ textAlign: 'left', paddingRight: '12px' }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            letterSpacing: '-0.3px',
                            color: '#ffffff'
                        }}>
                            Final Ride Settlement
                        </h2>
                        <p style={{
                            margin: '2px 0 0',
                            fontSize: '0.8rem',
                            color: '#e0e7ff',
                            fontWeight: 500
                        }}>
                            Booking #{effectiveBookingId} • Dynamic UPI QR
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: '#ffffff',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        ✕
                    </button>
                </div>

                {/* 2. Scrollable Body Content (Only Scrolls if Viewport is Restricted) */}
                <div className="renthub-qr-modal-body" style={{
                    padding: '18px 20px',
                    overflowY: 'auto',
                    flex: 1,
                    textAlign: 'center'
                }}>
                    {isPaid ? (
                        /* Payment Success State */
                        <div style={{ padding: '8px 0' }}>
                            <div style={{
                                background: '#ecfdf5',
                                border: '1.5px solid #a7f3d0',
                                borderRadius: '16px',
                                padding: '18px',
                                marginBottom: '16px'
                            }}>
                                <div style={{ color: '#047857', fontSize: '1.15rem', fontWeight: 800, marginBottom: '4px' }}>
                                    ✅ Payment Verified & Received!
                                </div>
                                <div style={{ color: '#065f46', fontSize: '1.8rem', fontWeight: 900, marginBottom: '4px' }}>
                                    ₹{amount}
                                </div>
                                <p style={{ color: '#047857', fontSize: '0.82rem', margin: 0, fontWeight: 600 }}>
                                    Status: <strong>PAID IN FULL</strong> {txnId ? `• Ref: ${txnId}` : ''}
                                </p>
                            </div>

                            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.5 }}>
                                The ride has been updated to <strong>COMPLETED</strong> in Supabase. The final invoice has been generated and emailed to the customer.
                            </p>

                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: '#10b981',
                                    color: '#ffffff',
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                Done & Close
                            </button>
                        </div>
                    ) : (
                        /* Active Payment QR State */
                        <div>
                            {/* Remaining Balance Card (Prominent & Read-Only) */}
                            <div style={{
                                background: '#f8fafc',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '14px',
                                padding: '10px 16px',
                                marginBottom: '14px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{
                                        fontSize: '0.72rem',
                                        color: '#64748b',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Remaining Balance to Collect
                                    </span>
                                    <div style={{
                                        color: '#0f172a',
                                        fontSize: '1.65rem',
                                        fontWeight: 900,
                                        lineHeight: 1.2
                                    }}>
                                        ₹{amount}
                                    </div>
                                </div>
                                <div style={{
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.3px'
                                }}>
                                    FIXED AMOUNT
                                </div>
                            </div>

                            {/* Clean QR Presentation Box (Intrinsic Aspect Ratio, High-Contrast White Background) */}
                            <div style={{
                                background: '#ffffff',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '16px',
                                padding: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                                marginBottom: '12px',
                                width: '100%',
                                maxWidth: '304px',
                                boxSizing: 'border-box'
                            }}>
                                {qrImageSource ? (
                                    <img
                                        src={qrImageSource}
                                        alt="Razorpay Dynamic UPI QR"
                                        style={{
                                            width: '100%',
                                            maxWidth: '280px',
                                            height: 'auto',
                                            aspectRatio: '1 / 1',
                                            objectFit: 'contain',
                                            display: 'block',
                                            borderRadius: '8px'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '240px',
                                        height: '240px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8',
                                        fontSize: '0.85rem',
                                        fontWeight: 600
                                    }}>
                                        Generating Dynamic QR...
                                    </div>
                                )}
                            </div>

                            {/* Scan Instruction & Supported Apps */}
                            <div style={{ marginBottom: '12px' }}>
                                <p style={{
                                    fontSize: '0.82rem',
                                    color: '#1e293b',
                                    fontWeight: 700,
                                    margin: '0 0 6px'
                                }}>
                                    Scan with Google Pay, PhonePe, Paytm or any supported UPI app:
                                </p>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    flexWrap: 'wrap'
                                }}>
                                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                                        <span key={app} style={{
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            {app}
                                        </span>
                                    ))}
                                </div>
                                <small style={{
                                    color: '#64748b',
                                    fontSize: '0.74rem',
                                    display: 'block',
                                    marginTop: '5px'
                                }}>
                                    Payee: <strong>RentHub Rentals</strong> ({qrData?.merchantVpa || 'renthub.rentals@okaxis'})
                                </small>
                            </div>

                            {/* Live Status Indicator & Expiration Notice */}
                            <div style={{
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                color: '#92400e',
                                borderRadius: '10px',
                                padding: '8px 12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <span style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f59e0b',
                                    animation: 'pulseDot 1.5s infinite',
                                    flexShrink: 0
                                }}></span>
                                <span>Live: Waiting for customer UPI payment...</span>
                            </div>

                            {errorMsg && (
                                <div style={{
                                    color: '#dc2626',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.78rem',
                                    marginBottom: '10px',
                                    fontWeight: 600
                                }}>
                                    {errorMsg}
                                </div>
                            )}

                            {/* Action Buttons: Copy Link & Verify Payment */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <button
                                    type="button"
                                    onClick={handleCopyUpi}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#334155',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {copied ? '✅ Link Copied!' : '📋 Copy UPI Link'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleManualVerify}
                                    disabled={verifying}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        cursor: verifying ? 'not-allowed' : 'pointer',
                                        opacity: verifying ? 0.75 : 1,
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {verifying ? 'Checking...' : '🔄 Verify Payment'}
                                </button>
                            </div>

                            {/* Test Simulation Option */}
                            <div style={{ paddingTop: '6px' }}>
                                <button
                                    type="button"
                                    onClick={handleSimulatePayment}
                                    disabled={verifying}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        fontSize: '0.72rem',
                                        textDecoration: 'underline',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🧪 Test Mode: Simulate Instant Verification
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettlementQRModal;
