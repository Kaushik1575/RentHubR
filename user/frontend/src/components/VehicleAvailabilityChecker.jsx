import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const VehicleAvailabilityChecker = ({ vehicleId, vehicleType, pricePerHour = 0 }) => {
    const navigate = useNavigate();

    const getTodayDateString = () => new Date().toISOString().split('T')[0];
    const getTomorrowDateString = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };

    const [selectedDate, setSelectedDate] = useState(getTodayDateString());
    const [startTime, setStartTime] = useState('10:00');
    const [duration, setDuration] = useState('4');

    const [schedule, setSchedule] = useState(null);
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    const [checkResult, setCheckResult] = useState(null);
    const [checkingSlot, setCheckingSlot] = useState(false);

    // Fetch schedule when date changes or vehicleId changes
    useEffect(() => {
        const fetchSchedule = async () => {
            if (!vehicleId || !vehicleType) return;
            setLoadingSchedule(true);
            setCheckResult(null);
            try {
                const res = await fetch(`/api/vehicles/${vehicleType}/${vehicleId}/schedule?date=${selectedDate}`);
                const data = await res.json();
                if (res.ok) {
                    setSchedule(data);
                } else {
                    console.error('Error loading schedule:', data);
                }
            } catch (err) {
                console.error('Failed to load schedule:', err);
            } finally {
                setLoadingSchedule(false);
            }
        };

        fetchSchedule();
    }, [vehicleId, vehicleType, selectedDate]);

    // Handle check slot availability
    const handleCheckSlot = async (e) => {
        if (e) e.preventDefault();

        // Validate not past date/time
        const selectedDateTime = new Date(`${selectedDate}T${startTime}`);
        if (selectedDateTime < new Date()) {
            toast.error('Cannot check availability for a past time slot');
            return;
        }

        setCheckingSlot(true);
        setCheckResult(null);

        try {
            const res = await fetch('/api/bookings/check-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicleId,
                    startDate: selectedDate,
                    startTime,
                    duration: parseInt(duration)
                })
            });

            const data = await res.json();

            if (res.ok) {
                const totalCost = (parseFloat(pricePerHour) || 0) * parseInt(duration);
                setCheckResult({
                    available: true,
                    message: `Available! Perfect slot from ${startTime} for ${duration} hours.`,
                    totalCost
                });
            } else {
                setCheckResult({
                    available: false,
                    message: data.message || data.error || 'Vehicle is not available for this time slot.'
                });
            }
        } catch (error) {
            console.error('Error checking availability:', error);
            setCheckResult({
                available: false,
                message: 'Failed to verify slot. Please try again.'
            });
        } finally {
            setCheckingSlot(false);
        }
    };

    // Quick book navigation
    const handleProceedToBook = () => {
        navigate(`/booking-form?vehicleId=${vehicleId}&type=${vehicleType}&startDate=${selectedDate}&startTime=${startTime}&duration=${duration}`);
    };

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            padding: '28px',
            margin: '2rem 0'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '16px',
                marginBottom: '20px'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>📅</span>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
                            Check Live Availability & Slot Schedule
                        </h3>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        RentHub requires a 1-hour maintenance gap before & after each ride to guarantee clean vehicles.
                    </p>
                </div>

                {/* Quick Date Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={() => setSelectedDate(getTodayDateString())}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: selectedDate === getTodayDateString() ? '#3b82f6' : '#f8fafc',
                            color: selectedDate === getTodayDateString() ? 'white' : '#334155',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedDate(getTomorrowDateString())}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: selectedDate === getTomorrowDateString() ? '#3b82f6' : '#f8fafc',
                            color: selectedDate === getTomorrowDateString() ? 'white' : '#334155',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Tomorrow
                    </button>
                </div>
            </div>

            {/* Date Picker & Slot Checker Controls */}
            <form onSubmit={handleCheckSlot}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '14px',
                    marginBottom: '20px'
                }}>
                    {/* Date */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                            Select Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            min={getTodayDateString()}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '13.5px',
                                fontWeight: '600',
                                color: '#0f172a',
                                background: '#f8fafc',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Start Time */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                            Start Time
                        </label>
                        <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '13.5px',
                                fontWeight: '600',
                                color: '#0f172a',
                                background: '#f8fafc',
                                outline: 'none'
                            }}
                        >
                            {['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(t => {
                                const [h] = t.split(':').map(Number);
                                const period = h >= 12 ? 'PM' : 'AM';
                                const displayHour = h % 12 === 0 ? 12 : h % 12;
                                return <option key={t} value={t}>{displayHour}:00 {period} ({t})</option>;
                            })}
                        </select>
                    </div>

                    {/* Duration */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                            Duration
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '13.5px',
                                fontWeight: '600',
                                color: '#0f172a',
                                background: '#f8fafc',
                                outline: 'none'
                            }}
                        >
                            <option value="2">2 Hours</option>
                            <option value="4">4 Hours</option>
                            <option value="6">6 Hours</option>
                            <option value="8">8 Hours</option>
                            <option value="12">12 Hours</option>
                            <option value="24">24 Hours (1 Day)</option>
                            <option value="48">2 Days (48 Hours)</option>
                            <option value="72">3 Days (72 Hours)</option>
                        </select>
                    </div>

                    {/* Action Button */}
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            type="submit"
                            disabled={checkingSlot}
                            style={{
                                width: '100%',
                                padding: '11px 16px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '13.5px',
                                fontWeight: '700',
                                cursor: checkingSlot ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { if (!checkingSlot) e.currentTarget.style.background = '#2563eb'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#3b82f6'; }}
                        >
                            {checkingSlot ? (
                                <><i className="fas fa-spinner fa-spin"></i> Checking...</>
                            ) : (
                                <><i className="fas fa-search"></i> Check Slot</>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Check Result Banner */}
            {checkResult && (
                <div style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    background: checkResult.available ? '#f0fdf4' : '#fef2f2',
                    border: `1.5px solid ${checkResult.available ? '#86efac' : '#fca5a5'}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: checkResult.available ? '#16a34a' : '#dc2626',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                        }}>
                            <i className={checkResult.available ? "fas fa-check" : "fas fa-times"}></i>
                        </span>
                        <div>
                            <div style={{
                                fontWeight: '800',
                                color: checkResult.available ? '#166534' : '#991b1b',
                                fontSize: '15px'
                            }}>
                                {checkResult.available ? '🎉 Slot Available!' : '⚠️ Slot Unavailable'}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: checkResult.available ? '#15803d' : '#b91c1c'
                            }}>
                                {checkResult.message}
                            </div>
                        </div>
                    </div>

                    {checkResult.available && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Est. Total</div>
                                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>₹{checkResult.totalCost}</div>
                            </div>
                            <button
                                type="button"
                                onClick={handleProceedToBook}
                                style={{
                                    background: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                            >
                                <span>Proceed to Book</span>
                                <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Daily Schedule Breakdown */}
            <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '16px 20px',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#334155',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span>
                        <i className="fas fa-list-ul" style={{ color: '#3b82f6', marginRight: '6px' }}></i>
                        Schedule on {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    {loadingSchedule && (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                            <i className="fas fa-spinner fa-spin"></i> Updating schedule...
                        </span>
                    )}
                </div>

                {schedule && schedule.bookedSlots && schedule.bookedSlots.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {schedule.bookedSlots.map((slot, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    background: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #fee2e2',
                                    fontSize: '12.5px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                                    <span style={{ fontWeight: '700', color: '#991b1b' }}>Booked:</span>
                                    <span style={{ color: '#334155', fontWeight: '600' }}>
                                        {slot.startTime} to {slot.endTime} ({slot.duration} hrs)
                                    </span>
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                                    1h Buffer: {slot.bufferStartTime} - {slot.bufferEndTime}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#15803d',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        <i className="fas fa-check-circle" style={{ color: '#16a34a' }}></i>
                        <span>No reservations for this date yet. All time slots are currently open!</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleAvailabilityChecker;
