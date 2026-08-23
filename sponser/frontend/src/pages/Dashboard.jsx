import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Truck, Calendar, Clock, CreditCard, Sparkles, Wrench, CalendarDays, TrendingUp } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalVehicles: 0,
        totalBookings: 0,
        totalRideHours: 0,
        totalRevenue: 0,
        netEarnings: 0,
        totalWithdrawn: 0,
        revenueChart: [],
        vehicleChart: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/sponsor/dashboard');
                const data = response.data;

                // Map backend response to frontend state structure
                setStats({
                    totalVehicles: data.totalVehicles || 0,
                    totalBookings: data.totalBookings || 0,
                    totalRideHours: data.totalRideHours || 0,
                    totalRevenue: data.totalRevenue || 0,
                    netEarnings: data.netEarnings || 0,
                    totalWithdrawn: data.totalWithdrawn || 0,
                    revenueChart: data.revenueChart || [],
                    vehicleChart: data.vehicleChart || []
                });
                setError(null);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                setError(error.message);
                // Fallback (zeroes)
                setStats({
                    totalVehicles: 0,
                    totalBookings: 0,
                    totalRideHours: 0,
                    totalRevenue: 0,
                    netEarnings: 0,
                    totalWithdrawn: 0,
                    revenueChart: [],
                    vehicleChart: []
                });
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen pb-20">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard
                    title="Total Vehicles"
                    value={stats.totalVehicles || 0}
                    icon={Truck}
                    color="text-brand-600"
                    bg="bg-brand-50"
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${(stats.totalRevenue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    color="text-green-600"
                    bg="bg-green-100"
                />
                <StatCard
                    title="Total Withdrawn"
                    value={`₹${(stats.totalWithdrawn || 0).toLocaleString()}`}
                    icon={CreditCard}
                    color="text-orange-600"
                    bg="bg-orange-100"
                />
                <StatCard
                    title="Net Earnings"
                    value={`₹${(stats.netEarnings || 0).toLocaleString()}`}
                    icon={CreditCard}
                    color="text-brand-600"
                    bg="bg-brand-100"
                />
                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings || 0}
                    icon={Calendar}
                    color="text-purple-600"
                    bg="bg-purple-100"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 min-w-0">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Monthly Revenue Trend</h2>
                    <div className="h-72 md:h-80 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                            <AreaChart data={stats.revenueChart}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 min-w-0">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Monthly Booking Activity</h2>
                    <div className="h-72 md:h-80 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                            <BarChart data={stats.revenueChart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Bookings" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Most Rented Vehicles */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col min-w-0">
                    <h2 className="text-lg font-bold mb-6 text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg">
                            <Truck className="w-5 h-5" />
                        </div>
                        Most Rented Vehicles
                    </h2>
                    
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="h-64 relative mb-4 w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                                {stats.vehicleChart && stats.vehicleChart.length > 0 ? (
                                    <PieChart>
                                        <Pie
                                            data={stats.vehicleChart}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {stats.vehicleChart.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value) => [`₹${value}`, "Revenue"]}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                        No vehicle data available
                                    </div>
                                )}
                            </ResponsiveContainer>
                        </div>

                        {/* Custom Clean Legend */}
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {stats.vehicleChart?.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]" title={entry.name}>{entry.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">₹{entry.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                    <h2 className="text-lg font-bold mb-6 text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        AI Insights
                    </h2>
                    <div className="space-y-4 flex-1">
                        
                        {/* Insight 1: Revenue */}
                        <div className="group relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-transparent p-5 transition-all hover:shadow-md hover:border-emerald-200">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <TrendingUp className="w-16 h-16 text-emerald-600" />
                            </div>
                            <div className="flex gap-4 relative z-10">
                                <div className="shrink-0 p-3 bg-emerald-100/50 text-emerald-600 rounded-xl shadow-sm ring-1 ring-emerald-200/50 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-emerald-900">Revenue Optimization</h3>
                                    <p className="text-sm text-emerald-700/90 mt-1 leading-relaxed">
                                        Your revenue has increased by <strong className="text-emerald-800">12%</strong> compared to last month. Consider promoting your top 2 performing vehicles to maximize this trend.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Insight 2: Maintenance */}
                        <div className="group relative overflow-hidden rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50/50 to-transparent p-5 transition-all hover:shadow-md hover:border-orange-200">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Wrench className="w-16 h-16 text-orange-600" />
                            </div>
                            <div className="flex gap-4 relative z-10">
                                <div className="shrink-0 p-3 bg-orange-100/50 text-orange-600 rounded-xl shadow-sm ring-1 ring-orange-200/50 group-hover:scale-110 transition-transform">
                                    <Wrench className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-orange-900">Proactive Maintenance</h3>
                                    <p className="text-sm text-orange-700/90 mt-1 leading-relaxed">
                                        Vehicle <strong>Yamaha R15 (KA-01-AB-1234)</strong> has crossed 200 total ride hours. Schedule a routine service check soon to prevent unplanned downtime.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Insight 3: Pattern */}
                        <div className="group relative overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50/50 to-transparent p-5 transition-all hover:shadow-md hover:border-violet-200">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <CalendarDays className="w-16 h-16 text-violet-600" />
                            </div>
                            <div className="flex gap-4 relative z-10">
                                <div className="shrink-0 p-3 bg-violet-100/50 text-violet-600 rounded-xl shadow-sm ring-1 ring-violet-200/50 group-hover:scale-110 transition-transform">
                                    <CalendarDays className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-violet-900">Booking Patterns</h3>
                                    <p className="text-sm text-violet-700/90 mt-1 leading-relaxed">
                                        Your fleet sees a <strong>40% spike</strong> in utilization during weekends. Consider implementing dynamic surge pricing on Saturdays and Sundays to increase yields.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bg}`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
    </div>
);

export default Dashboard;
