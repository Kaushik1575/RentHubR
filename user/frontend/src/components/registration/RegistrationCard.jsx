import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    Gift,
    Megaphone,
    ChevronDown,
    ArrowRight,
    Check
} from 'lucide-react';
import StatusPopup from '../StatusPopup';
import './registration.css';

const hearAboutOptions = [
    'Google Search',
    'Social Media',
    'Friend Referral',
    'WhatsApp/Telegram',
    'Online Advertisement',
    'YouTube',
    'Other'
];

const RegistrationCard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Form fields state
    const [formData, setFormData] = useState({
        fullName: searchParams.get('fullName') || '',
        email: searchParams.get('email') || '',
        phoneNumber: searchParams.get('phoneNumber') || '',
        password: '',
        confirmPassword: '',
        referralCode: searchParams.get('ref') || localStorage.getItem('referralCode') || '',
        hearAboutUs: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // OTP States for Email & Mobile
    const [emailOtp, setEmailOtp] = useState('');
    const [mobileOtp, setMobileOtp] = useState('');
    const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
    const [showMobileOtpInput, setShowMobileOtpInput] = useState(false);
    const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
    const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
    const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
    const [isVerifyingMobileOtp, setIsVerifyingMobileOtp] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [mobileVerified, setMobileVerified] = useState(false);

    // Inline errors
    const [errors, setErrors] = useState({});

    // Status Popup modal
    const [popup, setPopup] = useState({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    });

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Send Email OTP
    const handleSendEmailOtp = async () => {
        const cleanEmail = formData.email.trim();
        if (!cleanEmail) {
            setErrors(prev => ({ ...prev, email: 'Please enter your email address first' }));
            return;
        }
        if (!isValidEmail(cleanEmail)) {
            setErrors(prev => ({ ...prev, email: 'Please enter a valid email address (e.g. name@example.com)' }));
            return;
        }

        setIsSendingEmailOtp(true);
        setEmailOtp('');
        setEmailVerified(false);

        try {
            const r = await fetch('/api/register/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail })
            });
            const j = await r.json();

            if (r.ok) {
                setShowEmailOtpInput(true);
                setEmailOtp('');
                setErrors(prev => ({ ...prev, email: '' }));
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Email OTP Sent',
                    message: 'A 6-digit verification code has been sent to your email address.'
                });
            } else {
                setErrors(prev => ({ ...prev, email: j.error || 'Failed to send OTP' }));
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Unable to Send OTP',
                    message: j.error || 'Failed to send OTP. Please check your email and try again.'
                });
            }
        } catch (err) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Network Error',
                message: 'Could not connect to server. Please try again later.'
            });
        } finally {
            setIsSendingEmailOtp(false);
        }
    };

    // Verify Email OTP
    const handleVerifyEmailOtp = async (codeToVerify) => {
        const otpVal = codeToVerify || emailOtp;
        if (!otpVal || otpVal.length < 4) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Invalid OTP',
                message: 'Please enter the 6-digit OTP received in your email.'
            });
            return;
        }

        setIsVerifyingEmailOtp(true);
        try {
            const r = await fetch('/api/register/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'email',
                    identifier: formData.email.trim(),
                    otp: otpVal
                })
            });
            const j = await r.json();

            if (r.ok) {
                setEmailVerified(true);
                setShowEmailOtpInput(false);
                setErrors(prev => ({ ...prev, email: '' }));
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Email Verified',
                    message: 'Your email has been verified successfully!'
                });

                // Auto-trigger mobile OTP if phone number is present and not verified
                if (formData.phoneNumber && !mobileVerified && !showMobileOtpInput) {
                    setTimeout(() => {
                        handleSendMobileOtp();
                    }, 400);
                }
            } else {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Verification Failed',
                    message: j.error || 'Invalid or expired OTP. Please try again.'
                });
            }
        } catch (err) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Network Error',
                message: 'Could not verify OTP. Please try again later.'
            });
        } finally {
            setIsVerifyingEmailOtp(false);
        }
    };

    // Send Mobile OTP
    const handleSendMobileOtp = async () => {
        const cleanPhone = formData.phoneNumber.trim();
        if (!cleanPhone) {
            setErrors(prev => ({ ...prev, phoneNumber: 'Please enter your phone number first' }));
            return;
        }
        if (cleanPhone.replace(/\D/g, '').length < 10) {
            setErrors(prev => ({ ...prev, phoneNumber: 'Enter a valid 10-digit mobile number' }));
            return;
        }

        setIsSendingMobileOtp(true);
        setMobileOtp('');
        setMobileVerified(false);

        try {
            const r = await fetch('/api/register/send-mobile-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: cleanPhone })
            });
            const j = await r.json();

            if (r.ok) {
                setShowMobileOtpInput(true);
                setMobileOtp('');
                setErrors(prev => ({ ...prev, phoneNumber: '' }));
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Mobile OTP Sent',
                    message: 'A 6-digit verification code has been sent to your mobile number via SMS.'
                });
            } else {
                setErrors(prev => ({ ...prev, phoneNumber: j.error || 'Failed to send OTP' }));
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Unable to Send SMS OTP',
                    message: j.error || 'Failed to send mobile OTP. Please try again.'
                });
            }
        } catch (err) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Network Error',
                message: 'Could not connect to server. Please try again later.'
            });
        } finally {
            setIsSendingMobileOtp(false);
        }
    };

    // Verify Mobile OTP
    const handleVerifyMobileOtp = async (codeToVerify) => {
        const otpVal = codeToVerify || mobileOtp;
        if (!otpVal || otpVal.length < 4) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Invalid OTP',
                message: 'Please enter the 6-digit OTP received on your mobile.'
            });
            return;
        }

        setIsVerifyingMobileOtp(true);
        try {
            const r = await fetch('/api/register/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'mobile',
                    identifier: formData.phoneNumber.trim(),
                    otp: otpVal
                })
            });
            const j = await r.json();

            if (r.ok) {
                setMobileVerified(true);
                setShowMobileOtpInput(false);
                setErrors(prev => ({ ...prev, phoneNumber: '' }));
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Mobile Verified',
                    message: 'Your mobile number has been verified successfully!'
                });
            } else {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Verification Failed',
                    message: j.error || 'Invalid or expired Mobile OTP. Please try again.'
                });
            }
        } catch (err) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Network Error',
                message: 'Could not verify OTP. Please try again later.'
            });
        } finally {
            setIsVerifyingMobileOtp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Please enter your full name';
        if (!formData.email.trim()) newErrors.email = 'Please enter your email';
        else if (!isValidEmail(formData.email)) newErrors.email = 'Enter a valid email';
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Please enter your phone number';
        if (!formData.password) newErrors.password = 'Please enter a password';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm your password';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.hearAboutUs) newErrors.hearAboutUs = 'Select how you heard about us';
        if (!termsAgreed) newErrors.terms = 'You must agree to the Terms & Conditions';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!emailVerified) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Email Verification Required',
                message: 'Please click "Send OTP" on Email and verify the code before creating an account.'
            });
            return;
        }

        if (!mobileVerified) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Mobile Verification Required',
                message: 'Please click "Send OTP" on Phone Number and verify the code before creating an account.'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/register/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim(),
                    phoneNumber: formData.phoneNumber.trim(),
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    referralCode: formData.referralCode.trim(),
                    hearAboutUs: formData.hearAboutUs,
                    otp: emailOtp,
                    mobileOtp: mobileOtp
                })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.removeItem('referralCode');
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Account Created Successfully!',
                    message: 'Welcome to RentHub! Your rider account is active. Redirecting to login...'
                });
            } else {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Registration Failed',
                    message: data.error || (Array.isArray(data.details) ? data.details.join('\n') : 'Unable to complete registration.')
                });
            }
        } catch (err) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Network Error',
                message: 'Unable to connect to server. Please check your connection and try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="reg-card-box">
            {/* Header: User Avatar + Titles */}
            <div className="reg-card-header">
                <div className="reg-avatar-icon-box">
                    <User size={30} className="text-[#D97706]" strokeWidth={2.3} />
                </div>
                <div className="reg-header-titles">
                    <span className="reg-welcome-text">Welcome to RentHub</span>
                    <h2 className="reg-card-heading">Create Your Account</h2>
                    <span className="reg-card-subtext">Fill in your details and get ready to ride.</span>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="reg-form-container">
                {/* 1. Full Name */}
                <div className="reg-form-group">
                    <label htmlFor="fullName" className="reg-input-label">Full Name</label>
                    <div className={`reg-input-box ${errors.fullName ? 'error' : ''}`}>
                        <User size={18} className="reg-icon-prefix" />
                        <input
                            id="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
                            className="reg-field-input"
                            autoComplete="name"
                        />
                    </div>
                    {errors.fullName && <span className="reg-field-error">{errors.fullName}</span>}
                </div>

                {/* 2. Email Address (Full Width Row with Inline Send OTP) */}
                <div className="reg-form-group">
                    <label htmlFor="email" className="reg-input-label">Email Address</label>
                    <div className={`reg-input-box ${errors.email ? 'error' : ''} ${emailVerified ? 'verified-box' : ''}`}>
                        <Mail size={18} className="reg-icon-prefix" />
                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => {
                                handleChange('email', e.target.value);
                                if (emailVerified) setEmailVerified(false);
                            }}
                            disabled={emailVerified}
                            className="reg-field-input"
                            autoComplete="email"
                        />
                        {emailVerified ? (
                            <span className="reg-inline-verified-tag">
                                <Check size={13} strokeWidth={3} /> Verified
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSendEmailOtp}
                                disabled={isSendingEmailOtp}
                                className="reg-inline-otp-btn"
                                title="Send verification OTP"
                            >
                                {isSendingEmailOtp ? 'Sending...' : showEmailOtpInput ? 'Resend' : 'Send OTP'}
                            </button>
                        )}
                    </div>
                    {errors.email && <span className="reg-field-error">{errors.email}</span>}

                    {/* Email OTP Verification Drawer */}
                    {showEmailOtpInput && !emailVerified && (
                        <div className="reg-otp-drawer">
                            <div className="reg-otp-drawer-row">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="6-digit OTP"
                                    value={emailOtp}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setEmailOtp(val);
                                        if (val.length === 6) handleVerifyEmailOtp(val);
                                    }}
                                    className="reg-otp-drawer-input"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => handleVerifyEmailOtp(emailOtp)}
                                    disabled={isVerifyingEmailOtp || emailOtp.length < 4}
                                    className="reg-otp-drawer-verify-btn"
                                >
                                    {isVerifyingEmailOtp ? '...' : 'Verify'}
                                </button>
                            </div>
                            <span className="reg-otp-drawer-hint">Enter code sent to your email</span>
                        </div>
                    )}
                </div>

                {/* 3. Phone Number (Full Width Row with Inline Send OTP) */}
                <div className="reg-form-group">
                    <label htmlFor="phoneNumber" className="reg-input-label">Phone Number</label>
                    <div className={`reg-input-box ${errors.phoneNumber ? 'error' : ''} ${mobileVerified ? 'verified-box' : ''}`}>
                        <Phone size={18} className="reg-icon-prefix" />
                        <span className="reg-phone-code">+91</span>
                        <input
                            id="phoneNumber"
                            type="tel"
                            placeholder="Enter 10-digit mobile number"
                            value={formData.phoneNumber}
                            onChange={(e) => {
                                handleChange('phoneNumber', e.target.value);
                                if (mobileVerified) setMobileVerified(false);
                            }}
                            disabled={mobileVerified}
                            className="reg-field-input"
                            autoComplete="tel"
                        />
                        {mobileVerified ? (
                            <span className="reg-inline-verified-tag">
                                <Check size={13} strokeWidth={3} /> Verified
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSendMobileOtp}
                                disabled={isSendingMobileOtp}
                                className="reg-inline-otp-btn"
                                title="Send SMS verification OTP"
                            >
                                {isSendingMobileOtp ? 'Sending...' : showMobileOtpInput ? 'Resend' : 'Send OTP'}
                            </button>
                        )}
                    </div>
                    {errors.phoneNumber && <span className="reg-field-error">{errors.phoneNumber}</span>}

                    {/* Mobile OTP Verification Drawer */}
                    {showMobileOtpInput && !mobileVerified && (
                        <div className="reg-otp-drawer">
                            <div className="reg-otp-drawer-row">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="6-digit OTP"
                                    value={mobileOtp}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setMobileOtp(val);
                                        if (val.length === 6) handleVerifyMobileOtp(val);
                                    }}
                                    className="reg-otp-drawer-input"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => handleVerifyMobileOtp(mobileOtp)}
                                    disabled={isVerifyingMobileOtp || mobileOtp.length < 4}
                                    className="reg-otp-drawer-verify-btn"
                                >
                                    {isVerifyingMobileOtp ? '...' : 'Verify'}
                                </button>
                            </div>
                            <span className="reg-otp-drawer-hint">Enter code sent via SMS</span>
                        </div>
                    )}
                </div>

                {/* 3. Password & Confirm Password (Two Columns) */}
                <div className="reg-form-row-2col">
                    {/* Password */}
                    <div className="reg-form-group">
                        <label htmlFor="password" className="reg-input-label">Password</label>
                        <div className={`reg-input-box ${errors.password ? 'error' : ''}`}>
                            <Lock size={18} className="reg-icon-prefix" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                className="reg-field-input"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="reg-eye-toggle"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <span className="reg-field-error">{errors.password}</span>}
                    </div>

                    {/* Confirm Password */}
                    <div className="reg-form-group">
                        <label htmlFor="confirmPassword" className="reg-input-label">Confirm Password</label>
                        <div className={`reg-input-box ${errors.confirmPassword ? 'error' : ''}`}>
                            <Lock size={18} className="reg-icon-prefix" />
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                className="reg-field-input"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="reg-eye-toggle"
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <span className="reg-field-error">{errors.confirmPassword}</span>}
                    </div>
                </div>

                {/* 4. Referral Code & How did you hear about us? (Two Columns) */}
                <div className="reg-form-row-2col">
                    {/* Referral Code */}
                    <div className="reg-form-group">
                        <label htmlFor="referralCode" className="reg-input-label">Referral Code (Optional)</label>
                        <div className="reg-input-box">
                            <Gift size={18} className="reg-icon-prefix" />
                            <input
                                id="referralCode"
                                type="text"
                                placeholder="Enter referral Code"
                                value={formData.referralCode}
                                onChange={(e) => handleChange('referralCode', e.target.value.toUpperCase())}
                                className="reg-field-input"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </div>
                    </div>

                    {/* How did you hear about us? */}
                    <div className="reg-form-group">
                        <label htmlFor="hearAboutUs" className="reg-input-label">
                            How did you hear about us? <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div className={`reg-input-box ${errors.hearAboutUs ? 'error' : ''}`}>
                            <Megaphone size={18} className="reg-icon-prefix" />
                            <select
                                id="hearAboutUs"
                                value={formData.hearAboutUs}
                                onChange={(e) => handleChange('hearAboutUs', e.target.value)}
                                className="reg-select-field"
                            >
                                <option value="" disabled>Select an option</option>
                                {hearAboutOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <ChevronDown size={15} style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: '#64748B' }} />
                        </div>
                        {errors.hearAboutUs && <span className="reg-field-error">{errors.hearAboutUs}</span>}
                    </div>
                </div>

                {/* 5. Terms Checkbox */}
                <div className="reg-terms-row">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        className="reg-terms-checkbox"
                    />
                    <label htmlFor="terms">
                        I agree to the <Link to="/terms" className="reg-terms-link">Terms &amp; Conditions</Link> and <Link to="/privacy" className="reg-terms-link">Privacy Policy</Link>
                    </label>
                </div>
                {errors.terms && <span className="reg-field-error">{errors.terms}</span>}

                {/* 6. Big Gold CTA Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="reg-submit-cta-btn"
                >
                    <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
                    <ArrowRight size={18} strokeWidth={2.5} />
                </button>

                {/* 7. Bottom Login Link */}
                <div className="reg-card-bottom-login">
                    <span>Already have an account? </span>
                    <Link to="/login" className="reg-login-accent">
                        Login
                    </Link>
                </div>
            </form>

            {/* Status Popup */}
            <StatusPopup
                isOpen={popup.isOpen}
                onClose={() => {
                    setPopup(prev => ({ ...prev, isOpen: false }));
                    if (popup.type === 'success' && popup.title.includes('Created')) {
                        navigate('/login');
                    }
                }}
                type={popup.type}
                title={popup.title}
                message={popup.message}
            />
        </div>
    );
};

export default RegistrationCard;
