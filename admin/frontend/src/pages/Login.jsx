import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPopup from '../components/StatusPopup';

const Login = () => {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminId, setAdminId] = useState('');
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [isAdminRobotChecked, setIsAdminRobotChecked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [popup, setPopup] = useState({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    });

    const playClickSound = () => {
        const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3");
        audio.volume = 0.4;
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        if (!isAdminRobotChecked) {
            setPopup({ isOpen: true, type: 'error', title: 'Verification Required', message: 'Please confirm you are not a robot' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/login/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail, password: adminPassword, adminId })
            });
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({ ...data.admin, isAdmin: true }));
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Access Granted',
                    message: 'Welcome Admin! Decrypting control panel...'
                });
            } else {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Access Denied',
                    message: data.error || 'Invalid credentials or Admin ID'
                });
            }
        } catch (error) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Security Alert',
                message: 'An error occurred during verification.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-portal-wrapper">
            <div className="portal-glow-1"></div>
            <div className="portal-glow-2"></div>

            <div className="login-portal-card">
                <div className="login-portal-header">
                    <div className="login-logo-circle">
                        <i className="fas fa-user-shield"></i>
                    </div>
                    <h2>RentHub Admin</h2>
                    <p>Enter your authorization credentials</p>
                </div>

                <form onSubmit={handleAdminLogin} className="login-portal-form">
                    <div className="login-input-group">
                        <label>Email Address</label>
                        <div className="input-with-icon">
                            <i className="fas fa-envelope"></i>
                            <input
                                type="email"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                required
                                placeholder="name@renthub.com"
                            />
                        </div>
                    </div>

                    <div className="login-input-group">
                        <label>Admin ID</label>
                        <div className="input-with-icon">
                            <i className="fas fa-id-card"></i>
                            <input
                                type="text"
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                                required
                                placeholder="Employee ID"
                            />
                        </div>
                    </div>

                    <div className="login-input-group">
                        <label>Security Key (Password)</label>
                        <div className="input-with-icon">
                            <i className="fas fa-lock"></i>
                            <input
                                type={showAdminPassword ? "text" : "password"}
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                required
                                placeholder="Enter password"
                            />
                            <i
                                className={`fas ${showAdminPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                            ></i>
                        </div>
                    </div>

                    {/* Captcha Verify */}
                    <div className="captcha-verify-box">
                        <div className="captcha-left">
                            <div
                                onClick={() => {
                                    playClickSound();
                                    setIsAdminRobotChecked(!isAdminRobotChecked);
                                }}
                                className={`captcha-checkbox ${isAdminRobotChecked ? 'checked' : ''}`}
                            >
                                {isAdminRobotChecked && (
                                    <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                                        <path d="M20 34L10 24L12.83 21.17L20 28.34L37.17 11.17L40 14L20 34Z" fill="#10b981" />
                                    </svg>
                                )}
                            </div>
                            <span onClick={() => {
                                playClickSound();
                                setIsAdminRobotChecked(!isAdminRobotChecked);
                            }} className="captcha-label">I'm not a robot</span>
                        </div>
                        <div className="captcha-right">
                            <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" />
                            <div className="captcha-text">reCAPTCHA</div>
                            <div className="captcha-sublinks">Privacy - Terms</div>
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="submit-portal-btn">
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Authenticating...
                            </>
                        ) : (
                            <>
                                Authenticate Account <i className="fas fa-sign-in-alt"></i>
                            </>
                        )}
                    </button>
                </form>
            </div>

            <StatusPopup
                isOpen={popup.isOpen}
                onClose={() => {
                    setPopup({ ...popup, isOpen: false });
                    if (popup.type === 'success') {
                        navigate('/admin');
                    }
                }}
                type={popup.type}
                title={popup.title}
                message={popup.message}
            />

            <style>{`
                .login-portal-wrapper {
                    min-height: 100vh;
                    width: 100%;
                    background-color: #f8fafc;
                    background-image: 
                        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.05) 0, transparent 50%), 
                        radial-gradient(at 50% 0%, rgba(56, 189, 248, 0.05) 0, transparent 50%),
                        radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.03) 0, transparent 50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    font-family: 'Inter', system-ui, sans-serif;
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                }

                .portal-glow-1 {
                    position: absolute;
                    top: 15%;
                    left: 15%;
                    width: 320px;
                    height: 320px;
                    background: rgba(99, 102, 241, 0.08);
                    border-radius: 50%;
                    filter: blur(90px);
                    z-index: 0;
                    pointer-events: none;
                }

                .portal-glow-2 {
                    position: absolute;
                    bottom: 15%;
                    right: 15%;
                    width: 380px;
                    height: 380px;
                    background: rgba(56, 189, 248, 0.08);
                    border-radius: 50%;
                    filter: blur(100px);
                    z-index: 0;
                    pointer-events: none;
                }

                .login-portal-card {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 28px;
                    width: 100%;
                    max-width: 460px;
                    padding: 45px 35px;
                    box-shadow: 
                        0 20px 40px rgba(15, 23, 42, 0.05),
                        0 1px 3px rgba(255, 255, 255, 0.8) inset;
                    z-index: 10;
                    box-sizing: border-box;
                    animation: cardSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .login-portal-header {
                    text-align: center;
                    margin-bottom: 35px;
                }

                .login-logo-circle {
                    width: 64px;
                    height: 64px;
                    border-radius: 18px;
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    color: white;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.7rem;
                    box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);
                    margin-bottom: 18px;
                }

                .login-portal-header h2 {
                    font-size: 1.85rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 6px 0;
                    letter-spacing: -0.5px;
                }

                .login-portal-header p {
                    font-size: 0.9rem;
                    color: #64748b;
                    margin: 0;
                    font-weight: 500;
                }

                .login-portal-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .login-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .login-input-group label {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-with-icon > i:first-child {
                    position: absolute;
                    left: 18px;
                    color: #94a3b8;
                    font-size: 1.05rem;
                    pointer-events: none;
                }

                .input-with-icon input {
                    width: 100%;
                    padding: 14px 20px 14px 48px;
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    color: #0f172a;
                    font-size: 0.95rem;
                    font-weight: 500;
                    outline: none;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }

                .input-with-icon input:focus {
                    border-color: #6366f1;
                    background: #ffffff;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
                }

                .toggle-password {
                    position: absolute;
                    right: 18px;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: color 0.2s;
                }

                .toggle-password:hover {
                    color: #475569;
                }

                /* Captcha box */
                .captcha-verify-box {
                    margin-top: 5px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                }

                .captcha-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .captcha-checkbox {
                    width: 22px;
                    height: 22px;
                    background: #ffffff;
                    border: 2.5px solid #cbd5e1;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .captcha-checkbox.checked {
                    border-color: #10b981;
                    background: rgba(16, 185, 129, 0.05);
                }

                .captcha-label {
                    color: #475569;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    user-select: none;
                }

                .captcha-right {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .captcha-right img {
                    width: 28px;
                    height: 28px;
                    opacity: 0.7;
                }

                .captcha-text {
                    font-size: 9px;
                    color: #64748b;
                    margin-top: 2px;
                    font-weight: 600;
                }

                .captcha-sublinks {
                    font-size: 8px;
                    color: #94a3b8;
                    margin-top: 1px;
                }

                /* Submit button */
                .submit-portal-btn {
                    width: 100%;
                    padding: 15px;
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.2);
                    transition: all 0.2s;
                }

                .submit-portal-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(79, 70, 229, 0.35);
                    filter: brightness(1.05);
                }

                .submit-portal-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                @keyframes cardSlideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Login;
