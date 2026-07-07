import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import OTPInput from '../components/OTPInput';
import api from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        address: '', // Sponsor Needs Address
        otp: '',
        mobileOtp: '',
        hearAboutUs: '',
        otherSource: ''
    });
    const [emailVerified, setEmailVerified] = useState(false);
    const [mobileVerified, setMobileVerified] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [showMobileOtpInput, setShowMobileOtpInput] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSendOtp = async () => {
        setFormData(prev => ({ ...prev, otp: '' }));
        setEmailVerified(false);
        if (!formData.email) {
            toast.error('Please enter your email first');
            return;
        }
        setIsSendingOtp(true);
        try {
            await api.post('/send-email-otp', { email: formData.email });
            setShowOtpInput(true);
            toast.success('OTP sent to your email');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleSendMobileOtp = async () => {
        setFormData(prev => ({ ...prev, mobileOtp: '' }));
        setMobileVerified(false);
        if (!formData.phoneNumber) {
            toast.error('Please enter your phone number first');
            return;
        }
        setIsSendingMobileOtp(true);
        try {
            await api.post('/send-mobile-otp', { phoneNumber: formData.phoneNumber });
            setShowMobileOtpInput(true);
            toast.success('OTP sent to your mobile');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setIsSendingMobileOtp(false);
        }
    };

    const verifyOtp = async (type, otpValue) => {
        const identifier = type === 'email' ? formData.email : formData.phoneNumber;
        try {
            await api.post('/verify-otp', { type, identifier, otp: otpValue });

            if (type === 'email') {
                setEmailVerified(true);
                setFormData(prev => ({ ...prev, otp: otpValue }));
                // Auto-trigger mobile OTP after email success if phone exists and not already verified
                if (formData.phoneNumber && !mobileVerified) {
                    setTimeout(() => handleSendMobileOtp(), 100);
                }
            }
            else {
                setMobileVerified(true);
                setFormData(prev => ({ ...prev, mobileOtp: otpValue }));
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid OTP');
        }
    };

    const calculatePasswordStrength = (pwd) => {
        return {
            length: pwd.length >= 8,
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            digit: /[0-9]/.test(pwd),
            special: /[!@#\$%\^&\*_\-\?]/.test(pwd),
            nospace: !/\s/.test(pwd),
            notcommon: !['123456', 'password', 'admin', '12345678', 'qwerty', 'letmein', 'welcome', 'password1', '12345', 'passw0rd'].includes(pwd.toLowerCase())
        };
    };

    const passwordChecks = calculatePasswordStrength(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        const failed = Object.entries(passwordChecks).filter(([k, v]) => !v).map(x => x[0]);
        if (failed.length > 0) {
            toast.error('Password does not meet complexity requirements');
            return;
        }

        if (!emailVerified) {
            toast.error('Please verify your email');
            return;
        }

        if (!mobileVerified) {
            toast.error('Please verify your mobile number');
            return;
        }

        try {
            await api.post('/register', {
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                address: formData.address,
                emailOtp: formData.otp,
                mobileOtp: formData.mobileOtp
            });

            toast.success('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 1500);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="auth-page" style={{
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div className="auth-container" style={{
                maxWidth: '850px',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                textAlign: 'left'
            }}>
                <div className="auth-header" style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '28px', color: '#2c3e50', fontWeight: 'bold', margin: '0 0 8px 0' }}>Become a Partner</h2>
                    <p style={{ color: '#7f8c8d', margin: 0 }}>Join RentHub Sponsor Network</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                    {/* Full Name: Full Width */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="fullName" style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#2c3e50', fontSize: '16px' }}>Full Name</label>
                        <input type="text" id="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" required
                            style={{
                                width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', fontWeight: '500', outline: 'none', transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2ecc71'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>

                    {/* Email Group */}
                    <div className="form-group" style={{ gridColumn: 'span 1' }}>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#2c3e50', fontSize: '16px' }}>Email Address</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="email" id="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" required
                                style={{ flex: 1, padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', fontWeight: '500', outline: 'none' }}
                            />
                            <button type="button" onClick={handleSendOtp} disabled={isSendingOtp} className="btn-verify"
                                style={{
                                    padding: '0 16px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500',
                                    opacity: isSendingOtp ? 0.7 : 1, whiteSpace: 'nowrap'
                                }}>
                                {isSendingOtp ? '...' : 'Send'}
                            </button>
                        </div>
                        {showOtpInput && (
                            <div style={{ marginTop: '12px' }}>
                                {emailVerified ? (
                                    <div style={{ color: '#27ae60', fontSize: '13px', fontWeight: '500' }}>✓ Email Verified</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <OTPInput length={6} value={formData.otp} onChange={(val) => setFormData(prev => ({ ...prev, otp: val }))} onComplete={(val) => verifyOtp('email', val)} />
                                        <small style={{ color: '#95a5a6', fontSize: '11px' }}>Check your email inbox</small>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Phone Group */}
                    <div className="form-group" style={{ gridColumn: 'span 1' }}>
                        <label htmlFor="phoneNumber" style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#2c3e50', fontSize: '16px' }}>Phone Number</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="tel" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Mobile Number" required
                                style={{ flex: 1, padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', fontWeight: '500', outline: 'none' }}
                            />
                            <button type="button" onClick={handleSendMobileOtp} disabled={isSendingMobileOtp} className="btn-verify"
                                style={{
                                    padding: '0 16px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500',
                                    opacity: isSendingMobileOtp ? 0.7 : 1, whiteSpace: 'nowrap'
                                }}>
                                {isSendingMobileOtp ? '...' : 'Send'}
                            </button>
                        </div>
                        {showMobileOtpInput && (
                            <div style={{ marginTop: '12px' }}>
                                {mobileVerified ? (
                                    <div style={{ color: '#27ae60', fontSize: '13px', fontWeight: '500' }}>✓ Mobile Verified</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <OTPInput length={6} value={formData.mobileOtp} onChange={(val) => setFormData(prev => ({ ...prev, mobileOtp: val }))} onComplete={(val) => verifyOtp('mobile', val)} />
                                        <small style={{ color: '#95a5a6', fontSize: '11px' }}>Check your mobile for OTP</small>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Address Field (Sponsor Requirement) */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="address" style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#2c3e50', fontSize: '16px' }}>Residential Address</label>
                        <textarea id="address" value={formData.address} onChange={handleChange} placeholder="Full Address" required
                            style={{
                                width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', fontWeight: '500', outline: 'none', minHeight: '80px'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2ecc71'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>

                    {/* Passwords */}
                    <div className="form-group" style={{ gridColumn: 'span 1' }}>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#2c3e50', fontSize: '16px' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showPassword ? 'text' : 'password'} id="password" value={formData.password} onChange={handleChange} placeholder="Password" required
                                style={{ width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', fontWeight: '500', outline: 'none' }}
                            />
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#bdc3c7' }}></i>
                        </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 1' }}>
                        <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#2c3e50', fontSize: '16px' }}>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required
                                style={{ width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', fontWeight: '500', outline: 'none' }}
                            />
                            <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#bdc3c7' }}></i>
                        </div>
                    </div>

                    {/* Password Rules - Compact Horizontal */}
                    <div style={{ gridColumn: '1 / -1', background: '#f8f9fa', padding: '12px', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#7f8c8d' }}>
                        <span style={{ color: passwordChecks.length ? '#27ae60' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {passwordChecks.length ? '✓' : '○'} 8+ Chars
                        </span>
                        <span style={{ color: passwordChecks.upper ? '#27ae60' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {passwordChecks.upper ? '✓' : '○'} Uppercase
                        </span>
                        <span style={{ color: passwordChecks.lower ? '#27ae60' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {passwordChecks.lower ? '✓' : '○'} Lowercase
                        </span>
                        <span style={{ color: passwordChecks.digit ? '#27ae60' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {passwordChecks.digit ? '✓' : '○'} Number
                        </span>
                        <span style={{ color: passwordChecks.special ? '#27ae60' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {passwordChecks.special ? '✓' : '○'} Symbol
                        </span>
                    </div>

                    {/* Submit */}
                    <button type="submit" className="btn btn-primary"
                        disabled={!emailVerified || !mobileVerified}
                        style={{
                            gridColumn: '1 / -1', width: '100%', padding: '14px',
                            background: (!emailVerified || !mobileVerified) ? '#95a5a6' : '#2ecc71',
                            color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600',
                            cursor: (!emailVerified || !mobileVerified) ? 'not-allowed' : 'pointer',
                            marginTop: '10px',
                            boxShadow: (!emailVerified || !mobileVerified) ? 'none' : '0 4px 12px rgba(46, 204, 113, 0.25)',
                            opacity: (!emailVerified || !mobileVerified) ? 0.7 : 1,
                            transition: 'all 0.3s'
                        }}>
                        Register as Sponsor
                    </button>
                </form>

                <div style={{ textAlign: 'center', fontSize: '14px', color: '#7f8c8d' }}>
                    Already have an account? <Link to="/login" style={{ color: '#2ecc71', fontWeight: '600', textDecoration: 'none', marginLeft: '4px' }}>Login</Link>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .auth-container { padding: 24px !important; }
                    form { grid-template-columns: 1fr !important; gap: 16px !important; }
                    .form-group { grid-column: span 1 !important; }
                }
            `}</style>
        </div >
    );
};

export default Register;
