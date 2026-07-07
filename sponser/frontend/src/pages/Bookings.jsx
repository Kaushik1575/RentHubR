import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Filter, Download, Eye, Calendar, User, Bike, MapPin, Clock, IndianRupee, X } from 'lucide-react';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [searchTerm, statusFilter, bookings]);

    const fetchBookings = async () => {
        try {
            const response = await api.get('/sponsor/bookings');
            setBookings(response.data.bookings || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to fetch bookings');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
        let filtered = [...bookings];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(b =>
                b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter - Fixed to handle multiple status values
        if (statusFilter !== 'all') {
            filtered = filtered.filter(b => {
                const status = b.status?.toLowerCase();
                if (statusFilter === 'completed') {
                    return ['completed', 'ride_completed', 'ride_ended', 'payment_success'].includes(status);
                } else if (statusFilter === 'active') {
                    return ['active', 'ongoing', 'ride_started'].includes(status);
                } else if (statusFilter === 'cancelled') {
                    return ['cancelled', 'rejected'].includes(status);
                } else if (statusFilter === 'pending') {
                    return status === 'pending';
                }
                return status === statusFilter;
            });
        }

        setFilteredBookings(filtered);
    };

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'completed':
            case 'ride_completed':
            case 'ride_ended':
            case 'payment_success':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'active':
            case 'ongoing':
            case 'ride_started':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cancelled':
            case 'rejected':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status) => {
        const s = status?.toLowerCase();
        if (s === 'ride_completed' || s === 'ride_ended' || s === 'payment_success') return 'Completed';
        if (s === 'ride_started') return 'Active';
        return status?.charAt(0).toUpperCase() + status?.slice(1);
    };

    const downloadCSV = () => {
        const headers = ['Booking ID', 'Customer', 'Vehicle', 'Date', 'Duration (hrs)', 'Amount (₹)', 'Status'];
        const rows = filteredBookings.map(b => [
            b.bookingId,
            b.customerName,
            b.vehicleName,
            new Date(b.bookingDate).toLocaleDateString(),
            b.totalHours,
            b.totalAmount,
            b.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('CSV downloaded successfully');
    };

    const viewDetails = (booking) => {
        setSelectedBooking(booking);
        setShowDetailModal(true);
    };

    const stats = {
        total: bookings.length,
        completed: bookings.filter(b => ['completed', 'ride_completed', 'ride_ended', 'payment_success'].includes(b.status?.toLowerCase())).length,
        active: bookings.filter(b => ['active', 'ongoing', 'ride_started'].includes(b.status?.toLowerCase())).length,
        cancelled: bookings.filter(b => ['cancelled', 'rejected'].includes(b.status?.toLowerCase())).length,
        pending: bookings.filter(b => b.status?.toLowerCase() === 'pending').length,
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-20">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Booking History</h1>
                <p className="text-gray-500 mt-1">Track all rentals and their status</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Bookings</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Bike className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Cancelled</p>
                            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                            <X className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter('completed')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setStatusFilter('cancelled')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        Cancelled
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        Pending
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search booking ID, customer, vehicle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none w-80"
                        />
                    </div>
                    <button
                        onClick={downloadCSV}
                        disabled={filteredBookings.length === 0}
                        className="p-2 border border-brand-200 bg-brand-50 rounded-lg hover:bg-brand-100 text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download CSV"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                <th className="px-6 py-4">Booking ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Vehicle</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-10 text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                                            Loading bookings...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-10 text-gray-500">
                                        {searchTerm || statusFilter !== 'all' ? 'No bookings match your filters' : 'No bookings found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-brand-600 font-medium">
                                            #{booking.bookingId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                                                    {booking.customerName?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{booking.customerName}</p>
                                                    <p className="text-xs text-gray-500">{booking.customerEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {booking.vehicleImage && (
                                                    <img
                                                        src={booking.vehicleImage}
                                                        alt={booking.vehicleName}
                                                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{booking.vehicleName}</p>
                                                    <p className="text-xs text-gray-500">{booking.registrationNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                                            {booking.totalHours} hrs
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800">
                                            ₹{booking.totalAmount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${getStatusColor(booking.status)}`}>
                                                {getStatusLabel(booking.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {/* Payment Status Badge */}
                                                <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${booking.paymentStatus === 'paid' ? 'text-green-600 bg-green-50 border border-green-200' : 'text-orange-600 bg-orange-50 border border-orange-200'}`}>
                                                    {booking.paymentStatus}
                                                </span>
                                                {/* View Details Button */}
                                                <button
                                                    onClick={() => viewDetails(booking)}
                                                    className="p-2 hover:bg-brand-50 rounded-lg text-brand-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {filteredBookings.length} of {bookings.length} bookings
                    </p>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-brand-600 to-brand-700 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Booking Details</h2>
                                    <p className="text-brand-100 mt-1">#{selectedBooking.bookingId}</p>
                                </div>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <User className="w-5 h-5 text-brand-600" />
                                    <h3 className="font-semibold text-gray-800">Customer Information</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Name</p>
                                        <p className="font-medium text-gray-800">{selectedBooking.customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Email</p>
                                        <p className="font-medium text-gray-800 text-sm">{selectedBooking.customerEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                                        <p className="font-medium text-gray-800">{selectedBooking.customerPhone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bike className="w-5 h-5 text-brand-600" />
                                    <h3 className="font-semibold text-gray-800">Vehicle Information</h3>
                                </div>
                                <div className="flex gap-4">
                                    {selectedBooking.vehicleImage && (
                                        <img
                                            src={selectedBooking.vehicleImage}
                                            alt={selectedBooking.vehicleName}
                                            className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                                        />
                                    )}
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Vehicle Name</p>
                                            <p className="font-medium text-gray-800">{selectedBooking.vehicleName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Model</p>
                                            <p className="font-medium text-gray-800">{selectedBooking.vehicleModel || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Registration</p>
                                            <p className="font-medium text-gray-800 font-mono">{selectedBooking.registrationNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Type</p>
                                            <p className="font-medium text-gray-800 capitalize">{selectedBooking.vehicleType}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="w-5 h-5 text-brand-600" />
                                    <h3 className="font-semibold text-gray-800">Booking Details</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Booking Date</p>
                                        <p className="font-medium text-gray-800">
                                            {new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                                        <p className="font-medium text-gray-800">{selectedBooking.totalHours} hours</p>
                                    </div>
                                    {selectedBooking.startTime && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Start Time</p>
                                            <p className="font-medium text-gray-800">
                                                {new Date(selectedBooking.startTime).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    )}
                                    {selectedBooking.endTime && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">End Time</p>
                                            <p className="font-medium text-gray-800">
                                                {new Date(selectedBooking.endTime).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl p-4 border border-brand-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <IndianRupee className="w-5 h-5 text-brand-600" />
                                    <h3 className="font-semibold text-gray-800">Payment Information</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                                        <p className="text-2xl font-bold text-brand-600">
                                            ₹{selectedBooking.totalAmount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Payment Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${selectedBooking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {selectedBooking.paymentStatus}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Booking Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase border ${getStatusColor(selectedBooking.status)}`}>
                                            {getStatusLabel(selectedBooking.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Location Info */}
                            {(selectedBooking.pickupLocation || selectedBooking.dropLocation) && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="w-5 h-5 text-brand-600" />
                                        <h3 className="font-semibold text-gray-800">Location Details</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedBooking.pickupLocation && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Pickup Location</p>
                                                <p className="font-medium text-gray-800">{selectedBooking.pickupLocation}</p>
                                            </div>
                                        )}
                                        {selectedBooking.dropLocation && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Drop Location</p>
                                                <p className="font-medium text-gray-800">{selectedBooking.dropLocation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg transition-colors"
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

export default Bookings;
