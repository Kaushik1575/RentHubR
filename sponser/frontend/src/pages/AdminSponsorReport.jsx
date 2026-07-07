import React, { useEffect, useState } from 'react';
import { IndianRupee, PieChart, Wallet, CreditCard, Download, Eye, Calendar, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminSponsorReport = () => {
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        sponsorShare: 0,
        platformFee: 0,
        totalPaid: 0,
        pendingBalance: 0
    });
    const [loading, setLoading] = useState(true);
    const [selectedSponsor, setSelectedSponsor] = useState(null); // For Modal

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            // Use configured API service
            const response = await api.get('/admin/sponsor-report');
            // Assuming response structure: { report: [], totals: {} }
            setReportData(response.data.report || []);
            setSummary(response.data.totals || {});
        } catch (error) {
            console.error('Error fetching report:', error);
            toast.error('Failed to load sponsor report');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCSV = () => {
        // Implementation for CSV download can be added here
        toast.success('Download feature coming soon');
    };

    const openSponsorModal = (sponsor) => {
        setSelectedSponsor(sponsor);
    };

    const closeSponsorModal = () => {
        setSelectedSponsor(null);
    };

    if (loading) return <div className="p-8 text-center">Loading Report...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Sponsor Earnings Report</h1>
                <button
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Revenue"
                    amount={summary.totalRevenue}
                    icon={IndianRupee}
                    color="bg-purple-100 text-purple-600"
                />
                <SummaryCard
                    title="Sponsor Share (70%)"
                    amount={summary.sponsorShare}
                    icon={Wallet}
                    color="bg-blue-100 text-blue-600"
                />
                <SummaryCard
                    title="Paid Out"
                    amount={summary.totalPaid}
                    icon={CreditCard}
                    color="bg-green-100 text-green-600"
                />
                <SummaryCard
                    title="Pending Balance"
                    amount={summary.pendingBalance}
                    icon={PieChart}
                    color="bg-orange-100 text-orange-600"
                />
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-700">Detailed Sponsor Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="p-4 font-medium">Sponsor Name</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium text-right">Vehicles</th>
                                <th className="p-4 font-medium text-right">Bookings</th>
                                <th className="p-4 font-medium text-right">Total Revenue</th>
                                <th className="p-4 font-medium text-right">Net Share (70%)</th>
                                <th className="p-4 font-medium text-right">Paid</th>
                                <th className="p-4 font-medium text-right">Balance</th>
                                <th className="p-4 font-medium text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reportData.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800">{row.name}</td>
                                    <td className="p-4 text-gray-500 text-sm">{row.email}</td>
                                    <td className="p-4 text-right">{row.vehicleCount || '-'}</td>
                                    <td className="p-4 text-right">{row.bookings}</td>
                                    <td className="p-4 text-right font-medium">₹{row.totalRevenue.toLocaleString()}</td>
                                    <td className="p-4 text-right text-blue-600">₹{row.sponsorShare.toLocaleString()}</td>
                                    <td className="p-4 text-right text-green-600">₹{row.withdrawn.toLocaleString()}</td>
                                    <td className="p-4 text-right font-bold text-orange-600">₹{row.balance.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => openSponsorModal(row)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                            title="View Dashboard"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedSponsor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{selectedSponsor.name}'s Dashboard</h2>
                                <p className="text-gray-500 text-sm">{selectedSponsor.email}</p>
                            </div>
                            <button onClick={closeSponsorModal} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <DetailCard
                                title="Total Vehicles"
                                value={selectedSponsor.vehicleCount || 0}
                                icon={Truck}
                                bg="bg-blue-50" iconColor="text-blue-500"
                            />
                            <DetailCard
                                title="Total Revenue"
                                value={`₹${selectedSponsor.totalRevenue.toLocaleString()}`}
                                icon={IndianRupee}
                                bg="bg-green-50" iconColor="text-green-500"
                            />
                            <DetailCard
                                title="Net Earnings"
                                value={`₹${selectedSponsor.sponsorShare.toLocaleString()}`}
                                icon={CreditCard}
                                bg="bg-indigo-50" iconColor="text-indigo-500"
                            />
                            <DetailCard
                                title="Total Bookings"
                                value={selectedSponsor.bookings}
                                icon={Calendar}
                                bg="bg-purple-50" iconColor="text-purple-500"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={closeSponsorModal}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const SummaryCard = ({ title, amount, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">
                {title.includes('Total Paid') || title.includes('Balance') || title.includes('Revenue') || title.includes('Share')
                    ? `₹${amount.toLocaleString()}`
                    : amount}
            </h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} />
        </div>
    </div>
);

const DetailCard = ({ title, value, icon: Icon, bg, iconColor }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500 mb-2">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${bg} ${iconColor}`}>
            <Icon size={24} />
        </div>
    </div>
);

export default AdminSponsorReport;
