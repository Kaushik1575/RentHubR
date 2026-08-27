import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPopup from '../components/StatusPopup';
import { Scanner } from '@yudiel/react-qr-scanner';
import './AdminPanelStyles.css';
import AdminIssues from '../components/AdminIssues';
import AdminOffers from '../components/AdminOffers';
import AdminReports from '../components/AdminReports';
import ComingSoonCard from '../components/ComingSoonCard';


const AdminPanel = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [adminUser, setAdminUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [activeTab, setActiveTab] = useState('dashboard');

    // Stats
    const [stats, setStats] = useState({
        totalVehicles: 0, pendingBookings: 0, todaysBookings: 0, activeUsers: 0,
        confirmedBookings: 0, totalBookingsMonth: 0, cancelledBookings: 0, pendingRefunds: 0,
        activeOffers: 0,
        recentActivity: []
    });

    // Users
    const [users, setUsers] = useState([]);
    const [usersFilter, setUsersFilter] = useState('');

    // Bookings
    const [bookings, setBookings] = useState([]);
    const [bookingsSearch, setBookingsSearch] = useState('');
    const [bookingsStatusFilter, setBookingsStatusFilter] = useState('');
    const [bookingsDateFilter, setBookingsDateFilter] = useState('');

    // Vehicles
    const [vehicles, setVehicles] = useState([]);
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
    const [requests, setRequests] = useState([]); // New state for requests
    const [earnings, setEarnings] = useState([]); // Sponsor Earnings
    const [withdrawalRequests, setWithdrawalRequests] = useState([]); // Withdrawal Requests
    const [withdrawalFilter, setWithdrawalFilter] = useState('pending'); // 'pending', 'approved', 'history', 'all'

    // Modals State
    const [modal, setModal] = useState({ type: null, data: null }); // type: 'viewBooking', 'editBooking', etc.

    // Form Data States for Modals
    const [editBookingData, setEditBookingData] = useState({});
    const [editUserData, setEditUserData] = useState({});
    const [vehicleFormData, setVehicleFormData] = useState({});
    const [stageFormData, setStageFormData] = useState({});

    const [scanInput, setScanInput] = useState('');
    const [popup, setPopup] = useState({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token || !adminUser || !adminUser.adminId) {
            navigate('/login');
            return;
        }
        loadDashboardStats();
    }, [token, navigate, adminUser]);

    useEffect(() => {
        if (activeTab === 'dashboard') loadDashboardStats();
        if (activeTab === 'users') loadUsers();
        if (activeTab === 'bookings') loadBookings();
        if (activeTab === 'vehicles') loadVehicles();
        if (activeTab === 'requests') loadRequests(); // Load requests
        if (activeTab === 'policies') loadPolicies();
        if (activeTab === 'earnings') loadEarnings();
        if (activeTab === 'withdrawals') {
            loadWithdrawalRequests();
            loadEarnings(); // Load earnings to show balance context
        }
    }, [activeTab]);

    const loadDashboardStats = async () => {
        try {
            const res = await fetch('/api/dashboard-stats', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setUsers(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const loadBookings = async (page = 1) => {
        try {
            const res = await fetch(`/api/admin/bookings?page=${page}&limit=50`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const result = await res.json();
                if (Array.isArray(result)) setBookings(result);
                else if (result.data) setBookings(result.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadVehicles = async () => {
        try {
            const res = await fetch('/api/admin/vehicles', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setVehicles(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const loadRequests = async () => {
        try {
            const res = await fetch('/api/admin/vehicle-requests', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setRequests(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const loadEarnings = async () => {
        try {
            const res = await fetch('/api/admin/sponsor-earnings', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setEarnings(await res.json());
        } catch (e) { console.error(e); }
    };

    // Filtered Vehicles
    const filteredVehicles = vehicles.filter(v => {
        const searchLower = vehicleSearch.toLowerCase();
        const matchesSearch = (v.name && v.name.toLowerCase().includes(searchLower)) ||
            (v.id && v.id.toString().includes(vehicleSearch)) ||
            (v.category && v.category.toLowerCase().includes(searchLower)) ||
            (v.sponsor_name && v.sponsor_name.toLowerCase().includes(searchLower)) ||
            (v.sponsor_phone && v.sponsor_phone.includes(vehicleSearch));
        const matchesType = vehicleTypeFilter === 'all' || v.type === vehicleTypeFilter;
        return matchesSearch && matchesType;
    });

    const loadWithdrawalRequests = async () => {
        try {
            const res = await fetch('/api/admin/withdrawal/requests', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setWithdrawalRequests(data.requests || []);
            }
        } catch (e) { console.error('Error loading withdrawals', e); }
    };

    const handleWithdrawalAction = async (id, status) => {
        try {
            const res = await fetch(`/api/admin/withdrawal/requests/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                setPopup({ isOpen: true, type: 'success', title: 'Success', message: `Withdrawal request ${status}` });
                loadWithdrawalRequests(); // Reload list
                loadEarnings(); // Reload earnings to update balance
            } else {
                setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to update status' });
            }
        } catch (e) {
            console.error('Error updating withdrawal:', e);
            setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Something went wrong' });
        }
    };

    const loadPolicies = () => {
        // Static content for now or fetch if API exists
    };

    // --- Actions ---

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // User Actions
    // User Actions
    const executeBlockUser = async () => {
        const { userId, isBlocked } = modal.data;
        try {
            const res = await fetch(`/api/admin/users/${userId}/block`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ isBlocked: !isBlocked })
            });
            if (res.ok) {
                loadUsers();
                setModal({ type: null });
                setPopup({ isOpen: true, type: 'success', title: 'Success', message: `User ${isBlocked ? 'unblocked' : 'blocked'} successfully` });
            } else {
                setPopup({ isOpen: true, type: 'error', title: 'Action Failed', message: 'Failed to update status' });
            }
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error updating status' }); }
    };

    const handleBlockUser = (userId, isBlocked) => {
        setModal({ type: 'confirmBlockUser', data: { userId, isBlocked } });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/users/${editUserData.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(editUserData)
            });
            if (res.ok) {
                setModal({ type: null });
                loadUsers();
                setPopup({ isOpen: true, type: 'success', title: 'User Updated', message: 'User details updated successfully' });
            } else {
                const d = await res.json();
                setPopup({ isOpen: true, type: 'error', title: 'Update Failed', message: d.error || 'Failed update' });
            }
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error updating' }); }
    };

    // Booking Actions
    const handleConfirmBooking = async (id) => {
        try {
            await fetch(`/api/admin/bookings/${id}/confirm`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            loadBookings();
            setPopup({ isOpen: true, type: 'success', title: 'Confirmed', message: 'Booking confirmed successfully' });
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error confirming' }); }
    };



    const handleDeleteBooking = async (id) => {
        try {
            await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            setModal({ type: null });
            loadBookings();
            setPopup({ isOpen: true, type: 'success', title: 'Deleted', message: 'Booking deleted successfully' });
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error deleting' }); }
    };

    const handleUpdateBooking = async (e) => {
        e.preventDefault();
        try {
            await fetch(`/api/admin/bookings/${editBookingData.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(editBookingData)
            });
            setModal({ type: null });
            loadBookings();
            setPopup({ isOpen: true, type: 'success', title: 'Updated', message: 'Booking updated successfully' });
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error updating' }); }
    };

    const executeRefundComplete = async () => {
        try {
            await fetch(`/api/admin/bookings/${modal.data.id}/refund-complete`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            loadBookings();
            setModal({ type: null });
            setPopup({ isOpen: true, type: 'success', title: 'Refunded', message: 'Refund marked as complete' });
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error processing refund' }); }
    };

    const handleRefundComplete = (id) => {
        setModal({ type: 'confirmRefundComplete', data: { id } });
    };

    const executeSendSOS = async () => {
        try {
            const res = await fetch('/api/admin/send-sos', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: modal.data.id })
            });
            const d = await res.json();
            setModal({ type: null });
            if (res.ok) {
                setPopup({ isOpen: true, type: 'success', title: 'SOS Sent', message: d.message });
            } else {
                setPopup({ isOpen: true, type: 'error', title: 'SOS Failed', message: d.error });
            }
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error sending SOS' }); }
    };

    const handleSendSOS = (id) => {
        setModal({ type: 'confirmSOS', data: { id } });
    };

    // QR Scan Action
    const handleScanQR = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/scan-qr', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: (typeof scanInput === 'string' ? scanInput : scanInput.text).trim() })
            });
            const data = await res.json();

            if (res.ok) {
                setModal({ type: null });
                setScanInput('');
                loadBookings(); // Refresh list

                if (data.type === 'ride_end') {
                    // Show detailed summary for ride end
                    const balance = data.data.totalPayable;
                    const isRefund = balance < 0;

                    const summary = `Ride Ended Successfully!
--------------------------------
Date: ${data.data.rideEndTime}
Status: COMPLETED
--------------------------------
Time Used: ${data.data.durationText}
Actual Amount: ₹${data.data.totalBaseAmount}
Advance Paid: ₹${data.data.advancePaid}
--------------------------------
${isRefund ? `REFUND CUSTOMER: ₹${Math.abs(balance)}` : `COLLECT AMOUNT: ₹${balance}`}
`;
                    setPopup({ isOpen: true, type: 'success', title: 'Ride Completed', message: summary });
                } else if (data.type === 'already_completed') {
                    // Show info for already completed rides
                    const balance = data.data.balance;
                    const isRefund = balance < 0;
                    const summary = `This ride was already completed.
--------------------------------
Booking ID: ${data.data.bookingId}
Status: ${data.data.status}
--------------------------------
Total Amount: ₹${data.data.totalAmount}
Advance Paid: ₹${data.data.advancePaid}
${isRefund ? `Refund: ₹${Math.abs(balance)}` : `Balance: ₹${balance}`}
`;
                    setPopup({ isOpen: true, type: 'success', title: 'Already Completed', message: summary });
                } else {
                    // Ride Start or others
                    setPopup({ isOpen: true, type: 'success', title: 'Success', message: data.message });
                }
            } else {
                setPopup({ isOpen: true, type: 'error', title: 'Scan Failed', message: data.error || 'Failed to process QR code' });
            }
        } catch (e) {
            console.error(e);
            setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Network or Server Error' });
        }
    };

    // Vehicle Actions
    const executeDeleteVehicle = async () => {
        const { id, type } = modal.data;
        try {
            await fetch(`/api/admin/vehicles/${type}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            loadVehicles();
            setModal({ type: null });
            setPopup({ isOpen: true, type: 'success', title: 'Deleted', message: 'Vehicle deleted successfully' });
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error deleting vehicle' }); }
    };

    const handleDeleteVehicle = (id, type) => {
        setModal({ type: 'confirmDeleteVehicle', data: { id, type } });
    };

    const handleVehicleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        const isEdit = !!vehicleFormData.id;
        const url = isEdit
            ? `/api/admin/vehicles/${vehicleFormData.type}/${vehicleFormData.id}`
            : `/api/admin/vehicles/${vehicleFormData.type}`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(vehicleFormData)
            });

            const data = await res.json();

            if (res.ok) {
                if (data.alreadyApproved) {
                    setPopup({ isOpen: true, type: 'success', title: 'Already Approved', message: data.message });
                } else {
                    setPopup({ isOpen: true, type: 'success', title: isEdit ? 'Updated' : 'Added', message: `Vehicle ${isEdit ? 'updated' : 'added'} successfully` });
                }
                setModal({ type: null });
                loadVehicles();
                if (activeTab === 'requests') loadRequests();
            } else {
                setPopup({ isOpen: true, type: 'error', title: 'Action Failed', message: data.error || 'Operation failed' });
            }
        } catch (e) {
            console.error(e);
            setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error saving vehicle' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveRequest = (request) => {
        setVehicleFormData({
            name: request.name || '',
            type: request.vehicleType || 'bike',
            model: request.model || '',
            year: request.year || '',
            registration_number: request.registration_number || '',
            price: request.price || '',
            category: 'Standard', // Default
            status: 'available',
            image_url: request.image_url || '',
            requestId: request.id
        });
        setModal({ type: 'addVehicle' });
    };

    const executeRejectRequest = async (id, reason) => {
        if (!reason || !reason.trim()) {
            setPopup({ isOpen: true, type: 'error', title: 'Reason Required', message: 'Please enter a rejection reason for the sponsor.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/vehicle-requests/${id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: reason.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                loadRequests();
                setModal({ type: null });
                setPopup({ isOpen: true, type: 'success', title: 'Application Rejected', message: data.message || 'Vehicle request rejected and notice email sent to sponsor.' });
            } else {
                setPopup({ isOpen: true, type: 'error', title: 'Error', message: data.error || 'Failed to reject request' });
            }
        } catch (e) {
            setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error rejecting request' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectRequest = (requestOrId) => {
        const reqObj = typeof requestOrId === 'object' ? requestOrId : requests.find(r => r.id === requestOrId) || { id: requestOrId };
        setModal({ type: 'rejectRequest', data: reqObj });
        setStageFormData({ rejectionReason: '' });
    };

    const executeDeleteRequest = async (id) => {
        try {
            const res = await fetch(`/api/admin/vehicle-requests/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                loadRequests();
                setModal({ type: null });
                setPopup({ isOpen: true, type: 'success', title: 'Deleted', message: 'Request deleted' });
            } else {
                setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete' });
            }
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error deleting request' }); }
    };

    const handleDeleteRequest = (id) => {
        setModal({ type: 'confirmDeleteRequest', data: { id } });
    };

    const handleAdvanceStage = async (requestId, targetStage, payload = {}) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/vehicle-requests/${requestId}/stage`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    stage: targetStage,
                    ...payload
                })
            });

            const data = await res.json();
            if (res.ok) {
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: `Stage ${targetStage} Activated`,
                    message: data.message || `Stage ${targetStage} successfully updated and notification email sent to sponsor!`
                });
                setModal({ type: null });
                loadRequests();
                loadVehicles();
            } else {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Update Failed',
                    message: data.error || 'Failed to update vehicle stage'
                });
            }
        } catch (e) {
            console.error(e);
            setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error updating vehicle stage' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Filtering ---
    const filteredUsers = users.filter(u => {
        const s = usersFilter.toLowerCase();
        return !s ||
            (u.fullName || '').toLowerCase().includes(s) ||
            (u.email || '').toLowerCase().includes(s) ||
            (u.phoneNumber || '').includes(s);
    });

    const filteredBookings = bookings.filter(b => {
        const s = bookingsSearch.toLowerCase();
        const matchSearch = !s ||
            (b.customerName || '').toLowerCase().includes(s) ||
            (b.vehicleName || '').toLowerCase().includes(s) ||
            (b.booking_id || '').toLowerCase().includes(s) ||
            String(b.id).includes(s);
        const matchStatus = !bookingsStatusFilter || (b.status || '').toLowerCase() === bookingsStatusFilter;
        const matchDate = !bookingsDateFilter || b.start_date === bookingsDateFilter;
        return matchSearch && matchStatus && matchDate;
    });

    // --- Helper for formatting dates ---
    const formatDate = (dateString) => {
        if (!dateString || dateString === 'N/A') return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="admin-body">
            <div className="admin-mobile-header">
                <button className="mobile-menu-btn" onClick={toggleSidebar}>
                    <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
                <h2>Admin</h2>
            </div>
            <div className={`admin-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                {/* Overlay for mobile */}
                {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

                <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <h2>Admin</h2>
                        <span className="admin-name-sub">{adminUser.adminName}</span>
                    </div>
                    <nav className="sidebar-nav">
                        <ul>
                            <li><a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}><i className="fas fa-tachometer-alt"></i> Dashboard</a></li>
                            <li><a className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}><i className="fas fa-chart-pie"></i> Analytics & Reports</a></li>
                            <li><a className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}><i className="fas fa-users"></i> User Management</a></li>
                            <li><a className={`nav-link ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => { setActiveTab('bookings'); setIsSidebarOpen(false); }}><i className="fas fa-calendar-check"></i> Bookings</a></li>
                            <li><a className={`nav-link ${activeTab === 'vehicles' ? 'active' : ''}`} onClick={() => { setActiveTab('vehicles'); setIsSidebarOpen(false); }}><i className="fas fa-motorcycle"></i> Vehicles</a></li>
                            <li><a className={`nav-link ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => { setActiveTab('offers'); setIsSidebarOpen(false); }}><i className="fas fa-gift"></i> Manage Offers</a></li>
                            <li><a className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => { setActiveTab('requests'); setIsSidebarOpen(false); }}><i className="fas fa-clipboard-list"></i> Requests {requests.length > 0 && <span className="badge">{requests.length}</span>}</a></li>
                            <li><a className={`nav-link ${activeTab === 'policies' ? 'active' : ''}`} onClick={() => { setActiveTab('policies'); setIsSidebarOpen(false); }}><i className="fas fa-file-alt"></i> Policies</a></li>
                            <li><a className={`nav-link ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => { setActiveTab('earnings'); setIsSidebarOpen(false); }}><i className="fas fa-chart-line"></i> Sponsor Reports</a></li>
                            <li><a className={`nav-link ${activeTab === 'sponsorPortal' ? 'active' : ''}`} onClick={() => { setActiveTab('sponsorPortal'); setIsSidebarOpen(false); }}><i className="fas fa-handshake"></i> Sponsor Portal</a></li>
                            <li><a className={`nav-link ${activeTab === 'withdrawals' ? 'active' : ''}`} onClick={() => { setActiveTab('withdrawals'); setIsSidebarOpen(false); }}><i className="fas fa-money-bill-wave"></i> Withdrawals</a></li>
                            <li><a className={`nav-link ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => { setActiveTab('issues'); setIsSidebarOpen(false); }}><i className="fas fa-headset"></i> Support Issues</a></li>
                        </ul>
                    </nav>
                    <div className="sidebar-footer">
                        <a onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                </aside>

                <main className="admin-content">
                    {/* DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <div id="dashboard" className="content-section active">
                            <h3>Dashboard</h3>
                            <div className="dashboard-cards">
                                <div className="card"><div className="card-icon"><i className="fas fa-car"></i></div><div className="card-info"><h4>Total Vehicles</h4><p>{stats.totalVehicles}</p></div></div>
                                <div className="card"><div className="card-icon"><i className="fas fa-clock"></i></div><div className="card-info"><h4>Pending Confirmations</h4><p>{stats.pendingBookings}</p></div></div>
                                <div className="card"><div className="card-icon"><i className="fas fa-calendar-day"></i></div><div className="card-info"><h4>Today's Bookings</h4><p>{stats.todaysBookings}</p></div></div>
                                <div className="card"><div className="card-icon"><i className="fas fa-users"></i></div><div className="card-info"><h4>Active Users</h4><p>{stats.activeUsers}</p></div></div>
                                <div className="card"><div className="card-icon"><i className="fas fa-motorcycle"></i></div><div className="card-info"><h4>Confirmed Bookings</h4><p>{stats.confirmedBookings}</p></div></div>
                                <div className="card"><div className="card-icon"><i className="fas fa-calendar-alt"></i></div><div className="card-info"><h4>Monthly Bookings</h4><p>{stats.totalBookingsMonth}</p></div></div>
                                <div className="card" onClick={() => setActiveTab('offers')} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #fff 0%, #f5f3ff 100%)' }}><div className="card-icon" style={{ color: '#4f46e5' }}><i className="fas fa-gift"></i></div><div className="card-info"><h4>Active Offers</h4><p>{stats.activeOffers || 0}</p></div></div>
                                <div className="card"><div className="card-icon"><i className="fas fa-ban"></i></div><div className="card-info"><h4>Cancelled Bookings</h4><p>{stats.cancelledBookings}</p></div></div>
                                <div className="card"><div className="card-icon"><i className="fas fa-hand-holding-usd"></i></div><div className="card-info"><h4>Pending Refunds</h4><p>{stats.pendingRefunds}</p></div></div>
                            </div>
                            <div className="recent-activity">
                                <h3>Recent Activity</h3>
                                <div className="activity-log">
                                    {stats.recentActivity && stats.recentActivity.length > 0 ? stats.recentActivity.map((act, i) => (
                                        <div key={i} className={`activity-item ${act.type}`}>
                                            <div className="activity-icon-wrapper">
                                                {act.type === 'confirmed' ? <i className="fas fa-check-circle"></i> :
                                                    act.type === 'cancelled' ? <i className="fas fa-times-circle"></i> :

                                                        <i className="fas fa-plus-circle"></i>}
                                            </div>
                                            <div className="activity-content">
                                                <span className="activity-desc">{act.description}</span>
                                                <span className="activity-time">{formatDate(act.timestamp)}</span>
                                            </div>
                                        </div>
                                    )) : <div className="no-activity">No recent activity</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS */}
                    {activeTab === 'users' && (
                        <div id="users" className="content-section active">
                            <div className="section-header-modern">
                                <div>
                                    <h2>User Directory</h2>
                                    <p className="section-subtitle">Manage system users and administrators</p>
                                </div>
                            </div>

                            <div className="inventory-controls">
                                <div className="search-box-modern">
                                    <i className="fas fa-search"></i>
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or phone..."
                                        value={usersFilter}
                                        onChange={e => setUsersFilter(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="modern-table-card">
                                <div className="table-responsive">
                                    <table className="modern-data-table">
                                        <thead>
                                            <tr>
                                                <th>User Profile</th>
                                                <th>Contact Info</th>
                                                <th>Access Level</th>
                                                <th>Account Status</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-5">
                                                        <div className="no-results">
                                                            <i className="fas fa-users-slash"></i>
                                                            <p>No users found matching your search.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredUsers.map(u => (
                                                <tr key={u.id}>
                                                    <td>
                                                        <div className="user-profile-cell">
                                                            <div className="user-avatar-circle">
                                                                {(u.fullName || u.adminName || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="user-meta">
                                                                <span className="u-name">{u.fullName || u.adminName || 'Unknown User'}</span>
                                                                <span className="u-id">User ID: #{u.id}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="contact-cell-modern">
                                                            <span className="contact-info-bit"><i className="fas fa-envelope"></i> {u.email}</span>
                                                            <span className="contact-info-bit"><i className="fas fa-phone"></i> {u.phoneNumber || 'No phone'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`role-pill ${u.isAdmin ? 'admin' : 'user'}`}>
                                                            {u.isAdmin ? <><i className="fas fa-user-shield"></i> Admin</> : <><i className="fas fa-user"></i> User</>}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-pill ${u.isBlocked ? 'busy' : 'available'}`}>
                                                            {u.isBlocked ? 'Blocked' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="actions-cell">
                                                            <button className="icon-btn-modern view" onClick={() => setModal({ type: 'viewUser', data: u })} title="View Profile">
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button className="icon-btn-modern edit" onClick={() => { setEditUserData(u); setModal({ type: 'editUser' }); }} title="Edit User">
                                                                <i className="fas fa-user-edit"></i>
                                                            </button>
                                                            <button
                                                                className={`icon-btn-modern ${u.isBlocked ? 'available' : 'delete'}`}
                                                                style={u.isBlocked ? { background: '#ecfdf5', color: '#10b981' } : {}}
                                                                onClick={() => handleBlockUser(u.id, u.isBlocked)}
                                                                title={u.isBlocked ? 'Unblock User' : 'Block User'}
                                                            >
                                                                <i className={`fas ${u.isBlocked ? 'fa-user-check' : 'fa-user-slash'}`}></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BOOKINGS */}
                    {activeTab === 'bookings' && (
                        <div id="bookings" className="content-section active">
                            <h2>Bookings</h2>
                            <div className="booking-filters">
                                <div><label>Search:</label><input type="text" placeholder="Name, Vehicle, or ID" value={bookingsSearch} onChange={e => setBookingsSearch(e.target.value)} /></div>
                                <div>
                                    <label>Status:</label>
                                    <select value={bookingsStatusFilter} onChange={e => setBookingsStatusFilter(e.target.value)}>
                                        <option value="">All</option>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="ride_started">Ride Started</option>
                                        <option value="ride_completed">Ride Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="rider_not_come">Rider Not Come</option>

                                    </select>
                                </div>
                                <div><label>Start Date:</label><input type="date" value={bookingsDateFilter} onChange={e => setBookingsDateFilter(e.target.value)} /></div>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button className="action-btn" style={{ background: '#333', color: '#fff' }} onClick={() => { setScanInput(''); setModal({ type: 'scanQR' }); }}>
                                        <i className="fas fa-qrcode"></i> Scan QR
                                    </button>
                                </div>
                            </div>
                            <div className="table-container">
                                <table id="bookings-table">
                                    <thead><tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Start Date</th><th>Duration</th><th>Amount</th><th>Status</th><th>Refund</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {filteredBookings.map(b => (
                                            <tr key={b.id}>
                                                <td>{b.booking_id || `#${b.id}`}</td>
                                                <td>{b.customerName}</td>
                                                <td>{b.vehicleName}</td>
                                                <td>{b.start_date}</td>
                                                <td>{b.duration} hrs</td>
                                                <td>₹{b.total_amount}</td>
                                                {/* Points column data removed */}
                                                <td><span className={`status-badge status-${(b.status || 'pending').toLowerCase()}`}>{b.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></td>
                                                <td>
                                                    {(b.status === 'cancelled') ? (
                                                        <div className="refund-info">
                                                            <p><strong>Refund:</strong> ₹{b.refund_amount}</p>
                                                            <p><strong>Status:</strong> {b.refund_status}</p>
                                                            {b.transaction_id && (
                                                                <p style={{ fontSize: '0.85em', color: '#666' }}>
                                                                    <strong>Payment ID:</strong><br />
                                                                    {b.transaction_id}
                                                                </p>
                                                            )}
                                                            {b.refund_id && (
                                                                <p style={{ fontSize: '0.85em', color: '#4CAF50' }}>
                                                                    <strong>Refund ID:</strong><br />
                                                                    {b.refund_id}
                                                                </p>
                                                            )}
                                                            {/* Show Refund Details if present, otherwise show pending submission warning */}
                                                            {b.refund_details ? (
                                                                <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#555', background: '#f5f5f5', padding: '5px', borderRadius: '4px' }}>
                                                                    {(b.refund_details.method === 'upi' || b.refund_details.method === 'UPI') && (
                                                                        <p><strong>UPI:</strong> {b.refund_details.upiId}</p>
                                                                    )}
                                                                    {(b.refund_details.method === 'bank' || b.refund_details.method === 'Bank') && (
                                                                        <>
                                                                            <p><strong>Bank:</strong> {b.refund_details.accountNumber}</p>
                                                                            <p><strong>IFSC:</strong> {b.refund_details.ifsc}</p>
                                                                            <p><strong>Holder:</strong> {b.refund_details.accountHolder}</p>
                                                                        </>
                                                                    )}
                                                                    {b.refund_details.method === 'auto_razorpay' && (
                                                                        <p className="text-muted" style={{ fontStyle: 'italic', color: '#2196F3' }}>
                                                                            ✓ Auto-Refund
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div style={{ marginTop: '5px', fontSize: '0.85em', color: '#c62828', background: '#ffebee', padding: '5px 8px', borderRadius: '4px', borderLeft: '3px solid #f44336', fontWeight: 'bold' }}>
                                                                    ⚠️ User has not submitted refund details yet
                                                                </div>
                                                            )}

                                                        </div>
                                                    ) : 'N/A'}
                                                </td>
                                                <td>
                                                    <div className="action-buttons-container">
                                                        <button className="action-btn btn-view" onClick={() => setModal({ type: 'viewBooking', data: b })}><i className="fas fa-eye"></i> View</button>
                                                        {b.status === 'pending' && (
                                                            <>
                                                                <button className="action-btn btn-confirm" onClick={() => handleConfirmBooking(b.id)}>Confirm</button>

                                                            </>
                                                        )}
                                                        {(['confirmed', 'cancelled', 'ride_started', 'ride_completed', 'completed'].includes(b.status)) && (
                                                            <>
                                                                <button className="action-btn btn-edit" onClick={() => { setEditBookingData(b); setModal({ type: 'editBooking' }); }}><i className="fas fa-edit"></i> Edit</button>
                                                                <button className="action-btn btn-delete" onClick={() => { setModal({ type: 'deleteBooking', data: b }) }}><i className="fas fa-trash"></i> Delete</button>
                                                            </>
                                                        )}
                                                        {(() => {
                                                            // Case-insensitive check for SOS button visibility
                                                            const s = (b.status || '').toLowerCase();
                                                            if (s === 'confirmed' || s === 'ride_started') {
                                                                return (
                                                                    <button className="action-btn btn-sos" onClick={() => handleSendSOS(b.id)}>
                                                                        <i className="fas fa-exclamation-triangle"></i> SOS
                                                                    </button>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                        {(['cancelled'].includes(b.status) && b.refund_status === 'processing') &&
                                                            <button className="action-btn btn-confirm-refund" onClick={() => handleRefundComplete(b.id)}><i className="fas fa-check"></i> Ref. Done</button>
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* VEHICLES */}
                    {activeTab === 'vehicles' && (
                        <div id="vehicles" className="content-section active">
                            <div className="section-header-modern">
                                <div>
                                    <h2>Vehicles Inventory</h2>
                                    <p className="section-subtitle">Manage and track all rental fleet</p>
                                </div>
                                <button className="add-vehicle-btn" onClick={() => { setVehicleFormData({ type: 'bike' }); setModal({ type: 'addVehicle' }); }}>
                                    <i className="fas fa-plus"></i> Add New Vehicle
                                </button>
                            </div>

                            <div className="inventory-controls">
                                <div className="search-box-modern">
                                    <i className="fas fa-search"></i>
                                    <input
                                        type="text"
                                        placeholder="Search by name, ID, or category..."
                                        value={vehicleSearch}
                                        onChange={(e) => setVehicleSearch(e.target.value)}
                                    />
                                </div>
                                <div className="filter-group-modern">
                                    <button
                                        className={`filter-pill ${vehicleTypeFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => setVehicleTypeFilter('all')}
                                    >All</button>
                                    <button
                                        className={`filter-pill ${vehicleTypeFilter === 'bike' ? 'active' : ''}`}
                                        onClick={() => setVehicleTypeFilter('bike')}
                                    ><i className="fas fa-motorcycle"></i> Bikes</button>
                                    <button
                                        className={`filter-pill ${vehicleTypeFilter === 'car' ? 'active' : ''}`}
                                        onClick={() => setVehicleTypeFilter('car')}
                                    ><i className="fas fa-car"></i> Cars</button>
                                    <button
                                        className={`filter-pill ${vehicleTypeFilter === 'scooty' ? 'active' : ''}`}
                                        onClick={() => setVehicleTypeFilter('scooty')}
                                    ><i className="fas fa-moped"></i> Scooters</button>
                                </div>
                            </div>

                            <div className="modern-table-card">
                                <div className="table-responsive">
                                    <table className="modern-data-table">
                                        <thead>
                                            <tr>
                                                <th>Vehicle Info</th>
                                                <th>Sponsor / Owner</th>
                                                <th>Specs</th>
                                                <th>Price / Hr</th>
                                                <th>Status</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredVehicles.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-5">
                                                        <div className="no-results">
                                                            <i className="fas fa-search"></i>
                                                            <p>No vehicles match your search criteria.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredVehicles.map(v => (
                                                <tr key={v.id}>
                                                    <td>
                                                        <div className="vehicle-cell">
                                                            <div className="vehicle-thumb">
                                                                {v.image_url ? (
                                                                    <img src={v.image_url} alt={v.name} />
                                                                ) : (
                                                                    <i className={`fas ${v.type === 'car' ? 'fa-car' : 'fa-motorcycle'}`}></i>
                                                                )}
                                                            </div>
                                                            <div className="vehicle-meta">
                                                                <span className="v-name">{v.name}</span>
                                                                <span className="v-id">ID: #{v.id} • {v.category || 'Standard'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{
                                                                width: '34px',
                                                                height: '34px',
                                                                borderRadius: '50%',
                                                                background: v.sponsor_name && v.sponsor_name !== 'RentHub Fleet' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e2e8f0',
                                                                color: v.sponsor_name && v.sponsor_name !== 'RentHub Fleet' ? '#ffffff' : '#64748b',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.82rem',
                                                                flexShrink: 0
                                                            }}>
                                                                {(v.sponsor_name || 'RH').substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>
                                                                    {v.sponsor_name || 'RentHub Fleet'}
                                                                </div>
                                                                {v.sponsor_phone ? (
                                                                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                                                        <i className="fas fa-phone-alt" style={{ marginRight: '4px', fontSize: '0.7rem' }}></i>
                                                                        {v.sponsor_phone}
                                                                    </div>
                                                                ) : (
                                                                    <span style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#64748b' }}>
                                                                        Internal Fleet
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="specs-cell">
                                                            <span className="spec-item"><i className="fas fa-tag"></i> {v.type}</span>
                                                            <span className="spec-item"><i className="fas fa-cog"></i> {v.engine || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="price-tag-modern">₹{v.price}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-pill ${v.status === 'Available' ? 'available' : 'busy'}`}>
                                                            {v.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="actions-cell">
                                                            <button className="icon-btn-modern view" onClick={() => setModal({ type: 'viewVehicle', data: v })} title="View Details">
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button className="icon-btn-modern edit" onClick={() => { setVehicleFormData(v); setModal({ type: 'editVehicle' }); }} title="Edit Vehicle">
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button className="icon-btn-modern delete" onClick={() => handleDeleteVehicle(v.id, v.type)} title="Delete Vehicle">
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REQUESTS */}
                    {activeTab === 'requests' && (
                        <div id="requests" className="content-section active">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h2>Vehicle Onboarding Pipeline</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                                        Manage multi-stage vehicle inspections, revenue agreements, GPS fitment, and fleet activations.
                                    </p>
                                </div>
                                <button className="action-btn" onClick={loadRequests} title="Refresh Requests" style={{ background: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-sync-alt"></i> Refresh Pipeline
                                </button>
                            </div>

                            <div className="requests-container">
                                {requests.length === 0 ? (
                                    <div className="no-data-card">
                                        <i className="fas fa-clipboard-list"></i>
                                        <p>No pending vehicle requests found in onboarding pipeline.</p>
                                    </div>
                                ) : (
                                    <div className="requests-grid">
                                        {requests.map(r => {
                                            const isApproved = r.status === 'approved';
                                            const isRejected = r.status === 'rejected';
                                            const currentStage = r.current_stage || (isApproved ? 9 : 1);
                                            const progressPercent = Math.round((currentStage / 9) * 100);
                                            const trackingId = r.tracking_id || `RH-REQ-${r.id}`;

                                            return (
                                                <div key={r.id} className="request-card" style={{ border: isApproved ? '2px solid #10b981' : currentStage === 6 ? '2px solid #f59e0b' : '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                                    <div className="req-header" style={{ padding: '16px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                        <div className="req-title">
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                <span style={{ background: '#1e1b4b', color: '#fef08a', fontSize: '0.72rem', fontWeight: '800', fontFamily: 'monospace', padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.5px' }}>
                                                                    {trackingId}
                                                                </span>
                                                                <span className={`status-badge status-${(r.vehicleType || 'bike').toLowerCase()}`}>{r.vehicleType || 'bike'}</span>
                                                            </div>
                                                            <h4 style={{ margin: '4px 0 2px 0', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>{r.name}</h4>
                                                            <span className="req-model" style={{ color: '#64748b', fontSize: '0.85rem' }}>{r.model} • {r.year} ({r.registration_number || 'In Reg'})</span>
                                                        </div>
                                                        <div className="req-badges">
                                                            <span className="price-badge" style={{ background: '#eef2ff', color: '#4338ca', fontWeight: '800', padding: '4px 10px', borderRadius: '8px' }}>
                                                                ₹{r.price}<small>/hr</small>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar Header */}
                                                    <div style={{ padding: '12px 18px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.78rem' }}>
                                                            <span style={{ fontWeight: '800', color: isApproved ? '#059669' : '#4338ca', textTransform: 'uppercase' }}>
                                                                {isApproved ? '🟢 Stage 9/9: Live & Active in Fleet' : `Stage ${currentStage} of 9: ${r.stage_name || 'In Progress'}`}
                                                            </span>
                                                            <strong style={{ color: '#0f172a' }}>{progressPercent}%</strong>
                                                        </div>
                                                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${progressPercent}%`,
                                                                height: '100%',
                                                                background: isApproved ? '#10b981' : 'linear-gradient(90deg, #4f46e5, #8b5cf6)',
                                                                borderRadius: '10px',
                                                                transition: 'width 0.4s ease'
                                                            }}></div>
                                                        </div>
                                                    </div>

                                                    <div className="req-body" style={{ padding: '16px 18px' }}>
                                                        {/* Sponsor Contact Details */}
                                                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                                                <span style={{ color: '#64748b' }}>Sponsor:</span>
                                                                <strong style={{ color: '#0f172a' }}><i className="fas fa-user-tie" style={{ color: '#4f46e5', marginRight: '4px' }}></i> {r.sponsors?.full_name || 'N/A'}</strong>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                                                <span style={{ color: '#64748b' }}>Phone:</span>
                                                                <span style={{ color: '#334155', fontFamily: 'monospace' }}><i className="fas fa-phone-alt" style={{ color: '#10b981', marginRight: '4px' }}></i> {r.sponsors?.phone_number || r.phone_number || 'N/A'}</span>
                                                            </div>
                                                            {r.sponsors?.email && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                                                    <span style={{ color: '#64748b' }}>Email:</span>
                                                                    <span style={{ color: '#4f46e5' }}>{r.sponsors.email}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Documents Provided */}
                                                        <div className="req-docs-section" style={{ marginBottom: '14px' }}>
                                                            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Uploaded Documents:</label>
                                                            <div className="req-docs-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                {r.image_url ? (
                                                                    <a href={r.image_url} target="_blank" rel="noreferrer" className="doc-chip photo">
                                                                        <i className="fas fa-camera"></i> Photo
                                                                    </a>
                                                                ) : <span className="doc-chip missing">Missing Photo</span>}

                                                                {r.rc_url ? (
                                                                    <a href={r.rc_url} target="_blank" rel="noreferrer" className="doc-chip rc">
                                                                        <i className="fas fa-file-invoice"></i> RC Book
                                                                    </a>
                                                                ) : <span className="doc-chip missing">Missing RC</span>}

                                                                {r.insurance_url ? (
                                                                    <a href={r.insurance_url} target="_blank" rel="noreferrer" className="doc-chip insurance">
                                                                        <i className="fas fa-shield-alt"></i> Insurance
                                                                    </a>
                                                                ) : <span className="doc-chip missing">Missing Insr.</span>}

                                                                {r.puc_url ? (
                                                                    <a href={r.puc_url} target="_blank" rel="noreferrer" className="doc-chip puc">
                                                                        <i className="fas fa-smog"></i> PUC
                                                                    </a>
                                                                ) : <span className="doc-chip missing">Missing PUC</span>}
                                                            </div>
                                                        </div>

                                                        {/* Stage Specific Highlights */}
                                                        {r.survey_report && (
                                                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#166534', marginBottom: '12px' }}>
                                                                <strong>📋 Survey Scorecard:</strong> Tyres ({r.survey_report.tyres || 'Good'}) • Brakes ({r.survey_report.brakes || 'Tested'}) • Engine ({r.survey_report.engine || 'Smooth'})
                                                            </div>
                                                        )}

                                                        {r.pricing_terms && (
                                                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#92400e', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                                                <span><strong>Rate:</strong> ₹{r.pricing_terms.proposed_price || r.price}/hr</span>
                                                                <span><strong>Sponsor Split:</strong> {r.pricing_terms.sponsor_percentage || 70}%</span>
                                                            </div>
                                                        )}

                                                        {r.gps_tracking && (
                                                            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#3730a3', marginBottom: '12px' }}>
                                                                <strong>📍 GPS IMEI:</strong> {r.gps_tracking.device_imei || 'Paired'}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Stage Action Controls */}
                                                    <div className="req-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '16px 18px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        {isApproved ? (
                                                            <div style={{ width: '100%', textAlign: 'center', color: '#16a34a', fontWeight: 'bold', fontSize: '0.95rem', padding: '10px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #86efac' }}>
                                                                <i className="fas fa-check-circle"></i> Vehicle Live & Generating Revenue
                                                            </div>
                                                        ) : isRejected ? (
                                                            <div style={{ width: '100%', textAlign: 'center', color: '#dc2626', fontWeight: 'bold', fontSize: '0.95rem', padding: '10px', background: '#fee2e2', borderRadius: '8px' }}>
                                                                <i className="fas fa-times-circle"></i> Application Rejected
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Step 1 -> Step 2 */}
                                                                {currentStage === 1 && (
                                                                    <button
                                                                        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}
                                                                        onClick={() => handleAdvanceStage(r.id, 2, { notes: 'Documents verified by Admin' })}
                                                                    >
                                                                        <i className="fas fa-file-check"></i> Step 2: Verify Documents & Clear
                                                                    </button>
                                                                )}

                                                                {/* Step 2 -> Step 3 */}
                                                                {currentStage === 2 && (
                                                                    <button
                                                                        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                                        onClick={() => {
                                                                            setStageFormData({ requestId: r.id, survey_scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], notes: 'Field team scheduled for inspection' });
                                                                            setModal({ type: 'stageScheduleSurvey', data: r });
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-calendar-alt"></i> Step 3: Schedule Physical Survey
                                                                    </button>
                                                                )}

                                                                {/* Step 3 -> Step 4 */}
                                                                {currentStage === 3 && (
                                                                    <button
                                                                        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                                        onClick={() => {
                                                                            setStageFormData({
                                                                                requestId: r.id,
                                                                                tyres: 'Good',
                                                                                brakes: 'Good',
                                                                                engine: 'Good',
                                                                                lights: 'Good',
                                                                                chassis: 'Good',
                                                                                overall_status: 'PASSED',
                                                                                notes: 'Vehicle inspected and verified roadworthy.'
                                                                            });
                                                                            setModal({ type: 'stageSurveyReport', data: r });
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-clipboard-check"></i> Step 4: Submit Inspection Report
                                                                    </button>
                                                                )}

                                                                {/* Sponsor Counter-Offer Notification & Direct Action Buttons */}
                                                                {(r.counter_offer_price || r.vehicle_details?.counter_offer_price || r.sponsor_requested_price || r.vehicle_details?.sponsor_requested_price) ? (
                                                                    <div style={{ background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: '12px', padding: '12px', marginBottom: '8px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4c1d95', textTransform: 'uppercase' }}>
                                                                                💬 Sponsor Counter-Offer
                                                                            </span>
                                                                            <span style={{ background: '#6366f1', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                                                                                ₹{r.counter_offer_price || r.vehicle_details?.counter_offer_price || r.sponsor_requested_price || r.vehicle_details?.sponsor_requested_price}/hr Requested
                                                                            </span>
                                                                        </div>
                                                                        {(r.sponsor_price_remarks || r.vehicle_details?.sponsor_price_remarks) && (
                                                                            <p style={{ margin: '2px 0 10px', fontSize: '0.76rem', color: '#5b21b6', fontStyle: 'italic' }}>
                                                                                "{r.sponsor_price_remarks || r.vehicle_details?.sponsor_price_remarks}"
                                                                            </p>
                                                                        )}
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                            {/* Action 1: 1-Click Accept Sponsor Counter-Offer */}
                                                                            <button
                                                                                type="button"
                                                                                style={{ width: '100%', padding: '10px 14px', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                                                onClick={() => {
                                                                                    const askedRate = parseFloat(r.counter_offer_price || r.vehicle_details?.counter_offer_price || r.price || 65);
                                                                                    handleAdvanceStage(r.id, 6, {
                                                                                        pricing_terms: {
                                                                                            proposed_price: askedRate,
                                                                                            sponsor_percentage: 70,
                                                                                            platform_percentage: 30
                                                                                        },
                                                                                        terms_accepted: true,
                                                                                        terms_declined: false,
                                                                                        counter_offer_price: null,
                                                                                        sponsor_requested_price: null,
                                                                                        agreement_accepted_at: new Date().toISOString(),
                                                                                        notes: `Admin accepted sponsor requested rate of ₹${askedRate}/hr with 70% revenue share.`
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <i className="fas fa-check-circle"></i> ✓ Accept Sponsor's ₹{r.counter_offer_price || r.vehicle_details?.counter_offer_price}/hr & Unlock Step 7
                                                                            </button>

                                                                            {/* Action 2: Propose Different Price */}
                                                                            <button
                                                                                type="button"
                                                                                style={{ width: '100%', padding: '8px 12px', background: '#fff', color: '#6d28d9', border: '1.5px solid #c4b5fd', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                                                onClick={() => {
                                                                                    const askedRate = r.counter_offer_price || r.vehicle_details?.counter_offer_price || r.price || 65;
                                                                                    setStageFormData({
                                                                                        requestId: r.id,
                                                                                        proposed_price: askedRate,
                                                                                        sponsor_percentage: 70,
                                                                                        mark_accepted: false,
                                                                                        notes: `Revised pricing proposal`
                                                                                    });
                                                                                    setModal({ type: 'stagePricingDecision', data: r });
                                                                                }}
                                                                            >
                                                                                <i className="fas fa-edit"></i> Propose Different Counter-Price
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : currentStage === 4 ? (
                                                                    /* Initial Step 4 -> Step 5 */
                                                                    <button
                                                                        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}
                                                                        onClick={() => {
                                                                            setStageFormData({ requestId: r.id, proposed_price: r.price || 65, sponsor_percentage: 70, mark_accepted: false, notes: 'Revenue terms proposed' });
                                                                            setModal({ type: 'stagePricingDecision', data: r });
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-hand-holding-usd"></i> Step 5: Propose Price & 70% Split
                                                                    </button>
                                                                ) : null}

                                                                {/* Step 5 / 6 Waiting / Agreement Signed */}
                                                                {(currentStage === 5 || currentStage === 6) && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                        <div style={{
                                                                            background: (r.terms_declined || r.counter_offer_price || r.vehicle_details?.counter_offer_price) ? '#fef2f2' : (r.agreement_accepted_at || r.terms_accepted) ? '#ecfdf5' : '#fffbeb',
                                                                            border: `1px solid ${(r.terms_declined || r.counter_offer_price || r.vehicle_details?.counter_offer_price) ? '#fca5a5' : (r.agreement_accepted_at || r.terms_accepted) ? '#a7f3d0' : '#fde68a'}`,
                                                                            color: (r.terms_declined || r.counter_offer_price || r.vehicle_details?.counter_offer_price) ? '#991b1b' : (r.agreement_accepted_at || r.terms_accepted) ? '#065f46' : '#b45309',
                                                                            padding: '10px 12px',
                                                                            borderRadius: '8px',
                                                                            textAlign: 'center',
                                                                            fontSize: '0.85rem',
                                                                            fontWeight: 'bold'
                                                                        }}>
                                                                            {(r.counter_offer_price || r.vehicle_details?.counter_offer_price)
                                                                                ? `💬 Sponsor Counter-Offer: Asked ₹${r.counter_offer_price || r.vehicle_details?.counter_offer_price}/hr (Action: Accept or Re-propose)`
                                                                                : r.terms_declined
                                                                                    ? '✕ Sponsor Declined Pricing Terms'
                                                                                    : (r.agreement_accepted_at || r.terms_accepted)
                                                                                        ? '✓ Pricing Terms Agreed by Sponsor'
                                                                                        : '⏳ Waiting for Sponsor Price Agreement'}
                                                                        </div>

                                                                        {/* Step 7 Button: STRICTLY LOCKED until Sponsor Agrees to Terms */}
                                                                        {(r.terms_accepted || r.agreement_accepted_at) && !r.terms_declined && !r.counter_offer_price && !r.vehicle_details?.counter_offer_price ? (
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                                {(r.signed_contract_url || r.vehicle_details?.signed_contract_url) && (
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px 10px' }}>
                                                                                        <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                            <i className="fas fa-file-check" style={{ color: '#059669' }}></i> Signed Contract Uploaded
                                                                                        </span>
                                                                                        <a
                                                                                            href={r.signed_contract_url || r.vehicle_details?.signed_contract_url}
                                                                                            target="_blank"
                                                                                            rel="noreferrer"
                                                                                            style={{ background: '#059669', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, textDecoration: 'none' }}
                                                                                        >
                                                                                            <i className="fas fa-external-link-alt"></i> View File
                                                                                        </a>
                                                                                    </div>
                                                                                )}
                                                                                <button
                                                                                    style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                                                    onClick={() => handleAdvanceStage(r.id, 7, { notes: 'Contract officially activated by Admin' })}
                                                                                >
                                                                                    <i className="fas fa-file-signature"></i> Step 7: Activate Contract
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                disabled={true}
                                                                                title="Sponsor must agree to the pricing terms in Step 5 before you can activate contract"
                                                                                style={{ width: '100%', padding: '11px', background: '#f1f5f9', color: '#94a3b8', border: '1.5px dashed #cbd5e1', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                                            >
                                                                                <i className="fas fa-lock"></i> Step 7 Locked (Awaiting Sponsor Agreement)
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Step 7 -> Step 8 */}
                                                                {currentStage === 7 && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                        {(r.signed_contract_url || r.vehicle_details?.signed_contract_url) && (
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px 10px' }}>
                                                                                <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                    <i className="fas fa-file-check" style={{ color: '#059669' }}></i> Verified Signed Contract
                                                                                </span>
                                                                                <a
                                                                                    href={r.signed_contract_url || r.vehicle_details?.signed_contract_url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    style={{ background: '#059669', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, textDecoration: 'none' }}
                                                                                >
                                                                                    <i className="fas fa-external-link-alt"></i> View Contract
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                        <button
                                                                            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                                            onClick={() => {
                                                                                setStageFormData({ requestId: r.id, device_imei: `86420904${Date.now().toString().slice(-7)}`, notes: 'GPS tracker installed and paired' });
                                                                                setModal({ type: 'stageGPSInstallation', data: r });
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-map-marker-alt"></i> Step 8: Install & Pair GPS Tracker
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {/* Step 8 -> Step 9 (Vehicle Fleet Live Launch) */}
                                                                {currentStage === 8 && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                        {(r.signed_contract_url || r.vehicle_details?.signed_contract_url) && (
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px 10px' }}>
                                                                                <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                    <i className="fas fa-file-check" style={{ color: '#059669' }}></i> Signed Contract on File
                                                                                </span>
                                                                                <a
                                                                                    href={r.signed_contract_url || r.vehicle_details?.signed_contract_url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    style={{ background: '#059669', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, textDecoration: 'none' }}
                                                                                >
                                                                                    <i className="fas fa-external-link-alt"></i> View Contract
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                        <button
                                                                            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}
                                                                            onClick={() => handleAdvanceStage(r.id, 9, { notes: 'Vehicle published live to customer rental fleet' })}
                                                                        >
                                                                            <i className="fas fa-rocket"></i> Step 9: Launch & Push Vehicle LIVE! 🟢
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Common Utility Buttons */}
                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                            <button
                                                                style={{ flex: 1, padding: '8px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                                onClick={() => setModal({ type: 'viewRequestTimeline', data: r })}
                                                            >
                                                                <i className="fas fa-history"></i> Log
                                                            </button>
                                                            {!isApproved && (
                                                                <button
                                                                    style={{ padding: '8px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                                    onClick={() => handleRejectRequest(r.id)}
                                                                >
                                                                    <i className="fas fa-times"></i> Reject
                                                                </button>
                                                            )}
                                                            <button
                                                                style={{ padding: '8px 12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                                                                onClick={() => handleDeleteRequest(r.id)}
                                                                title="Delete Request"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SPONSOR REPORTS */}
                    {activeTab === 'earnings' && (
                        <div id="earnings" className="content-section active" style={{ padding: '24px' }}>
                            <ComingSoonCard
                                title="Sponsor Revenue & Yield Management"
                                subtitle="Automated 70/30 revenue distribution calculator, real-time ROI tracking per sponsored asset, and automated fleet performance disbursements."
                                icon="fas fa-chart-line"
                                phase="Release 2.5 • Sponsor Ecosystem"
                                features={[
                                    "Automated 70% Sponsor Share & 30% Platform split ledger engine",
                                    "Individual vehicle depreciation & capital recoupment tracker",
                                    "Automated monthly earnings statement generator for vehicle owners",
                                    "Multi-sponsor asset syndication and co-ownership distribution"
                                ]}
                                onBack={() => setActiveTab('dashboard')}
                            />
                        </div>
                    )}

                    {/* POLICIES */}
                    {activeTab === 'policies' && (
                        <div id="policies" className="content-section active" style={{ display: 'flex', justifyContent: 'center', background: '#f0f2f5', padding: '20px' }}>
                            <div className="policy-document" style={{
                                background: 'white',
                                width: '100%',
                                maxWidth: '800px',
                                minHeight: '800px',
                                padding: '50px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                borderRadius: '4px',
                                color: '#333',
                                fontFamily: "'Times New Roman', Times, serif"
                            }}>
                                <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
                                    <h1 style={{ margin: '0', fontSize: '28px', textTransform: 'uppercase', letterSpacing: '2px' }}>Terms & Conditions</h1>
                                    <p style={{ margin: '10px 0 0', fontSize: '14px', fontStyle: 'italic', color: '#666' }}>RentHub Vehicle Rental Services</p>
                                </div>

                                <div className="policy-section" style={{ marginBottom: '25px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>1. Driver Eligibility</h3>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>1.1 Age Limit:</strong> The rider must be at least 18 years of age to rent a vehicle.
                                    </p>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>1.2 License:</strong> The rider must verify they possess a valid, government-issued driving license appropriate for the vehicle category (LMV/MCWG) and carry the original during the trip.
                                    </p>
                                </div>

                                <div className="policy-section" style={{ marginBottom: '25px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>2. Booking & Cancellation</h3>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>2.1 Confirmation:</strong> Bookings are confirmed only upon receipt of the advance payment.
                                    </p>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>2.2 Cancellation Policy:</strong> Free cancellation is available up to 24 hours before the trip start time. Cancellations made within 24 hours will incur a fee of 50% of the advance amount. No refunds for cancellations after the trip start time.
                                    </p>
                                </div>

                                <div className="policy-section" style={{ marginBottom: '25px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>3. Security Deposit & Payments</h3>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        Refundable security deposits may be required for certain high-end vehicles. This deposit will be refunded within 5-7 business days after the vehicle is returned damage-free.
                                    </p>
                                </div>

                                <div className="policy-section" style={{ marginBottom: '25px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>4. Vehicle Usage</h3>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>4.1 Prohibited Use:</strong> Vehicles cannot be used for racing, towing, transporting illegal substances, or commercial passenger transport.
                                    </p>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>4.2 Territory:</strong> Vehicles must be driven within the state limits unless a special permit is obtained and approved by RentHub.
                                    </p>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>4.3 Traffic Violations:</strong> The user is solely responsible for paying any traffic fines or challans incurred during the rental period.
                                    </p>
                                </div>

                                <div className="policy-section" style={{ marginBottom: '25px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>5. Fuel Policy</h3>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        The vehicle is provided with a full tank (or sufficient fuel to reach the nearest station). It must be returned with the same fuel level. If returned with less fuel, the cost of the difference plus a refueling surcharge will be deducted.
                                    </p>
                                </div>

                                <div className="policy-section" style={{ marginBottom: '25px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>6. Damage & Breakdown</h3>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>6.1 Accident:</strong> In case of an accident, the user must immediately notify RentHub and valid authorities. The user is liable for damage costs up to the insurance deductible amount.
                                    </p>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>6.2 Breakdown:</strong> For mechanical failures not caused by user negligence, RentHub will provide roadside assistance or a replacement vehicle subject to availability.
                                    </p>
                                </div>

                                <div className="policy-section" style={{ marginBottom: '25px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>7. Return Policy</h3>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>7.1 Late Return:</strong> A grace period of 30 minutes is allowed. Returns delayed by more than 30 minutes will attract a penalty of ₹100/hour + double the hourly rental rate for the extended duration.
                                    </p>
                                    <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', color: '#444' }}>
                                        <strong>7.2 Condition:</strong> The vehicle must be returned in a clean condition. Excessive dirt or trash may incur a cleaning fee.
                                    </p>
                                </div>

                                <div className="policy-footer" style={{ marginTop: '50px', borderTop: '1px solid #ddd', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: '#888' }}>
                                    <p>Last updated: December 2025</p>
                                    <p>RentHub Inc. &copy; All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* WITHDRAWALS */}
                    {/* WITHDRAWALS */}
                    {/* WITHDRAWALS */}
                    {activeTab === 'withdrawals' && (
                        <div id="withdrawals" className="content-section active" style={{ padding: '24px' }}>
                            <ComingSoonCard
                                title="Automated Banking & Payout Gateway"
                                subtitle="Direct multi-bank RTGS/NEFT batch disbursement system with automated penny-drop verification and instantaneous UPI payout rails."
                                icon="fas fa-money-bill-wave"
                                phase="Release 2.5 • Financial Core"
                                features={[
                                    "Instant bank account verification via NPCI penny-drop API",
                                    "Automated T+1 daily batch payout disbursements to sponsors",
                                    "Automated TDS deduction certificate (Form 16A) generation",
                                    "Comprehensive audit trail & multi-level financial approval workflows"
                                ]}
                                onBack={() => setActiveTab('dashboard')}
                            />
                        </div>
                    )}

                    {/* SPONSOR PORTAL */}
                    {activeTab === 'sponsorPortal' && (
                        <div id="sponsorPortal" className="content-section active" style={{ padding: '24px' }}>
                            <ComingSoonCard
                                title="Sponsor Partner Portal & Mobile Dashboard"
                                subtitle="Dedicated partner ecosystem allowing vehicle owners to monitor live GPS telemetry, trip revenue, and maintenance logs in real time."
                                icon="fas fa-handshake"
                                phase="Release 2.5 • Partner Suite"
                                features={[
                                    "Real-time vehicle GPS live tracking with geofence security alerts",
                                    "Instant wallet balance withdrawal via IMPS / UPI auto-payout",
                                    "Digital contract management & automated yearly agreement renewal",
                                    "Fleet maintenance scheduling with partner workshop network"
                                ]}
                                onBack={() => setActiveTab('dashboard')}
                            />
                        </div>
                    )}

                    {/* SUPPORT ISSUES */}
                    {activeTab === 'issues' && (
                        <div id="issues" className="content-section active" style={{ padding: '24px' }}>
                            <AdminIssues />
                        </div>
                    )}

                    {/* OFFERS MANAGEMENT */}
                    {activeTab === 'offers' && (
                        <div id="offers" className="content-section active">
                            <AdminOffers />
                        </div>
                    )}

                    {/* ANALYTICS & REPORTS */}
                    {activeTab === 'reports' && (
                        <div id="reports" className="content-section active" style={{ padding: '24px' }}>
                            <ComingSoonCard
                                title="Advanced Analytics & Intelligence Reports"
                                subtitle="Deep fleet performance analytics, customer cohort retention metrics, automated GST reconciliation, and predictive revenue forecasting engine."
                                icon="fas fa-chart-pie"
                                phase="Release 2.5 • Enterprise Suite"
                                features={[
                                    "AI-Powered vehicle utilization & dynamic surge pricing models",
                                    "Automated monthly GST/TDS tax compliance & invoicing reports",
                                    "Customer lifetime value (LTV) & churn prediction analytics",
                                    "Export reports in PDF, XLSX, and live BigQuery/PowerBI connectors"
                                ]}
                                onBack={() => setActiveTab('dashboard')}
                            />
                        </div>
                    )}
                </main>

            </div>

            {/* MODALS */}
            {modal.type === 'viewBooking' && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setModal({ type: null })}>&times;</span>
                        <h2>Booking Details</h2>
                        <div className="booking-details">
                            <h4 style={{ color: '#4CAF50', margin: '0 0 15px 0' }}>Booking ID: {modal.data.booking_id || `#${modal.data.id}`}</h4>

                            <p><strong>Vehicle:</strong> {modal.data.vehicleName} {modal.data.vehicleType ? `(${modal.data.vehicleType})` : ''}</p>
                            <p><strong>Start Date:</strong> {modal.data.start_date} ({modal.data.start_time})</p>

                            {/* Calculate End Date roughly for display */}
                            {(() => {
                                const start = new Date(`${modal.data.start_date}T${modal.data.start_time}`);
                                const end = new Date(start.getTime() + (modal.data.duration * 60 * 60 * 1000));
                                const endDate = end.toLocaleDateString('en-CA');
                                const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                                return <p><strong>End Date:</strong> {endDate} ({endTime})</p>;
                            })()}

                            <p><strong>Duration:</strong> {modal.data.duration} hours</p>
                            <p><strong>Total Amount:</strong> ₹{modal.data.total_amount}</p>
                            <p><strong>Advance Payment:</strong> ₹{modal.data.advance_payment}</p>
                            <p><strong>Advance Payment:</strong> ₹{modal.data.advance_payment}</p>
                            <p><strong>Remaining Amount:</strong> ₹{modal.data.total_amount - modal.data.advance_payment}</p>
                            {/* Points earned removed */}
                            {modal.data.coupon_code && (
                                <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                    <i className="fas fa-tag"></i> Coupon Used: {modal.data.coupon_code} ({modal.data.reward_type === 'FREE_2_HOUR_RIDE' ? 'Free 2 Hours' : 'Reward'})
                                </p>
                            )}

                            {modal.data.transaction_id && (
                                <p><strong>Transaction ID:</strong> {modal.data.transaction_id}</p>
                            )}

                            <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '5px', border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-calendar-alt" style={{ color: '#6c757d' }}></i>
                                <span style={{ color: '#495057', fontSize: '0.9em' }}>
                                    <strong>Booked on:</strong> {formatDate(modal.data.created_at)}
                                </span>
                            </div>

                            <p style={{ marginTop: '15px' }}><strong>Status:</strong> <span className={`status-badge status-${(modal.data.status || 'pending').toLowerCase()}`}>{modal.data.status}</span></p>


                            {/* Ride Summary (Visible for Active & Completed Rides) */}
                            {(modal.data.status === 'ride_started' || modal.data.status === 'ride_completed' || modal.data.status === 'completed') && (
                                <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #b3e5fc' }}>
                                    <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #b3e5fc', paddingBottom: '5px' }}>Ride Summary</h4>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9em', marginBottom: '10px' }}>
                                        <div>
                                            <strong>Ride Start:</strong><br />
                                            {formatDate(modal.data.ride_start_time || modal.data.updated_at)}
                                        </div>
                                        {/* Show End Time only if completed */}
                                        {(modal.data.status === 'ride_completed' || modal.data.status === 'completed') ? (
                                            <div>
                                                <strong>Ride End:</strong><br />
                                                {formatDate(modal.data.ride_end_time)}
                                            </div>
                                        ) : (
                                            <div>
                                                <strong>Ride End:</strong><br />
                                                <span style={{ color: '#ff9800', fontStyle: 'italic' }}>IN PROGRESS...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* FULL PAYMENT SUMMARY - ONLY FOR COMPLETED RIDES */}
                                    {(modal.data.status === 'ride_completed' || modal.data.status === 'completed') && (
                                        <>
                                            {(modal.data.extra_amount > 0) && (
                                                <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                                                    ⚠️ Overdue Charge: ₹{modal.data.extra_amount}<br />
                                                    <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: '#555' }}>
                                                        {(() => {
                                                            const extraHours = modal.data.extra_hours || 0;
                                                            const hours = Math.floor(extraHours);
                                                            const minutes = Math.round((extraHours - hours) * 60);
                                                            return `(${hours} hrs / ${minutes} mins)`;
                                                        })()}
                                                    </span>
                                                </p>
                                            )}

                                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #bbb' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                    <span>Actual Billable Amount:</span>
                                                    <span>₹{modal.data.total_amount}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#4caf50' }}>
                                                    <span>Advance Paid:</span>
                                                    <span>- ₹{modal.data.advance_payment}</span>
                                                </div>

                                                {/* Logic for Balance */}
                                                {(() => {
                                                    const total = parseFloat(modal.data.total_amount) || 0;
                                                    const advance = parseFloat(modal.data.advance_payment) || 0;
                                                    // Backend updates 'total_amount' to the full Actual Billable Amount upon ride completion
                                                    const balance = total - advance;

                                                    const isRefund = balance < 0;

                                                    return (
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            paddingTop: '10px',
                                                            marginTop: '10px',
                                                            borderTop: '2px solid #333',
                                                            fontSize: '1.2em',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            <span>{isRefund ? 'REFUND CUSTOMER:' : 'TOTAL PAYABLE:'}</span>
                                                            <span style={{ color: isRefund ? '#d32f2f' : '#1976d2' }}>
                                                                ₹{Math.abs(balance)}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {(modal.data.status === 'cancelled' || modal.data.status === 'rejected') && (
                                <div style={{ borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '10px' }}>
                                    <p><strong>Refund Amount:</strong> ₹{modal.data.refund_amount}</p>
                                    <p><strong>Refund Status:</strong> {modal.data.refund_status}</p>
                                    {modal.data.refund_details && (
                                        <div style={{ marginTop: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '5px', border: '1px solid #eee' }}>
                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1em' }}>Refund Details</h4>
                                            {(modal.data.refund_details.method === 'upi' || modal.data.refund_details.method === 'UPI') && (
                                                <p style={{ margin: '5px 0' }}><strong>UPI ID:</strong> {modal.data.refund_details.upiId}</p>
                                            )}
                                            {(modal.data.refund_details.method === 'bank' || modal.data.refund_details.method === 'Bank') && (
                                                <>
                                                    <p style={{ margin: '5px 0' }}><strong>Bank Account:</strong> {modal.data.refund_details.accountNumber}</p>
                                                    <p style={{ margin: '5px 0' }}><strong>IFSC:</strong> {modal.data.refund_details.ifsc}</p>
                                                    <p style={{ margin: '5px 0' }}><strong>Holder Name:</strong> {modal.data.refund_details.accountHolder}</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {modal.type === 'editBooking' && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setModal({ type: null })}>&times;</span>
                        <h2>Edit Booking</h2>
                        <form onSubmit={handleUpdateBooking}>
                            <div style={{ marginBottom: '12px' }}><label>Start Date</label><input type="date" value={editBookingData.start_date || ''} onChange={e => setEditBookingData({ ...editBookingData, start_date: e.target.value })} required className="form-control" /></div>
                            <div style={{ marginBottom: '12px' }}><label>Status</label>
                                <select value={editBookingData.status} onChange={e => setEditBookingData({ ...editBookingData, status: e.target.value })} className="form-control">
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <button className="action-btn btn-confirm">Save</button>
                        </form>
                    </div>
                </div>
            )}

            {modal.type === 'rejectBooking' && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setModal({ type: null })}>&times;</span>
                        <h2>Reject Booking</h2>
                        <textarea style={{ width: '100%', minHeight: '100px' }} placeholder="Reason for rejection" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}></textarea>
                        <button className="action-btn btn-reject" style={{ marginTop: '10px' }} onClick={handleRejectBooking}>Submit</button>
                    </div>
                </div>
            )}

            {modal.type === 'scanQR' && (
                <div className="modal">
                    <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
                        <span className="close-button" onClick={() => setModal({ type: null })}>&times;</span>
                        <h2>Scan QR Code</h2>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                            <div className="tabs" style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setScanInput('') /* clear input on switch if needed, or keep mode state */}
                                    style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer', opacity: scanInput === 'camera' ? 1 : 0.6 }}
                                >
                                    <i className="fas fa-camera"></i> Camera
                                </button>
                                <button
                                    onClick={() => {/* managed via input focus usually, but here we just show both or toggle. Let's just show camera area */ }}
                                    style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#333', color: 'white', cursor: 'pointer' }}
                                >
                                    Manual Input
                                </button>
                            </div>
                        </div>

                        <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px', position: 'relative', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Scanner
                                onScan={(result) => {
                                    if (result && result.length > 0) {
                                        const rawValue = result[0].rawValue;
                                        setScanInput(rawValue);
                                        // Feedback logic here if needed
                                    }
                                }}
                                onError={(error) => console.log(error?.message)}
                                components={{
                                    audio: false,
                                    onOff: true,
                                    torch: true,
                                    zoom: true,
                                    finder: true
                                }}
                                styles={{
                                    container: { width: '100%', height: '100%' },
                                    video: { width: '100%', height: '100%', objectFit: 'cover' }
                                }}
                                allowMultiple={true}
                                scanDelay={500}
                            />
                            {!scanInput && <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, color: 'white', opacity: 0.8, pointerEvents: 'none', textAlign: 'center', zIndex: 10, fontWeight: 'bold' }}>Scanning...</div>}
                        </div>

                        <p style={{ marginBottom: '10px', color: '#666', textAlign: 'center' }}>Scan the QR code or enter Booking ID below.</p>
                        <form onSubmit={handleScanQR}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Booking ID (e.g. RH...)"
                                    value={typeof scanInput === 'object' ? scanInput.text : scanInput}
                                    onChange={e => setScanInput(e.target.value)}
                                    autoFocus
                                    required
                                    style={{
                                        fontSize: '1.2rem',
                                        padding: '12px',
                                        textAlign: 'center',
                                        letterSpacing: '1px',
                                        fontWeight: 'bold',
                                        border: '2px solid #ddd'
                                    }}
                                />
                                {scanInput && (
                                    <button
                                        type="button"
                                        onClick={() => setScanInput('')}
                                        style={{
                                            background: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 15px', fontSize: '1.2rem', color: '#555'
                                        }}
                                        title="Clear"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="action-btn btn-confirm" style={{ width: '100%', padding: '12px', fontSize: '1.1rem' }}>Process Scan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRM DELETE BOOKING */}
            <StatusPopup
                isOpen={modal.type === 'deleteBooking'}
                onClose={() => setModal({ type: null })}
                onConfirm={() => handleDeleteBooking(modal.data?.id)}
                type="confirm"
                title="Confirm Delete"
                message="Are you sure you want to delete this booking?"
                confirmText="Yes, Delete"
                cancelText="Cancel"
            />

            {modal.type === 'viewUser' && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setModal({ type: null })}>&times;</span>
                        <h2>User Details</h2>
                        <p><strong>Name:</strong> {modal.data.fullName || modal.data.adminName}</p>
                        <p><strong>Email:</strong> {modal.data.email}</p>
                        <p><strong>Phone:</strong> {modal.data.phoneNumber}</p>
                        <p><strong>Role:</strong> {modal.data.isAdmin ? 'Admin' : 'User'}</p>
                    </div>
                </div>
            )}

            {modal.type === 'editUser' && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setModal({ type: null })}>&times;</span>
                        <h2>Edit User</h2>
                        <form onSubmit={handleUpdateUser}>
                            <div style={{ marginBottom: '12px' }}><label>Name</label><input type="text" value={editUserData.fullName || editUserData.adminName || ''} onChange={e => setEditUserData({ ...editUserData, fullName: e.target.value })} /></div>
                            <div style={{ marginBottom: '12px' }}><label>Email</label><input type="email" value={editUserData.email || ''} onChange={e => setEditUserData({ ...editUserData, email: e.target.value })} /></div>
                            <div style={{ marginBottom: '12px' }}><label>Phone</label><input type="text" value={editUserData.phoneNumber || ''} onChange={e => setEditUserData({ ...editUserData, phoneNumber: e.target.value })} /></div>
                            <button className="action-btn btn-confirm">Save</button>
                        </form>
                    </div>
                </div>
            )}

            {/* SPONSOR DETAILS MODAL */}
            {modal.type === 'viewSponsorDetails' && (
                <div className="modal">
                    <div className="modal-content sponsor-dashboard-modal" style={{ maxWidth: '900px', width: '95%', padding: '0', background: 'transparent', border: 'none' }}>

                        {/* Header */}
                        <div className="modal-header-styled">
                            <h2>
                                <i className="fas fa-chart-line"></i>
                                {modal.data.name}'s Dashboard
                            </h2>
                            <button className="modal-close-btn-styled" onClick={() => setModal({ type: null })}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body-styled">

                            {/* Premium Stats Grid */}
                            <div className="modal-stats-grid">
                                <div className="stat-card-premium">
                                    <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#10b981' }}>
                                        <i className="fas fa-car-side"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h4>Total Vehicles</h4>
                                        <p>{modal.data.totalVehicles || 0}</p>
                                    </div>
                                </div>
                                <div className="stat-card-premium">
                                    <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                                        <i className="fas fa-rupee-sign"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h4>Total Revenue</h4>
                                        <p>₹{parseFloat(modal.data.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                                <div className="stat-card-premium">
                                    <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                                        <i className="fas fa-wallet"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h4>Net Earnings</h4>
                                        <p className="text-success">₹{parseFloat(modal.data.sponsorShare || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                                <div className="stat-card-premium">
                                    <div className="stat-icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}>
                                        <i className="fas fa-calendar-check"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h4>Bookings</h4>
                                        <p>{modal.data.bookingsCount}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Financial Summary */}
                            <div className="financial-summary-section">
                                <h3><i className="fas fa-file-invoice-dollar" style={{ marginRight: '8px' }}></i> Financial Summary</h3>

                                <div className="summary-rows">
                                    <div className="summary-row">
                                        <span className="summary-label">Sponsor Name</span>
                                        <span className="summary-value">{modal.data.name}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span className="summary-label">Registered Email</span>
                                        <span className="summary-value" style={{ color: '#64748b' }}>{modal.data.email}</span>
                                    </div>
                                    <div className="summary-row" style={{ marginTop: '10px' }}>
                                        <span className="summary-label">Total Generated Revenue</span>
                                        <span className="summary-value">₹{parseFloat(modal.data.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="summary-row">
                                        <span className="summary-label">Platform Fee (30%)</span>
                                        <span className="summary-value text-warning">- ₹{parseFloat(modal.data.platformShare || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="summary-row" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                        <span className="summary-label">Sponsor Gross Share (70%)</span>
                                        <span className="summary-value text-success">₹{parseFloat(modal.data.sponsorShare || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="summary-row">
                                        <span className="summary-label">Total Amount Withdrawn</span>
                                        <span className="summary-value text-danger">- ₹{parseFloat(modal.data.totalWithdrawn || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="summary-row total">
                                        <span className="summary-label">Current Withdrawable Balance</span>
                                        <span className="summary-value" style={{ fontSize: '1.4rem', color: modal.data.currentBalance < 0 ? '#ef4444' : '#0f172a' }}>
                                            ₹{parseFloat(modal.data.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Vehicle Modal */}
            {(modal.type === 'addVehicle' || modal.type === 'editVehicle') && (
                <div className="modal">
                    <div className="modal-content" style={{ maxWidth: '650px', width: '95%' }}>
                        <span className="close-button" onClick={() => setModal({ type: null })}>&times;</span>
                        <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                            {modal.type === 'addVehicle' ? 'Add New Vehicle' : 'Edit Vehicle Details'}
                        </h2>

                        <form onSubmit={handleVehicleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {/* Left Column */}
                                <div>
                                    <div className="form-group">
                                        <label>Vehicle Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={vehicleFormData.name || ''}
                                            onChange={e => setVehicleFormData({ ...vehicleFormData, name: e.target.value })}
                                            placeholder="e.g. Royal Enfield Classic"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Vehicle Type</label>
                                        <select
                                            className="form-control"
                                            value={vehicleFormData.type || 'bike'}
                                            onChange={e => setVehicleFormData({ ...vehicleFormData, type: e.target.value })}
                                        >
                                            <option value="bike">Bike</option>
                                            <option value="car">Car</option>
                                            <option value="scooty">Scooty</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Model</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={vehicleFormData.model || ''}
                                            onChange={e => setVehicleFormData({ ...vehicleFormData, model: e.target.value })}
                                            placeholder="e.g. Classic 350"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Year</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={vehicleFormData.year || ''}
                                            onChange={e => setVehicleFormData({ ...vehicleFormData, year: e.target.value })}
                                            placeholder="e.g. 2024"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Hourly Price (₹)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={vehicleFormData.price || ''}
                                            onChange={e => setVehicleFormData({ ...vehicleFormData, price: e.target.value })}
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div>
                                    <div className="form-group">
                                        <label>Registration Number</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={vehicleFormData.registration_number || ''}
                                            onChange={e => setVehicleFormData({ ...vehicleFormData, registration_number: e.target.value })}
                                            placeholder="e.g. OD-02-XY-1234"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Category</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={vehicleFormData.category || ''}
                                            onChange={e => setVehicleFormData({ ...vehicleFormData, category: e.target.value })}
                                            placeholder="e.g. Cruiser"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            className="form-control"
                                            value={vehicleFormData.status || 'available'}
                                            onChange={e => setVehicleFormData({ ...vehicleFormData, status: e.target.value })}
                                        >
                                            <option value="available">Available (Active)</option>
                                            <option value="unavailable">Unavailable</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Image URL</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={vehicleFormData.image_url || ''}
                                            onChange={e => setVehicleFormData({ ...vehicleFormData, image_url: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>

                                    {/* Image Preview */}
                                    <div style={{
                                        height: '110px',
                                        background: '#f8f9fa',
                                        border: '1px dashed #ced4da',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '10px',
                                        overflow: 'hidden'
                                    }}>
                                        {vehicleFormData.image_url ? (
                                            <img
                                                src={vehicleFormData.image_url}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = 'Invalid Image URL' }}
                                            />
                                        ) : (
                                            <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Image Preview</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="action-btn" style={{ background: '#f8f9fa', color: '#333', border: '1px solid #ddd' }} onClick={() => setModal({ type: null })}>Cancel</button>
                                <button type="submit" className="action-btn btn-confirm" disabled={isSubmitting} style={{ minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                                    {isSubmitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i> Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save"></i>
                                            {modal.type === 'addVehicle' ? (vehicleFormData.requestId ? 'Approve & Earn' : 'Add Vehicle') : 'Save Changes'}
                                        </>
                                    )}
                                </button>
                            </div>

                            {modal.type === 'addVehicle' && vehicleFormData.requestId && (
                                <p style={{ marginTop: '15px', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
                                    <i className="fas fa-info-circle"></i> Approving this vehicle will automatically notify the sponsor via email.
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {modal.type === 'viewVehicle' && (
                <div className="modal">
                    <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }}>
                        <span className="close-button" onClick={() => setModal({ type: null })}>&times;</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                            <div style={{
                                width: '65px',
                                height: '65px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {modal.data.image_url ? (
                                    <img src={modal.data.image_url} alt={modal.data.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <i className={`fas ${modal.data.type === 'car' ? 'fa-car' : 'fa-motorcycle'}`} style={{ fontSize: '1.6rem', color: '#64748b' }}></i>
                                )}
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.35rem', color: '#1e293b' }}>{modal.data.name}</h2>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>ID: #{modal.data.id} • Type: {modal.data.type?.toUpperCase()}</span>
                            </div>
                        </div>

                        {/* Sponsor / Owner Card */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                                <i className="fas fa-user-tie"></i> Vehicle Sponsor / Owner Information
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', textTransform: 'uppercase' }}>Sponsor Name</span>
                                    <strong style={{ color: '#1e293b' }}>{modal.data.sponsor_name || 'RentHub Fleet (Internal)'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', textTransform: 'uppercase' }}>Contact Phone</span>
                                    <strong style={{ color: '#1e293b' }}>{modal.data.sponsor_phone || 'N/A'}</strong>
                                </div>
                                {modal.data.sponsor_email && (
                                    <div>
                                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', textTransform: 'uppercase' }}>Email</span>
                                        <span style={{ color: '#334155' }}>{modal.data.sponsor_email}</span>
                                    </div>
                                )}
                                {modal.data.sponsor_upi && (
                                    <div>
                                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', textTransform: 'uppercase' }}>UPI ID</span>
                                        <span style={{ color: '#334155' }}>{modal.data.sponsor_upi}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vehicle Specifications Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.9rem' }}>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Category</span>
                                <strong>{modal.data.category || 'Standard'}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Registration Number</span>
                                <strong>{modal.data.registration_number || 'N/A'}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Model / Year</span>
                                <strong>{modal.data.model || 'N/A'} ({modal.data.year || 'N/A'})</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Engine</span>
                                <strong>{modal.data.engine || 'N/A'}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Hourly Price</span>
                                <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>₹{modal.data.price}/hr</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Status</span>
                                <span className={`status-pill ${modal.data.status === 'Available' ? 'available' : 'busy'}`}>{modal.data.status || 'Active'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STAGE MODAL 1: Schedule Physical Survey (Stage 3) */}
            {modal.type === 'stageScheduleSurvey' && (
                <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1050 }}>
                    <div className="modal-backdrop" onClick={() => setModal({ type: null })}></div>
                    <div className="modal-content" style={{ maxWidth: '520px', width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e0f2fe' }}>
                        <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>📅 Schedule Physical Survey</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                                    Assign an engineer visit date for <strong>{modal.data?.name}</strong>.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModal({ type: null })}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    color: '#ffffff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleAdvanceStage(stageFormData.requestId, 3, {
                                survey_scheduled_date: stageFormData.survey_scheduled_date,
                                notes: stageFormData.notes
                            });
                        }}>
                            <div className="modal-body" style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '18px', lineHeight: 1.5 }}>
                                    Assign an inspection date for RentHub field engineers to visit the sponsor's location and physically review the vehicle.
                                </p>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        Inspection Visit Date <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={stageFormData.survey_scheduled_date || ''}
                                        onChange={(e) => setStageFormData({ ...stageFormData, survey_scheduled_date: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            border: '1.5px solid #cbd5e1',
                                            fontSize: '0.88rem',
                                            fontFamily: 'inherit',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        Inspector / Field Notes
                                    </label>
                                    <textarea
                                        rows="3"
                                        placeholder="e.g. Field Engineer Rahul assigned. Sponsor contacted for time slot 11 AM."
                                        value={stageFormData.notes || ''}
                                        onChange={(e) => setStageFormData({ ...stageFormData, notes: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            border: '1.5px solid #cbd5e1',
                                            fontSize: '0.85rem',
                                            fontFamily: 'inherit',
                                            boxSizing: 'border-box'
                                        }}
                                    ></textarea>
                                </div>
                            </div>
                            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setModal({ type: null })}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
                                        background: '#fff',
                                        color: '#475569',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                        color: '#fff',
                                        fontWeight: 700,
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                                    }}
                                >
                                    {isSubmitting ? 'Scheduling...' : 'Confirm & Notify Sponsor 📩'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STAGE MODAL 2: Physical Survey Inspection Report (Stage 4 - 5-Tier Condition Selector) */}
            {modal.type === 'stageSurveyReport' && (
                <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1050 }}>
                    <div className="modal-backdrop" onClick={() => setModal({ type: null })}></div>
                    <div className="modal-content" style={{ maxWidth: '640px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', border: '1px solid #d1fae5' }}>

                        {/* Header */}
                        <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', shrink: 0 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>📋 Physical Survey Inspection Scorecard</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                                    Vehicle: <strong>{modal.data?.name}</strong> • {modal.data?.registration_number || 'No Reg'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModal({ type: null })}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    color: '#ffffff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const isOverallPassed = stageFormData.overall_status !== 'FAILED';

                            if (!isOverallPassed) {
                                // If admin selected FAILED, execute formal rejection
                                const failReason = `Physical Survey Failed: ${stageFormData.notes || 'Vehicle failed mechanical safety and roadworthiness standards.'}`;
                                executeRejectRequest(stageFormData.requestId, failReason);
                                return;
                            }

                            handleAdvanceStage(stageFormData.requestId, 4, {
                                survey_report: {
                                    tyres: stageFormData.tyres || 'Good',
                                    brakes: stageFormData.brakes || 'Good',
                                    engine: stageFormData.engine || 'Good',
                                    lights: stageFormData.lights || 'Good',
                                    chassis: stageFormData.chassis || 'Good',
                                    overall_status: 'PASSED',
                                    overall_rating: (stageFormData.tyres === 'Excellent' && stageFormData.engine === 'Excellent') ? 'Grade A+ (Flawless)' : 'Grade A (Roadworthy Pass)'
                                },
                                notes: stageFormData.notes || 'Vehicle passed physical survey checklist'
                            });
                        }} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

                            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

                                {/* Quick Preset Buttons */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Itemized Diagnostic Grades:
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStageFormData({
                                                    ...stageFormData,
                                                    tyres: 'Excellent',
                                                    brakes: 'Excellent',
                                                    engine: 'Excellent',
                                                    lights: 'Excellent',
                                                    chassis: 'Excellent',
                                                    overall_status: 'PASSED'
                                                });
                                            }}
                                            style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            All Excellent
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStageFormData({
                                                    ...stageFormData,
                                                    tyres: 'Good',
                                                    brakes: 'Good',
                                                    engine: 'Good',
                                                    lights: 'Good',
                                                    chassis: 'Good',
                                                    overall_status: 'PASSED'
                                                });
                                            }}
                                            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            All Good
                                        </button>
                                    </div>
                                </div>

                                {/* Diagnostic Category Cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                    {[
                                        { key: 'tyres', label: 'Tyres & Tread Condition', detail: 'Tread depth, sidewalls & tyre pressure' },
                                        { key: 'brakes', label: 'Brakes & Suspension', detail: 'Front/rear pads, discs, forks & shock absorbers' },
                                        { key: 'engine', label: 'Engine & Transmission', detail: 'Idle smoothness, oil level, clutch & exhaust' },
                                        { key: 'lights', label: 'Lights & Electricals', detail: 'Headlight, tail lamp, indicators, horn & battery' },
                                        { key: 'chassis', label: 'Chassis & Bodywork', detail: 'Frame alignment, body panels & paint condition' }
                                    ].map((cat) => {
                                        const currentVal = stageFormData[cat.key] || 'Good';

                                        const TIERS = [
                                            { value: 'Excellent', label: 'Excellent', activeBg: '#10b981', activeColor: '#fff', border: '#059669' },
                                            { value: 'Good', label: 'Good', activeBg: '#22c55e', activeColor: '#fff', border: '#16a34a' },
                                            { value: 'Fair', label: 'Fair', activeBg: '#eab308', activeColor: '#1e293b', border: '#ca8a04' },
                                            { value: 'Needs Repair', label: 'Needs Repair', activeBg: '#f97316', activeColor: '#fff', border: '#ea580c' },
                                            { value: 'Critical', label: 'Critical', activeBg: '#ef4444', activeColor: '#fff', border: '#dc2626' }
                                        ];

                                        return (
                                            <div key={cat.key} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <div>
                                                        <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{cat.label}</strong>
                                                        <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>{cat.detail}</span>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 800,
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        background: currentVal === 'Excellent' ? '#d1fae5' : currentVal === 'Good' ? '#dcfce7' : currentVal === 'Fair' ? '#fef9c3' : currentVal === 'Needs Repair' ? '#ffedd5' : '#fee2e2',
                                                        color: currentVal === 'Excellent' ? '#065f46' : currentVal === 'Good' ? '#166534' : currentVal === 'Fair' ? '#854d0e' : currentVal === 'Needs Repair' ? '#9a3412' : '#991b1b'
                                                    }}>
                                                        {currentVal}
                                                    </span>
                                                </div>

                                                {/* 5-Tier Condition Pills */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                                                    {TIERS.map((tier) => {
                                                        const isSelected = currentVal === tier.value;
                                                        return (
                                                            <button
                                                                key={tier.value}
                                                                type="button"
                                                                onClick={() => setStageFormData({ ...stageFormData, [cat.key]: tier.value })}
                                                                style={{
                                                                    padding: '7px 4px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: isSelected ? 800 : 600,
                                                                    textAlign: 'center',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.15s ease',
                                                                    background: isSelected ? tier.activeBg : '#ffffff',
                                                                    color: isSelected ? tier.activeColor : '#475569',
                                                                    border: isSelected ? `2px solid ${tier.border}` : '1px solid #cbd5e1',
                                                                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                                                                }}
                                                            >
                                                                {tier.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Overall Inspection Verdict (PASSED vs FAILED) */}
                                <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', color: '#1e293b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Final Inspection Verdict:
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setStageFormData({ ...stageFormData, overall_status: 'PASSED' })}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                transition: 'all 0.2s ease',
                                                background: stageFormData.overall_status !== 'FAILED' ? '#ecfdf5' : '#f8fafc',
                                                border: stageFormData.overall_status !== 'FAILED' ? '2.5px solid #10b981' : '1px solid #cbd5e1',
                                                color: stageFormData.overall_status !== 'FAILED' ? '#065f46' : '#64748b'
                                            }}
                                        >
                                            <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '2px' }}>PASSED</strong>
                                            <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>Roadworthy & Approved</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStageFormData({ ...stageFormData, overall_status: 'FAILED' })}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                transition: 'all 0.2s ease',
                                                background: stageFormData.overall_status === 'FAILED' ? '#fef2f2' : '#f8fafc',
                                                border: stageFormData.overall_status === 'FAILED' ? '2.5px solid #ef4444' : '1px solid #cbd5e1',
                                                color: stageFormData.overall_status === 'FAILED' ? '#991b1b' : '#64748b'
                                            }}
                                        >
                                            <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '2px' }}>FAILED</strong>
                                            <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>Reject for Safety/Defects</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#1e293b', marginBottom: '4px', textTransform: 'uppercase' }}>
                                        Inspector Summary / Remarks for Sponsor
                                    </label>
                                    <input
                                        type="text"
                                        value={stageFormData.notes || ''}
                                        onChange={(e) => setStageFormData({ ...stageFormData, notes: e.target.value })}
                                        placeholder="e.g. Vehicle in pristine mechanical condition. All tests passed."
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', shrink: 0 }}>
                                <button
                                    type="button"
                                    onClick={() => setModal({ type: null })}
                                    style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: stageFormData.overall_status === 'FAILED'
                                            ? 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)'
                                            : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                        color: '#fff',
                                        fontWeight: 700,
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        boxShadow: stageFormData.overall_status === 'FAILED' ? '0 4px 12px rgba(220, 38, 38, 0.3)' : '0 4px 12px rgba(5, 150, 105, 0.3)'
                                    }}
                                >
                                    {isSubmitting
                                        ? 'Processing...'
                                        : stageFormData.overall_status === 'FAILED'
                                            ? 'Reject Application & Send Report'
                                            : 'Publish & Approve Survey Report'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STAGE MODAL 3: Proposed Rental Price & Revenue Split (Stage 5) */}
            {modal.type === 'stagePricingDecision' && (
                <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1050 }}>
                    <div className="modal-backdrop" onClick={() => setModal({ type: null })}></div>
                    <div className="modal-content" style={{ maxWidth: '520px', width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #fef3c7' }}>
                        <div style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>💰 Set Pricing & Revenue Share</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                                    Set customer rate and 70% sponsor split for <strong>{modal.data?.name}</strong>.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModal({ type: null })}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    color: '#ffffff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const prevProposed = modal.data?.pricing_terms?.proposed_price || modal.data?.price || null;
                            const prevCounter = modal.data?.counter_offer_price || modal.data?.sponsor_requested_price || modal.data?.vehicle_details?.counter_offer_price || null;

                            handleAdvanceStage(stageFormData.requestId, stageFormData.mark_accepted ? 6 : 5, {
                                pricing_terms: {
                                    proposed_price: parseFloat(stageFormData.proposed_price || 65),
                                    previous_price: prevProposed,
                                    previous_counter_price: prevCounter,
                                    sponsor_percentage: parseFloat(stageFormData.sponsor_percentage || 70),
                                    platform_percentage: 100 - parseFloat(stageFormData.sponsor_percentage || 70),
                                    is_revised: !!(prevProposed && prevProposed !== parseFloat(stageFormData.proposed_price || 65))
                                },
                                previous_proposed_price: prevProposed,
                                previous_counter_price: prevCounter,
                                terms_accepted: !!stageFormData.mark_accepted,
                                terms_declined: false,
                                counter_offer_price: null,
                                sponsor_requested_price: null,
                                agreement_accepted_at: stageFormData.mark_accepted ? new Date().toISOString() : null,
                                notes: stageFormData.mark_accepted
                                    ? `Agreed pricing at ₹${stageFormData.proposed_price}/hr with ${stageFormData.sponsor_percentage}% sponsor share. Unlocked for contract activation.`
                                    : `Admin revised pricing to ₹${stageFormData.proposed_price}/hr (Previous: ₹${prevProposed || 'N/A'}/hr, Sponsor Asked: ₹${prevCounter || 'N/A'}/hr)`
                            });
                        }}>
                            <div className="modal-body" style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                                {(modal.data?.counter_offer_price || modal.data?.sponsor_requested_price) && (
                                    <div style={{ background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4c1d95', textTransform: 'uppercase' }}>
                                                💬 Sponsor Requested Counter-Offer
                                            </span>
                                            <span style={{ background: '#6366f1', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                                                ₹{modal.data?.counter_offer_price || modal.data?.sponsor_requested_price}/hr
                                            </span>
                                        </div>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#5b21b6' }}>
                                            Sponsor 70% Share: <strong>₹{((modal.data?.counter_offer_price || modal.data?.sponsor_requested_price) * 0.7).toFixed(1)}/hr</strong>
                                        </p>
                                        {(modal.data?.sponsor_price_remarks) && (
                                            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#4338ca', fontStyle: 'italic', background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd6fe' }}>
                                                "{modal.data?.sponsor_price_remarks}"
                                            </p>
                                        )}
                                    </div>
                                )}
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '18px' }}>
                                    Set the official customer rental price and sponsor revenue share. An agreement link will be emailed to the sponsor for digital signature.
                                </p>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        Hourly Customer Rental Price (₹/hr) <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={stageFormData.proposed_price || ''}
                                        onChange={(e) => setStageFormData({ ...stageFormData, proposed_price: e.target.value })}
                                        min="10"
                                        required
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        Sponsor Revenue Share (%) <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={stageFormData.sponsor_percentage || 70}
                                        onChange={(e) => setStageFormData({ ...stageFormData, sponsor_percentage: e.target.value })}
                                        min="50"
                                        max="90"
                                        required
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                                    />
                                    <small style={{ color: '#64748b', display: 'block', marginTop: '4px', fontSize: '0.78rem' }}>
                                        RentHub platform management fee: {100 - (parseFloat(stageFormData.sponsor_percentage) || 70)}%
                                    </small>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '12px 14px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 'bold', color: '#065f46', marginTop: '14px' }}>
                                    <input
                                        type="checkbox"
                                        checked={stageFormData.mark_accepted || false}
                                        onChange={(e) => setStageFormData({ ...stageFormData, mark_accepted: e.target.checked })}
                                        style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
                                    />
                                    <div>
                                        <span>✓ Auto-Agree with Sponsor & Unlock Step 7</span>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#047857', fontWeight: 500 }}>
                                            Check this if this price is mutually agreed so you can immediately activate contract in Step 7.
                                        </p>
                                    </div>
                                </label>
                            </div>
                            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setModal({ type: null })}
                                    style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: stageFormData.mark_accepted ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                        color: '#fff',
                                        fontWeight: 700,
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        boxShadow: stageFormData.mark_accepted ? '0 4px 12px rgba(5, 150, 105, 0.3)' : '0 4px 12px rgba(217, 119, 6, 0.3)'
                                    }}
                                >
                                    {isSubmitting ? 'Processing...' : stageFormData.mark_accepted ? 'Confirm Agreement & Unlock Step 7' : 'Publish & Send Pricing Proposal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STAGE MODAL 4: Install & Pair GPS Tracker (Stage 8) */}
            {modal.type === 'stageGPSInstallation' && (
                <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1050 }}>
                    <div className="modal-backdrop" onClick={() => setModal({ type: null })}></div>
                    <div className="modal-content" style={{ maxWidth: '520px', width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e0e7ff' }}>
                        <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>📍 Pair Anti-Theft GPS Tracker</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                                    Pair hardware AIS-140 device for <strong>{modal.data?.name}</strong>.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModal({ type: null })}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    color: '#ffffff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleAdvanceStage(stageFormData.requestId, 8, {
                                gps_tracking: {
                                    device_imei: stageFormData.device_imei,
                                    device_model: 'RentHub SafeTrack 4G GPS',
                                    paired_at: new Date().toISOString()
                                },
                                notes: `GPS tracker (IMEI: ${stageFormData.device_imei}) fitted and paired with live telemetry`
                            });
                        }}>
                            <div className="modal-body" style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '18px' }}>
                                    Fit and pair the anti-theft GPS hardware device to the vehicle before pushing to the live customer fleet.
                                </p>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                        GPS Device IMEI Number (15 Digits) <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={stageFormData.device_imei || ''}
                                        onChange={(e) => setStageFormData({ ...stageFormData, device_imei: e.target.value })}
                                        placeholder="e.g. 864209048123456"
                                        required
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'monospace', fontWeight: 700 }}
                                    />
                                </div>
                            </div>
                            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setModal({ type: null })}
                                    style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                                        color: '#fff',
                                        fontWeight: 700,
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                    }}
                                >
                                    {isSubmitting ? 'Pairing...' : 'Pair GPS & Complete Stage 8 📍'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STAGE MODAL 5: View Request Full 9-Stage Timeline */}
            {modal.type === 'viewRequestTimeline' && modal.data && (
                <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1050 }}>
                    <div className="modal-backdrop" onClick={() => setModal({ type: null })}></div>
                    <div className="modal-content" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e0e7ff' }}>
                        <div style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>📜 Onboarding Timeline Audit</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                                    {modal.data.name} ({modal.data.tracking_id || `RH-REQ-${modal.data.id}`})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModal({ type: null })}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    color: '#ffffff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { number: 1, title: '1. Bike & Documents Submitted', icon: '📝' },
                                    { number: 2, title: '2. Document & Vehicle Review', icon: '🔍' },
                                    { number: 3, title: '3. Physical Survey Visit', icon: '🏠' },
                                    { number: 4, title: '4. Survey Inspection Report', icon: '📋' },
                                    { number: 5, title: '5. Price & Revenue Share Decision', icon: '💰' },
                                    { number: 6, title: '6. Sponsor Agreement', icon: '🤝' },
                                    { number: 7, title: '7. Contract Activated', icon: '✅' },
                                    { number: 8, title: '8. GPS Tracker Installation', icon: '📍' },
                                    { number: 9, title: '9. Bike Goes LIVE in Fleet', icon: '🟢' }
                                ].map((s) => {
                                    const currentStage = modal.data.current_stage || (modal.data.status === 'approved' ? 9 : 1);
                                    const isDone = currentStage >= s.number;
                                    const isCurrent = currentStage === s.number;

                                    return (
                                        <div key={s.number} style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '14px',
                                            padding: '14px 16px',
                                            borderRadius: '14px',
                                            background: isCurrent ? '#eef2ff' : isDone ? '#f8fafc' : '#ffffff',
                                            border: isCurrent ? '1.5px solid #6366f1' : isDone ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                                            opacity: isDone ? 1 : 0.65
                                        }}>
                                            <div style={{
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                background: isDone ? '#10b981' : '#e2e8f0',
                                                color: isDone ? '#fff' : '#64748b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '0.82rem',
                                                flexShrink: 0
                                            }}>
                                                {isDone ? '✓' : s.number}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <strong style={{ fontSize: '0.92rem', color: isDone ? '#0f172a' : '#64748b' }}>
                                                        {s.icon} {s.title}
                                                    </strong>
                                                    {isCurrent && (
                                                        <span style={{ background: '#4f46e5', color: '#fff', fontSize: '0.68rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px' }}>
                                                            CURRENT ACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                {s.number === 4 && modal.data.survey_report && (
                                                    <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '6px', background: '#dcfce7', padding: '6px 10px', borderRadius: '8px' }}>
                                                        Tyres: {modal.data.survey_report.tyres} • Brakes: {modal.data.survey_report.brakes} • Engine: {modal.data.survey_report.engine}
                                                    </div>
                                                )}
                                                {s.number === 5 && modal.data.pricing_terms && (
                                                    <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: '6px', background: '#fef3c7', padding: '6px 10px', borderRadius: '8px' }}>
                                                        Rate: ₹{modal.data.pricing_terms.proposed_price}/hr • Sponsor Share: {modal.data.pricing_terms.sponsor_percentage}%
                                                    </div>
                                                )}
                                                {s.number === 8 && modal.data.gps_tracking && (
                                                    <div style={{ fontSize: '0.78rem', color: '#3730a3', marginTop: '6px', background: '#e0e7ff', padding: '6px 10px', borderRadius: '8px' }}>
                                                        GPS IMEI: {modal.data.gps_tracking.device_imei}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setModal({ type: null })}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Close Log
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modals */}
            {/* Active User Block/Unblock Confirmation */}
            {/* Confirm Block User */}
            <StatusPopup
                isOpen={modal.type === 'confirmBlockUser'}
                onClose={() => setModal({ type: null })}
                onConfirm={executeBlockUser}
                type="confirm"
                title={modal.data?.isBlocked ? 'Unblock User' : 'Block User'}
                message={`Are you sure you want to ${modal.data?.isBlocked ? 'unblock' : 'block'} this user? This will ${modal.data?.isBlocked ? 'restore their access' : 'prevent them from logging in'}.`}
                confirmText={modal.data?.isBlocked ? 'Yes, Unblock' : 'Yes, Block'}
                cancelText="Cancel"
            />

            {/* Refund Complete Confirmation */}
            <StatusPopup
                isOpen={modal.type === 'confirmRefundComplete'}
                onClose={() => setModal({ type: null })}
                onConfirm={executeRefundComplete}
                type="confirm"
                title="Confirm Refund"
                message="Are you sure you want to mark this refund as COMPLETED? This action confirms you have sent the money to the user."
                confirmText="Yes, Completed"
                cancelText="Cancel"
            />

            {/* SOS Confirmation */}
            <StatusPopup
                isOpen={modal.type === 'confirmSOS'}
                onClose={() => setModal({ type: null })}
                onConfirm={executeSendSOS}
                type="confirm"
                title="Trigger SOS Alert"
                message="Are you sure you want to trigger an SOS for this booking? This will send emergency alerts to relevant authorities."
                confirmText="Yes, Send SOS"
                cancelText="Cancel"
            />

            {/* Delete Vehicle Confirmation */}
            <StatusPopup
                isOpen={modal.type === 'confirmDeleteVehicle'}
                onClose={() => setModal({ type: null })}
                onConfirm={executeDeleteVehicle}
                type="confirm"
                title="Delete Vehicle"
                message="Are you sure you want to delete this vehicle? This action cannot be undone."
                confirmText="Yes, Delete"
                cancelText="Cancel"
            />

            {/* Reject Vehicle Request Modal (Mandatory Reason + Automated Email) */}
            {modal.type === 'rejectRequest' && modal.data && (
                <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1050 }}>
                    <div className="modal-backdrop" onClick={() => setModal({ type: null })}></div>
                    <div className="modal-content" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1px solid #fee2e2' }}>

                        {/* Modal Header */}
                        <div style={{ background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', shrink: 0 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>🛑 Reject Vehicle Application</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                                    A formal rejection notice and reason will be dispatched to the sponsor's email.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModal({ type: null })}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    color: '#ffffff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '12px',
                                    shrink: 0
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{modal.data.name}</strong>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                                        {modal.data.tracking_id || `RH-REQ-${modal.data.id}`}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    <span>Reg: <strong>{modal.data.registration_number || 'N/A'}</strong></span> • <span>Stage {modal.data.current_stage || 1} Review</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Quick Presets (Click to Auto-fill):
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {[
                                        'RC Book / Insurance document copy is blurred or illegible. Please upload clear scanned copies.',
                                        'Failed physical mechanical survey: Tyre tread depth below safety threshold.',
                                        'Engine diagnostic test failed roadworthiness inspection.',
                                        'Vehicle registration documents expired or discrepancy with RTO records.',
                                        'Sponsor declined proposed rental price and revenue sharing terms.',
                                        'Vehicle model older than RentHub fleet maximum age limit.'
                                    ].map((preset, idx) => {
                                        const isSelected = stageFormData.rejectionReason === preset;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setStageFormData({ ...stageFormData, rejectionReason: preset })}
                                                style={{
                                                    background: isSelected ? '#fee2e2' : '#f8fafc',
                                                    border: isSelected ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                                    color: isSelected ? '#991b1b' : '#475569',
                                                    padding: '6px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.74rem',
                                                    fontWeight: isSelected ? 700 : 500,
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                • {preset.slice(0, 46)}...
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Mandatory Rejection Remarks / Reason for Sponsor <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <textarea
                                    rows="4"
                                    required
                                    value={stageFormData.rejectionReason || ''}
                                    onChange={(e) => setStageFormData({ ...stageFormData, rejectionReason: e.target.value })}
                                    placeholder="Explain specifically why the application was rejected so the sponsor can rectify the issue..."
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '0.85rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        lineHeight: 1.5
                                    }}
                                />
                            </div>

                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 14px', fontSize: '0.78rem', color: '#991b1b', lineHeight: 1.4 }}>
                                ⚠️ <strong>Note:</strong> Once rejected, the vehicle status will update to <em>Rejected</em> and an automated email with your remarks will be dispatched immediately to the sponsor.
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', shrink: 0 }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setModal({ type: null })}
                                style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn"
                                disabled={isSubmitting || !stageFormData.rejectionReason?.trim()}
                                onClick={() => executeRejectRequest(modal.data.id, stageFormData.rejectionReason)}
                                style={{
                                    background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    border: 'none',
                                    padding: '10px 22px',
                                    borderRadius: '10px',
                                    cursor: isSubmitting || !stageFormData.rejectionReason?.trim() ? 'not-allowed' : 'pointer',
                                    opacity: isSubmitting || !stageFormData.rejectionReason?.trim() ? 0.5 : 1,
                                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                                }}
                            >
                                {isSubmitting ? 'Sending Notice...' : '🛑 Confirm & Dispatch Rejection Notice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Request Confirmation */}
            <StatusPopup
                isOpen={modal.type === 'confirmDeleteRequest'}
                onClose={() => setModal({ type: null })}
                onConfirm={() => executeDeleteRequest(modal.data.id)}
                type="confirm"
                title="Delete Request"
                message="Are you sure you want to delete this request permanently?"
                confirmText="Yes, Delete"
                cancelText="Cancel"
            />

            <StatusPopup
                isOpen={popup.isOpen}
                onClose={() => setPopup({ ...popup, isOpen: false })}
                type={popup.type}
                title={popup.title}
                message={popup.message}
            />
        </div>
    );
};

export default AdminPanel;
