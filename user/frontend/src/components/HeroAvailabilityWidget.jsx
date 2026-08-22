import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const HeroAvailabilityWidget = ({ onSearch, isSearching, activeQuery, onReset }) => {
    // Current IST Date/Time setup
    const getTodayDateString = () => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    };

    const getDefaultStartTime = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 30);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes() < 30 ? '30' : '00';
        // if minutes were rounded up to 00 and we added 30 mins, adjust hours
        return `${hours}:${minutes}`;
    };

    const [category, setCategory] = useState('all');
    const [startDate, setStartDate] = useState(getTodayDateString());
    const [startTime, setStartTime] = useState(getDefaultStartTime());
    const [duration, setDuration] = useState('4');
    const [isCustomDuration, setIsCustomDuration] = useState(false);
    const [customDuration, setCustomDuration] = useState('6');

    // Quick duration options
    const durationOptions = [
        { label: '2 Hours', value: '2' },
        { label: '4 Hours', value: '4' },
        { label: '8 Hours', value: '8' },
        { label: '12 Hours', value: '12' },
        { label: '24 Hours (1 Day)', value: '24' },
        { label: '2 Days (48h)', value: '48' },
        { label: '3 Days (72h)', value: '72' },
    ];

    // Popular time slots
    const timeSlots = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!startDate) {
            toast.error('Please select a pickup date');
            return;
        }
        if (!startTime) {
            toast.error('Please select a pickup time');
            return;
        }

        const selectedDuration = isCustomDuration ? parseInt(customDuration) : parseInt(duration);
        if (!selectedDuration || selectedDuration <= 0) {
            toast.error('Please specify a valid duration');
            return;
        }

        // Validate not past date/time
        const selectedDateTime = new Date(`${startDate}T${startTime}`);
        if (selectedDateTime < new Date()) {
            toast.error('Cannot check availability for a past time slot');
            return;
        }

        onSearch({
            vehicleType: category,
            startDate,
            startTime,
            duration: selectedDuration
        });
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '1100px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 10
        }}>
            {/* Outer Glow & Card Container */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '28px 32px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                transition: 'all 0.3s ease'
            }}>
                {/* Header with Title & Category Pills */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    marginBottom: '24px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '18px'
                }}>
                    <div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '6px'
                        }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                            Live Fleet Availability Check
                        </div>
                        <h2 style={{
                            fontSize: '22px',
                            fontWeight: '800',
                            color: '#0f172a',
                            margin: 0,
                            letterSpacing: '-0.5px'
                        }}>
                            Find & Book Available Rides
                        </h2>
                    </div>

                    {/* Category Selector Tabs */}
                    <div style={{
                        display: 'flex',
                        background: '#f8fafc',
                        padding: '4px',
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        gap: '4px'
                    }}>
                        {[
                            { id: 'all', label: 'All Fleet', icon: '✨' },
                            { id: 'bike', label: 'Bikes', icon: '🏍️' },
                            { id: 'scooty', label: 'Scooty', icon: '🛵' },
                            { id: 'car', label: 'Cars', icon: '🚗' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setCategory(tab.id)}
                                style={{
                                    border: 'none',
                                    background: category === tab.id ? 'white' : 'transparent',
                                    color: category === tab.id ? '#0f172a' : '#64748b',
                                    fontWeight: category === tab.id ? '700' : '500',
                                    fontSize: '13px',
                                    padding: '8px 14px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: category === tab.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form Controls Grid */}
                <form onSubmit={handleSubmit}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        alignItems: 'flex-end'
                    }}>
                        {/* 1. Pickup Date */}
                        <div>
                            <label style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#334155',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <i className="fas fa-calendar-alt" style={{ color: '#3b82f6' }}></i>
                                Pickup Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                min={getTodayDateString()}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #cbd5e1',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#0f172a',
                                    background: '#f8fafc',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    cursor: 'pointer'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>

                        {/* 2. Pickup Time */}
                        <div>
                            <label style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#334155',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <i className="fas fa-clock" style={{ color: '#3b82f6' }}></i>
                                Pickup Time
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#0f172a',
                                        background: '#f8fafc',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                >
                                    {timeSlots.map(time => {
                                        const [h] = time.split(':').map(Number);
                                        const period = h >= 12 ? 'PM' : 'AM';
                                        const displayHour = h % 12 === 0 ? 12 : h % 12;
                                        return (
                                            <option key={time} value={time}>
                                                {displayHour}:00 {period} ({time})
                                            </option>
                                        );
                                    })}
                                </select>
                                <div style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: '#64748b'
                                }}>
                                    <i className="fas fa-chevron-down" style={{ fontSize: '12px' }}></i>
                                </div>
                            </div>
                        </div>

                        {/* 3. Duration */}
                        <div>
                            <label style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#334155',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <i className="fas fa-hourglass-half" style={{ color: '#3b82f6' }}></i>
                                Rental Duration
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={isCustomDuration ? 'custom' : duration}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setIsCustomDuration(true);
                                        } else {
                                            setIsCustomDuration(false);
                                            setDuration(e.target.value);
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#0f172a',
                                        background: '#f8fafc',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                >
                                    {durationOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                    <option value="custom">Custom Hours...</option>
                                </select>
                                <div style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: '#64748b'
                                }}>
                                    <i className="fas fa-chevron-down" style={{ fontSize: '12px' }}></i>
                                </div>
                            </div>
                        </div>

                        {/* Custom Duration Input if selected */}
                        {isCustomDuration && (
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                                    Hours
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="168"
                                    value={customDuration}
                                    onChange={(e) => setCustomDuration(e.target.value)}
                                    placeholder="Enter hours"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#0f172a',
                                        background: '#f8fafc',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        )}

                        {/* 4. Search Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isSearching}
                                style={{
                                    width: '100%',
                                    padding: '14px 20px',
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: '800',
                                    cursor: isSearching ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s ease',
                                    opacity: isSearching ? 0.7 : 1
                                }}
                                onMouseOver={(e) => { if (!isSearching) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
                            >
                                {isSearching ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        <span>Checking...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-search"></i>
                                        <span>Check Availability</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Active Filter Summary Bar */}
                {activeQuery && (
                    <div style={{
                        marginTop: '20px',
                        padding: '12px 18px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '14px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                                background: '#16a34a',
                                color: 'white',
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px'
                            }}>
                                <i className="fas fa-check"></i>
                            </span>
                            <span style={{ fontSize: '13.5px', color: '#166534', fontWeight: '600' }}>
                                Showing live availability for <strong>{new Date(activeQuery.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> at <strong>{activeQuery.startTime}</strong> ({activeQuery.duration} hrs)
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={onReset}
                            style={{
                                background: 'white',
                                border: '1px solid #86efac',
                                color: '#15803d',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#dcfce7'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                        >
                            <i className="fas fa-times"></i>
                            <span>Clear Filter / View All</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeroAvailabilityWidget;
