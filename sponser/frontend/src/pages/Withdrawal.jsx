import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Building, Smartphone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Withdrawal = () => {
    const [activeTab, setActiveTab] = useState('request');
    const [withdrawalRequests, setWithdrawalRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [availableBalance, setAvailableBalance] = useState(0);

    // Form state
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bank');
    const [bankDetails, setBankDetails] = useState({
        accountNumber: '',
        ifscCode: '',
        accountHolderName: ''
    });
    const [upiDetails, setUpiDetails] = useState({
        upiId: ''
    });

    useEffect(() => {
        fetchWithdrawalRequests();
        fetchAvailableBalance();
    }, []);

    const fetchWithdrawalRequests = async () => {
        try {
            const response = await api.get('/sponsor/withdrawal/my-requests');
            setWithdrawalRequests(response.data.requests || []);
        } catch (error) {
            console.error('Error fetching withdrawal requests:', error);
            toast.error('Failed to load withdrawal requests');
        }
    };

    const fetchAvailableBalance = async () => {
        try {
            const response = await api.get('/sponsor/revenue');
            console.log('Revenue API Response:', response.data);

            // The API already returns netEarnings which is 70% of gross revenue
            // grossRevenue = total, netEarnings = 70% (after 30% platform fee)
            const netEarnings = response.data.netEarnings || 0;
            const grossRevenue = response.data.grossRevenue || 0;

            console.log('Gross Revenue:', grossRevenue);
            console.log('Net Earnings (70%):', netEarnings);

            // Use netEarnings as available balance (already 70%)
            setAvailableBalance(netEarnings);
        } catch (error) {
            console.error('Error fetching balance:', error);
            toast.error('Failed to load balance');
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (parseFloat(amount) > availableBalance) {
            toast.error('Insufficient balance');
            return;
        }

        setLoading(true);

        try {
            const requestData = {
                amount: parseFloat(amount),
                paymentMethod,
                ...(paymentMethod === 'bank' ? { bankDetails } : { upiDetails })
            };

            await api.post('/sponsor/withdrawal/request', requestData);
            toast.success('Withdrawal request submitted successfully!');

            // Reset form
            setAmount('');
            setBankDetails({ accountNumber: '', ifscCode: '', accountHolderName: '' });
            setUpiDetails({ upiId: '' });

            // Refresh requests
            fetchWithdrawalRequests();
            setActiveTab('history');
        } catch (error) {
            console.error('Error submitting withdrawal request:', error);
            toast.error(error.response?.data?.error || 'Failed to submit withdrawal request');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', text: 'Pending' },
            approved: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700', text: 'Approved' },
            completed: { icon: CheckCircle, color: 'bg-green-100 text-green-700', text: 'Completed' },
            rejected: { icon: XCircle, color: 'bg-red-100 text-red-700', text: 'Rejected' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.text}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 pb-24">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Withdrawal Management</h1>
                    <p className="text-gray-600">Request withdrawals and track your payment history</p>
                </div>

                {/* Available Balance Card */}
                <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex-1">
                            <p className="text-indigo-100 text-sm font-medium mb-2">Available for Withdrawal (70% of Total Revenue)</p>
                            <h2 className="text-4xl font-bold">₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                            <DollarSign className="w-12 h-12" />
                        </div>
                    </div>

                    {/* Revenue Breakdown */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-indigo-100 text-xs mb-1">Total Revenue</p>
                            <p className="text-xl font-bold">₹{(availableBalance / 0.70).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-indigo-100 text-xs mb-1">Platform Fee (30%)</p>
                            <p className="text-xl font-bold">₹{((availableBalance / 0.70) * 0.30).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('request')}
                        className={`pb-3 px-4 font-semibold transition-all ${activeTab === 'request'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        New Request
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 px-4 font-semibold transition-all ${activeTab === 'history'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Request History
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'request' ? (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Withdrawal Request</h2>

                        <form onSubmit={handleSubmitRequest} className="space-y-6">
                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Withdrawal Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        max={availableBalance}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-lg font-semibold"
                                        required
                                    />
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    Maximum: ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Payment Method Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('bank')}
                                        className={`p-4 border-2 rounded-xl transition-all ${paymentMethod === 'bank'
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Building className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'bank' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        <p className={`font-semibold ${paymentMethod === 'bank' ? 'text-indigo-600' : 'text-gray-700'}`}>
                                            Bank Account
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('upi')}
                                        className={`p-4 border-2 rounded-xl transition-all ${paymentMethod === 'upi'
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Smartphone className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'upi' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        <p className={`font-semibold ${paymentMethod === 'upi' ? 'text-indigo-600' : 'text-gray-700'}`}>
                                            UPI
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Bank Details */}
                            {paymentMethod === 'bank' && (
                                <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
                                    <h3 className="font-semibold text-gray-800 mb-4">Bank Account Details</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Account Holder Name
                                        </label>
                                        <input
                                            type="text"
                                            value={bankDetails.accountHolderName}
                                            onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                                            placeholder="Enter account holder name"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Account Number
                                        </label>
                                        <input
                                            type="text"
                                            value={bankDetails.accountNumber}
                                            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                            placeholder="Enter account number"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-mono"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            IFSC Code
                                        </label>
                                        <input
                                            type="text"
                                            value={bankDetails.ifscCode}
                                            onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                                            placeholder="Enter IFSC code"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-mono uppercase"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* UPI Details */}
                            {paymentMethod === 'upi' && (
                                <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
                                    <h3 className="font-semibold text-gray-800 mb-4">UPI Details</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            UPI ID
                                        </label>
                                        <input
                                            type="text"
                                            value={upiDetails.upiId}
                                            onChange={(e) => setUpiDetails({ upiId: e.target.value })}
                                            placeholder="yourname@upi"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {withdrawalRequests.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Withdrawal Requests</h3>
                                <p className="text-gray-600">You haven't made any withdrawal requests yet.</p>
                            </div>
                        ) : (
                            withdrawalRequests.map((request) => (
                                <div key={request.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-800">
                                                ₹{parseFloat(request.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {new Date(request.created_at).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                                            <div className="flex items-center gap-2">
                                                {request.payment_method === 'bank' ? (
                                                    <>
                                                        <Building className="w-4 h-4 text-gray-600" />
                                                        <span className="font-semibold text-gray-800">Bank Transfer</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Smartphone className="w-4 h-4 text-gray-600" />
                                                        <span className="font-semibold text-gray-800">UPI</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Request ID</p>
                                            <p className="font-mono text-sm text-gray-800">#{request.id}</p>
                                        </div>
                                    </div>

                                    {request.payment_method === 'bank' && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500 mb-2">Bank Details</p>
                                            <p className="text-sm"><strong>Account:</strong> •••• {request.bank_account_number?.slice(-4)}</p>
                                            <p className="text-sm"><strong>IFSC:</strong> {request.ifsc_code}</p>
                                        </div>
                                    )}

                                    {request.payment_method === 'upi' && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500 mb-2">UPI Details</p>
                                            <p className="text-sm"><strong>UPI ID:</strong> {request.upi_id}</p>
                                        </div>
                                    )}

                                    {request.transaction_reference && (
                                        <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                                            <p className="text-xs text-green-700 mb-1">Transaction Reference</p>
                                            <p className="text-sm font-mono text-green-800">{request.transaction_reference}</p>
                                        </div>
                                    )}

                                    {request.admin_notes && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                            <p className="text-xs text-blue-700 mb-1">Admin Notes</p>
                                            <p className="text-sm text-blue-800">{request.admin_notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Withdrawal;
