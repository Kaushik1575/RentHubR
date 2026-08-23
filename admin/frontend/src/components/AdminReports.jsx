import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';

const AdminReports = ({ token }) => {
    // Filter states
    const [timeframe, setTimeframe] = useState('month'); // 'today', 'yesterday', 'week', 'last_7_days', 'month', 'last_month', 'year', 'custom'
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Report Data State
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBookingModal, setSelectedBookingModal] = useState(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                timeframe,
                startDate,
                endDate,
                vehicleCategory: categoryFilter,
                status: statusFilter
            });

            const res = await fetch(`/api/admin/reports/analytics?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setReportData(data);
            } else {
                toast.error(data.error || 'Failed to generate report');
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            toast.error('Network error loading analytics report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [timeframe, categoryFilter, statusFilter]);

    // Handle Custom Date Submit
    const handleCustomDateSubmit = (e) => {
        e.preventDefault();
        if (new Date(startDate) > new Date(endDate)) {
            toast.error('Start date cannot be after end date');
            return;
        }
        setTimeframe('custom');
        fetchReport();
    };

    // Export CSV Handler
    const handleExportCSV = () => {
        const queryParams = new URLSearchParams({
            timeframe,
            startDate,
            endDate,
            vehicleCategory: categoryFilter,
            status: statusFilter
        });
        window.open(`/api/admin/reports/export-csv?${queryParams.toString()}&token=${token}`, '_blank');
        toast.success('Downloading CSV Report...');
    };

    // Print Handler
    const handlePrint = () => {
        window.print();
    };

    // Filter bookings by in-table search query
    const filteredBookingsList = useMemo(() => {
        if (!reportData?.bookings) return [];
        if (!searchTerm.trim()) return reportData.bookings;

        const term = searchTerm.toLowerCase();
        return reportData.bookings.filter(b =>
            (b.booking_id && b.booking_id.toLowerCase().includes(term)) ||
            (b.customerName && b.customerName.toLowerCase().includes(term)) ||
            (b.customerEmail && b.customerEmail.toLowerCase().includes(term)) ||
            (b.customerPhone && b.customerPhone.includes(term)) ||
            (b.vehicleName && b.vehicleName.toLowerCase().includes(term)) ||
            (b.status && b.status.toLowerCase().includes(term))
        );
    }, [reportData, searchTerm]);

    const kpis = reportData?.kpis || {
        totalBookings: 0, completedBookings: 0, confirmedBookings: 0, cancelledBookings: 0,
        riderNotComeBookings: 0, cancellationRate: 0, completionRate: 0, grossRevenue: 0,
        advanceCollected: 0, balanceCollected: 0, totalRefunds: 0, netRevenue: 0,
        averageOrderValue: 0, totalRideHours: 0, averageDurationHours: 0
    };

    const riders = reportData?.riders || { uniqueRidersCount: 0, newRidersCount: 0, returningRidersCount: 0, topRiders: [] };
    const fleet = reportData?.fleet || { totalVehiclesInFleet: 0, categoryStats: {}, topVehicles: [] };
    const trends = reportData?.trends || [];

    // Max revenue for trend chart scaling
    const maxDailyRevenue = Math.max(...trends.map(t => t.revenue), 1000);

    return (
        <div className="admin-reports-wrapper" style={{ padding: '10px 0 60px 0' }}>
            {/* Header & Controls */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>
                        📊 Analytics & Business Reports
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                        Comprehensive revenue breakdown, rider metrics, fleet utilization, and downloadable financial reports.
                    </p>
                </div>

                {/* Export & Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        style={{
                            padding: '10px 16px',
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                        <span>Refresh</span>
                    </button>

                    <button
                        onClick={handleExportCSV}
                        style={{
                            padding: '10px 18px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'none'}
                    >
                        <i className="fas fa-file-csv"></i>
                        <span>Export CSV / Excel</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        style={{
                            padding: '10px 18px',
                            background: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'none'}
                    >
                        <i className="fas fa-print"></i>
                        <span>Print / PDF</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                marginBottom: '28px'
            }}>
                {/* Timeframe Buttons */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '18px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '16px'
                }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569', marginRight: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Timeframe:
                    </span>
                    {[
                        { id: 'today', label: 'Today' },
                        { id: 'yesterday', label: 'Yesterday' },
                        { id: 'this_week', label: 'This Week' },
                        { id: 'last_7_days', label: 'Last 7 Days' },
                        { id: 'month', label: 'This Month' },
                        { id: 'last_month', label: 'Last Month' },
                        { id: 'this_year', label: 'This Year' },
                        { id: 'custom', label: 'Custom Range' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setTimeframe(tab.id)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '30px',
                                border: '1px solid',
                                borderColor: timeframe === tab.id ? '#4f46e5' : '#e2e8f0',
                                background: timeframe === tab.id ? '#4f46e5' : '#f8fafc',
                                color: timeframe === tab.id ? '#ffffff' : '#475569',
                                fontWeight: timeframe === tab.id ? '700' : '500',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: timeframe === tab.id ? '0 4px 10px rgba(79, 70, 229, 0.2)' : 'none'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Secondary Filters (Category, Status, Custom Dates) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    alignItems: 'flex-end'
                }}>
                    {/* Vehicle Category */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                            <i className="fas fa-motorcycle" style={{ color: '#4f46e5', marginRight: '6px' }}></i>
                            Vehicle Category
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '13.5px',
                                fontWeight: '600',
                                color: '#1e293b',
                                background: '#f8fafc',
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Vehicles (Bikes, Scooty, Cars)</option>
                            <option value="bike">Bikes Only</option>
                            <option value="scooty">Scooty Only</option>
                            <option value="car">Cars Only</option>
                        </select>
                    </div>

                    {/* Booking Status */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                            <i className="fas fa-check-circle" style={{ color: '#10b981', marginRight: '6px' }}></i>
                            Booking Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '13.5px',
                                fontWeight: '600',
                                color: '#1e293b',
                                background: '#f8fafc',
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed Rides</option>
                            <option value="confirmed">Confirmed / Active</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rider_not_come">Rider Not Come (No-Show)</option>
                            <option value="pending">Pending Approval</option>
                        </select>
                    </div>

                    {/* Custom Start Date */}
                    {timeframe === 'custom' && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                From Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #cbd5e1',
                                    fontSize: '13.5px',
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    background: '#f8fafc',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    )}

                    {/* Custom End Date */}
                    {timeframe === 'custom' && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                To Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #cbd5e1',
                                    fontSize: '13.5px',
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    background: '#f8fafc',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    )}

                    {timeframe === 'custom' && (
                        <div>
                            <button
                                onClick={handleCustomDateSubmit}
                                style={{
                                    width: '100%',
                                    padding: '11px 16px',
                                    background: '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: '700',
                                    fontSize: '13.5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Apply Date Range
                            </button>
                        </div>
                    )}
                </div>

                {/* Period Active Badge */}
                {reportData && (
                    <div style={{ marginTop: '16px', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                        <span>
                            Report Period: <strong>{new Date(reportData.filter.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> to <strong>{new Date(reportData.filter.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        </span>
                    </div>
                )}
            </div>

            {/* Executive KPI Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '28px'
            }}>
                {/* 1. Net Revenue */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    color: 'white',
                    padding: '22px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(30, 27, 75, 0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Net Platform Revenue
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', margin: '8px 0', letterSpacing: '-0.5px' }}>
                        ₹{kpis.netRevenue.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#c7d2fe', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Gross: ₹{kpis.grossRevenue.toLocaleString('en-IN')}</span>
                        <span>Refunds: ₹{kpis.totalRefunds.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* 2. Total Bookings */}
                <div style={{
                    background: '#ffffff',
                    padding: '22px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Bookings</span>
                        <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                            {kpis.completionRate}% Done
                        </span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '8px 0' }}>
                        {kpis.totalBookings}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px' }}>
                        <span style={{ color: '#16a34a' }}>● {kpis.completedBookings} Completed</span>
                        <span style={{ color: '#2563eb' }}>● {kpis.confirmedBookings} Active</span>
                    </div>
                </div>

                {/* 3. Online Advance vs Balance */}
                <div style={{
                    background: '#ffffff',
                    padding: '22px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                        Advance Online (30%)
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '8px 0' }}>
                        ₹{kpis.advanceCollected.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                        <span>Cash Settled on Pickup: </span>
                        <strong style={{ color: '#0f172a' }}>₹{kpis.balanceCollected.toLocaleString('en-IN')}</strong>
                    </div>
                </div>

                {/* 4. Cancellations & No-Shows */}
                <div style={{
                    background: '#ffffff',
                    padding: '22px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Cancellations & No-Show</span>
                        <span style={{ background: kpis.cancellationRate > 15 ? '#fee2e2' : '#f1f5f9', color: kpis.cancellationRate > 15 ? '#dc2626' : '#64748b', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                            {kpis.cancellationRate}% Rate
                        </span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#dc2626', margin: '8px 0' }}>
                        {kpis.cancelledBookings + kpis.riderNotComeBookings}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px' }}>
                        <span>{kpis.cancelledBookings} Cancelled</span>
                        <span>{kpis.riderNotComeBookings} No-Shows</span>
                    </div>
                </div>

                {/* 5. Unique Riders & New Users */}
                <div style={{
                    background: '#ffffff',
                    padding: '22px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                        Active Riders In Period
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '8px 0' }}>
                        {riders.uniqueRidersCount}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '10px' }}>
                        <span style={{ color: '#059669', fontWeight: '700' }}>+{riders.newRidersCount} New Riders</span>
                        <span>({riders.returningRidersCount} Repeat)</span>
                    </div>
                </div>
            </div>

            {/* Visual Analytics Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '20px',
                marginBottom: '28px'
            }}>
                {/* 1. Daily Trend Visualizer */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                                📈 Revenue & Volume Trend
                            </h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Daily performance across selected period</p>
                        </div>
                    </div>

                    {trends.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '6px' }}>
                            {trends.map(t => {
                                const fillPercentage = Math.min(100, Math.round((t.revenue / maxDailyRevenue) * 100));
                                return (
                                    <div key={t.date} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px' }}>
                                        <div style={{ width: '70px', fontWeight: '700', color: '#475569', flexShrink: 0 }}>
                                            {t.displayDate} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({t.dayName})</span>
                                        </div>

                                        {/* Bar */}
                                        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '6px', height: '22px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: `${Math.max(5, fillPercentage)}%`,
                                                background: t.revenue > 0 ? 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)' : '#e2e8f0',
                                                height: '100%',
                                                borderRadius: '6px',
                                                transition: 'width 0.4s ease'
                                            }}></div>
                                            <span style={{ position: 'absolute', left: '10px', fontSize: '11px', fontWeight: '700', color: fillPercentage > 35 ? 'white' : '#1e293b' }}>
                                                {t.totalBookings > 0 ? `${t.totalBookings} rides • ₹${t.revenue.toLocaleString('en-IN')}` : '0 rides'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No daily data in this range</div>
                    )}
                </div>

                {/* 2. Category Share & Status Distribution */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                            🏍️ Category Revenue & Volume
                        </h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#64748b' }}>Bikes vs Scooty vs Cars breakdown</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                            {Object.entries(fleet.categoryStats).map(([key, cat]) => {
                                const catShare = kpis.grossRevenue > 0 ? Math.round((cat.revenue / kpis.grossRevenue) * 100) : 0;
                                const icon = key === 'bike' ? '🏍️' : key === 'scooty' ? '🛵' : '🚗';
                                return (
                                    <div key={key} style={{
                                        background: '#f8fafc',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
                                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>{cat.name}</div>
                                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#4f46e5', margin: '4px 0' }}>
                                            ₹{cat.revenue.toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                            {cat.count} rides ({catShare}%)
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Booking Status Distribution Bar */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                            <span>Booking Status Breakdown</span>
                            <span>{kpis.totalBookings} Total</span>
                        </div>

                        <div style={{ height: '12px', borderRadius: '10px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                            {kpis.totalBookings > 0 && (
                                <>
                                    <div style={{ width: `${(kpis.completedBookings / kpis.totalBookings) * 100}%`, background: '#10b981' }} title={`Completed: ${kpis.completedBookings}`}></div>
                                    <div style={{ width: `${(kpis.confirmedBookings / kpis.totalBookings) * 100}%`, background: '#3b82f6' }} title={`Active: ${kpis.confirmedBookings}`}></div>
                                    <div style={{ width: `${(kpis.cancelledBookings / kpis.totalBookings) * 100}%`, background: '#ef4444' }} title={`Cancelled: ${kpis.cancelledBookings}`}></div>
                                    <div style={{ width: `${(kpis.riderNotComeBookings / kpis.totalBookings) * 100}%`, background: '#f59e0b' }} title={`No Show: ${kpis.riderNotComeBookings}`}></div>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                            <span><strong style={{ color: '#10b981' }}>●</strong> Completed ({kpis.completedBookings})</span>
                            <span><strong style={{ color: '#3b82f6' }}>●</strong> Confirmed ({kpis.confirmedBookings})</span>
                            <span><strong style={{ color: '#ef4444' }}>●</strong> Cancelled ({kpis.cancelledBookings})</span>
                            <span><strong style={{ color: '#f59e0b' }}>●</strong> No-Show ({kpis.riderNotComeBookings})</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two Column Tables: Top Vehicles & Top Customers */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '20px',
                marginBottom: '28px'
            }}>
                {/* Top Performing Vehicles */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                        🏆 Top Performing Vehicles
                    </h3>

                    {fleet.topVehicles && fleet.topVehicles.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {fleet.topVehicles.map((v, i) => (
                                <div key={v.id || i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 14px',
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    fontSize: '13px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: '900', color: '#6366f1', width: '20px' }}>#{i + 1}</span>
                                        <div>
                                            <div style={{ fontWeight: '800', color: '#1e293b' }}>{v.name}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
                                                {v.category} • ₹{v.price}/hr
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '900', color: '#0f172a' }}>₹{v.revenue.toLocaleString('en-IN')}</div>
                                        <div style={{ fontSize: '11px', color: '#16a34a' }}>{v.bookingsCount} bookings</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0' }}>No vehicle stats in this period</div>
                    )}
                </div>

                {/* Top Riders Leaderboard */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                        👑 Top Customers / Riders
                    </h3>

                    {riders.topRiders && riders.topRiders.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {riders.topRiders.slice(0, 5).map((r, i) => (
                                <div key={r.userId || i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 14px',
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    fontSize: '13px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: '900', color: '#f59e0b', width: '20px' }}>#{i + 1}</span>
                                        <div>
                                            <div style={{ fontWeight: '800', color: '#1e293b' }}>{r.name}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                {r.phone || r.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '900', color: '#0f172a' }}>₹{r.totalSpent.toLocaleString('en-IN')}</div>
                                        <div style={{ fontSize: '11px', color: '#4f46e5' }}>{r.bookingsCount} rides</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0' }}>No customer stats in this period</div>
                    )}
                </div>
            </div>

            {/* Detailed Filtered Bookings Table */}
            <div style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
            }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    marginBottom: '20px'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                            📋 Bookings Master Record ({filteredBookingsList.length})
                        </h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>All reservation transactions in the selected date range</p>
                    </div>

                    {/* Table Search */}
                    <div style={{ position: 'relative', width: '280px' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
                        <input
                            type="text"
                            placeholder="Search by ID, name, vehicle..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '9px 12px 9px 34px',
                                borderRadius: '10px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '800' }}>Booking ID</th>
                                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '800' }}>Customer</th>
                                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '800' }}>Vehicle</th>
                                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '800' }}>Date & Slot</th>
                                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '800' }}>Duration</th>
                                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '800' }}>Gross Amt</th>
                                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '800' }}>Advance Paid</th>
                                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: '800' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookingsList.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                        No bookings match the filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredBookingsList.map(b => (
                                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '12px 14px', fontWeight: '800', color: '#4f46e5' }}>
                                            {b.booking_id}
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{b.customerName}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>{b.customerPhone || b.customerEmail}</div>
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{b.vehicleName}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>{b.vehicleCategory}</div>
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#334155', fontWeight: '600' }}>
                                            {b.startDate} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({b.startTime})</span>
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                                            {b.duration} hrs
                                        </td>
                                        <td style={{ padding: '12px 14px', fontWeight: '800', color: '#0f172a' }}>
                                            ₹{b.totalAmount}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#16a34a', fontWeight: '700' }}>
                                            ₹{b.advancePayment}
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                background: ['completed', 'ride_completed'].includes(b.status) ? '#dcfce7' :
                                                            ['confirmed', 'active'].includes(b.status) ? '#dbeafe' :
                                                            b.status === 'cancelled' ? '#fee2e2' :
                                                            b.status === 'rider_not_come' ? '#fef3c7' : '#f1f5f9',
                                                color: ['completed', 'ride_completed'].includes(b.status) ? '#15803d' :
                                                       ['confirmed', 'active'].includes(b.status) ? '#1d4ed8' :
                                                       b.status === 'cancelled' ? '#b91c1c' :
                                                       b.status === 'rider_not_come' ? '#b45309' : '#475569'
                                            }}>
                                                {b.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
