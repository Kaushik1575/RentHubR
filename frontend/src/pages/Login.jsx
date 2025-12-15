import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [activeTab, setActiveTab] = useState('user');
    const navigate = useNavigate();

    // User Form State
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userError, setUserError] = useState('');

    // Admin Form State
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminId, setAdminId] = useState('');
    const [adminError, setAdminError] = useState('');

    const [showUserPassword, setShowUserPassword] = useState(false);
    const [showAdminPassword, setShowAdminPassword] = useState(false);

    const handleUserLogin = async (e) => {
        e.preventDefault();
        setUserError('');
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, password: userPassword })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/');
                window.location.reload();
            } else {
                setUserError(data.error || 'Login failed');
            }
        } catch (error) {
            setUserError('An error occurred. Please try again.');
        }
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setAdminError('');
        try {
            const response = await fetch('/api/login/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail, password: adminPassword, adminId })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token); // Admin also uses 'token'
                localStorage.setItem('user', JSON.stringify({ ...data.admin, isAdmin: true }));
                navigate('/admin');
                window.location.reload();
            } else {
                setAdminError(data.error || 'Login failed');
            }
        } catch (error) {
            setAdminError('An error occurred during login');
        }
    };

    return (
        <div className="login-container" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1485965120184-e220f721d03e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '2rem'
        }}>
            <div className="login-box" style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '10px',
                boxShadow: '0 0 20px rgba(0,0,0,0.2)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div className="login-tabs" style={{ display: 'flex', marginBottom: '2rem', borderBottom: '2px solid #eee' }}>
                    <div
                        className={`login-tab ${activeTab === 'user' ? 'active' : ''}`}
                        onClick={() => setActiveTab('user')}
                        style={{
                            flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease',
                            color: activeTab === 'user' ? '#2ecc71' : '#666',
                            borderBottom: activeTab === 'user' ? '2px solid #2ecc71' : 'none',
                            marginBottom: activeTab === 'user' ? '-2px' : '0'
                        }}
                    >
                        User Login
                    </div>
                    <div
                        className={`login-tab ${activeTab === 'admin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('admin')}
                        style={{
                            flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease',
                            color: activeTab === 'admin' ? '#2ecc71' : '#666',
                            borderBottom: activeTab === 'admin' ? '2px solid #2ecc71' : 'none',
                            marginBottom: activeTab === 'admin' ? '-2px' : '0'
                        }}
                    >
                        Admin Login
                    </div>
                </div>

                {/* User Login Form */}
                {activeTab === 'user' && (
                    <form onSubmit={handleUserLogin} className="login-form active">
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Email</label>
                            <input
                                type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required
                                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }}
                            />
                        </div>
                        <div className="form-group password-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Password</label>
                            <input
                                type={showUserPassword ? "text" : "password"}
                                value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required
                                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }}
                            />
                            <i
                                className={`fas ${showUserPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                onClick={() => setShowUserPassword(!showUserPassword)}
                                style={{ position: 'absolute', right: '1rem', top: '2.2rem', cursor: 'pointer', color: '#666' }}
                            ></i>
                        </div>
                        <button type="submit" className="login-btn" style={{
                            width: '100%', padding: '1rem', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem', cursor: 'pointer'
                        }}>Login as User</button>
                        {userError && <div className="error-message" style={{ color: '#ff0000', marginTop: '1rem', textAlign: 'center' }}>{userError}</div>}
                        <div className="register-link" style={{ textAlign: 'center', marginTop: '1rem' }}>
                            Don't have an account? <Link to="/register-user" style={{ color: '#2ecc71' }}>Register here</Link>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                            <Link to="/forgot-password" style={{ color: '#666', fontSize: '0.9rem' }}>Forgot Password?</Link>
                        </div>
                    </form>
                )}

                {/* Admin Login Form */}
                {activeTab === 'admin' && (
                    <form onSubmit={handleAdminLogin} className="login-form active">
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Email</label>
                            <input
                                type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required
                                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }}
                            />
                        </div>
                        <div className="form-group password-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Password</label>
                            <input
                                type={showAdminPassword ? "text" : "password"}
                                value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required
                                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }}
                            />
                            <i
                                className={`fas ${showAdminPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                style={{ position: 'absolute', right: '1rem', top: '2.2rem', cursor: 'pointer', color: '#666' }}
                            ></i>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Admin ID</label>
                            <input
                                type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} required
                                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '5px' }}
                            />
                        </div>
                        <button type="submit" className="login-btn" style={{
                            width: '100%', padding: '1rem', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem', cursor: 'pointer'
                        }}>Login as Admin</button>
                        {adminError && <div className="error-message" style={{ color: '#ff0000', marginTop: '1rem', textAlign: 'center' }}>{adminError}</div>}
                        <div className="register-link" style={{ textAlign: 'center', marginTop: '1rem' }}>
                            Need admin access? <Link to="/register-admin" style={{ color: '#2ecc71' }}>Register here</Link>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                            <Link to="/forgot-password" style={{ color: '#666', fontSize: '0.9rem' }}>Forgot Password?</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
