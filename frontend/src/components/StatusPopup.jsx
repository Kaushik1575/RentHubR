import React from 'react';

const StatusPopup = ({ isOpen, onClose, type = 'error', title, message }) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';

    // Design configuration matching the user's "Login Successful" image
    const config = {
        icon: isSuccess ? 'fa-check' : 'fa-exclamation-triangle',
        iconColor: isSuccess ? '#4caf50' : '#f44336', // Green for success, Red for error
        iconBg: isSuccess ? '#e8f5e9' : '#ffebee',   // Light green/red background
        btnBg: isSuccess ? '#4caf50' : '#f44336',     // Button matches icon color
        defaultTitle: isSuccess ? 'Success' : 'Error',
        btnText: 'Okay, Got it'
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)', // Slightly darker overlay
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(3px)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '24px', // More rounded corners as in image
                width: '90%',
                maxWidth: '380px', // Slightly narrower card
                padding: '2.5rem 2rem',
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                animation: 'popup-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {/* Icon Container - Circular */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: config.iconBg,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <i className={`fas ${config.icon}`} style={{
                        color: config.iconColor,
                        fontSize: '2.2rem'
                    }}></i>
                </div>

                {/* Title */}
                <h2 style={{
                    color: '#2d3748', // Darker gray text
                    marginBottom: '0.5rem',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    lineHeight: '1.2'
                }}>
                    {title || config.defaultTitle}
                </h2>

                {/* Message */}
                <div style={{
                    color: '#718096', // Muted text color
                    marginBottom: '2rem',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    maxWidth: '100%'
                }}>
                    {message}
                </div>

                {/* Button */}
                <button
                    onClick={onClose}
                    style={{
                        background: config.btnBg,
                        color: 'white',
                        border: 'none',
                        padding: '0.8rem 0',
                        width: '80%', // Not full width, but wide
                        borderRadius: '50px', // Fully rounded pill button
                        fontSize: '1.05rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease, box-shadow 0.2s',
                        boxShadow: `0 4px 12px ${isSuccess ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)'}`
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px)'}
                >
                    {config.btnText}
                </button>
            </div>

            <style>
                {`
                @keyframes popup-scale-in {
                    0% { opacity: 0; transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }
                `}
            </style>
        </div>
    );
};

export default StatusPopup;
