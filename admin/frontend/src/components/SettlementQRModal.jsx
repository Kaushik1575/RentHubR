import React, { useState, useEffect, useRef } from 'react';

const SettlementQRModal = ({ isOpen, onClose, bookingId, initialData, onPaymentSuccess }) => {
    const effectiveBookingId = bookingId || initialData?.bookingId || initialData?.id || initialData?.paymentQr?.bookingId || '';
    
    const [qrData, setQrData] = useState(initialData?.paymentQr || null);
    const [amount, setAmount] = useState(
        initialData?.paymentQr?.amount || initialData?.totalPayable || initialData?.balance || 0
    );
    const [activeTab, setActiveTab] = useState('qr'); // 'qr' or 'flyer'
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

        // Start live auto-polling to detect when customer pays on GPay/PhonePe
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

    const displayQR = activeTab === 'flyer' 
        ? (qrData?.qrImageUrl || qrData?.cleanQrImageUrl) 
        : (qrData?.cleanQrImageUrl || qrData?.qrImageUrl);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, backdropFilter: 'blur(5px)', padding: '16px'
        }}>
            <style>{`
                @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.85); } }
            `}</style>
            
            <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '440px',
                maxHeight: '92vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                border: '1px solid #e2e8f0'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    padding: '20px 24px',
                    color: 'white',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    textAlign: 'center',
                    position: 'relative'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '16px', right: '16px',
                            background: 'rgba(255, 255, 255, 0.2)', border: 'none',
                            color: 'white', width: '32px', height: '32px', borderRadius: '50%',
                            fontSize: '18px', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    >
                        ✕
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
                        Final Ride Settlement
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                        Booking #{effectiveBookingId} • Fixed Amount UPI QR
                    </p>
                </div>

                {/* Body Content */}
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
                                <div style={{ color: '#065f46', fontSize: '1.9rem', fontWeight: 900, marginBottom: '4px' }}>
                                    ₹{amount}
                                </div>
                                <p style={{ color: '#047857', fontSize: '0.85rem', margin: 0 }}>
                                    Status: <strong>PAID IN FULL</strong> {txnId ? `• Ref: ${txnId}` : ''}
                                </p>
                            </div>

                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
                                The ride record has been updated to <strong>COMPLETED</strong> in Supabase. The customer has received their tax invoice via email.
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
                                padding: '14px 18px', marginBottom: '16px', display: 'flex',
                                justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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

                            {/* View Switcher if both clean QR and Razorpay card exist */}
                            {qrData?.cleanQrImageUrl && qrData?.qrImageUrl && (
                                <div style={{
                                    display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('qr')}
                                        style={{
                                            padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem',
                                            fontWeight: 700, border: 'none', cursor: 'pointer',
                                            background: activeTab === 'qr' ? '#2563eb' : '#f1f5f9',
                                            color: activeTab === 'qr' ? '#ffffff' : '#64748b'
                                        }}
                                    >
                                        📱 Crisp QR
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('flyer')}
                                        style={{
                                            padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem',
                                            fontWeight: 700, border: 'none', cursor: 'pointer',
                                            background: activeTab === 'flyer' ? '#2563eb' : '#f1f5f9',
                                            color: activeTab === 'flyer' ? '#ffffff' : '#64748b'
                                        }}
                                    >
                                        📄 Official Card
                                    </button>
                                </div>
                            )}

                            {/* Dynamic QR Code Card (Aspect Ratio Preserved) */}
                            <div style={{
                                background: '#ffffff',
                                border: '2px dashed #cbd5e1',
                                borderRadius: '18px',
                                padding: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '260px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                                marginBottom: '14px'
                            }}>
                                {displayQR ? (
                                    <img
                                        src={displayQR}
                                        alt="UPI Dynamic QR"
                                        style={{
                                            width: activeTab === 'flyer' ? '100%' : '240px',
                                            maxWidth: activeTab === 'flyer' ? '280px' : '240px',
                                            height: activeTab === 'flyer' ? 'auto' : '240px',
                                            maxHeight: '340px',
                                            objectFit: 'contain',
                                            display: 'block',
                                            borderRadius: '8px'
                                        }}
                                    />
                                ) : (
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                                        Generating Dynamic QR...
                                    </div>
                                )}
                            </div>

                            {/* Merchant & UPI App Badges */}
                            <div style={{ marginBottom: '14px' }}>
                                <p style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 700, margin: '0 0 6px' }}>
                                    Scan with any UPI app to pay:
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                                        <span key={app} style={{
                                            background: '#f1f5f9', color: '#475569', padding: '4px 10px',
                                            borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid #e2e8f0'
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
                                marginBottom: '14px'
                            }}>
                                <span style={{
                                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                                    backgroundColor: '#f59e0b', animation: 'pulseDot 1.5s infinite'
                                }}></span>
                                Live: Waiting for customer UPI payment...
                            </div>

                            {errorMsg && (
                                <div style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '12px', fontWeight: 600 }}>
                                    {errorMsg}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                <button
                                    onClick={handleCopyUpi}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '10px',
                                        border: '1px solid #cbd5e1', background: '#ffffff',
                                        color: '#334155', fontWeight: 700, fontSize: '0.85rem',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {copied ? '✅ Link Copied!' : '📋 Copy UPI Link'}
                                </button>

                                <button
                                    onClick={handleManualVerify}
                                    disabled={verifying}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '10px',
                                        border: 'none', background: '#2563eb',
                                        color: '#ffffff', fontWeight: 700, fontSize: '0.85rem',
                                        cursor: verifying ? 'not-allowed' : 'pointer',
                                        opacity: verifying ? 0.7 : 1
                                    }}
                                >
                                    {verifying ? 'Checking...' : '🔄 Verify Payment'}
                                </button>
                            </div>

                            {/* Test Simulation Helper (for Test Mode) */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                <button
                                    onClick={handleSimulatePayment}
                                    disabled={verifying}
                                    style={{
                                        background: 'none', border: 'none', color: '#64748b',
                                        fontSize: '0.72rem', textDecoration: 'underline', cursor: 'pointer'
                                    }}
                                >
                                    🧪 Simulate Successful Test Payment (Instant Verify)
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
