import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Truck, Calendar, Clock, CreditCard } from 'lucide-react';
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
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Monthly Revenue Trend</h2>
                    <div className="h-72 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
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

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Monthly Booking Activity</h2>
                    <div className="h-72 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
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
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Most Rented Vehicles</h2>
                    <div className="h-72 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            {stats.vehicleChart && stats.vehicleChart.length > 0 ? (
                                <PieChart>
                                    <Pie
                                        data={stats.vehicleChart}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.vehicleChart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                                </PieChart>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                    No vehicle data available
                                </div>
                            )}
                        </ResponsiveContainer>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {stats.vehicleChart.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1 text-xs text-gray-600">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">AI Insights</h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-brand-50 border-l-4 border-brand-500 rounded-r-lg">
                            <p className="text-sm text-brand-800 font-medium">🚀 Revenue Insight</p>
                            <p className="text-gray-600 text-sm mt-1">Your revenue has increased by <span className="font-bold text-green-600">12%</span> compared to last month. Keep up the good work!</p>
                        </div>
                        <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                            <p className="text-sm text-orange-800 font-medium">🔧 Maintenance Alert</p>
                            <p className="text-gray-600 text-sm mt-1">Vehicle <span className="font-semibold">Yamaha R15 (KA-01-AB-1234)</span> has crossed 200 ride hours. Consider scheduling a service check.</p>
                        </div>
                        <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
                            <p className="text-sm text-purple-800 font-medium">📅 Booking Pattern</p>
                            <p className="text-gray-600 text-sm mt-1">Your vehicles are booked <span className="font-bold">40% more</span> on weekends. Consider adjusting pricing for Saturday and Sunday.</p>
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
