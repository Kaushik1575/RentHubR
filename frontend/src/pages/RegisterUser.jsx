import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterUser = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        otp: ''
    });
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSendOtp = async () => {
        if (!formData.email) return alert('Please enter your email first');
        setIsSendingOtp(true);
        try {
            const r = await fetch('/api/register/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            const j = await r.json();
            if (r.ok) {
                setShowOtpInput(true);
                alert(j.message || 'OTP sent to your email');
            } else {
                alert(j.error || 'Failed to send OTP');
            }
        } catch (err) {
            alert('Could not send OTP, please try again later');
        } finally {
            setIsSendingOtp(false);
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
            alert('Passwords do not match');
            return;
        }

        const failed = Object.entries(passwordChecks).filter(([k, v]) => !v).map(x => x[0]);
        if (failed.length > 0) {
            alert('Password does not meet complexity requirements.');
            return;
        }

        if (!formData.otp) {
            alert('Please verify your email with OTP before submitting.');
            return;
        }

        try {
            const response = await fetch('/api/register/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (response.ok) {
                alert('User registration successful! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1500);
            } else {
                if (data && data.error && data.details && Array.isArray(data.details)) {
                    alert(data.error + '\n' + data.details.join('\n'));
                } else {
                    alert(data.error || 'Registration failed');
                }
            }
        } catch (error) {
            alert('An error occurred during registration.');
        }
    };

    return (
        <div className="auth-page gradient-reg" style={{
            background: 'linear-gradient(180deg, #A18CD1 0%, #FBC2EB 100%)',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="auth-container" style={{
                maxWidth: '500px',
                width: '90%',
                margin: '2rem auto',
                padding: '2.5rem',
                backgroundColor: '#fff',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
                <div className="auth-form">
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>Register as User</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="fullName" style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                            <input type="text" id="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                                <input type="email" id="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                            </div>
                            <div>
                                <button type="button" onClick={handleSendOtp} disabled={isSendingOtp} className="btn btn-verify" style={{ marginTop: '22px', padding: '0.6rem 0.9rem', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                    {isSendingOtp ? 'Sending...' : 'Verify Email'}
                                </button>
                            </div>
                        </div>

                        {showOtpInput && (
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="otp" style={{ display: 'block', marginBottom: '0.5rem' }}>Enter OTP</label>
                                <input type="text" id="otp" value={formData.otp} onChange={handleChange} placeholder="6-digit OTP" maxLength="6" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                                <small style={{ display: 'block', color: '#555', marginTop: '6px' }}>An OTP will expire in 10 minutes.</small>
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="phoneNumber" style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                            <input type="tel" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} id="password" value={formData.password} onChange={handleChange} placeholder="Password" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '12px', cursor: 'pointer', color: '#666' }}></i>
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#555' }}>
                                <strong>Password must include:</strong>
                                <ul style={{ margin: '6px 0 0 18px' }}>
                                    <li style={{ color: passwordChecks.length ? '#2ecc71' : '#d32f2f' }}>At least 8 characters</li>
                                    <li style={{ color: passwordChecks.upper ? '#2ecc71' : '#d32f2f' }}>At least one uppercase letter (A-Z)</li>
                                    <li style={{ color: passwordChecks.lower ? '#2ecc71' : '#d32f2f' }}>At least one lowercase letter (a-z)</li>
                                    <li style={{ color: passwordChecks.digit ? '#2ecc71' : '#d32f2f' }}>At least one digit (0-9)</li>
                                    <li style={{ color: passwordChecks.special ? '#2ecc71' : '#d32f2f' }}>At least one special character</li>
                                </ul>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '10px', top: '12px', cursor: 'pointer', color: '#666' }}></i>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1rem', cursor: 'pointer' }}>Register</button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6c757d' }}>Already have an account? <Link to="/login" style={{ color: '#2ecc71', fontWeight: 'bold' }}>Login</Link></p>
                    <p style={{ textAlign: 'center', marginTop: '0.5rem', color: '#6c757d' }}>Register as <Link to="/register-admin" style={{ color: '#2ecc71', fontWeight: 'bold' }}>Admin</Link></p>
                </div>
            </div>
        </div>
    );
};

export default RegisterUser;
