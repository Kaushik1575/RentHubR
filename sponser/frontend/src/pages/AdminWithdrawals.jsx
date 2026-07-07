import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Clock, CheckCircle, XCircle, Send, Search, User, FileText, ChevronRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminWithdrawals = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionType, setActionType] = useState('');
    const [transactionRef, setTransactionRef] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        fetchWithdrawalRequests();
    }, []);

    const fetchWithdrawalRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/withdrawal/requests');
            setRequests(response.data.requests || []);
        } catch (error) {
            console.error('Error fetching withdrawal requests:', error);
            toast.error('Failed to load withdrawal requests');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const pending = requests.filter(r => r.status === 'pending');
        const approved = requests.filter(r => r.status === 'approved');
        const completed = requests.filter(r => r.status === 'completed');
        const rejected = requests.filter(r => r.status === 'rejected');

        return {
            pendingCount: pending.length,
            approvedCount: approved.length,
            historyCount: completed.length + rejected.length,
            pendingAmount: pending.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0),
            approvedAmount: approved.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0),
            totalPaid: completed.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
        };
    }, [requests]);

    const filteredRequests = useMemo(() => {
        let filtered = [...requests];

        // Filter by Tab
        if (activeTab === 'pending') {
            filtered = filtered.filter(r => r.status === 'pending');
        } else if (activeTab === 'approved') {
            filtered = filtered.filter(r => r.status === 'approved');
        } else if (activeTab === 'history') {
            filtered = filtered.filter(r => ['completed', 'rejected'].includes(r.status));
        }
        // 'all' includes everything

        // Filter by Search
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(req =>
                req.sponsors?.full_name?.toLowerCase().includes(lowerSearch) ||
                req.sponsors?.email?.toLowerCase().includes(lowerSearch) ||
                req.id.toString().includes(lowerSearch)
            );
        }

        return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [requests, activeTab, searchTerm]);

    const handleAction = (request, action) => {
        setSelectedRequest(request);
        setActionType(action);
        setShowConfirmModal(true);
        setTransactionRef('');
        setAdminNotes('');
    };

    const confirmAction = async () => {
        if (!selectedRequest) return;

        try {
            const updateData = {
                status: actionType,
                adminNotes: adminNotes || undefined,
                transactionReference: transactionRef || undefined
            };

            await api.patch(`/admin/withdrawal/requests/${selectedRequest.id}`, updateData);

            if (actionType === 'completed') {
                toast.success('Payment processed & Email sent to Sponsor!');
            } else {
                toast.success(`Request ${actionType} successfully!`);
            }
            setShowConfirmModal(false);
            setSelectedRequest(null);
            fetchWithdrawalRequests();
        } catch (error) {
            console.error('Error updating withdrawal request:', error);
            toast.error(error.response?.data?.error || 'Failed to update request');
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', text: 'Pending' },
            approved: { icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-200', text: 'Approved' },
            completed: { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200', text: 'Paid' },
            rejected: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', text: 'Rejected' },
        }[status] || { icon: Clock, color: 'text-gray-600 bg-gray-50', text: status };

        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {config.text}
            </span>
        );
    };

    const tabs = [
        { id: 'pending', label: 'Pending', count: stats.pendingCount },
        { id: 'approved', label: 'Approved (To Pay)', count: stats.approvedCount },
        { id: 'history', label: 'History', count: stats.historyCount },
        { id: 'all', label: 'All Requests', count: requests.length },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sponsor Withdrawals</h1>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Requests</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.pendingCount}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">To Be Paid</p>
                            <h3 className="text-2xl font-bold text-gray-900">₹{stats.approvedAmount.toLocaleString()}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <div className="font-bold text-sm">Rs</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Paid</p>
                            <h3 className="text-2xl font-bold text-gray-900">₹{stats.totalPaid.toLocaleString()}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">All Time Total</p>
                            <h3 className="text-2xl font-bold text-gray-900">₹{(stats.totalPaid + stats.approvedAmount + stats.pendingAmount).toLocaleString()}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Tabs & Search */}
                    <div className="border-b border-gray-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex bg-gray-100/50 p-1 rounded-lg w-fit overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Table Heading */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Sponsor Details</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Search className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="font-medium">No {activeTab} requests found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {new Date(req.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                                        {req.sponsors?.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{req.sponsors?.full_name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500">{req.sponsors?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900">₹{parseFloat(req.amount).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                    {req.payment_method === 'upi' ? 'UPI' : 'Bank Transfer'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(req, 'approved')}
                                                                className="p-1.5 hover:bg-green-50 text-green-600 rounded-md transition-colors"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(req, 'rejected')}
                                                                className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {req.status === 'approved' && (
                                                        <button
                                                            onClick={() => handleAction(req, 'completed')}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 transition-all shadow-sm"
                                                        >
                                                            <Send className="w-3.5 h-3.5" />
                                                            Process Payment
                                                        </button>
                                                    )}
                                                    {req.status !== 'pending' && req.status !== 'approved' && (
                                                        <button
                                                            className="text-gray-400 cursor-default"
                                                            disabled
                                                        >
                                                            <ChevronRight className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 anime-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                        <div className={`h-2 w-full ${actionType === 'rejected' ? 'bg-red-500' : 'bg-indigo-600'
                            }`}></div>

                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Confirm {actionType === 'completed' ? 'Payment' : actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Please review the details before proceeding. This action cannot be undone.
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3 border border-gray-100">
                                <div className="flex justify-between">
                                    <span className="text-xs font-medium text-gray-500">Amount</span>
                                    <span className="text-sm font-bold text-gray-900">₹{parseFloat(selectedRequest.amount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-medium text-gray-500">Sponsor</span>
                                    <span className="text-sm font-medium text-gray-900">{selectedRequest.sponsors?.full_name}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3">
                                    <span className="text-xs font-medium text-gray-500 block mb-1">Payment Details</span>
                                    {selectedRequest.payment_method === 'upi' ? (
                                        <p className="text-sm font-mono bg-white border border-gray-200 p-2 rounded text-gray-700">{selectedRequest.upi_id}</p>
                                    ) : (
                                        <div className="text-sm bg-white border border-gray-200 p-2 rounded space-y-1">
                                            <p><span className="text-gray-500 text-xs">Acc:</span> <span className="font-mono text-gray-700">{selectedRequest.bank_account_number}</span></p>
                                            <p><span className="text-gray-500 text-xs">IFSC:</span> <span className="font-mono text-gray-700">{selectedRequest.ifsc_code}</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {actionType === 'completed' && (
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                        Transaction Reference ID
                                    </label>
                                    <input
                                        type="text"
                                        value={transactionRef}
                                        onChange={(e) => setTransactionRef(e.target.value)}
                                        placeholder="e.g. TXN123456789"
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                                    />
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                    Admin Notes (Optional)
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add internal notes..."
                                    rows="3"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAction}
                                    className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold shadow-sm transition-all ${actionType === 'rejected'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                        }`}
                                >
                                    Confirm {actionType === 'completed' ? 'Payment' : actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals;
