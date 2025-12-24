import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPopup from '../components/StatusPopup';
import ConfirmationPopup from '../components/ConfirmationPopup';


const AdminPanel = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [adminUser, setAdminUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [activeTab, setActiveTab] = useState('dashboard');

    // Stats
    const [stats, setStats] = useState({
        totalVehicles: 0, pendingBookings: 0, todaysBookings: 0, activeUsers: 0,
        confirmedBookings: 0, totalBookingsMonth: 0, cancelledBookings: 0, pendingRefunds: 0,
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

    // Modals State
    const [modal, setModal] = useState({ type: null, data: null }); // type: 'viewBooking', 'editBooking', etc.

    // Form Data States for Modals
    const [editBookingData, setEditBookingData] = useState({});
    const [editUserData, setEditUserData] = useState({});
    const [vehicleFormData, setVehicleFormData] = useState({});
    const [rejectionReason, setRejectionReason] = useState('');
    const [popup, setPopup] = useState({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    });

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
        if (activeTab === 'policies') loadPolicies();
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

    const handleRejectBooking = async () => {
        if (!rejectionReason) return setPopup({ isOpen: true, type: 'error', title: 'Reason Required', message: 'Please provide a reason' });
        try {
            await fetch(`/api/admin/bookings/${modal.data.id}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectionReason })
            });
            setModal({ type: null });
            loadBookings();
            setPopup({ isOpen: true, type: 'success', title: 'Rejected', message: 'Booking rejected successfully' });
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error rejecting' }); }
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
            if (res.ok) {
                setModal({ type: null });
                loadVehicles();
                setPopup({ isOpen: true, type: 'success', title: isEdit ? 'Updated' : 'Added', message: `Vehicle ${isEdit ? 'updated' : 'added'} successfully` });
            } else {
                setPopup({ isOpen: true, type: 'error', title: 'Action Failed', message: 'Operation failed' });
            }
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error saving vehicle' }); }
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
                        <span style={{ display: 'block', fontSize: '1rem', fontWeight: 'normal', marginTop: '6px' }}>{adminUser.adminName}</span>
                    </div>
                    <nav className="sidebar-nav">
                        <ul>
                            <li><a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}><i className="fas fa-tachometer-alt"></i> Dashboard</a></li>
                            <li><a className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}><i className="fas fa-users"></i> User Management</a></li>
                            <li><a className={`nav-link ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => { setActiveTab('bookings'); setIsSidebarOpen(false); }}><i className="fas fa-calendar-check"></i> Bookings</a></li>
                            <li><a className={`nav-link ${activeTab === 'vehicles' ? 'active' : ''}`} onClick={() => { setActiveTab('vehicles'); setIsSidebarOpen(false); }}><i className="fas fa-motorcycle"></i> Vehicles</a></li>
                            <li><a className={`nav-link ${activeTab === 'policies' ? 'active' : ''}`} onClick={() => { setActiveTab('policies'); setIsSidebarOpen(false); }}><i className="fas fa-file-alt"></i> Policies</a></li>
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
                                                        act.type === 'rejected' ? <i className="fas fa-ban"></i> :
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
                            <h2>Users</h2>
                            <div className="user-filters">
                                <div>
                                    <label>Search:</label>
                                    <input type="text" placeholder="Name, Email, or Phone" value={usersFilter} onChange={e => setUsersFilter(e.target.value)} />
                                </div>
                            </div>
                            <div className="table-container">
                                <table id="users-table">
                                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {filteredUsers.map(u => (
                                            <tr key={u.id}>
                                                <td>{u.id}</td>
                                                <td>{u.fullName || u.adminName || ''}</td>
                                                <td>{u.email}</td>
                                                <td>{u.phoneNumber}</td>
                                                <td>{u.isAdmin ? 'Admin' : 'User'}</td>
                                                <td>{u.isBlocked ? <span style={{ color: 'red' }}>Blocked</span> : <span style={{ color: 'green' }}>Active</span>}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button className="action-btn btn-view-user" onClick={() => setModal({ type: 'viewUser', data: u })}><i className="fas fa-eye"></i> View</button>
                                                        <button className="action-btn btn-edit-user" onClick={() => { setEditUserData(u); setModal({ type: 'editUser' }); }}><i className="fas fa-edit"></i> Edit</button>
                                                        <button className={`action-btn ${u.isBlocked ? 'btn-unblock-user' : 'btn-block-user'}`} onClick={() => handleBlockUser(u.id, u.isBlocked)}>
                                                            <i className="fas fa-ban"></i> {u.isBlocked ? 'Unblock' : 'Block'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                        <option value="cancelled">Cancelled</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div><label>Start Date:</label><input type="date" value={bookingsDateFilter} onChange={e => setBookingsDateFilter(e.target.value)} /></div>
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
                                                <td><span className={`status-badge status-${(b.status || 'pending').toLowerCase()}`}>{b.status}</span></td>
                                                <td>
                                                    {(b.status === 'cancelled' || b.status === 'rejected') ? (
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
                                                            {/* Show Refund Details if present */}
                                                            {b.refund_details && (
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
                                                                <button className="action-btn btn-reject" onClick={() => { setModal({ type: 'rejectBooking', data: b }); setRejectionReason(''); }}>Reject</button>
                                                            </>
                                                        )}
                                                        {(['confirmed', 'cancelled', 'rejected'].includes(b.status)) && (
                                                            <>
                                                                <button className="action-btn btn-edit" onClick={() => { setEditBookingData(b); setModal({ type: 'editBooking' }); }}><i className="fas fa-edit"></i> Edit</button>
                                                                <button className="action-btn btn-delete" onClick={() => { setModal({ type: 'deleteBooking', data: b }) }}><i className="fas fa-trash"></i> Delete</button>
                                                            </>
                                                        )}
                                                        {b.status === 'confirmed' && <button className="action-btn btn-sos" onClick={() => handleSendSOS(b.id)}><i className="fas fa-exclamation-triangle"></i> SOS</button>}
                                                        {(['cancelled', 'rejected'].includes(b.status) && b.refund_status === 'processing') &&
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
                            <h2>Vehicles</h2>
                            <button className="action-btn btn-confirm" style={{ marginBottom: '18px' }} onClick={() => { setVehicleFormData({ type: 'bike' }); setModal({ type: 'addVehicle' }); }}>+ Add Vehicle</button>
                            <div className="table-container">
                                <table id="vehicles-table">
                                    <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {vehicles.map(v => (
                                            <tr key={v.id}>
                                                <td>{v.id}</td>
                                                <td>{v.name}</td>
                                                <td>{v.type}</td>
                                                <td>{v.category}</td>
                                                <td>₹{v.price}</td>
                                                <td>{v.status}</td>
                                                <td>
                                                    <button className="action-btn btn-view-vehicle" onClick={() => setModal({ type: 'viewVehicle', data: v })}><i className="fas fa-eye"></i> View</button>
                                                    <button className="action-btn btn-edit-vehicle" onClick={() => { setVehicleFormData(v); setModal({ type: 'editVehicle' }); }}><i className="fas fa-edit"></i> Edit</button>
                                                    <button className="action-btn btn-delete-vehicle" onClick={() => handleDeleteVehicle(v.id, v.type)}><i className="fas fa-trash"></i> Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
                            <p><strong>Remaining Amount:</strong> ₹{modal.data.remaining_amount || (modal.data.total_amount - modal.data.advance_payment)}</p>

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

            {/* CONFIRM DELETE BOOKING */}
            <ConfirmationPopup
                isOpen={modal.type === 'deleteBooking'}
                onClose={() => setModal({ type: null })}
                onConfirm={() => handleDeleteBooking(modal.data?.id)}
                title="Confirm Delete"
                message="Are you sure you want to delete this booking?"
                confirmText="Yes, Delete"
                cancelText="Cancel"
                type="danger"
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

            {(modal.type === 'addVehicle' || modal.type === 'editVehicle') && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setModal({ type: null })}>&times;</span>
                        <h2>{modal.type === 'addVehicle' ? 'Add' : 'Edit'} Vehicle</h2>
                        <form onSubmit={handleVehicleSubmit}>
                            <div style={{ marginBottom: '10px' }}><label>Name</label><input type="text" value={vehicleFormData.name || ''} onChange={e => setVehicleFormData({ ...vehicleFormData, name: e.target.value })} required /></div>
                            <div style={{ marginBottom: '10px' }}><label>Type</label>
                                <select value={vehicleFormData.type || 'bike'} onChange={e => setVehicleFormData({ ...vehicleFormData, type: e.target.value })}>
                                    <option value="car">Car</option>
                                    <option value="bike">Bike</option>
                                    <option value="scooty">Scooty</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '10px' }}><label>Category</label><input type="text" value={vehicleFormData.category || ''} onChange={e => setVehicleFormData({ ...vehicleFormData, category: e.target.value })} required /></div>
                            <div style={{ marginBottom: '10px' }}><label>Price</label><input type="number" value={vehicleFormData.price || ''} onChange={e => setVehicleFormData({ ...vehicleFormData, price: e.target.value })} required /></div>
                            <div style={{ marginBottom: '10px' }}><label>Status</label>
                                <select value={vehicleFormData.status || 'available'} onChange={e => setVehicleFormData({ ...vehicleFormData, status: e.target.value })}>
                                    <option value="available">Available</option>
                                    <option value="unavailable">Unavailable</option>
                                </select>
                            </div>
                            <button className="action-btn btn-confirm">Save</button>
                        </form>
                    </div>
                </div>
            )}

            {modal.type === 'viewVehicle' && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setModal({ type: null })}>&times;</span>
                        <h2>Vehicle Details</h2>
                        <p><strong>Name:</strong> {modal.data.name}</p>
                        <p><strong>Type:</strong> {modal.data.type}</p>
                        <p><strong>Price:</strong> {modal.data.price}</p>
                        <p><strong>Status:</strong> {modal.data.status}</p>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modals */}
            {/* Active User Block/Unblock Confirmation */}
            <ConfirmationPopup
                isOpen={modal.type === 'confirmBlockUser'}
                onClose={() => setModal({ type: null })}
                onConfirm={executeBlockUser}
                title={modal.data?.isBlocked ? 'Unblock User' : 'Block User'}
                message={`Are you sure you want to ${modal.data?.isBlocked ? 'unblock' : 'block'} this user?`}
                confirmText={`Yes, ${modal.data?.isBlocked ? 'Unblock' : 'Block'}`}
                type={modal.data?.isBlocked ? 'warning' : 'danger'}
                icon={modal.data?.isBlocked ? 'fa-user-check' : 'fa-user-slash'}
            />

            {/* Refund Complete Confirmation */}
            <ConfirmationPopup
                isOpen={modal.type === 'confirmRefundComplete'}
                onClose={() => setModal({ type: null })}
                onConfirm={executeRefundComplete}
                title="Confirm Refund"
                message="Are you sure you want to mark this refund as COMPLETED? This action cannot be undone."
                confirmText="Yes, Complete Refund"
                type="warning"
                icon="fa-check-circle"
            />

            {/* SOS Confirmation */}
            <ConfirmationPopup
                isOpen={modal.type === 'confirmSOS'}
                onClose={() => setModal({ type: null })}
                onConfirm={executeSendSOS}
                title="Confirm SOS"
                message="Are you sure you want to trigger SOS for this booking? This will send emergency alerts."
                confirmText="Yes, Send SOS"
                type="danger"
                icon="fa-bell"
            />

            {/* Delete Vehicle Confirmation */}
            <ConfirmationPopup
                isOpen={modal.type === 'confirmDeleteVehicle'}
                onClose={() => setModal({ type: null })}
                onConfirm={executeDeleteVehicle}
                title="Confirm Delete"
                message="Are you sure you want to delete this vehicle?"
                confirmText="Yes, Delete"
                type="danger"
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
