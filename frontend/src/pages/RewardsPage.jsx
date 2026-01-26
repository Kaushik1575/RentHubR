import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ScratchCard from '../components/ScratchCard';
import ReferralCard from '../components/ReferralCard';
import StatusPopup from '../components/StatusPopup';

const RewardsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ coins: 0, rewards: [], scratchCards: [], referralCode: '' });
    const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '' });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login if not authenticated, preserving the destination
            navigate('/login', { state: { from: location } });
            return;
        }
        fetchRewardsData();
    }, [navigate, location]);

    const fetchRewardsData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/rewards', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                console.log('Rewards Data:', result);
                if (result.success) {
                    setData(result);
                } else {
                    console.error('Rewards API failed:', result.message);
                }
            } else {
                if (res.status === 401 || res.status === 403) {
                    // Token expired or invalid - redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login', { state: { from: location } });
                    return;
                }
                console.error('Rewards API fetch error:', res.status);
            }
        } catch (error) {
            console.error('Rewards Page Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Animation State
    const [animations, setAnimations] = useState([]);

    const handleScratchReveal = async (cardId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/scratch-claim', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cardId })
            });
            const result = await res.json();
            if (result.success) {
                // Determine card position for animation
                const cardElement = document.getElementById(`scratch-card-${cardId}`);
                const coinTarget = document.getElementById('coin-balance-display');

                if (cardElement && coinTarget && result.card.prize_type === 'COINS') {
                    const startRect = cardElement.getBoundingClientRect();
                    const endRect = coinTarget.getBoundingClientRect();

                    // Create multiple flying coins
                    const newAnimations = [];
                    for (let i = 0; i < 5; i++) {
                        newAnimations.push({
                            id: Date.now() + i,
                            start: { x: startRect.left + startRect.width / 2, y: startRect.top + startRect.height / 2 },
                            end: { x: endRect.left + endRect.width / 2, y: endRect.top + endRect.height / 2 },
                            delay: i * 100
                        });
                    }
                    setAnimations(prev => [...prev, ...newAnimations]);

                    // Remove animations after flight
                    setTimeout(() => {
                        setAnimations([]);
                        // Update balance AFTER animation
                        setData(prev => ({
                            ...prev,
                            coins: prev.coins + parseInt(result.card.prize_value)
                        }));
                    }, 1500);
                } else {
                    // Update balance immediately if no animation
                    if (result.card.prize_type === 'COINS') {
                        setData(prev => ({ ...prev, coins: prev.coins + parseInt(result.card.prize_value) }));
                    }
                }

                setData(prev => ({
                    ...prev,
                    scratchCards: prev.scratchCards.map(card =>
                        card.id === cardId ? { ...card, is_scratched: true, prize_type: result.card.prize_type, prize_value: result.card.prize_value } : card
                    )
                }));
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => { });
                return true;
            }
        } catch (e) {
            console.error(e);
        }
        return false;
    };

    const handleRedeem = async () => {
        try {
            const token = localStorage.getItem('token');
            setPopup({ isOpen: true, type: 'info', title: 'Redeeming...', message: 'Please wait...' });

            const res = await fetch('/api/user/redeem', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await res.json();

            if (res.ok && result.success) {
                // Update local state
                setData(prev => ({
                    ...prev,
                    coins: prev.coins - 1000,
                    rewards: [result.reward, ...prev.rewards]
                }));

                // Check if we need to return to booking
                if (location.state?.returnUrl) {
                    setPopup({
                        isOpen: true,
                        type: 'success',
                        title: 'Reward Redeemed!',
                        message: `Your Code: ${result.reward.coupon_code}`,
                        customActions: (
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button onClick={() => {
                                    navigator.clipboard.writeText(result.reward.coupon_code);
                                    navigate(location.state.returnUrl, { state: { autoApplyCode: result.reward.coupon_code } });
                                }} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Copy & Return to Booking
                                </button>
                                <button onClick={() => setPopup({ ...popup, isOpen: false })} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Stay Here
                                </button>
                            </div>
                        )
                    });
                } else {
                    // Standard Popup
                    setPopup({
                        isOpen: true,
                        type: 'success',
                        title: 'Woohoo!',
                        message: `Reward Redeemed! Code: ${result.reward.coupon_code}`,
                        customActions: (
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button onClick={() => {
                                    navigator.clipboard.writeText(result.reward.coupon_code);
                                    setPopup({ ...popup, isOpen: false });
                                }} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Copy Code
                                </button>
                            </div>
                        )
                    });
                }
            } else {
                setPopup({ isOpen: true, type: 'error', title: 'Redemption Failed', message: result.error || 'Insufficient coins' });
            }
        } catch (error) {
            setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Network error' });
        }
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;

    const availableRides = Math.floor(data.coins / 1000);

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Segoe UI', sans-serif" }}>
            <Navbar />

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 20px 50px 20px' }}>

                {/* Header Section */}
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a' }}>My Rewards</h1>
                    <p style={{ color: '#666' }}>Manage your coins and rewards</p>
                </div>

                {/* SUPER COINS YELLOW CARD (Replicating Screenshot) */}
                <div style={{
                    background: '#FFC107', // Yellow background
                    borderRadius: '20px',
                    padding: '30px',
                    color: '#374151',
                    boxShadow: '0 10px 30px rgba(255, 193, 7, 0.3)',
                    marginBottom: '40px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1f2937' }}>RentHub Super Coins</h2>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>Earn 1 coin for every minute of ride!</p>
                        </div>
                        <div id="coin-balance-display" style={{
                            background: 'rgba(255,255,255,0.4)',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            fontSize: '28px',
                            fontWeight: '900',
                            color: '#1f2937',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'transform 0.2s',
                            transform: animations.length > 0 ? 'scale(1.1)' : 'scale(1)'
                        }}>
                            {data.coins} <span style={{ fontSize: '20px', background: '#fff', borderRadius: '50%', padding: '2px' }}>🪙</span>
                        </div>
                    </div>

                    {/* Progress Bar Mockup */}
                    <div style={{ margin: '20px 0', height: '6px', background: 'rgba(255,255,255,0.5)', borderRadius: '3px' }}>
                        <div style={{ width: `${Math.min((data.coins % 1000) / 10, 100)}%`, height: '100%', background: 'white', borderRadius: '3px' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '25px', opacity: 0.8 }}>
                        <span>{(data.coins % 1000)} / 1000</span>
                        <span>{(data.coins % 1000) === 0 && data.coins > 0 ? 'Goal Reached!' : `${1000 - (data.coins % 1000)} coins to go`}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            onClick={handleRedeem}
                            disabled={data.coins < 1000}
                            style={{
                                background: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '50px',
                                color: data.coins >= 1000 ? '#f59e0b' : '#9ca3af',
                                fontWeight: 'bold',
                                fontSize: '15px',
                                cursor: data.coins >= 1000 ? 'pointer' : 'not-allowed',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            Redeem 2-Hour Ride (1000 🪙)
                        </button>

                        {availableRides > 0 && (
                            <div style={{
                                background: 'rgba(255,255,255,0.3)',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                🎉 {availableRides} Free Ride(s) Available!
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>Your Coupon Codes (Tap to copy):</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {data.rewards.map(r => (
                                <div key={r.id}
                                    onClick={() => {
                                        navigator.clipboard.writeText(r.coupon_code);
                                        alert(`Code ${r.coupon_code} copied!`);
                                    }}
                                    style={{
                                        background: 'white',
                                        padding: '8px 14px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: '#d97706',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    📁 {r.coupon_code} <i className="far fa-copy" style={{ fontSize: '11px', opacity: 0.6 }}></i>
                                </div>
                            ))}
                            {data.rewards.length === 0 && <span style={{ opacity: 0.7, fontSize: '13px' }}>No coupons yet. Redeem coins to get one!</span>}
                        </div>
                    </div>
                </div>

                {/* Animation Container */}
                {animations.map(anim => (
                    <div key={anim.id} style={{
                        position: 'fixed',
                        top: 0, left: 0,
                        zIndex: 9999,
                        fontSize: '24px',
                        pointerEvents: 'none',
                        transition: 'all 1s cubic-bezier(0.19, 1, 0.22, 1)',
                        transform: `translate(${anim.end.x}px, ${anim.end.y}px)`,
                        opacity: 0,
                        animation: 'fly 1s forwards',
                    }}>
                        <style>{`
                             @keyframes fly {
                                 0% { transform: translate(${anim.start.x}px, ${anim.start.y}px) scale(0.5); opacity: 1; }
                                 100% { transform: translate(${anim.end.x}px, ${anim.end.y}px) scale(1); opacity: 0; }
                             }
                         `}</style>
                        🪙
                    </div>
                ))}

                {/* Referral Section (Kept from new design) */}
                <ReferralCard code={data.referralCode} />

                {/* Scratch Cards Grid */}
                <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-layer-group" style={{ color: '#6366f1' }}></i> Your Scratch Cards
                    </h2>

                    {data.scratchCards.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '60px 20px',
                            background: 'white', borderRadius: '20px',
                            color: '#9ca3af', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                        }}>
                            <img src="https://cdn-icons-png.flaticon.com/512/7486/7486747.png" alt="Empty" style={{ width: '80px', opacity: 0.5, marginBottom: '20px' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No rewards yet</h3>
                            <p>Invite your friends to start earning!</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            gap: '25px',
                            overflowX: 'auto',
                            padding: '10px 5px 30px 5px', // Bottom padding for scrollbar/shadow
                            scrollSnapType: 'x mandatory',
                            scrollbarWidth: 'none', // Hide scrollbar Firefox
                            msOverflowStyle: 'none', // Hide scrollbar IE
                            maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)', // Fade effect
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)'
                        }}>
                            <style>{`
                                .rewards-slider::-webkit-scrollbar { display: none; }
                            `}</style>

                            {data.scratchCards.map((card, index) => (
                                <div key={card.id} id={`scratch-card-${card.id}`} style={{
                                    flex: '0 0 auto',
                                    scrollSnapAlign: 'start'
                                }}>
                                    <ScratchCard card={card} onReveal={handleScratchReveal} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            <StatusPopup
                isOpen={popup.isOpen}
                onClose={() => setPopup({ ...popup, isOpen: false })}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                customActions={popup.customActions}
            />
        </div>
    );
};

export default RewardsPage;
