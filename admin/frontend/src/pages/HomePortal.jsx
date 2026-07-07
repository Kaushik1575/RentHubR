import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePortalStyles.css';

const HomePortal = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const adminUser = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="portal-container">
            <div className="portal-glow-1"></div>
            <div className="portal-glow-2"></div>
            
            <div className="portal-card">
                <div className="portal-header">
                    <div className="portal-logo">
                        <i className="fas fa-user-shield"></i>
                    </div>
                    <h1>RentHub</h1>
                    <p className="portal-subtitle">Control Center & Administrative Portal</p>
                </div>

                <div className="portal-body">
                    {token && adminUser.adminName ? (
                        <div className="portal-welcome-box">
                            <p className="welcome-label">Welcome back,</p>
                            <h3>{adminUser.adminName}</h3>
                            <span className="welcome-role"><i className="fas fa-shield-alt"></i> System Administrator</span>
                            
                            <button className="portal-btn primary-btn" onClick={() => navigate('/admin')}>
                                Go to Dashboard <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    ) : (
                        <div className="portal-actions-box">
                            <p className="actions-label">Select an option to proceed</p>
                            
                            <button className="portal-btn primary-btn" onClick={() => navigate('/login')}>
                                <i className="fas fa-sign-in-alt"></i> Log In to Dashboard
                            </button>
                            
                            <button className="portal-btn secondary-btn" onClick={() => navigate('/register-admin')}>
                                <i className="fas fa-user-plus"></i> Register New Admin Account
                            </button>
                        </div>
                    )}
                </div>

                <div className="portal-footer">
                    <p>© 2026 RentHub Inc. All rights reserved.</p>
                    <div className="portal-links">
                        <a href="http://localhost:5173" target="_blank" rel="noreferrer"><i className="fas fa-external-link-alt"></i> Customer App</a>
                        <span className="divider">•</span>
                        <a href="#support"><i className="fas fa-question-circle"></i> Help & Support</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePortal;
