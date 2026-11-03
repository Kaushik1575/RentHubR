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
    
    // Zoom & Download State
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomScale, setZoomScale] = useState(1);

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

    // Keyboard support for closing zoom overlay
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isZoomed) {
                    setIsZoomed(false);
                } else if (isOpen) {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isZoomed, isOpen, onClose]);

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

    // Use actual Razorpay image_url / qrImageUrl directly
    const qrImageSource = qrData?.image_url || qrData?.qrImageUrl || qrData?.cleanQrImageUrl;

    const handleDownloadQr = async () => {
        if (!qrImageSource) return;
        const filename = `renthub-settlement-qr-${effectiveBookingId || 'booking'}.png`;
        try {
            const res = await fetch(qrImageSource);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch {
            // Fallback direct anchor click
            const a = document.createElement('a');
            a.href = qrImageSource;
            a.target = '_blank';
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    if (!isOpen) return null;

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
            padding: '12px',
            boxSizing: 'border-box'
        }}>
            <style>{`
                @keyframes pulseDot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.35; transform: scale(0.85); }
                }
                @keyframes rhSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .renthub-qr-modal-body::-webkit-scrollbar {
                    width: 5px;
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
                @media (max-width: 480px) {
                    .renthub-settlement-qr-img {
                        max-width: 280px !important;
                    }
                }
                @media (min-width: 481px) {
                    .renthub-settlement-qr-img {
                        max-width: 335px !important;
                    }
                }
            `}</style>

            {/* Main Modal Card */}
            <div style={{
                background: '#ffffff',
                borderRadius: '18px',
                width: '100%',
                maxWidth: '460px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
                position: 'relative',
                margin: 'auto'
            }}>
                {/* 1. Fixed Header (Always visible, close button does not overlap) */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                    padding: '14px 18px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ textAlign: 'left', paddingRight: '12px', minWidth: 0 }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            letterSpacing: '-0.2px',
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            Final Ride Settlement
                        </h2>
                        <p style={{
                            margin: '2px 0 0',
                            fontSize: '0.78rem',
                            color: '#dbeafe',
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
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        ✕
                    </button>
                </div>

                {/* 2. Scrollable Body Content (Single scroll, only when restricted) */}
                <div className="renthub-qr-modal-body" style={{
                    padding: '14px 18px',
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
                            {/* Remaining Balance Card (Prominent & Fixed Read-Only) */}
                            <div style={{
                                background: '#f8fafc',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '10px 14px',
                                marginBottom: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: '#64748b',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        display: 'block'
                                    }}>
                                        Remaining Balance to Collect
                                    </span>
                                    <div style={{
                                        color: '#0f172a',
                                        fontSize: '1.55rem',
                                        fontWeight: 900,
                                        lineHeight: 1.15
                                    }}>
                                        ₹{amount}
                                    </div>
                                </div>
                                <div style={{
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    padding: '4px 10px',
                                    borderRadius: '16px',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.3px'
                                }}>
                                    FIXED AMOUNT
                                </div>
                            </div>

                            {/* Clean QR Presentation Box (Large 320-360px Desktop / 260-300px Mobile with Quiet Zone) */}
                            <div style={{
                                background: '#ffffff',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '16px',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                                margin: '0 auto 10px',
                                width: 'fit-content',
                                maxWidth: '100%',
                                boxSizing: 'border-box'
                            }}>
                                {qrImageSource ? (
                                    <>
                                        <img
                                            src={qrImageSource}
                                            alt="Razorpay Dynamic UPI QR"
                                            className="renthub-settlement-qr-img"
                                            onClick={() => { setIsZoomed(true); setZoomScale(1); }}
                                            title="Click to zoom QR"
                                            style={{
                                                width: '100%',
                                                maxWidth: '335px',
                                                height: 'auto',
                                                aspectRatio: '1 / 1',
                                                objectFit: 'contain',
                                                display: 'block',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                imageRendering: '-webkit-optimize-contrast'
                                            }}
                                        />

                                        {/* Dedicated Zoom & Save QR Controls */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                            marginTop: '10px',
                                            width: '100%',
                                            justifyContent: 'center'
                                        }}>
                                            <button
                                                type="button"
                                                onClick={() => { setIsZoomed(true); setZoomScale(1); }}
                                                style={{
                                                    padding: '6px 14px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    color: '#1e40af',
                                                    background: '#eff6ff',
                                                    border: '1px solid #bfdbfe',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                                            >
                                                🔍 Zoom QR (Enlarge)
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleDownloadQr}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    color: '#475569',
                                                    background: '#f8fafc',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                title="Download original QR image"
                                                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                                            >
                                                ⬇️ Save
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{
                                        width: '260px',
                                        height: '260px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        gap: '8px'
                                    }}>
                                        <div style={{
                                            width: '26px',
                                            height: '26px',
                                            border: '3px solid #e2e8f0',
                                            borderTopColor: '#2563eb',
                                            borderRadius: '50%',
                                            animation: 'rhSpin 0.8s linear infinite'
                                        }} />
                                        Generating Dynamic QR...
                                    </div>
                                )}
                            </div>

                            {/* Scan Instruction & Supported Apps */}
                            <div style={{ marginBottom: '10px' }}>
                                <p style={{
                                    fontSize: '0.8rem',
                                    color: '#1e293b',
                                    fontWeight: 700,
                                    margin: '0 0 6px',
                                    lineHeight: 1.3
                                }}>
                                    Scan with Google Pay, PhonePe, Paytm or any supported UPI app
                                </p>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '5px',
                                    flexWrap: 'wrap'
                                }}>
                                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                                        <span key={app} style={{
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            {app}
                                        </span>
                                    ))}
                                </div>
                                <small style={{
                                    color: '#64748b',
                                    fontSize: '0.72rem',
                                    display: 'block',
                                    marginTop: '4px'
                                }}>
                                    Payee: <strong>RentHub Rentals</strong> ({qrData?.merchantVpa || 'renthub.rentals@okaxis'})
                                </small>
                            </div>

                            {/* Live Status Indicator & Expiration Notice */}
                            <div style={{
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                color: '#92400e',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                marginBottom: '10px'
                            }}>
                                <span style={{
                                    display: 'inline-block',
                                    width: '7px',
                                    height: '7px',
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
                                    fontSize: '0.76rem',
                                    marginBottom: '10px',
                                    fontWeight: 600
                                }}>
                                    {errorMsg}
                                </div>
                            )}

                            {/* Action Buttons: Copy Link & Verify Payment */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                <button
                                    type="button"
                                    onClick={handleCopyUpi}
                                    style={{
                                        flex: 1,
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#334155',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
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
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: verifying ? 'not-allowed' : 'pointer',
                                        opacity: verifying ? 0.75 : 1,
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {verifying ? 'Checking...' : '🔄 Verify Payment'}
                                </button>
                            </div>

                            {/* Test Simulation Option */}
                            <div style={{ paddingTop: '4px' }}>
                                <button
                                    type="button"
                                    onClick={handleSimulatePayment}
                                    disabled={verifying}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        fontSize: '0.7rem',
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

            {/* 3. Fullscreen / Centered QR Zoom Overlay */}
            {isZoomed && qrImageSource && (
                <div
                    role="dialog"
                    aria-label="Enlarged QR Preview"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        zIndex: 1000000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        boxSizing: 'border-box'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsZoomed(false);
                    }}
                >
                    {/* Zoom Top Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        maxWidth: '520px',
                        marginBottom: '14px',
                        padding: '8px 16px',
                        background: 'rgba(30, 41, 59, 0.85)',
                        borderRadius: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        boxSizing: 'border-box',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                                🔍 Enlarged UPI QR
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#93c5fd' }}>
                                Amount: ₹{amount} • Booking #{effectiveBookingId}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Zoom Out */}
                            <button
                                type="button"
                                onClick={() => setZoomScale(s => Math.max(0.8, Number((s - 0.2).toFixed(2))))}
                                disabled={zoomScale <= 0.8}
                                title="Zoom Out"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    border: 'none',
                                    color: '#ffffff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: zoomScale <= 0.8 ? 'not-allowed' : 'pointer',
                                    opacity: zoomScale <= 0.8 ? 0.4 : 1
                                }}
                            >
                                −
                            </button>

                            {/* Scale Display / Reset */}
                            <button
                                type="button"
                                onClick={() => setZoomScale(1)}
                                title="Reset to 100%"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    color: '#e2e8f0',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                {Math.round(zoomScale * 100)}%
                            </button>

                            {/* Zoom In */}
                            <button
                                type="button"
                                onClick={() => setZoomScale(s => Math.min(2.5, Number((s + 0.2).toFixed(2))))}
                                disabled={zoomScale >= 2.5}
                                title="Zoom In"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    border: 'none',
                                    color: '#ffffff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: zoomScale >= 2.5 ? 'not-allowed' : 'pointer',
                                    opacity: zoomScale >= 2.5 ? 0.4 : 1
                                }}
                            >
                                +
                            </button>

                            {/* Download Button */}
                            <button
                                type="button"
                                onClick={handleDownloadQr}
                                title="Download Original QR"
                                style={{
                                    background: '#059669',
                                    border: 'none',
                                    color: '#ffffff',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                ⬇️ Save
                            </button>

                            {/* Close Zoom */}
                            <button
                                type="button"
                                onClick={() => setIsZoomed(false)}
                                aria-label="Close Zoom"
                                title="Close Zoom Overlay (Esc)"
                                style={{
                                    background: 'rgba(239, 68, 68, 0.85)',
                                    border: 'none',
                                    color: '#ffffff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '4px'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Centered Large White Card with Quiet Zone */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        maxWidth: '92vw',
                        maxHeight: '75vh',
                        overflow: 'auto',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{
                            transform: `scale(${zoomScale})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img
                                src={qrImageSource}
                                alt="Razorpay Dynamic UPI QR (Enlarged)"
                                style={{
                                    width: '380px',
                                    maxWidth: '80vw',
                                    height: 'auto',
                                    aspectRatio: '1 / 1',
                                    objectFit: 'contain',
                                    display: 'block',
                                    imageRendering: '-webkit-optimize-contrast',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>

                        <div style={{ marginTop: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                                Scan with any UPI App: GPay • PhonePe • Paytm • BHIM
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                                Payee: <strong>RentHub Rentals</strong> ({qrData?.merchantVpa || 'renthub.rentals@okaxis'})
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettlementQRModal;
