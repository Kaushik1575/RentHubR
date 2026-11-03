import React, { useState, useEffect, useRef } from 'react';
import getApiUrl from '../config/api';

const SettlementQRModal = ({ isOpen, onClose, bookingId, initialData, onPaymentSuccess }) => {
    const [qrData, setQrData] = useState(initialData?.paymentQr || null);
    const [amount, setAmount] = useState(initialData?.remainingAmount || initialData?.totalPayable || initialData?.balance || 0);
    const [isPaid, setIsPaid] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [txnId, setTxnId] = useState('');
    const pollIntervalRef = useRef(null);

    // Fetch fresh QR data
    useEffect(() => {
        if (!isOpen || !bookingId) return;

        let active = true;

        if (!initialData?.paymentQr) {
            fetch(getApiUrl('/api/payment/settlement-qr'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
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
                    if (active) setErrorMsg('Could not load payment QR: ' + err.message);
                });
        } else {
            setQrData(initialData.paymentQr);
            setAmount(initialData.remainingAmount || initialData.totalPayable || initialData.balance || initialData.paymentQr.amount);
        }

        // Live auto-polling to detect when payment completes
        pollIntervalRef.current = setInterval(() => {
            fetch(getApiUrl(`/api/payment/settlement-status/${bookingId}`))
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
    }, [isOpen, bookingId]);

    const handleCopyUpi = () => {
        const link = qrData?.upiIntentUrl || qrData?.paymentLinkUrl;
        if (link) {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleOpenUpiApp = () => {
        if (qrData?.upiIntentUrl) {
            window.location.href = qrData.upiIntentUrl;
        } else if (qrData?.paymentLinkUrl) {
            window.open(qrData.paymentLinkUrl, '_blank');
        }
    };

    const handleManualVerify = async () => {
        setVerifying(true);
        setErrorMsg('');
        try {
            const res = await fetch(getApiUrl('/api/payment/verify-settlement'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
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

    // Test mode payment simulation helper
    const handleSimulatePayment = async () => {
        setVerifying(true);
        try {
            const res = await fetch(getApiUrl('/api/payment/verify-settlement'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    paymentId: 'pay_test_simulated_' + Date.now(),
                    orderId: qrData?.orderId || qrData?.qrId
                })
            });
            const data = await res.json();
            if (data.isPaid) {
                setIsPaid(true);
                setTxnId(data.transactionId || 'SIMULATED_TEST_PAID');
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                if (onPaymentSuccess) onPaymentSuccess(data);
            }
        } catch (e) {
            setErrorMsg(e.message);
        } finally {
            setVerifying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        }}>
            <div style={{
                background: '#ffffff', borderRadius: '20px', maxWidth: '480px', width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', overflow: 'hidden',
                position: 'relative', border: '1px solid #e2e8f0', animation: 'fadeInScale 0.25s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    background: isPaid ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    padding: '24px 20px', color: '#ffffff', textAlign: 'center', position: 'relative'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)',
                            border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%',
                            fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        &times;
                    </button>
                    <div style={{ fontSize: '2.4rem', marginBottom: '4px' }}>
                        {isPaid ? '🎉' : '💳'}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        {isPaid ? 'Ride Settlement Paid!' : 'Pay Remaining Ride Balance'}
                    </h2>
                    <p style={{ margin: '6px 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                        Booking #{bookingId} • Fixed Amount UPI QR
                    </p>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', textAlign: 'center' }}>
                    {isPaid ? (
                        <div>
                            <div style={{
                                background: '#ecfdf5', border: '2px solid #a7f3d0', borderRadius: '16px',
                                padding: '20px', marginBottom: '20px'
                            }}>
                                <div style={{ color: '#047857', fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
                                    ✅ Payment Received & Verified!
                                </div>
                                <div style={{ color: '#065f46', fontSize: '1.8rem', fontWeight: 900, marginBottom: '4px' }}>
                                    ₹{amount}
                                </div>
                                <p style={{ color: '#047857', fontSize: '0.85rem', margin: 0 }}>
                                    Your ride is now <strong>COMPLETED</strong>.
                                </p>
                            </div>

                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                                Thank you for riding with RentHub! You can now download your final updated tax invoice from My Bookings.
                            </p>

                            <button
                                onClick={onClose}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                    background: '#10b981', color: 'white', fontWeight: 800, fontSize: '1rem',
                                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                Done & View Bookings
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* Amount Display */}
                            <div style={{
                                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px',
                                padding: '14px 18px', marginBottom: '18px', display: 'flex',
                                justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Exact Outstanding Balance
                                    </span>
                                    <div style={{ color: '#0f172a', fontSize: '1.6rem', fontWeight: 900 }}>
                                        ₹{amount}
                                    </div>
                                </div>
                                <div style={{
                                    background: '#dbeafe', color: '#1e40af', padding: '6px 12px',
                                    borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800
                                }}>
                                    FIXED AMOUNT
                                </div>
                            </div>

                            {/* Dynamic QR Code Card */}
                            <div style={{
                                background: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: '18px',
                                padding: '16px', display: 'inline-block', boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                                marginBottom: '16px'
                            }}>
                                {qrData?.qrImageUrl ? (
                                    <img
                                        src={qrData.qrImageUrl}
                                        alt="UPI Dynamic QR"
                                        style={{ width: '230px', height: '230px', display: 'block', borderRadius: '8px' }}
                                    />
                                ) : (
                                    <div style={{ width: '230px', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        Generating Dynamic QR...
                                    </div>
                                )}
                            </div>

                            {/* Mobile 1-Click Launch Button */}
                            <div style={{ marginBottom: '16px' }}>
                                <button
                                    onClick={handleOpenUpiApp}
                                    style={{
                                        width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                        color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                                    }}
                                >
                                    <span>📱</span> Pay with UPI App (GPay / PhonePe / Paytm)
                                </button>
                                <small style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginTop: '6px' }}>
                                    Pre-filled payee: <strong>RentHub Rentals</strong> ({qrData?.merchantVpa || 'renthub.rentals@okaxis'})
                                </small>
                            </div>

                            {/* Live Status Indicator */}
                            <div style={{
                                background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e',
                                borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem',
                                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                marginBottom: '16px'
                            }}>
                                <span style={{
                                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                                    backgroundColor: '#f59e0b', animation: 'pulse 1.5s infinite'
                                }}></span>
                                Live: Scan QR code to complete payment
                            </div>

                            {errorMsg && (
                                <div style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '12px', fontWeight: 600 }}>
                                    {errorMsg}
                                </div>
                            )}

                            {/* Secondary Buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <button
                                    onClick={handleCopyUpi}
                                    style={{
                                        padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1',
                                        background: '#f8fafc', color: '#334155', fontWeight: 700, fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {copied ? '✅ Link Copied!' : '📋 Copy UPI Link'}
                                </button>

                                <button
                                    onClick={handleManualVerify}
                                    disabled={verifying}
                                    style={{
                                        padding: '10px', borderRadius: '10px', border: 'none',
                                        background: '#10b981', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem',
                                        cursor: verifying ? 'wait' : 'pointer'
                                    }}
                                >
                                    {verifying ? 'Checking...' : '🔄 I Have Paid'}
                                </button>
                            </div>

                            {/* Test Simulation Helper */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '12px' }}>
                                <button
                                    onClick={handleSimulatePayment}
                                    disabled={verifying}
                                    style={{
                                        background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem',
                                        textDecoration: 'underline', cursor: 'pointer', padding: '4px'
                                    }}
                                >
                                    🧪 Test Mode: Simulate Payment Confirmation
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
