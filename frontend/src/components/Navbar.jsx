import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusPopup from './StatusPopup';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            setIsLoggedIn(!!token);

            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setIsAdmin(user.isAdmin === true || user.is_admin === true); // Handle both cases just in case
                } catch (e) {
                    console.error("Error parsing user from local storage", e);
                }
            }
        };

        checkAuth();
        // Listen for storage events (optional, but good for multi-tab or if login happens elsewhere)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setIsAdmin(false);
        setShowLogoutConfirm(false);
        navigate('/login');
        // Force reload to clear state if needed, or just let state handle it
        window.location.reload();
    };

    return (
        <>
            <nav className="navbar">
                <div className="logo">
                    <h1>RentHub</h1>
                </div>
                <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                    <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
                    <Link to="/about" onClick={() => setIsMenuOpen(false)}>About</Link>
                    <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link>
                    <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)}>My Bookings</Link>
                </div>
                <div className={`auth-buttons ${isMenuOpen ? 'active' : ''}`}>
                    {!isLoggedIn ? (
                        <>
                            <Link to="/login" className="btn btn-login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                            <button onClick={() => { setShowRegisterModal(true); setIsMenuOpen(false); }} className="btn btn-primary">Register</button>
                        </>
                    ) : (
                        <>

                            <button onClick={handleLogout} className="btn">Logout</button>
                        </>
                    )}
                </div>
                <div className={`hamburger ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </nav>

            {/* Register Modal */}
            {showRegisterModal && (
                <div className="modal" style={{ display: 'flex', position: 'fixed', zIndex: 9999, left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ background: '#fff', padding: '32px 24px', borderRadius: '10px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', minWidth: '300px', textAlign: 'center', position: 'relative' }}>
                        <span onClick={() => setShowRegisterModal(false)} style={{ position: 'absolute', top: '10px', right: '15px', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</span>
                        <h3 style={{ marginBottom: '20px' }}>Register as</h3>
                        <button onClick={() => { setShowRegisterModal(false); navigate('/register-user'); }} className="btn btn-primary" style={{ margin: '8px 0', width: '90%' }}>User</button><br />
                        <button onClick={() => { setShowRegisterModal(false); navigate('/register-admin'); }} className="btn btn-secondary" style={{ margin: '8px 0', width: '90%' }}>Admin</button><br />
                        <button onClick={() => setShowRegisterModal(false)} className="btn" style={{ marginTop: '16px', background: '#eee', color: '#333' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Popup */}
            <StatusPopup
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={confirmLogout}
                type="confirm"
                title="Log Out"
                message="Are you sure you want to log out?"
                confirmText="Yes, Logout"
                cancelText="Cancel"
            />
        </>
    );
};

export default Navbar;
