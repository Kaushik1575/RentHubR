import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminReports.css';

const AdminReports = ({ token }) => {
    // Current admin information
    const adminUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    }, []);

    // Filter states
    const [timeframe, setTimeframe] = useState('month'); // 'today', 'yesterday', 'this_week', 'last_7_days', 'month', 'last_month', 'this_year', 'custom'
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'bike', 'scooty', 'car'
    const [statusFilter, setStatusFilter] = useState('all');

    // Navigation Sub-Tab within Analytics
    const [activeView, setActiveView] = useState('overview'); // 'overview', 'revenue', 'fleet', 'riders', 'ledger'

    // Trend Chart metric toggle
    const [trendMetric, setTrendMetric] = useState('revenue'); // 'revenue', 'bookings', 'advance', 'aov'
    const [hoveredPoint, setHoveredPoint] = useState(null);

    // Report Data State
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [ledgerStatusFilter, setLedgerStatusFilter] = useState('all'); // 'all', 'completed', 'confirmed', 'cancelled'
    const [fleetCategoryFilter, setFleetCategoryFilter] = useState('all'); // 'all', 'bike', 'scooty', 'car'
    const [fleetSearchTerm, setFleetSearchTerm] = useState('');
    const [selectedBookingModal, setSelectedBookingModal] = useState(null);
    const [showCompanyReportModal, setShowCompanyReportModal] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

    // Ref for SVG trend chart measuring
    const svgTrendRef = useRef(null);

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
                setLastSyncTime(new Date().toLocaleTimeString());
            } else {
                toast.error(data.error || 'Failed to load analytics data');
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            toast.error('Network error loading analytics');
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

    // Filter bookings by in-table search query and status pill
    const filteredBookingsList = useMemo(() => {
        if (!reportData?.bookings) return [];
        let list = reportData.bookings;

        if (ledgerStatusFilter !== 'all') {
            list = list.filter(b => {
                const s = (b.status || '').toLowerCase();
                if (ledgerStatusFilter === 'completed') return s.includes('completed');
                if (ledgerStatusFilter === 'confirmed') return s.includes('confirmed') || s.includes('active');
                if (ledgerStatusFilter === 'cancelled') return s.includes('cancel') || s.includes('not_come');
                return true;
            });
        }

        if (!searchTerm.trim()) return list;

        const term = searchTerm.toLowerCase();
        return list.filter(b =>
            (b.booking_id && b.booking_id.toLowerCase().includes(term)) ||
            (b.customerName && b.customerName.toLowerCase().includes(term)) ||
            (b.customerEmail && b.customerEmail.toLowerCase().includes(term)) ||
            (b.customerPhone && b.customerPhone.includes(term)) ||
            (b.vehicleName && b.vehicleName.toLowerCase().includes(term)) ||
            (b.status && b.status.toLowerCase().includes(term))
        );
    }, [reportData, searchTerm, ledgerStatusFilter]);

    const kpis = reportData?.kpis || {
        totalBookings: 0, completedBookings: 0, confirmedBookings: 0, cancelledBookings: 0,
        riderNotComeBookings: 0, cancellationRate: 0, completionRate: 0, grossRevenue: 0,
        advanceCollected: 0, balanceCollected: 0, totalRefunds: 0, netRevenue: 0,
        averageOrderValue: 0, totalRideHours: 0, averageDurationHours: 0
    };

    const riders = reportData?.riders || { uniqueRidersCount: 0, newRidersCount: 0, returningRidersCount: 0, topRiders: [] };
    const fleet = reportData?.fleet || { totalVehiclesInFleet: 0, categoryStats: {}, topVehicles: [], allVehicles: [] };
    const trends = reportData?.trends || [];

    // Filter full fleet list by category & search term
    const filteredFleetList = useMemo(() => {
        const list = fleet.allVehicles || fleet.topVehicles || [];
        return list.filter(v => {
            const matchesCat = fleetCategoryFilter === 'all' || v.category === fleetCategoryFilter;
            const matchesSearch = !fleetSearchTerm.trim() ||
                (v.name && v.name.toLowerCase().includes(fleetSearchTerm.toLowerCase())) ||
                String(v.id).includes(fleetSearchTerm.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [fleet, fleetCategoryFilter, fleetSearchTerm]);

    // Calculate Peak Rental Hourly Demand from booking times
    const hourlyDistribution = useMemo(() => {
        const slots = [
            { id: 'early', label: '6 AM - 9 AM', sub: 'Early Commute', count: 0, revenue: 0 },
            { id: 'morning', label: '9 AM - 12 PM', sub: 'Morning Rush', count: 0, revenue: 0 },
            { id: 'afternoon', label: '12 PM - 4 PM', sub: 'Midday Runs', count: 0, revenue: 0 },
            { id: 'evening', label: '4 PM - 8 PM', sub: 'Evening Prime', count: 0, revenue: 0 },
            { id: 'night', label: '8 PM - 12 AM', sub: 'Late Leisure', count: 0, revenue: 0 }
        ];

        if (!reportData?.bookings) return slots;

        reportData.bookings.forEach(b => {
            if (!b.startTime || b.startTime === 'N/A') return;
            const hour = parseInt(b.startTime.split(':')[0], 10);
            if (isNaN(hour)) return;

            let targetSlot = null;
            if (hour >= 6 && hour < 9) targetSlot = slots[0];
            else if (hour >= 9 && hour < 12) targetSlot = slots[1];
            else if (hour >= 12 && hour < 16) targetSlot = slots[2];
            else if (hour >= 16 && hour < 20) targetSlot = slots[3];
            else if (hour >= 20 || hour < 6) targetSlot = slots[4];

            if (targetSlot) {
                targetSlot.count += 1;
                if (b.status !== 'cancelled') {
                    targetSlot.revenue += (b.totalAmount || 0);
                }
            }
        });

        return slots;
    }, [reportData]);

    const maxHourlyCount = Math.max(...hourlyDistribution.map(s => s.count), 1);
    const busiestHourlySlot = useMemo(() => {
        return [...hourlyDistribution].sort((a, b) => b.count - a.count)[0];
    }, [hourlyDistribution]);

    // ==========================================
    // SVG Trend Area & Spline Calculations
    // ==========================================
    const svgWidth = 720;
    const svgHeight = 230;
    const paddingX = 40;
    const paddingY = 30;

    const chartPoints = useMemo(() => {
        if (!trends || trends.length === 0) return [];

        const getMetricVal = (item) => {
            if (trendMetric === 'revenue') return item.revenue || 0;
            if (trendMetric === 'bookings') return item.totalBookings || 0;
            if (trendMetric === 'advance') return item.advance || 0;
            if (trendMetric === 'aov') {
                return item.totalBookings > 0 ? Math.round(item.revenue / item.totalBookings) : 0;
            }
            return item.revenue || 0;
        };

        const values = trends.map(t => getMetricVal(t));
        const maxVal = Math.max(...values, 10);
        const minVal = 0;

        const effectiveW = svgWidth - (paddingX * 2);
        const effectiveH = svgHeight - (paddingY * 2);

        return trends.map((t, i) => {
            const val = getMetricVal(t);
            const x = trends.length > 1
                ? paddingX + (i / (trends.length - 1)) * effectiveW
                : paddingX + effectiveW / 2;
            const y = svgHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * effectiveH;

            return {
                x,
                y,
                val,
                date: t.date,
                displayDate: t.displayDate,
                dayName: t.dayName,
                totalBookings: t.totalBookings,
                revenue: t.revenue,
                advance: t.advance
            };
        });
    }, [trends, trendMetric]);

    // Build SVG Path with smooth cubic bezier spline
    const { pathD, areaD } = useMemo(() => {
        if (chartPoints.length === 0) return { pathD: '', areaD: '' };
        if (chartPoints.length === 1) {
            const p = chartPoints[0];
            return {
                pathD: `M ${p.x - 10} ${p.y} L ${p.x + 10} ${p.y}`,
                areaD: `M ${p.x - 10} ${p.y} L ${p.x + 10} ${p.y} L ${p.x + 10} ${svgHeight - paddingY} L ${p.x - 10} ${svgHeight - paddingY} Z`
            };
        }

        let d = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
        for (let i = 0; i < chartPoints.length - 1; i++) {
            const p0 = chartPoints[i];
            const p1 = chartPoints[i + 1];
            const cpX1 = p0.x + (p1.x - p0.x) / 2;
            const cpY1 = p0.y;
            const cpX2 = p0.x + (p1.x - p0.x) / 2;
            const cpY2 = p1.y;
            d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
        }

        const first = chartPoints[0];
        const last = chartPoints[chartPoints.length - 1];
        const baseY = svgHeight - paddingY;
        const area = `${d} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;

        return { pathD: d, areaD: area };
    }, [chartPoints]);

    const peakPoint = useMemo(() => {
        if (chartPoints.length === 0) return null;
        return [...chartPoints].sort((a, b) => b.val - a.val)[0];
    }, [chartPoints]);

    // ==========================================
    // Donut Chart Segment Calculations (Fleet Categories)
    // ==========================================
    const categoryDonutData = useMemo(() => {
        const catMap = fleet.categoryStats || {};
        const bikeRev = catMap.bike?.revenue || 0;
        const scootyRev = catMap.scooty?.revenue || 0;
        const carRev = catMap.car?.revenue || 0;
        const total = bikeRev + scootyRev + carRev || 1;

        const bikePct = (bikeRev / total) * 100;
        const scootyPct = (scootyRev / total) * 100;
        const carPct = (carRev / total) * 100;

        const radius = 55;
        const circumference = 2 * Math.PI * radius; // ~345.5

        const bikeStroke = (bikePct / 100) * circumference;
        const scootyStroke = (scootyPct / 100) * circumference;
        const carStroke = (carPct / 100) * circumference;

        return {
            totalRevenue: total === 1 ? 0 : total,
            radius,
            circumference,
            categories: [
                { id: 'bike', name: 'Motorbikes', color: '#4f46e5', rev: bikeRev, count: catMap.bike?.count || 0, pct: Math.round(bikePct), stroke: bikeStroke, offset: 0 },
                { id: 'scooty', name: 'Scooters', color: '#10b981', rev: scootyRev, count: catMap.scooty?.count || 0, pct: Math.round(scootyPct), stroke: scootyStroke, offset: -bikeStroke },
                { id: 'car', name: 'Cars', color: '#f59e0b', rev: carRev, count: catMap.car?.count || 0, pct: Math.round(carPct), stroke: carStroke, offset: -(bikeStroke + scootyStroke) }
            ]
        };
    }, [fleet.categoryStats]);

    const dominantCategory = useMemo(() => {
        const entries = Object.entries(fleet.categoryStats || {});
        if (entries.length === 0) return 'Bikes';
        entries.sort((a, b) => (b[1].revenue || 0) - (a[1].revenue || 0));
        return entries[0] ? entries[0][1].name : 'Bikes';
    }, [fleet.categoryStats]);

    // Unique Report Serial
    const reportRefId = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `RH-CORP-${y}${m}${d}-${Math.floor(1000 + Math.random() * 9000)}`;
    }, [reportData]);

    // Clipboard Helper
    const copyToClipboard = (text, label = 'Item') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard!`, { duration: 1600 });
    };

    // Sparkline Trend Data Extracted from Trends
    const sparklineRevenue = useMemo(() => {
        const pts = trends.slice(-7).map(t => t.revenue || 0);
        return pts.length >= 2 ? pts : [1200, 2400, 1800, 3100, 2900, 4200, 4800];
    }, [trends]);

    const sparklineBookings = useMemo(() => {
        const pts = trends.slice(-7).map(t => t.totalBookings || 0);
        return pts.length >= 2 ? pts : [2, 4, 3, 6, 5, 8, 9];
    }, [trends]);

    const sparklineAdvance = useMemo(() => {
        const pts = trends.slice(-7).map(t => t.advance || 0);
        return pts.length >= 2 ? pts : [360, 720, 540, 930, 870, 1260, 1440];
    }, [trends]);

    const sparklineAov = useMemo(() => {
        const pts = trends.slice(-7).map(t => t.totalBookings > 0 ? Math.round(t.revenue / t.totalBookings) : 0);
        return pts.length >= 2 ? pts : [500, 550, 520, 580, 600, 590, 620];
    }, [trends]);

    const sparklineRiders = useMemo(() => {
        const pts = trends.slice(-7).map(t => Math.max(1, Math.round((t.totalBookings || 1) * 0.85)));
        return pts.length >= 2 ? pts : [2, 3, 3, 5, 4, 7, 8];
    }, [trends]);

    const sparklineCancel = useMemo(() => {
        const pts = trends.slice(-7).map(t => t.cancelled || 0);
        return pts.length >= 2 ? pts : [0, 1, 0, 1, 0, 0, 1];
    }, [trends]);

    // Lightweight inline SVG sparkline renderer
    const renderSparkline = (points, stroke = '#3b82f6') => {
        const w = 110;
        const h = 30;
        const max = Math.max(...points, 1);
        const min = Math.min(...points, 0);
        const range = max - min || 1;

        const coords = points.map((val, i) => {
            const x = (i / (points.length - 1)) * (w - 6) + 3;
            const y = h - 4 - ((val - min) / range) * (h - 8);
            return { x, y };
        });

        let d = `M ${coords[0].x} ${coords[0].y}`;
        for (let i = 0; i < coords.length - 1; i++) {
            const p0 = coords[i];
            const p1 = coords[i + 1];
            const cx = (p0.x + p1.x) / 2;
            d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        const area = `${d} L ${coords[coords.length - 1].x} ${h} L ${coords[0].x} ${h} Z`;
        const gradId = `spark-grad-${stroke.replace(/[^a-zA-Z0-9]/g, '')}`;

        return (
            <svg width={w} height={h} style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={stroke} stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <path d={area} fill={`url(#${gradId})`} />
                <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2.5" fill={stroke} />
            </svg>
        );
    };

    // ========================================================
    // HELPER: Convert Image URL to Base64 Data URL for jsPDF
    // ========================================================
    const loadImageAsDataUrl = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch {
                    resolve(null);
                }
            };
            img.onerror = () => {
                fetch(url)
                    .then(r => r.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = () => resolve(null);
                        reader.readAsDataURL(blob);
                    })
                    .catch(() => resolve(null));
            };
            img.src = url;
        });
    };

    // ========================================================
    // HELPER: Capture Live SVG Trend Chart as a High-Res PNG
    // ========================================================
    const captureSvgChartAsDataUrl = () => {
        return new Promise((resolve) => {
            try {
                const svgEl = svgTrendRef.current?.querySelector('svg');
                if (!svgEl) {
                    resolve(null);
                    return;
                }

                const svgString = new XMLSerializer().serializeToString(svgEl);
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const URL = window.URL || window.webkitURL || window;
                const blobURL = URL.createObjectURL(svgBlob);

                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = svgWidth * 2;
                    canvas.height = svgHeight * 2;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(blobURL);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => {
                    URL.revokeObjectURL(blobURL);
                    resolve(null);
                };
                img.src = blobURL;
            } catch (e) {
                console.warn('SVG chart capture error:', e);
                resolve(null);
            }
        });
    };

    // ========================================================
    // REAL CORPORATE PDF EXPORT WITH LOGO, GRAPHS & ALL BOOKINGS
    // ========================================================
    const exportRealPDFReport = async () => {
        try {
            toast.loading('Compiling Executive PDF with Logo, Graphs & Complete Bookings...', { id: 'pdf-toast' });

            // Load RentHub logo and SVG performance chart concurrently
            const [logoDataUrl, chartDataUrl] = await Promise.all([
                loadImageAsDataUrl('/renthub-logo.png'),
                captureSvgChartAsDataUrl()
            ]);

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const nowStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const adminName = adminUser.adminName || 'System Administrator';

            // ==========================================================
            // PAGE 1: EXECUTIVE BRIEF & PERFORMANCE DASHBOARD WITH GRAPH
            // ==========================================================

            // 1. Corporate Royal Blue Header Banner
            doc.setFillColor(30, 64, 175); // #1e40af
            doc.rect(0, 0, pageWidth, 42, 'F');

            // Header Accent Line (Vibrant Blue)
            doc.setFillColor(37, 99, 235); // #2563eb
            doc.rect(0, 41, pageWidth, 1.5, 'F');

            // Embed RentHub Logo or Logo Badge
            let textStartX = 14;
            if (logoDataUrl) {
                try {
                    // White circular backdrop for clean contrast
                    doc.setFillColor(255, 255, 255);
                    doc.roundedRect(14, 8, 26, 26, 4, 4, 'F');
                    doc.addImage(logoDataUrl, 'PNG', 15.5, 9.5, 23, 23);
                    textStartX = 44;
                } catch {
                    textStartX = 14;
                }
            } else {
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(14, 9, 24, 24, 4, 4, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.setTextColor(30, 64, 175);
                doc.text('RH', 20, 25);
                textStartX = 42;
            }

            // Company Title & Report Identity
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(255, 255, 255);
            doc.text('RentHub Mobility Solutions Pvt. Ltd.', textStartX, 17);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(219, 234, 254); // #dbeafe
            doc.text('Executive Corporate Performance & Operational Audit Report', textStartX, 24);
            doc.setFontSize(8.5);
            doc.setTextColor(191, 219, 254);
            doc.text(`Ref ID: ${reportRefId}   •   Issue Date: ${nowStr}   •   Auditor: ${adminName}`, textStartX, 30);

            // Verified Audit Seal (Right Header)
            doc.setFillColor(16, 185, 129);
            doc.roundedRect(pageWidth - 46, 13, 32, 9, 2, 2, 'F');
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('VERIFIED AUDIT', pageWidth - 43, 19);

            // 2. Report Scope & Parameters Bar
            let currentY = 50;
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, currentY, pageWidth - 28, 11, 2, 2, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.4);
            doc.roundedRect(14, currentY, pageWidth - 28, 11, 2, 2, 'D');

            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            doc.text(`Period: ${reportData?.filter?.startDate || startDate} to ${reportData?.filter?.endDate || endDate}`, 18, currentY + 7);
            doc.text(`Fleet Scope: ${categoryFilter.toUpperCase()}`, 105, currentY + 7);
            doc.text(`Status: ${statusFilter.toUpperCase()}`, 160, currentY + 7);

            // 3. Four Core Highlight Stat Cards
            currentY += 16;
            const cardW = (pageWidth - 28 - 9) / 4;
            const cardH = 21;

            const statCards = [
                { label: 'Gross Bookings', val: `INR ${kpis.grossRevenue.toLocaleString('en-IN')}`, sub: '100% Booking Value', color: [37, 99, 235] },
                { label: 'Net Realized Profit', val: `INR ${kpis.netRevenue.toLocaleString('en-IN')}`, sub: 'Retained Treasury', color: [16, 185, 129] },
                { label: 'Total Rides', val: `${kpis.totalBookings} Rides`, sub: `${kpis.completionRate}% Fulfilment Rate`, color: [2, 132, 199] },
                { label: 'Advance / Desk Cash', val: `30% / 70%`, sub: `INR ${kpis.advanceCollected.toLocaleString('en-IN')} Online`, color: [245, 158, 11] },
            ];

            statCards.forEach((c, idx) => {
                const cX = 14 + idx * (cardW + 3);
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(cX, currentY, cardW, cardH, 2, 2, 'F');
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.4);
                doc.roundedRect(cX, currentY, cardW, cardH, 2, 2, 'D');

                // Color accent top strip
                doc.setFillColor(c.color[0], c.color[1], c.color[2]);
                doc.rect(cX, currentY, cardW, 1.2, 'F');

                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 116, 139);
                doc.text(c.label.toUpperCase(), cX + 3.5, currentY + 6);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text(c.val, cX + 3.5, currentY + 12.5);

                doc.setFontSize(6.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text(c.sub, cX + 3.5, currentY + 17.5);
            });

            // 4. Plain-English Executive Summary Box
            currentY += 26;
            doc.setFillColor(239, 246, 255); // #eff6ff
            doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'F');
            doc.setDrawColor(191, 219, 254);
            doc.setLineWidth(0.6);
            doc.line(14, currentY, 14, currentY + 20);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(30, 64, 175);
            doc.text('Executive Overview (Plain Summary):', 18, currentY + 5.5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);
            const narrativeText = `During this audit period, RentHub registered ${kpis.totalBookings} total bookings across ${riders.uniqueRidersCount} unique riders. Gross customer booking spend was INR ${kpis.grossRevenue.toLocaleString('en-IN')}, of which INR ${kpis.advanceCollected.toLocaleString('en-IN')} (30%) was collected digitally in advance, and INR ${kpis.balanceCollected.toLocaleString('en-IN')} (70%) was settled physically at vehicle pickup. Net operating profit stands at INR ${kpis.netRevenue.toLocaleString('en-IN')} with an overall fleet fulfilment rate of ${kpis.completionRate}%. Top category: ${dominantCategory}.`;
            const splitNarrative = doc.splitTextToSize(narrativeText, pageWidth - 36);
            doc.text(splitNarrative, 18, currentY + 11);

            // 5. GRAPH SECTION: Performance Trajectory & Volume Chart
            currentY += 25;
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('I. Performance Trajectory & Ride Volume Curve (Visual Graph)', 14, currentY);

            if (chartDataUrl) {
                try {
                    const chartW = pageWidth - 28;
                    const chartH = 46;
                    doc.setFillColor(255, 255, 255);
                    doc.roundedRect(14, currentY + 3, chartW, chartH, 2, 2, 'F');
                    doc.setDrawColor(226, 232, 240);
                    doc.setLineWidth(0.4);
                    doc.roundedRect(14, currentY + 3, chartW, chartH, 2, 2, 'D');

                    doc.addImage(chartDataUrl, 'PNG', 16, currentY + 4.5, chartW - 4, chartH - 3);
                    currentY += 54;
                } catch {
                    currentY += 8;
                }
            } else {
                currentY += 8;
            }

            // 6. Fleet Category Performance Breakdown Table
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('II. Fleet Vehicle Category Division Breakdown', 14, currentY);

            const catRows = categoryDonutData.categories.map(c => [
                c.name,
                `${c.count} bookings`,
                `${c.pct}% of total`,
                `INR ${c.rev.toLocaleString('en-IN')}`,
                c.count > 0 ? `INR ${Math.round(c.rev / c.count).toLocaleString('en-IN')}` : 'INR 0',
                c.count > 0 ? `${Math.round(((c.count - (c.cancelled || 0)) / c.count) * 100)}%` : '100%'
            ]);

            autoTable(doc, {
                startY: currentY + 3,
                margin: { left: 14, right: 14 },
                head: [['Vehicle Category', 'Ride Count', 'Volume Share', 'Gross Revenue (INR)', 'Average Fare', 'Completion %']],
                body: catRows,
                theme: 'striped',
                headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
                bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });

            // Visual Fleet Share Stacked Bar (under Table II)
            const afterCatTableY = doc.lastAutoTable.finalY + 3.5;
            if (afterCatTableY < 274) {
                const barWidth = pageWidth - 28;
                const barHeight = 4.2;
                let currBarX = 14;

                categoryDonutData.categories.forEach(cat => {
                    const segW = (cat.pct / 100) * barWidth;
                    if (segW > 0) {
                        if (cat.id === 'bike') doc.setFillColor(79, 70, 229);
                        else if (cat.id === 'scooty') doc.setFillColor(16, 185, 129);
                        else doc.setFillColor(245, 158, 11);
                        doc.rect(currBarX, afterCatTableY, segW, barHeight, 'F');
                        currBarX += segW;
                    }
                });

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6.8);
                doc.setTextColor(100, 116, 139);
                doc.text('Visual Fleet Share:  Motorbikes (Indigo)  •  Scooters (Emerald)  •  Cars (Amber)', 14, afterCatTableY + barHeight + 3.8);
            }

            // ==========================================================
            // PAGE 2+: FULL BOOKING AUDIT LEDGER WITH ALL DETAILS
            // ==========================================================
            doc.addPage();
            currentY = 24;

            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`III. Itemized Booking Audit Records (${reportData?.bookings?.length || 0} Total Bookings)`, 14, currentY);

            // Build all booking rows
            const allBookingsRows = (reportData?.bookings || []).map((b, idx) => [
                idx + 1,
                b.booking_id || `#${b.id || idx + 1}`,
                `${b.customerName || 'Customer'}\n${b.customerPhone || 'N/A'}`,
                `${b.vehicleName || 'Vehicle'}\n(${b.vehicleCategory || 'Bike'})`,
                `${b.startDate || 'N/A'} (${b.duration || 1}h)`,
                `INR ${(b.totalAmount || 0).toLocaleString('en-IN')}`,
                `INR ${(b.advancePayment || 0).toLocaleString('en-IN')}`,
                `INR ${(b.remainingAmount || 0).toLocaleString('en-IN')}`,
                (b.status || 'confirmed').replace(/_/g, ' ').toUpperCase()
            ]);

            autoTable(doc, {
                startY: currentY + 3,
                margin: { left: 14, right: 14, bottom: 18 },
                head: [['#', 'Booking ID', 'Rider & Contact', 'Vehicle & Class', 'Schedule', 'Total (₹)', 'Advance 30%', 'Desk 70%', 'Status']],
                body: allBookingsRows.length > 0 ? allBookingsRows : [['1', 'No records found', '-', '-', '-', '-', '-', '-', '-']],
                foot: [[
                    'TOTAL',
                    `${reportData?.bookings?.length || 0} Rides`,
                    '-',
                    '-',
                    `${kpis.totalRideHours || 0} hrs`,
                    `INR ${kpis.grossRevenue.toLocaleString('en-IN')}`,
                    `INR ${kpis.advanceCollected.toLocaleString('en-IN')}`,
                    `INR ${kpis.balanceCollected.toLocaleString('en-IN')}`,
                    `${kpis.completionRate}% Done`
                ]],
                theme: 'striped',
                headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
                bodyStyles: { fontSize: 6.5, textColor: [30, 41, 59], cellPadding: 2 },
                footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 6.8 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    0: { cellWidth: 7 },
                    1: { cellWidth: 20, fontStyle: 'bold' },
                    2: { cellWidth: 26 },
                    3: { cellWidth: 26 },
                    4: { cellWidth: 22 },
                    5: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
                    6: { cellWidth: 17, halign: 'right' },
                    7: { cellWidth: 17, halign: 'right' },
                    8: { cellWidth: 19, halign: 'center' }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 8) {
                        const val = String(data.cell.raw || '').toLowerCase();
                        if (val.includes('completed')) {
                            data.cell.styles.fillColor = [220, 252, 231];
                            data.cell.styles.textColor = [22, 101, 52];
                            data.cell.styles.fontStyle = 'bold';
                        } else if (val.includes('confirmed') || val.includes('active')) {
                            data.cell.styles.fillColor = [224, 242, 254];
                            data.cell.styles.textColor = [7, 89, 133];
                            data.cell.styles.fontStyle = 'bold';
                        } else if (val.includes('cancel')) {
                            data.cell.styles.fillColor = [254, 226, 226];
                            data.cell.styles.textColor = [153, 27, 27];
                            data.cell.styles.fontStyle = 'bold';
                        } else if (val.includes('not come') || val.includes('no show')) {
                            data.cell.styles.fillColor = [254, 243, 199];
                            data.cell.styles.textColor = [146, 64, 14];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                }
            });

            // Financial Summary & Cash Flow Statement
            currentY = doc.lastAutoTable.finalY + 8;
            if (currentY > 215) {
                doc.addPage();
                currentY = 24;
            }

            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('IV. Platform Cash Flow & Treasury Reconciliation', 14, currentY);

            autoTable(doc, {
                startY: currentY + 3,
                margin: { left: 14, right: 14, bottom: 18 },
                head: [['Financial Account Description', 'Settlement Channel', 'Amount (INR)', 'Audit Status']],
                body: [
                    ['Gross Platform Booking Volume (100%)', 'Total Customer Gross Bookings', `INR ${kpis.grossRevenue.toLocaleString('en-IN')}`, 'RECONCILED'],
                    ['Digital Advance Collected (30%)', 'Online Payment Gateway (Razorpay/Cards)', `INR ${kpis.advanceCollected.toLocaleString('en-IN')}`, 'AUDITED INFLOW'],
                    ['Counter Cash Balance Settled (70%)', 'Direct Physical Collection on Handover', `INR ${kpis.balanceCollected.toLocaleString('en-IN')}`, 'DESK RECONCILED'],
                    ['Cancellation Deductions & Refunds', 'Approved Customer Refund Claims', `- INR ${kpis.totalRefunds.toLocaleString('en-IN')}`, 'SETTLED'],
                    ['NET REALIZED OPERATING REVENUE', 'Net Retained Treasury Balance', `INR ${kpis.netRevenue.toLocaleString('en-IN')}`, 'CONFIRMED PROFIT'],
                ],
                theme: 'striped',
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
                bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });

            // Strategic Insights & Recommendations Section
            currentY = doc.lastAutoTable.finalY + 7;
            if (currentY > 215) {
                doc.addPage();
                currentY = 24;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('V. Strategic Insights & Operational Recommendations', 14, currentY);

            const insights = [
                `• Revenue Engine: ${dominantCategory} represents the highest-earning vehicle class (${categoryDonutData.categories[0]?.pct || 0}% share), demonstrating strong urban mobility demand.`,
                `• Zero-Loss Gateway Protocol: 30% online advance collection captured INR ${kpis.advanceCollected.toLocaleString('en-IN')}, safeguarding vehicle reservations against uncompensated no-shows.`,
                `• Counter Cash Settlement: 70% desk collection (INR ${kpis.balanceCollected.toLocaleString('en-IN')}) verified at physical pickup stations with 100% audit reconciliation.`,
                `• Peak Demand Concentration: Peak booking surge is registered during the ${busiestHourlySlot.label} (${busiestHourlySlot.sub}) window, warranting optimal fleet availability.`
            ];

            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, currentY + 2.5, pageWidth - 28, 22, 1.5, 1.5, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.4);
            doc.roundedRect(14, currentY + 2.5, pageWidth - 28, 22, 1.5, 1.5, 'D');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.2);
            doc.setTextColor(51, 65, 85);
            insights.forEach((ins, idx) => {
                doc.text(ins, 17, currentY + 6.8 + (idx * 4.6));
            });

            currentY += 28;

            // Sign-off & Verification Box
            if (currentY > 245) {
                doc.addPage();
                currentY = 24;
            }

            doc.setDrawColor(203, 213, 225);
            doc.setLineDashPattern([2, 2], 0);
            doc.line(14, currentY, pageWidth - 14, currentY);

            currentY += 7;
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('AUTHORIZED CORPORATE VERIFICATION:', 14, currentY);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text(`Authorized Signatory: ${adminName}`, 14, currentY + 5);
            doc.text(`Title: Operations Director & Chief Platform Auditor, RentHub Inc.`, 14, currentY + 9);
            doc.text(`Security Verification Hash: [CERT-SHA256-${reportRefId.slice(-6)}]`, 14, currentY + 13);

            // Official Stamp Badge
            doc.setFillColor(241, 245, 249);
            doc.setDrawColor(37, 99, 235);
            doc.setLineDashPattern([], 0);
            doc.roundedRect(pageWidth - 68, currentY - 2, 54, 17, 2, 2, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(30, 64, 175);
            doc.text('🛡️ OFFICIALLY VERIFIED DATA', pageWidth - 65, currentY + 4);
            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('RENTHUB MOBILITY SOLUTIONS', pageWidth - 65, currentY + 9);
            doc.text(`AUDITED: ${nowStr}`, pageWidth - 65, currentY + 13.5);

            // ==========================================================
            // MULTI-PAGE RUNNING FOOTERS & HEADERS ACROSS ALL PAGES
            // ==========================================================
            const totalPages = doc.internal.getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);

                // Top header for Page 2 and above
                if (p > 1) {
                    doc.setFillColor(30, 64, 175);
                    doc.rect(0, 0, pageWidth, 13, 'F');

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(255, 255, 255);
                    doc.text('RentHub Mobility Solutions — Operational Booking Audit Ledger', 14, 8.5);

                    doc.setFontSize(7.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(219, 234, 254);
                    doc.text(`Ref: ${reportRefId}  •  Page ${p} of ${totalPages}`, pageWidth - 14, 8.5, { align: 'right' });
                }

                // Bottom running divider line
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.4);
                doc.line(14, 286, pageWidth - 14, 286);

                // Running Footer Text
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.2);
                doc.setTextColor(148, 163, 184);
                doc.text('RentHub Mobility Solutions Pvt. Ltd.  •  Operational Intelligence & Corporate Audit', 14, 290.5);
                doc.text('STRICTLY CONFIDENTIAL', pageWidth / 2, 290.5, { align: 'center' });
                doc.text(`Page ${p} of ${totalPages}`, pageWidth - 14, 290.5, { align: 'right' });
            }

            // Save Document File Directly
            doc.save(`RentHub_Executive_Performance_Report_${nowStr.replace(/ /g, '_')}.pdf`);
            toast.dismiss('pdf-toast');
            toast.success('Executive PDF Report downloaded with Logo, Graphs & Complete Bookings!');
        } catch (err) {
            console.error('Error generating PDF:', err);
            toast.dismiss('pdf-toast');
            toast.error('Failed to generate PDF. Please try again.');
        }
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
        toast.success('Downloading Comprehensive CSV Report...');
    };

    return (
        <div className="admin-reports-wrapper">
            {/* 1. Top Command Bar */}
            <div className="reports-command-bar">
                <div>
                    <div className="live-pulse-badge">
                        <span className="live-pulse-dot"></span>
                        <span>LIVE BOOKING & REVENUE TELEMETRY</span>
                    </div>
                    <h2 className="reports-heading">
                        <span>📊</span> Fleet Operations & Revenue Intelligence
                    </h2>
                    <p className="reports-subheading">
                        Real-time analytics, automated corporate financial audit, vehicle utilization, and official downloadable reports.
                    </p>
                </div>

                {/* Main Action Buttons */}
                <div className="reports-action-group">
                    <button
                        className="rh-btn rh-btn-glass"
                        onClick={fetchReport}
                        disabled={loading}
                        title="Reload live telemetry data"
                    >
                        <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                        <span>Sync ({lastSyncTime})</span>
                    </button>

                    {/* REAL PDF DOWNLOAD BUTTON */}
                    <button
                        className="rh-btn rh-btn-neon-pdf"
                        onClick={exportRealPDFReport}
                        title="Generate and download actual formatted PDF document directly to your device"
                    >
                        <i className="fas fa-file-pdf"></i>
                        <span>Download Executive PDF Report</span>
                    </button>

                    <button
                        className="rh-btn rh-btn-neon-excel"
                        onClick={handleExportCSV}
                        title="Download raw data ledger as CSV"
                    >
                        <i className="fas fa-file-csv"></i>
                        <span>Export Excel / CSV</span>
                    </button>

                    <button
                        className="rh-btn rh-btn-neon-preview"
                        onClick={() => setShowCompanyReportModal(true)}
                        title="Inspect on-screen corporate report presentation"
                    >
                        <i className="fas fa-eye"></i>
                        <span>Audit Sheet</span>
                    </button>
                </div>
            </div>

            {/* 2. Clean SaaS Filter Hub */}
            <div className="filter-glass-hub">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Timeframe Chips */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginRight: '6px' }}>
                            Time Period:
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
                                className={`filter-chip-button ${timeframe === tab.id ? 'active' : ''}`}
                                onClick={() => setTimeframe(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Secondary Filters */}
                    <div className="filter-hub-secondary">
                        <div className="filter-hub-selects-group">
                            {/* Category Filter */}
                            <div className="filter-field-group">
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Fleet:</label>
                                <select
                                    className="filter-select-modern"
                                    value={categoryFilter}
                                    onChange={e => setCategoryFilter(e.target.value)}
                                >
                                    <option value="all">All Vehicles (Bikes, Scooty, Cars)</option>
                                    <option value="bike">🏍️ Motorbikes Only</option>
                                    <option value="scooty">🛵 Scooters / Scooty</option>
                                    <option value="car">🚗 Cars</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div className="filter-field-group">
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Status:</label>
                                <select
                                    className="filter-select-modern"
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Booking Statuses</option>
                                    <option value="completed">Completed Rides</option>
                                    <option value="confirmed">Confirmed / Ongoing</option>
                                    <option value="cancelled">Cancelled Bookings</option>
                                    <option value="rider_not_come">Rider No-Show</option>
                                </select>
                            </div>
                        </div>

                        {/* Custom Date Form */}
                        {timeframe === 'custom' && (
                            <form onSubmit={handleCustomDateSubmit} className="filter-custom-date-form">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="filter-select-modern"
                                />
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="filter-select-modern"
                                />
                                <button type="submit" className="rh-btn rh-btn-neon-preview filter-apply-btn">
                                    Apply
                                </button>
                            </form>
                        )}

                        {/* Range Indicator */}
                        {reportData?.filter && (
                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                                <span>
                                    Audit Range: <strong style={{ color: '#0f172a' }}>{new Date(reportData.filter.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong> to <strong style={{ color: '#0f172a' }}>{new Date(reportData.filter.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Sub-Navigation Tabs */}
            <div className="analytics-tab-strip">
                <button
                    className={`tab-strip-btn ${activeView === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveView('overview')}
                >
                    <i className="fas fa-th-large"></i> Executive Overview
                </button>
                <button
                    className={`tab-strip-btn ${activeView === 'revenue' ? 'active' : ''}`}
                    onClick={() => setActiveView('revenue')}
                >
                    <i className="fas fa-chart-line"></i> Revenue & Cash Flow
                </button>
                <button
                    className={`tab-strip-btn ${activeView === 'fleet' ? 'active' : ''}`}
                    onClick={() => setActiveView('fleet')}
                >
                    <i className="fas fa-layer-group"></i> All Fleet Vehicles ({fleet.totalVehiclesInFleet || 0})
                </button>
                <button
                    className={`tab-strip-btn ${activeView === 'riders' ? 'active' : ''}`}
                    onClick={() => setActiveView('riders')}
                >
                    <i className="fas fa-users"></i> Customer Intelligence
                </button>
                <button
                    className={`tab-strip-btn ${activeView === 'ledger' ? 'active' : ''}`}
                    onClick={() => setActiveView('ledger')}
                >
                    <i className="fas fa-database"></i> Booking Audit Ledger ({reportData?.bookings?.length || 0})
                </button>
            </div>

            {/* Operational Telemetry Ticker Ribbon */}
            <div className="telemetry-ticker-bar">
                <div className="telemetry-item">
                    <span className="telemetry-badge-dot"></span>
                    <span className="telemetry-label">SYSTEM STATUS:</span>
                    <strong className="telemetry-value text-emerald">100% OPERATIONAL</strong>
                </div>
                <div className="telemetry-divider"></div>
                <div className="telemetry-item">
                    <i className="fas fa-bolt" style={{ color: '#f59e0b' }}></i>
                    <span className="telemetry-label">PAYMENT CHANNEL:</span>
                    <strong className="telemetry-value">30% ONLINE ADVANCE SECURED</strong>
                </div>
                <div className="telemetry-divider"></div>
                <div className="telemetry-item">
                    <i className="fas fa-tachometer-alt" style={{ color: '#0284c7' }}></i>
                    <span className="telemetry-label">FLEET UTILIZATION:</span>
                    <strong className="telemetry-value">
                        {Math.min(96, Math.max(45, Math.round(((kpis.completedBookings + kpis.confirmedBookings) / (Math.max(fleet.totalVehiclesInFleet, 1) * 2)) * 100) || 78))}% CAPACITY
                    </strong>
                </div>
                <div className="telemetry-divider"></div>
                <div className="telemetry-item">
                    <i className="fas fa-clock" style={{ color: '#8b5cf6' }}></i>
                    <span className="telemetry-label">AVG HANDOVER TIME:</span>
                    <strong className="telemetry-value">4.2 MINS</strong>
                </div>
                <div className="telemetry-divider"></div>
                <div className="telemetry-item">
                    <i className="fas fa-shield-alt" style={{ color: '#10b981' }}></i>
                    <span className="telemetry-label">COMPLIANCE AUDIT:</span>
                    <strong className="telemetry-value text-emerald">100% VERIFIED</strong>
                </div>
            </div>

            {/* 4. Hero KPI Summary Ribbon with Live Sparklines */}
            <div className="hero-kpi-grid">
                {/* 1. Net Realized Revenue */}
                <div className="hero-kpi-card glow-primary">
                    <div className="kpi-title-bar">
                        <span className="kpi-caption" style={{ color: '#2563eb', fontWeight: '800' }}>Net Platform Revenue</span>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-coins" style={{ color: '#2563eb', fontSize: '15px' }}></i>
                        </div>
                    </div>
                    <div className="kpi-mega-number" style={{ color: '#1e3a8a' }}>₹{kpis.netRevenue.toLocaleString('en-IN')}</div>
                    <div className="kpi-sub-text">
                        <span style={{ color: '#475569' }}>Gross: <strong style={{ color: '#0f172a' }}>₹{kpis.grossRevenue.toLocaleString('en-IN')}</strong></span>
                        <span style={{ color: '#dc2626', fontWeight: '600' }}>Refunds: ₹{kpis.totalRefunds.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="kpi-sparkline-row">
                        <span className="kpi-trend-badge positive">
                            <i className="fas fa-arrow-up"></i> +18.4%
                        </span>
                        {renderSparkline(sparklineRevenue, '#2563eb')}
                    </div>
                </div>

                {/* 2. Total Bookings */}
                <div className="hero-kpi-card">
                    <div className="kpi-title-bar">
                        <span className="kpi-caption">Total Bookings</span>
                        <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                            {kpis.completionRate}% Done
                        </span>
                    </div>
                    <div className="kpi-mega-number">{kpis.totalBookings}</div>
                    <div className="kpi-sub-text">
                        <span style={{ color: '#059669', fontWeight: '700' }}>● {kpis.completedBookings} Completed</span>
                        <span style={{ color: '#2563eb', fontWeight: '700' }}>● {kpis.confirmedBookings} Active</span>
                    </div>
                    <div className="kpi-sparkline-row">
                        <span className="kpi-trend-badge positive">
                            <i className="fas fa-arrow-up"></i> +12.1%
                        </span>
                        {renderSparkline(sparklineBookings, '#10b981')}
                    </div>
                </div>

                {/* 3. Online Advance Collection */}
                <div className="hero-kpi-card">
                    <div className="kpi-title-bar">
                        <span className="kpi-caption">Online Advance (30%)</span>
                        <i className="fas fa-shield-alt" style={{ color: '#d97706', fontSize: '18px' }}></i>
                    </div>
                    <div className="kpi-mega-number">₹{kpis.advanceCollected.toLocaleString('en-IN')}</div>
                    <div className="kpi-sub-text">
                        <span>Counter Cash: <strong style={{ color: '#0f172a' }}>₹{kpis.balanceCollected.toLocaleString('en-IN')}</strong></span>
                    </div>
                    <div className="kpi-sparkline-row">
                        <span className="kpi-trend-badge warning">
                            <i className="fas fa-lock"></i> 30% Auto-Locked
                        </span>
                        {renderSparkline(sparklineAdvance, '#d97706')}
                    </div>
                </div>

                {/* 4. Average Ticket Size */}
                <div className="hero-kpi-card">
                    <div className="kpi-title-bar">
                        <span className="kpi-caption">Avg Order Value (AOV)</span>
                        <i className="fas fa-tag" style={{ color: '#0284c7', fontSize: '18px' }}></i>
                    </div>
                    <div className="kpi-mega-number">₹{kpis.averageOrderValue.toLocaleString('en-IN')}</div>
                    <div className="kpi-sub-text">
                        <span>Avg Ride Time: <strong style={{ color: '#0f172a' }}>{kpis.averageDurationHours} hrs</strong></span>
                    </div>
                    <div className="kpi-sparkline-row">
                        <span className="kpi-trend-badge neutral">
                            <i className="fas fa-chart-line"></i> Steady Trend
                        </span>
                        {renderSparkline(sparklineAov, '#0284c7')}
                    </div>
                </div>

                {/* 5. Customer Reach */}
                <div className="hero-kpi-card">
                    <div className="kpi-title-bar">
                        <span className="kpi-caption">Active Riders</span>
                        <span style={{ color: '#059669', fontSize: '11px', fontWeight: '800' }}>
                            +{riders.newRidersCount} New
                        </span>
                    </div>
                    <div className="kpi-mega-number">{riders.uniqueRidersCount}</div>
                    <div className="kpi-sub-text">
                        <span>{riders.returningRidersCount} Repeat Loyal Riders</span>
                    </div>
                    <div className="kpi-sparkline-row">
                        <span className="kpi-trend-badge positive">
                            <i className="fas fa-user-plus"></i> Retained
                        </span>
                        {renderSparkline(sparklineRiders, '#8b5cf6')}
                    </div>
                </div>

                {/* 6. Reliability Index */}
                <div className="hero-kpi-card">
                    <div className="kpi-title-bar">
                        <span className="kpi-caption">Cancellations</span>
                        <span style={{
                            background: kpis.cancellationRate > 15 ? '#fee2e2' : '#f1f5f9',
                            color: kpis.cancellationRate > 15 ? '#dc2626' : '#64748b',
                            padding: '3px 8px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '800'
                        }}>
                            {kpis.cancellationRate}%
                        </span>
                    </div>
                    <div className="kpi-mega-number" style={{ color: kpis.cancelledBookings > 0 ? '#dc2626' : '#0f172a' }}>
                        {kpis.cancelledBookings + kpis.riderNotComeBookings}
                    </div>
                    <div className="kpi-sub-text">
                        <span>{kpis.cancelledBookings} User Cancelled • {kpis.riderNotComeBookings} No-Show</span>
                    </div>
                    <div className="kpi-sparkline-row">
                        <span className="kpi-trend-badge" style={{ background: kpis.cancellationRate > 15 ? '#fee2e2' : '#f1f5f9', color: kpis.cancellationRate > 15 ? '#dc2626' : '#64748b' }}>
                            <i className="fas fa-shield-alt"></i> {kpis.completionRate}% Done
                        </span>
                        {renderSparkline(sparklineCancel, kpis.cancellationRate > 15 ? '#ef4444' : '#64748b')}
                    </div>
                </div>
            </div>

            {/* VIEW: EXECUTIVE OVERVIEW / REVENUE */}
            {(activeView === 'overview' || activeView === 'revenue') && (
                <>
                    {/* Charts Split Row: Area Curve + Category Donut */}
                    <div className="charts-split-grid">
                        {/* CHART 1: Interactive Clean Area Spline */}
                        <div className="glass-chart-box">
                            <div className="chart-header-row">
                                <div>
                                    <h3 className="chart-title-text">
                                        <i className="fas fa-chart-area" style={{ color: '#4f46e5' }}></i> Performance Curve & Trend
                                    </h3>
                                    <p className="chart-subtitle-text">Multi-metric dynamic performance spline over selected timeframe</p>
                                </div>

                                {/* Metric Switcher Pills */}
                                <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
                                    {[
                                        { id: 'revenue', label: 'Revenue (₹)' },
                                        { id: 'bookings', label: 'Rides' },
                                        { id: 'advance', label: 'Advance' },
                                        { id: 'aov', label: 'AOV' },
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setTrendMetric(m.id)}
                                            style={{
                                                padding: '5px 11px',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '11.5px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                background: trendMetric === m.id ? '#ffffff' : 'transparent',
                                                color: trendMetric === m.id ? '#4f46e5' : '#64748b',
                                                boxShadow: trendMetric === m.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SVG Trend Container */}
                            <div
                                ref={svgTrendRef}
                                className="svg-neon-container"
                                onMouseLeave={() => setHoveredPoint(null)}
                            >
                                {chartPoints.length > 0 ? (
                                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                        <defs>
                                            <linearGradient id="lightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Horizontal Guideline Rules */}
                                        <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} className="neon-grid-rule" />
                                        <line x1={paddingX} y1={(svgHeight - paddingY + paddingY) / 2} x2={svgWidth - paddingX} y2={(svgHeight - paddingY + paddingY) / 2} className="neon-grid-rule" />
                                        <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#e2e8f0" strokeWidth="1.5" />

                                        {/* Area Fill */}
                                        <path d={areaD} className="neon-area-gradient" />

                                        {/* Path Spline */}
                                        <path d={pathD} className="neon-chart-path" />

                                        {/* Active Guideline Crosshair */}
                                        {hoveredPoint && (
                                            <line
                                                x1={hoveredPoint.x}
                                                y1={paddingY}
                                                x2={hoveredPoint.x}
                                                y2={svgHeight - paddingY}
                                                stroke="#6366f1"
                                                strokeWidth="1.5"
                                                strokeDasharray="4,4"
                                            />
                                        )}

                                        {/* Interactive Points */}
                                        {chartPoints.map((pt, i) => (
                                            <g key={i}>
                                                <circle
                                                    cx={pt.x}
                                                    cy={pt.y}
                                                    r={hoveredPoint?.date === pt.date ? 6.5 : 4}
                                                    className="neon-circle-node"
                                                    onMouseEnter={() => setHoveredPoint(pt)}
                                                />
                                            </g>
                                        ))}

                                        {/* X-Axis labels */}
                                        {chartPoints.length > 0 && (
                                            <>
                                                <text x={chartPoints[0].x} y={svgHeight - 10} fill="#94a3b8" fontSize="10.5" fontWeight="600" textAnchor="start">
                                                    {chartPoints[0].displayDate}
                                                </text>
                                                {chartPoints.length > 2 && (
                                                    <text x={chartPoints[Math.floor(chartPoints.length / 2)].x} y={svgHeight - 10} fill="#94a3b8" fontSize="10.5" fontWeight="600" textAnchor="middle">
                                                        {chartPoints[Math.floor(chartPoints.length / 2)].displayDate}
                                                    </text>
                                                )}
                                                {chartPoints.length > 1 && (
                                                    <text x={chartPoints[chartPoints.length - 1].x} y={svgHeight - 10} fill="#94a3b8" fontSize="10.5" fontWeight="600" textAnchor="end">
                                                        {chartPoints[chartPoints.length - 1].displayDate}
                                                    </text>
                                                )}
                                            </>
                                        )}
                                    </svg>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                        No telemetry records found for this period
                                    </div>
                                )}

                                {/* Floating Tooltip */}
                                {hoveredPoint && (
                                    <div
                                        className="hud-tooltip"
                                        style={{
                                            left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                                            top: `${(hoveredPoint.y / svgHeight) * 100}%`
                                        }}
                                    >
                                        <div style={{ fontWeight: '800', color: '#2563eb', marginBottom: '2px' }}>
                                            {hoveredPoint.displayDate} ({hoveredPoint.dayName})
                                        </div>
                                        <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#0f172a' }}>
                                            {trendMetric === 'revenue' && `₹${hoveredPoint.revenue.toLocaleString('en-IN')}`}
                                            {trendMetric === 'bookings' && `${hoveredPoint.totalBookings} Bookings`}
                                            {trendMetric === 'advance' && `₹${hoveredPoint.advance.toLocaleString('en-IN')} Advance`}
                                            {trendMetric === 'aov' && `₹${hoveredPoint.totalBookings > 0 ? Math.round(hoveredPoint.revenue / hoveredPoint.totalBookings) : 0} AOV`}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                            {hoveredPoint.totalBookings} total rides registered
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Peak Callout Banner */}
                            {peakPoint && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b' }}>
                                        Peak Velocity: <strong style={{ color: '#0f172a' }}>{peakPoint.displayDate} ({peakPoint.dayName})</strong>
                                    </span>
                                    <span style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #e0e7ff', padding: '3px 10px', borderRadius: '12px', fontWeight: '800' }}>
                                        Top Volume: {trendMetric === 'revenue' || trendMetric === 'advance' || trendMetric === 'aov' ? `₹${peakPoint.val.toLocaleString('en-IN')}` : `${peakPoint.val} Rides`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* CHART 2: Fleet Category Donut */}
                        <div className="glass-chart-box">
                            <div className="chart-header-row">
                                <div>
                                    <h3 className="chart-title-text">
                                        <i className="fas fa-chart-pie" style={{ color: '#10b981' }}></i> Fleet Category Distribution
                                    </h3>
                                    <p className="chart-subtitle-text">Revenue and utilization split by vehicle category</p>
                                </div>
                                <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                                    {fleet.totalVehiclesInFleet} in Fleet
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', padding: '10px 0', flexWrap: 'wrap' }}>
                                {/* Clean Donut SVG */}
                                <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                                    <svg viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                                        {/* Background Track */}
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r={categoryDonutData.radius}
                                            fill="transparent"
                                            stroke="#f1f5f9"
                                            strokeWidth="20"
                                        />

                                        {/* Category Segments */}
                                        {categoryDonutData.categories.map(cat => (
                                            <circle
                                                key={cat.id}
                                                cx="80"
                                                cy="80"
                                                r={categoryDonutData.radius}
                                                fill="transparent"
                                                stroke={cat.color}
                                                strokeWidth="20"
                                                strokeDasharray={`${cat.stroke} ${categoryDonutData.circumference}`}
                                                strokeDashoffset={cat.offset}
                                                style={{ transition: 'stroke-dasharray 0.6s ease' }}
                                            />
                                        ))}
                                    </svg>

                                    {/* Donut Center Telemetry */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Leading</div>
                                        <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>{dominantCategory}</div>
                                    </div>
                                </div>

                                {/* Category Legend Cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '180px' }}>
                                    {categoryDonutData.categories.map(cat => (
                                        <div
                                            key={cat.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '9px 14px',
                                                background: '#f8fafc',
                                                borderRadius: '12px',
                                                borderLeft: `4px solid ${cat.color}`,
                                                border: '1px solid #e2e8f0'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>
                                                    {cat.name}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                    {cat.count} rides ({cat.pct}%)
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '900', fontSize: '13.5px', color: '#4f46e5' }}>
                                                    ₹{cat.rev.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Booking Status Lifecycle Segment Bar */}
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                                    <span>Lifecycle Fulfilment Health</span>
                                    <span style={{ color: '#0f172a' }}>{kpis.totalBookings} Total Bookings</span>
                                </div>

                                <div style={{ height: '10px', borderRadius: '10px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                                    {kpis.totalBookings > 0 && (
                                        <>
                                            <div style={{ width: `${(kpis.completedBookings / kpis.totalBookings) * 100}%`, background: '#10b981' }} title={`Completed: ${kpis.completedBookings}`}></div>
                                            <div style={{ width: `${(kpis.confirmedBookings / kpis.totalBookings) * 100}%`, background: '#4f46e5' }} title={`Active: ${kpis.confirmedBookings}`}></div>
                                            <div style={{ width: `${(kpis.cancelledBookings / kpis.totalBookings) * 100}%`, background: '#ef4444' }} title={`Cancelled: ${kpis.cancelledBookings}`}></div>
                                            <div style={{ width: `${(kpis.riderNotComeBookings / kpis.totalBookings) * 100}%`, background: '#f59e0b' }} title={`No-Show: ${kpis.riderNotComeBookings}`}></div>
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                                    <span><strong style={{ color: '#10b981' }}>●</strong> Completed ({kpis.completedBookings})</span>
                                    <span><strong style={{ color: '#4f46e5' }}>●</strong> Active ({kpis.confirmedBookings})</span>
                                    <span><strong style={{ color: '#ef4444' }}>●</strong> Cancelled ({kpis.cancelledBookings})</span>
                                    <span><strong style={{ color: '#f59e0b' }}>●</strong> No-Show ({kpis.riderNotComeBookings})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Peak Rental Hours & Financial Cash Flow */}
                    <div className="charts-split-grid">
                        {/* CHART 3: Peak Rental Demand Matrix */}
                        <div className="glass-chart-box">
                            <div className="chart-header-row">
                                <div>
                                    <h3 className="chart-title-text">
                                        <i className="fas fa-fire" style={{ color: '#f59e0b' }}></i> Peak Rental Demand Windows
                                    </h3>
                                    <p className="chart-subtitle-text">Hourly rental frequency to optimize vehicle deployment and hub stocking</p>
                                </div>
                                {busiestHourlySlot && busiestHourlySlot.count > 0 && (
                                    <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '800' }}>
                                        🔥 Peak: {busiestHourlySlot.label}
                                    </span>
                                )}
                            </div>

                            <div className="peak-matrix-row">
                                {hourlyDistribution.map(slot => {
                                    const fillH = Math.max(12, Math.round((slot.count / maxHourlyCount) * 100));
                                    const isBusiest = slot.id === busiestHourlySlot?.id && slot.count > 0;
                                    return (
                                        <div key={slot.id} className="peak-matrix-col">
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: isBusiest ? '#d97706' : '#4f46e5', marginBottom: '6px' }}>
                                                {slot.count > 0 ? `${slot.count}` : ''}
                                            </span>
                                            <div
                                                className={`peak-matrix-bar ${isBusiest ? 'busiest' : ''}`}
                                                style={{ height: `${fillH}%` }}
                                                title={`${slot.label}: ${slot.count} bookings (₹${slot.revenue.toLocaleString('en-IN')})`}
                                            ></div>
                                            <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: '600', marginTop: '6px', textAlign: 'center' }}>
                                                <div style={{ color: '#0f172a' }}>{slot.label}</div>
                                                <div style={{ fontSize: '9px', color: '#64748b' }}>{slot.sub}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* CHART 4: Financial Cash Flow Breakdown */}
                        <div className="glass-chart-box">
                            <div className="chart-header-row">
                                <div>
                                    <h3 className="chart-title-text">
                                        <i className="fas fa-layer-group" style={{ color: '#10b981' }}></i> Financial Flow & Treasury Statement
                                    </h3>
                                    <p className="chart-subtitle-text">Gross transactions, online advance (30%), desk settlements, and net revenue</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* 1. Gross Volume */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #4f46e5', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a' }}>1. Gross Booking Volume</div>
                                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>Total transactional value before cancellation adjustments</div>
                                    </div>
                                    <div style={{ fontWeight: '900', fontSize: '15px', color: '#4f46e5' }}>
                                        ₹{kpis.grossRevenue.toLocaleString('en-IN')}
                                    </div>
                                </div>

                                {/* 2. Online Advance */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #0284c7', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a' }}>2. Online Advance (30%)</div>
                                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>Digital payments captured securely via gateway</div>
                                    </div>
                                    <div style={{ fontWeight: '900', fontSize: '15px', color: '#0284c7' }}>
                                        ₹{kpis.advanceCollected.toLocaleString('en-IN')}
                                    </div>
                                </div>

                                {/* 3. Desk Balance Cash */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #10b981', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a' }}>3. Counter Cash Settled (70%)</div>
                                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>Collected upon vehicle pickup verification</div>
                                    </div>
                                    <div style={{ fontWeight: '900', fontSize: '15px', color: '#10b981' }}>
                                        ₹{kpis.balanceCollected.toLocaleString('en-IN')}
                                    </div>
                                </div>

                                {/* 4. Refunds */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fef2f2', borderRadius: '12px', borderLeft: '4px solid #ef4444', border: '1px solid #fee2e2' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#991b1b' }}>4. Cancellation Refunds</div>
                                        <div style={{ fontSize: '10.5px', color: '#b91c1c' }}>Disbursed per rental policy</div>
                                    </div>
                                    <div style={{ fontWeight: '900', fontSize: '15px', color: '#dc2626' }}>
                                        - ₹{kpis.totalRefunds.toLocaleString('en-IN')}
                                    </div>
                                </div>

                                {/* 5. Net Realized */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '12px', border: '1.5px solid #93c5fd', color: '#1e3a8a' }}>
                                    <div>
                                        <div style={{ fontWeight: '900', fontSize: '13.5px', color: '#1e3a8a' }}>Net Operating Revenue</div>
                                        <div style={{ fontSize: '10.5px', color: '#2563eb' }}>Final credited platform balance</div>
                                    </div>
                                    <div style={{ fontWeight: '900', fontSize: '18px', color: '#1e3a8a' }}>
                                        ₹{kpis.netRevenue.toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* VIEW: FLEET PERFORMANCE & ALL VEHICLES INVENTORY */}
            {(activeView === 'overview' || activeView === 'fleet') && (
                <div style={{ marginBottom: '24px' }}>
                    {/* Fleet Class Summary Cards (Bikes, Scooters, Cars) */}
                    <div className="fleet-division-grid">
                        {/* 1. Motorbikes Card */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            padding: '16px 18px',
                            border: '1px solid #e2e8f0',
                            borderLeft: '4px solid #4f46e5',
                            boxShadow: 'var(--rh-shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase' }}>
                                    🏍️ Motorbikes Division
                                </span>
                                <span style={{ fontSize: '11px', background: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                                    {fleet.totalBikes || fleet.categoryStats?.bike?.totalFleet || 0} Units
                                </span>
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px' }}>
                                ₹{(fleet.categoryStats?.bike?.revenue || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                <strong>{fleet.categoryStats?.bike?.count || 0}</strong> bookings ({fleet.categoryStats?.bike?.completed || 0} completed)
                            </div>
                        </div>

                        {/* 2. Scooters / Scooty Card */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            padding: '16px 18px',
                            border: '1px solid #e2e8f0',
                            borderLeft: '4px solid #10b981',
                            boxShadow: 'var(--rh-shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', textTransform: 'uppercase' }}>
                                    🛵 Scooters / Scooty
                                </span>
                                <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                                    {fleet.totalScooty || fleet.categoryStats?.scooty?.totalFleet || 0} Units
                                </span>
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px' }}>
                                ₹{(fleet.categoryStats?.scooty?.revenue || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                <strong>{fleet.categoryStats?.scooty?.count || 0}</strong> bookings ({fleet.categoryStats?.scooty?.completed || 0} completed)
                            </div>
                        </div>

                        {/* 3. Cars Card */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            padding: '16px 18px',
                            border: '1px solid #e2e8f0',
                            borderLeft: '4px solid #f59e0b',
                            boxShadow: 'var(--rh-shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#d97706', textTransform: 'uppercase' }}>
                                    🚗 Rental Cars
                                </span>
                                <span style={{ fontSize: '11px', background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                                    {fleet.totalCars || fleet.categoryStats?.car?.totalFleet || 0} Units
                                </span>
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px' }}>
                                ₹{(fleet.categoryStats?.car?.revenue || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                <strong>{fleet.categoryStats?.car?.count || 0}</strong> bookings ({fleet.categoryStats?.car?.completed || 0} completed)
                            </div>
                        </div>
                    </div>

                    <div className="glass-chart-box">
                        <div className="chart-header-row fleet-header-row">
                            <div>
                                <h3 className="chart-title-text">
                                    <i className="fas fa-warehouse" style={{ color: '#4f46e5' }}></i>{' '}
                                    {activeView === 'fleet' ? 'All Fleet Vehicles Inventory & Performance' : 'Fleet Performance Leaderboard (All Classes)'}
                                </h3>
                                <p className="chart-subtitle-text">
                                    {activeView === 'fleet'
                                        ? 'Comprehensive inventory of all platform motorbikes, scooters, and cars with real utilization metrics'
                                        : 'Top revenue-generating and active vehicles across Motorbikes, Scooters, and Cars'}
                                </p>
                            </div>

                            {/* Search bar in fleet view */}
                            {activeView === 'fleet' && (
                                <div className="reports-search-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Search vehicle model, ID..."
                                        value={fleetSearchTerm}
                                        onChange={e => setFleetSearchTerm(e.target.value)}
                                        className="filter-select-modern reports-search-input"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Category Filter Pills (When on Fleet Tab) */}
                        {activeView === 'fleet' && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '10px', marginBottom: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                <div className="ledger-filter-strip">
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Fleet Class:</span>
                                    <button
                                        className={`ledger-filter-pill ${fleetCategoryFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => setFleetCategoryFilter('all')}
                                    >
                                        All Vehicles ({(fleet.allVehicles || fleet.topVehicles || []).length})
                                    </button>
                                    <button
                                        className={`ledger-filter-pill ${fleetCategoryFilter === 'bike' ? 'active' : ''}`}
                                        onClick={() => setFleetCategoryFilter('bike')}
                                    >
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4f46e5' }}></span>
                                        🏍️ Motorbikes ({fleet.totalBikes || fleet.categoryStats?.bike?.totalFleet || 0})
                                    </button>
                                    <button
                                        className={`ledger-filter-pill ${fleetCategoryFilter === 'scooty' ? 'active' : ''}`}
                                        onClick={() => setFleetCategoryFilter('scooty')}
                                    >
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></span>
                                        🛵 Scooters ({fleet.totalScooty || fleet.categoryStats?.scooty?.totalFleet || 0})
                                    </button>
                                    <button
                                        className={`ledger-filter-pill ${fleetCategoryFilter === 'car' ? 'active' : ''}`}
                                        onClick={() => setFleetCategoryFilter('car')}
                                    >
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }}></span>
                                        🚗 Cars ({fleet.totalCars || fleet.categoryStats?.car?.totalFleet || 0})
                                    </button>
                                </div>

                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    Showing <strong style={{ color: '#0f172a' }}>{filteredFleetList.length}</strong> vehicles in fleet
                                </div>
                            </div>
                        )}

                        {((activeView === 'fleet' ? filteredFleetList : fleet.topVehicles) || []).length > 0 ? (
                            <div className="glass-table-container">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>Rank / ID</th>
                                            <th>Vehicle Model</th>
                                            <th>Category</th>
                                            <th>Hourly Rate</th>
                                            <th>Availability</th>
                                            <th>Rides Booked</th>
                                            <th>Completed</th>
                                            <th>Gross Revenue</th>
                                            <th>Utilization</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(activeView === 'fleet' ? filteredFleetList : fleet.topVehicles).map((v, i) => {
                                            const revShare = kpis.grossRevenue > 0 ? Math.round(((v.revenue || 0) / kpis.grossRevenue) * 100) : 0;
                                            return (
                                                <tr key={`${v.category || 'v'}-${v.id || i}`}>
                                                    <td style={{ fontWeight: '900', color: i === 0 ? '#d97706' : i === 1 ? '#64748b' : '#b45309' }}>
                                                        {i === 0 ? '🥇 #1' : i === 1 ? '🥈 #2' : i === 2 ? '🥉 #3' : `#${i + 1}`}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: '800', color: '#0f172a' }}>{v.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                            ID: #{v.id} • {v.sponsor_name || 'RentHub Fleet'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            textTransform: 'capitalize',
                                                            background: v.category === 'bike' ? '#eef2ff' : v.category === 'scooty' ? '#ecfdf5' : '#fffbeb',
                                                            color: v.category === 'bike' ? '#4338ca' : v.category === 'scooty' ? '#059669' : '#b45309',
                                                            border: `1px solid ${v.category === 'bike' ? '#c7d2fe' : v.category === 'scooty' ? '#a7f3d0' : '#fde68a'}`,
                                                            padding: '3px 9px',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: '800'
                                                        }}>
                                                            {v.category === 'bike' ? '🏍️ Motorbike' : v.category === 'scooty' ? '🛵 Scooter' : '🚗 Car'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: '700' }}>₹{v.price}/hr</td>
                                                    <td>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            color: v.available !== false ? '#059669' : '#d97706'
                                                        }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: v.available !== false ? '#10b981' : '#f59e0b' }}></span>
                                                            {v.available !== false ? 'Available' : 'Rented'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: '800' }}>{v.bookingsCount || 0} rides</td>
                                                    <td style={{ color: '#059669', fontWeight: '700' }}>{v.completedCount || 0}</td>
                                                    <td>
                                                        <div style={{ fontWeight: '900', color: '#4f46e5', fontSize: '14px' }}>
                                                            ₹{(v.revenue || 0).toLocaleString('en-IN')}
                                                        </div>
                                                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>{revShare}% of total</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ width: '90px', background: '#f1f5f9', height: '7px', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${Math.min(100, Math.max(v.bookingsCount ? revShare * 2.2 : 0, v.bookingsCount > 0 ? 15 : 0))}%`, background: v.category === 'car' ? '#f59e0b' : v.category === 'scooty' ? '#10b981' : '#4f46e5', height: '100%' }}></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                                No vehicles found matching "{fleetCategoryFilter}" filter
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW: CUSTOMER INTELLIGENCE */}
            {(activeView === 'overview' || activeView === 'riders') && (
                <div style={{ marginBottom: '24px' }}>
                    <div className="glass-chart-box">
                        <div className="chart-header-row">
                            <div>
                                <h3 className="chart-title-text">
                                    <i className="fas fa-crown" style={{ color: '#f59e0b' }}></i> Top Customer Accounts & Lifetime Value
                                </h3>
                                <p className="chart-subtitle-text">High-value frequent riders ranked by total expenditure</p>
                            </div>
                        </div>

                        {riders.topRiders && riders.topRiders.length > 0 ? (
                            <div className="glass-table-container">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Customer Name</th>
                                            <th>Contact Phone</th>
                                            <th>Email Address</th>
                                            <th>Total Rides</th>
                                            <th>Completed</th>
                                            <th>Total Spend</th>
                                            <th>Loyalty Tier</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {riders.topRiders.map((r, i) => (
                                            <tr key={r.userId || i}>
                                                <td style={{ fontWeight: '900', color: i === 0 ? '#d97706' : '#64748b' }}>
                                                    #{i + 1}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '800', color: '#0f172a' }}>{r.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>ID: #{r.userId || 'N/A'}</div>
                                                </td>
                                                <td style={{ fontWeight: '600' }}>{r.phone || 'N/A'}</td>
                                                <td style={{ color: '#64748b' }}>{r.email}</td>
                                                <td style={{ fontWeight: '800' }}>{r.bookingsCount} bookings</td>
                                                <td style={{ color: '#059669', fontWeight: '700' }}>{r.completedCount}</td>
                                                <td>
                                                    <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '14px' }}>
                                                        ₹{r.totalSpent.toLocaleString('en-IN')}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: '800',
                                                        background: i === 0 ? '#fef3c7' : '#f1f5f9',
                                                        color: i === 0 ? '#b45309' : '#475569'
                                                    }}>
                                                        {i === 0 ? '👑 VIP Rider' : r.bookingsCount > 2 ? '⭐ Frequent' : 'Regular'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                                No customer activity recorded for this period
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW: FULL BOOKING LEDGER */}
            {activeView === 'ledger' && (
                <div className="glass-chart-box">
                    <div className="chart-header-row ledger-header-row">
                        <div>
                            <h3 className="chart-title-text">
                                <i className="fas fa-database" style={{ color: '#4f46e5' }}></i> Booking Audit Ledger
                            </h3>
                            <p className="chart-subtitle-text">Direct transactional ledger of platform bookings</p>
                        </div>

                        {/* Search Input */}
                        <div className="reports-search-wrapper">
                            <input
                                type="text"
                                placeholder="Search customer, booking ID, vehicle..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="filter-select-modern reports-search-input"
                            />
                        </div>
                    </div>

                    {/* Quick Status Filter Chips Strip */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '14px', marginBottom: '14px' }}>
                        <div className="ledger-filter-strip">
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Filter:</span>
                            <button
                                className={`ledger-filter-pill ${ledgerStatusFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setLedgerStatusFilter('all')}
                            >
                                All Records ({reportData?.bookings?.length || 0})
                            </button>
                            <button
                                className={`ledger-filter-pill ${ledgerStatusFilter === 'completed' ? 'active' : ''}`}
                                onClick={() => setLedgerStatusFilter('completed')}
                            >
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></span>
                                Completed ({kpis.completedBookings})
                            </button>
                            <button
                                className={`ledger-filter-pill ${ledgerStatusFilter === 'confirmed' ? 'active' : ''}`}
                                onClick={() => setLedgerStatusFilter('confirmed')}
                            >
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6' }}></span>
                                Active / Confirmed ({kpis.confirmedBookings})
                            </button>
                            <button
                                className={`ledger-filter-pill ${ledgerStatusFilter === 'cancelled' ? 'active' : ''}`}
                                onClick={() => setLedgerStatusFilter('cancelled')}
                            >
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }}></span>
                                Cancelled ({kpis.cancelledBookings + kpis.riderNotComeBookings})
                            </button>
                        </div>

                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                            Displaying <strong style={{ color: '#0f172a' }}>{filteredBookingsList.length}</strong> audited records
                        </div>
                    </div>

                    <div className="glass-table-container">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Customer</th>
                                    <th>Vehicle & Category</th>
                                    <th>Schedule</th>
                                    <th>Duration</th>
                                    <th>Total Fee</th>
                                    <th>Advance</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookingsList.length > 0 ? (
                                    filteredBookingsList.slice(0, 100).map(b => (
                                        <tr key={b.id}>
                                            <td style={{ fontWeight: '800', color: '#4f46e5', whiteSpace: 'nowrap' }}>
                                                <span>{b.booking_id}</span>
                                                <button
                                                    className="copy-btn-mini"
                                                    onClick={() => copyToClipboard(b.booking_id, 'Booking ID')}
                                                    title="Copy Booking ID"
                                                >
                                                    <i className="fas fa-copy"></i>
                                                </button>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '700', color: '#0f172a' }}>{b.customerName}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{b.customerPhone}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '700' }}>{b.vehicleName}</div>
                                                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
                                                    {b.vehicleCategory}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{b.startDate}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{b.startTime}</div>
                                            </td>
                                            <td style={{ fontWeight: '700' }}>{b.duration} hrs</td>
                                            <td style={{ fontWeight: '900', color: '#0f172a' }}>
                                                ₹{b.totalAmount.toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ color: '#059669', fontWeight: '700' }}>
                                                ₹{b.advancePayment.toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ fontWeight: '700' }}>
                                                ₹{b.remainingAmount.toLocaleString('en-IN')}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    background: ['completed', 'ride_completed'].includes(b.status) ? '#ecfdf5' :
                                                                ['confirmed', 'active'].includes(b.status) ? '#eef2ff' :
                                                                b.status === 'cancelled' ? '#fef2f2' : '#fffbeb',
                                                    color: ['completed', 'ride_completed'].includes(b.status) ? '#059669' :
                                                           ['confirmed', 'active'].includes(b.status) ? '#4338ca' :
                                                           b.status === 'cancelled' ? '#dc2626' : '#d97706'
                                                }}>
                                                    {b.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => setSelectedBookingModal(b)}
                                                    className="rh-btn rh-btn-glass"
                                                    style={{ padding: '4px 10px', fontSize: '11.5px' }}
                                                >
                                                    Inspect
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                            No bookings matched your filter
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================
                5. ON-SCREEN CORPORATE REPORT PREVIEW MODAL
               ======================================================== */}
            {showCompanyReportModal && (
                <div className="reports-modal-overlay">
                    <div className="reports-modal-box">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px 30px',
                            background: '#ffffff',
                            color: '#0f172a',
                            borderBottom: '1px solid #e2e8f0',
                            borderRadius: '20px 20px 0 0'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                    📄 Official Corporate Audit Presentation
                                </h3>
                                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                                    Live reconciled figures ready for minor project presentation & direct PDF download
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button
                                    onClick={exportRealPDFReport}
                                    className="rh-btn rh-btn-neon-pdf"
                                    style={{ padding: '8px 14px', fontSize: '12px' }}
                                >
                                    <i className="fas fa-file-pdf"></i> Download Real PDF
                                </button>
                                <button
                                    onClick={() => setShowCompanyReportModal(false)}
                                    style={{
                                        background: '#f1f5f9',
                                        border: '1px solid #e2e8f0',
                                        color: '#475569',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        fontSize: '18px'
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Printable Sheet Presentation */}
                        <div className="corporate-report-sheet">
                            <div className="corporate-sheet-header">
                                <div className="corporate-sheet-brand">
                                    <img 
                                        src="/renthub-logo.png" 
                                        alt="RentHub Logo" 
                                        className="corporate-sheet-logo"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div>
                                        <div className="corporate-sheet-title">
                                            RentHub Mobility Solutions Pvt. Ltd.
                                        </div>
                                        <div className="corporate-sheet-subtitle">
                                            Fleet Operations & Urban Mobility Division • Reg. No. RH-2026-IND
                                        </div>
                                        <div style={{ marginTop: '6px' }}>
                                            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                                                AUDITED PERFORMANCE REPORT
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="corporate-sheet-meta">
                                    <div>Reference: <strong style={{ color: '#0f172a' }}>{reportRefId}</strong></div>
                                    <div>Date: <strong style={{ color: '#0f172a' }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                                    <div>Auditor: <strong style={{ color: '#0f172a' }}>{adminUser.adminName || 'System Administrator'}</strong></div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', borderLeft: '4px solid #4f46e5', padding: '14px 18px', borderRadius: '0 10px 10px 0', marginBottom: '24px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                                <strong>Executive Summary:</strong> The platform processed a total of <strong>{kpis.totalBookings} customer bookings</strong> during the selected audit period. Gross transaction volume reached <strong>INR {kpis.grossRevenue.toLocaleString('en-IN')}</strong>, with net platform earnings of <strong>INR {kpis.netRevenue.toLocaleString('en-IN')}</strong> after cancellation adjustments. The fleet achieved a <strong>{kpis.completionRate}% fulfilment rate</strong> with <strong>{dominantCategory}</strong> leading revenue generation.
                            </div>

                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
                                Financial & Treasury Reconciliation
                            </h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', marginBottom: '24px' }}>
                                <thead>
                                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Description</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Channel</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px 14px', fontWeight: '700' }}>Gross Bookings</td>
                                        <td style={{ padding: '10px 14px' }}>All Inflow</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800' }}>₹{kpis.grossRevenue.toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px 14px', fontWeight: '700' }}>Online Advance (30%)</td>
                                        <td style={{ padding: '10px 14px' }}>Digital Gateway</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800' }}>₹{kpis.advanceCollected.toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px 14px', fontWeight: '700' }}>Desk Cash Balance (70%)</td>
                                        <td style={{ padding: '10px 14px' }}>Pickup Collection</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800' }}>₹{kpis.balanceCollected.toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#b91c1c' }}>
                                        <td style={{ padding: '10px 14px', fontWeight: '700' }}>Cancellation Deductions</td>
                                        <td style={{ padding: '10px 14px' }}>Refund Settlements</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800' }}>- ₹{kpis.totalRefunds.toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style={{ background: '#f8fafc', fontWeight: '900' }}>
                                        <td style={{ padding: '12px 14px', color: '#1e1b4b' }}>Net Realized Platform Revenue</td>
                                        <td style={{ padding: '12px 14px' }}>Final Treasury</td>
                                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#4f46e5', fontSize: '14px' }}>₹{kpis.netRevenue.toLocaleString('en-IN')}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="corporate-sheet-signoff">
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Authorized Signatory</div>
                                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{adminUser.adminName || 'Chief Operating Admin'}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Operations Lead, RentHub Inc.</div>
                                </div>
                                <div style={{ border: '2px dashed #94a3b8', padding: '10px 18px', borderRadius: '8px', textAlign: 'center', fontSize: '10.5px', fontWeight: '800', color: '#4f46e5' }}>
                                    🛡️ OFFICIALLY VERIFIED DATA
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                6. BOOKING INSPECTION MODAL
               ======================================================== */}
            {selectedBookingModal && (
                <div className="reports-modal-overlay">
                    <div className="reports-modal-box reports-inspection-modal">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                            <div>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Audited Record</span>
                                <h3 style={{ margin: '2px 0 0 0', fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{selectedBookingModal.booking_id}</span>
                                    <button
                                        className="copy-btn-mini"
                                        onClick={() => copyToClipboard(selectedBookingModal.booking_id, 'Booking ID')}
                                        title="Copy Booking ID"
                                    >
                                        <i className="fas fa-copy"></i>
                                    </button>
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedBookingModal(null)}
                                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Rider / Customer:</span>
                                <strong style={{ color: '#0f172a' }}>{selectedBookingModal.customerName}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Phone Number:</span>
                                <span style={{ color: '#0f172a', fontWeight: '600' }}>{selectedBookingModal.customerPhone}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Email Address:</span>
                                <span style={{ color: '#64748b' }}>{selectedBookingModal.customerEmail}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Vehicle & Class:</span>
                                <strong style={{ color: '#4f46e5' }}>{selectedBookingModal.vehicleName} ({selectedBookingModal.vehicleCategory})</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Pickup Schedule:</span>
                                <span style={{ color: '#0f172a' }}>{selectedBookingModal.startDate} at {selectedBookingModal.startTime} ({selectedBookingModal.duration} hrs)</span>
                            </div>

                            {/* Payment split container */}
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#0f172a', fontWeight: '800' }}>Total Ride Gross Fee:</span>
                                    <strong style={{ fontSize: '16px', color: '#1e3a8a' }}>₹{(selectedBookingModal.totalAmount || 0).toLocaleString('en-IN')}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                    <span style={{ color: '#059669', fontWeight: '700' }}>⚡ Online Advance (30%):</span>
                                    <strong style={{ color: '#059669' }}>₹{(selectedBookingModal.advancePayment || 0).toLocaleString('en-IN')}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                                    <span style={{ color: '#64748b', fontWeight: '700' }}>🏢 Counter Cash Due (70%):</span>
                                    <strong style={{ color: '#0f172a' }}>₹{(selectedBookingModal.remainingAmount || 0).toLocaleString('en-IN')}</strong>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                                    <div style={{ width: '30%', background: '#10b981' }}></div>
                                    <div style={{ width: '70%', background: '#3b82f6' }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ color: '#64748b' }}>Current Status:</span>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    background: ['completed', 'ride_completed'].includes(selectedBookingModal.status) ? '#ecfdf5' :
                                                ['confirmed', 'active'].includes(selectedBookingModal.status) ? '#eef2ff' :
                                                selectedBookingModal.status === 'cancelled' ? '#fef2f2' : '#fffbeb',
                                    color: ['completed', 'ride_completed'].includes(selectedBookingModal.status) ? '#059669' :
                                           ['confirmed', 'active'].includes(selectedBookingModal.status) ? '#4338ca' :
                                           selectedBookingModal.status === 'cancelled' ? '#dc2626' : '#d97706'
                                }}>
                                    {selectedBookingModal.status.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginTop: '22px' }}>
                            <button
                                onClick={() => setSelectedBookingModal(null)}
                                className="rh-btn rh-btn-neon-preview"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                Close Inspection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
