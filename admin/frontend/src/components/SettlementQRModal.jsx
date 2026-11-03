import React, { useState, useEffect, useRef } from 'react';

const SettlementQRModal = ({ isOpen, onClose, bookingId, initialData, onPaymentSuccess }) => {
    const [qrData, setQrData] = useState(initialData?.paymentQr || null);
    const [amount, setAmount] = useState(initialData?.totalPayable || initialData?.balance || initialData?.paymentQr?.amount || 0);
    const [isPaid, setIsPaid] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [txnId, setTxnId] = useState('');
    const pollIntervalRef = useRef(null);

    // Fetch fresh QR data if not provided
    useEffect(() => {
        if (!isOpen || !bookingId) return;

        let active = true;

        if (!initialData?.paymentQr) {
            fetch('/api/payment/settlement-qr', {
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
                    if (active) setErrorMsg('Could not load QR code: ' + err.message);
                });
        } else {
            setQrData(initialData.paymentQr);
            setAmount(initialData.totalPayable || initialData.balance || initialData.paymentQr.amount);
        }

        // Start live auto-polling to detect when customer pays on GPay/PhonePe
        pollIntervalRef.current = setInterval(() => {
            fetch(`/api/payment/settlement-status/${bookingId}`)
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

    const handleManualVerify = async () => {
        setVerifying(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/payment/verify-settlement', {
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

    const handleSimulatePayment = async () => {
        setVerifying(true);
        try {
            const res = await fetch('/api/payment/verify-settlement', {
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
                        {isPaid ? '🎉' : '⚡'}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        {isPaid ? 'Ride Settlement Complete!' : 'Final Ride Settlement'}
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
                                    ✅ Payment Verified & Received!
                                </div>
                                <div style={{ color: '#065f46', fontSize: '1.8rem', fontWeight: 900, marginBottom: '4px' }}>
                                    ₹{amount}
                                </div>
                                <p style={{ color: '#047857', fontSize: '0.85rem', margin: 0 }}>
                                    Status: <strong>PAID IN FULL</strong> {txnId ? `• Ref: ${txnId}` : ''}
                                </p>
                            </div>

                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                                The ride record has been updated to <strong>COMPLETED</strong> in Supabase. The customer has received their completion confirmation and updated tax invoice.
                            </p>

                            <button
                                onClick={onClose}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                    background: '#10b981', color: 'white', fontWeight: 800, fontSize: '1rem',
                                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                Done & Close
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* Amount Highlight */}
                            <div style={{
                                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px',
                                padding: '14px 18px', marginBottom: '18px', display: 'flex',
                                justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Remaining Balance to Collect
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
                                        style={{ width: '240px', height: '240px', display: 'block', borderRadius: '8px' }}
                                    />
                                ) : (
                                    <div style={{ width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        Generating Dynamic QR...
                                    </div>
                                )}
                            </div>

                            {/* Merchant & UPI App Badges */}
                            <div style={{ marginBottom: '16px' }}>
                                <p style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 700, margin: '0 0 6px' }}>
                                    Scan with any UPI app to pay:
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                                        <span key={app} style={{
                                            background: '#f1f5f9', color: '#475569', padding: '4px 10px',
                                            borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #e2e8f0'
                                        }}>
                                            {app}
                                        </span>
                                    ))}
                                </div>
                                <small style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginTop: '6px' }}>
                                    Payee: <strong>RentHub Rentals</strong> ({qrData?.merchantVpa || 'renthub.rentals@okaxis'})
                                </small>
                            </div>

                            {/* Live Polling Status Indicator */}
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
                                Live: Waiting for customer UPI payment...
                            </div>

                            {errorMsg && (
                                <div style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '12px', fontWeight: 600 }}>
                                    {errorMsg}
                                </div>
                            )}

                            {/* Action Buttons */}
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
                                        background: '#2563eb', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem',
                                        cursor: verifying ? 'wait' : 'pointer'
                                    }}
                                >
                                    {verifying ? 'Checking...' : '🔄 Verify Payment'}
                                </button>
                            </div>

                            {/* Test Mode Simulation helper */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '12px' }}>
                                <button
                                    onClick={handleSimulatePayment}
                                    disabled={verifying}
                                    style={{
                                        background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem',
                                        textDecoration: 'underline', cursor: 'pointer', padding: '4px'
                                    }}
                                >
                                    🧪 Test Mode: Simulate Customer Payment Confirmation
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
