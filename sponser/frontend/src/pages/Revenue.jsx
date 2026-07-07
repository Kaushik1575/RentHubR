import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { DollarSign, Download, TrendingDown, CreditCard, Calendar, ChevronDown, Clock, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Revenue = () => {
    const [originalData, setOriginalData] = useState({ transactions: [], vehicleStats: [] });
    const [loading, setLoading] = useState(true);

    // Date Filtering State
    const [selectedMonth, setSelectedMonth] = useState(-1); // Default to Whole Year
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const formatRideTime = (hours) => {
        if (!hours || hours === 0) return '0h 0min';
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}min`;
    };

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const response = await api.get('/sponsor/revenue');
                setOriginalData(response.data);
            } catch (error) {
                console.error(error);
                // Fallback Mock
                // Fallback Mock
                setOriginalData({
                    grossRevenue: 15400,
                    netEarnings: 10780, // 15400 - 30% - 0 withdrawals
                    totalWithdrawn: 0,
                    commission: 4620,
                    transactions: [
                        { id: 'TXN001', raw_date: '2023-10-25T10:00:00Z', date: '10/25/2023', amount: 1200, type: 'Credit', description: 'Booking payment', vehicle_name: 'Yamaha R15', vehicle_reg: 'WB-01-1234' },
                        { id: 'TXN002', raw_date: '2023-10-26T14:30:00Z', date: '10/26/2023', amount: 3500, type: 'Credit', description: 'Booking payment', vehicle_name: 'Royal Enfield', vehicle_reg: 'WB-02-5678' },
                        { id: 'TXN004', raw_date: '2023-10-29T09:15:00Z', date: '10/29/2023', amount: 900, type: 'Credit', description: 'Booking payment', vehicle_name: 'Honda City', vehicle_reg: 'WB-03-9012' },
                    ],
                    vehicleStats: [] // We'll compute this dynamically anyway
                });
                // toast.error("Using mock revenue data");
            } finally {
                setLoading(false);
            }
        };
        fetchRevenue();
    }, []);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // --- Derived Data based on Filter ---
    const filteredData = useMemo(() => {
        if (!originalData.transactions) return { transactions: [], summary: {}, chartData: [], vehicleStats: [] };

        let startOfMonth, endOfMonth;

        if (selectedMonth === -1) {
            // Whole Year
            startOfMonth = new Date(selectedYear, 0, 1);
            endOfMonth = new Date(selectedYear, 11, 31, 23, 59, 59);
        } else {
            // Specific Month
            startOfMonth = new Date(selectedYear, selectedMonth, 1);
            endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
        }

        // 1. Filter Transactions
        const activeTxns = originalData.transactions.filter(t => {
            const tDate = new Date(t.raw_date || t.date); // Use raw_date if available
            return tDate >= startOfMonth && tDate <= endOfMonth;
        });

        // 2. Calculate Summary
        let totalEarnings = 0;
        let totalWithdrawn = 0;

        activeTxns.forEach(t => {
            if (t.type === 'Credit') {
                totalEarnings += t.amount;
            } else if (t.type === 'Debit') {
                totalWithdrawn += Math.abs(t.amount);
            }
        });

        // Commission is based on Earnings only
        const commission = totalEarnings * 0.30;
        const net = totalEarnings - commission - totalWithdrawn;

        // Map to what UI expects
        const gross = totalEarnings;

        // 3. Prepare Chart Data
        let chartData = [];

        if (selectedMonth === -1) {
            // Yearly View: Aggregate by Month
            const monthMap = new Map();
            months.forEach((_, idx) => monthMap.set(idx, 0)); // Init all months to 0

            activeTxns.forEach(t => {
                const d = new Date(t.raw_date || t.date);
                const mIdx = d.getMonth();
                const amt = (t.type === 'Credit' ? t.amount : -t.amount);
                monthMap.set(mIdx, (monthMap.get(mIdx) || 0) + amt);
            });

            chartData = Array.from(monthMap.entries()).map(([mIdx, amount]) => ({
                name: months[mIdx].substring(0, 3), // "Jan", "Feb"
                amount
            }));
        } else {
            // Monthly View: Aggregate by Day
            const daysInMonth = endOfMonth.getDate();
            const dailyMap = new Map();
            // Initialize all days
            for (let i = 1; i <= daysInMonth; i++) {
                dailyMap.set(i, 0);
            }
            activeTxns.forEach(t => {
                const d = new Date(t.raw_date || t.date).getDate();
                dailyMap.set(d, (dailyMap.get(d) || 0) + (t.type === 'Credit' ? t.amount : -t.amount));
            });
            chartData = Array.from(dailyMap.entries()).map(([day, amount]) => ({
                name: `${day}`, // Just the day number
                amount
            }));
        }

        // 4. Calculate Vehicle Stats for this period
        // We need to group transactions by vehicle
        const vStatsMap = new Map();

        // Pre-fill with known vehicles from original stats to ensure we show 0-revenue vehicles too (optional)
        // For accurate period stats, we construct from transactions
        activeTxns.forEach(t => {
            if (!t.vehicle_name || t.type === 'Debit') return; // Skip if no vehicle info or is a Debit (Withdrawal)

            const key = t.vehicle_name + t.vehicle_reg;
            if (!vStatsMap.has(key)) {
                vStatsMap.set(key, {
                    name: t.vehicle_name || 'Unknown',
                    regNo: t.vehicle_reg || '---',
                    image: t.vehicle_image, // Ideally this should come from txn or we look it up
                    total: 0,
                    count: 0
                });
            }
            const stat = vStatsMap.get(key);
            stat.total += (t.type === 'Credit' ? t.amount : -t.amount);
            stat.count += 1;
            // Now we have 'hours' in the transaction object from backend
            stat.hours = (stat.hours || 0) + (t.hours || 0);
        });

        // Determine "hours" is tricky without duration in txn. 
        // We'll trust the summary is financial. Display duration might need backend support on txn object or we omit it for period view.

        return {
            transactions: activeTxns,
            summary: { gross, commission, net, totalWithdrawn },
            chartData,
            vehicleStats: Array.from(vStatsMap.values())
        };

    }, [originalData, selectedMonth, selectedYear]);


    const downloadCSV = () => {
        const headers = ["Transaction ID", "Date", "Vehicle", "Description", "Type", "Amount"];
        const rows = filteredData.transactions.map(t => [
            t.id,
            new Date(t.raw_date || t.date).toLocaleDateString(),
            t.vehicle_name || '-',
            t.description,
            t.type,
            t.amount
        ]);

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += headers.join(",") + "\n";
        rows.forEach(row => {
            csvContent += row.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `revenue_${selectedYear}_${selectedMonth === -1 ? 'Yearly' : (selectedMonth + 1)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const currentYear = new Date().getFullYear();
    // User requested only THIS YEAR
    const years = [currentYear];

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Revenue Data...</div>;

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen pb-20 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Revenue & Analytics</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Showing data for <span className="font-semibold text-indigo-600">{selectedMonth === -1 ? `Year ${selectedYear}` : `${months[selectedMonth]} ${selectedYear}`}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Month Selector */}
                        <div className="relative group">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-gray-300 hover:border-indigo-500 text-gray-700 py-2 pl-4 pr-10 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium shadow-sm transition-all"
                            >
                                <option value={-1}>Whole Year</option>
                                {months.map((m, idx) => (
                                    <option key={idx} value={idx}>{m}</option>
                                ))}
                            </select>
                            <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Year Selector */}
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-gray-300 hover:border-indigo-500 text-gray-700 py-2 pl-4 pr-10 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium shadow-sm transition-all"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <button
                            onClick={downloadCSV}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-95 font-medium ml-2"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign className="w-16 h-16 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Gross Revenue</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{filteredData.summary.gross?.toLocaleString() || 0}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
                            <TrendingUp className="w-3 h-3" />
                            <span>100% of volume</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingDown className="w-16 h-16 text-red-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Platform Fee (30%)</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">- ₹{filteredData.summary.commission?.toLocaleString() || 0}</h3>
                        </div>
                        <p className="text-xs text-gray-400">Deducted automatically</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CreditCard className="w-16 h-16 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Withdrawn</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{filteredData.summary.totalWithdrawn?.toLocaleString() || 0}</h3>
                        </div>
                        <p className="text-xs text-gray-400">Already paid out</p>
                    </div>

                    {/* Net */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 shadow-lg shadow-indigo-200 text-white flex flex-col justify-between h-32 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-20">
                            <CreditCard className="w-24 h-24 text-white" />
                        </div>
                        <div>
                            <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Net Earnings</p>
                            <h3 className="text-3xl font-bold mt-1">₹{filteredData.summary.net?.toLocaleString() || 0}</h3>
                        </div>
                        <p className="text-xs text-indigo-200">Payout eligible</p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend</h3>
                    <div className="h-72 md:h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredData.chartData}>
                                <defs>
                                    <linearGradient id="colorRn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    dy={10}
                                    interval="preserveStartEnd"
                                    minTickGap={30}
                                />
                                <YAxis
                                    hide={false}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`₹${value}`, "Revenue"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRn)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Two Column Grid: Transactions & Vehicle Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Vehicle Breakdown */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Vehicle Performance</h3>
                            <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-md">
                                {selectedMonth === -1 ? `Year ${selectedYear}` : months[selectedMonth]}
                            </span>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Vehicle</th>
                                        <th className="px-6 py-3 text-right font-semibold">Trips</th>
                                        <th className="px-6 py-3 text-right font-semibold">Total Hours</th>
                                        <th className="px-6 py-3 text-right font-semibold">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(filteredData.vehicleStats || []).length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-10 text-center text-gray-400 text-sm">
                                                No vehicle activity this month
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.vehicleStats.map((v, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 overflow-hidden">
                                                            {v.image ? (
                                                                <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span>{v.name.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 text-sm truncate">{v.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{v.regNo}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-600 font-medium">
                                                    {v.count}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-600 font-medium">
                                                    {formatRideTime(v.hours || 0)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    ₹{v.total.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Transactions Log */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                            <span className="text-xs font-medium text-gray-500">
                                {filteredData.transactions.length} entries
                            </span>
                        </div>
                        <div className="overflow-x-auto flex-1 max-h-[400px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Date</th>
                                        <th className="px-6 py-3 font-semibold">Details</th>
                                        <th className="px-6 py-3 text-right font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(filteredData.transactions || []).length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-10 text-center text-gray-400 text-sm">
                                                No transactions found for this period
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.transactions.map((txn, index) => (
                                            <tr key={txn.id || index} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                                                    {new Date(txn.raw_date || txn.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                    <div className="text-[10px] text-gray-400">{new Date(txn.raw_date || txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{txn.description}</p>
                                                    <p className="text-xs text-gray-500 font-mono">#{txn.booking_id || txn.id}</p>
                                                </td>
                                                <td className={`px-6 py-3 text-sm font-mono font-bold text-right ${txn.type === 'Debit' ? 'text-red-500' : 'text-green-600'}`}>
                                                    {txn.type === 'Debit' ? '-' : '+'} ₹{Math.abs(txn.amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Revenue;
