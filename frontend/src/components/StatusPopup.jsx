import React from 'react';

const StatusPopup = ({ isOpen, onClose, type = 'error', title, message }) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';

    // Design configuration matching the user's screenshot
    const config = {
        icon: isSuccess ? 'fa-check' : 'fa-exclamation-triangle',
        iconColor: isSuccess ? '#4caf50' : '#f44336',
        iconBg: isSuccess ? '#e8f5e9' : '#ffebee',
        btnBg: isSuccess ? '#4caf50' : '#f44336',
        defaultTitle: isSuccess ? 'Success' : 'Error'
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99999, // Extremely high z-index to stay on top
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                padding: '2.5rem 2rem',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                animation: 'popup-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                {/* Icon Container */}
                <div style={{
                    width: '70px',
                    height: '70px',
                    background: config.iconBg,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <i className={`fas ${config.icon}`} style={{
                        color: config.iconColor,
                        fontSize: '2rem'
                    }}></i>
                </div>

                {/* Title */}
                <h2 style={{
                    color: '#333',
                    marginBottom: '1rem',
                    fontSize: '1.6rem',
                    fontWeight: '700'
                }}>
                    {title || config.defaultTitle}
                </h2>

                {/* Message */}
                <p style={{
                    color: '#666',
                    marginBottom: '2rem',
                    lineHeight: '1.6',
                    fontSize: '1rem'
                }}>
                    {message}
                </p>

                {/* Button */}
                <button
                    onClick={onClose}
                    style={{
                        background: config.btnBg,
                        color: 'white',
                        border: 'none',
                        padding: '0.9rem 2.5rem',
                        borderRadius: '30px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        boxShadow: `0 4px 15px ${isSuccess ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Okay, Got it
                </button>
            </div>

            <style>
                {`
                @keyframes popup-in {
                    0% { opacity: 0; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1); }
                }
                `}
            </style>
        </div>
    );
};

export default StatusPopup;
