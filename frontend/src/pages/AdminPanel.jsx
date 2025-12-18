import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPopup from '../components/StatusPopup';


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
    const handleBlockUser = async (userId, isBlocked) => {
        if (!confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`)) return;
        try {
            const res = await fetch(`/api/admin/users/${userId}/block`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ isBlocked: !isBlocked })
            });
            if (res.ok) loadUsers();
            else setPopup({ isOpen: true, type: 'error', title: 'Action Failed', message: 'Failed to update status' });
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error updating status' }); }
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

    const handleRefundComplete = async (id) => {
        if (!confirm('Mark refund as completed?')) return;
        try {
            await fetch(`/api/admin/bookings/${id}/refund-complete`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            loadBookings();
            setPopup({ isOpen: true, type: 'success', title: 'Refunded', message: 'Refund marked as complete' });
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error processing refund' }); }
    };

    const handleSendSOS = async (id) => {
        if (!confirm('Send SOS activation?')) return;
        try {
            const res = await fetch('/api/admin/send-sos', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: id })
            });
            const d = await res.json();
            if (res.ok) {
                setPopup({ isOpen: true, type: 'success', title: 'SOS Sent', message: d.message });
            } else {
                setPopup({ isOpen: true, type: 'error', title: 'SOS Failed', message: d.error });
            }
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error sending SOS' }); }
    };

    // Vehicle Actions
    const handleDeleteVehicle = async (id, type) => {
        if (!confirm('Delete this vehicle?')) return;
        try {
            await fetch(`/api/admin/vehicles/${type}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            loadVehicles();
            setPopup({ isOpen: true, type: 'success', title: 'Deleted', message: 'Vehicle deleted successfully' });
        } catch (e) { setPopup({ isOpen: true, type: 'error', title: 'Error', message: 'Error deleting vehicle' }); }
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
                                                    <button className="action-btn btn-view-user" onClick={() => setModal({ type: 'viewUser', data: u })}><i className="fas fa-eye"></i> View</button>
                                                    <button className="action-btn btn-edit-user" onClick={() => { setEditUserData(u); setModal({ type: 'editUser' }); }}><i className="fas fa-edit"></i> Edit</button>
                                                    <button className={`action-btn ${u.isBlocked ? 'btn-unblock-user' : 'btn-block-user'}`} onClick={() => handleBlockUser(u.id, u.isBlocked)}>
                                                        <i className="fas fa-ban"></i> {u.isBlocked ? 'Unblock' : 'Block'}
                                                    </button>
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
                                                <td>{b.id}</td>
                                                <td>{b.customerName}</td>
                                                <td>{b.vehicleName}</td>
                                                <td>{b.start_date}</td>
                                                <td>{b.duration} hrs</td>
                                                <td>₹{b.total_amount}</td>
                                                <td><span className={`status-badge status-${(b.status || 'pending').toLowerCase()}`}>{b.status}</span></td>
                                                <td>
                                                    {(b.status === 'cancelled' || b.status === 'rejected') ? (
                                                        <div className="refund-info">
                                                            <p><strong>Ref:</strong> ₹{b.refund_amount}</p>
                                                            <p><strong>Status:</strong> {b.refund_status}</p>
                                                            {b.refund_details && (
                                                                b.refund_details.method === 'auto_reversal' ?
                                                                    <p className="text-muted" style={{ fontSize: '0.85em' }}><em>Auto-Reversed (Tx: {b.refund_details.original_tx || 'N/A'})</em></p> :
                                                                    (b.refund_details.method === 'upi' ? <p>UPI: {b.refund_details.upiId}</p> : <p>Bank: {b.refund_details.accountNumber}</p>)
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
                        <div id="policies" className="content-section active">
                            <h2>Policies</h2>
                            <div className="table-container">
                                <table id="policies-table">
                                    <thead><tr><th>#</th><th>Title</th><th>Description</th></tr></thead>
                                    <tbody>
                                        <tr><td>1</td><td>Cancellation</td><td>Free cancellation up to 24 hours before trip start.</td></tr>
                                        <tr><td>2</td><td>Late Return</td><td>Penalty charges apply for late returns beyond grace period.</td></tr>
                                        <tr><td>3</td><td>Fuel Policy</td><td>Vehicle provided with full tank must be returned with full tank.</td></tr>
                                    </tbody>
                                </table>
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
                            <p><strong>Booking ID:</strong> {modal.data.id}</p>
                            <p><strong>Customer:</strong> {modal.data.customerName} ({modal.data.customerPhone})</p>
                            <p><strong>Vehicle:</strong> {modal.data.vehicleName}</p>
                            <p><strong>Range:</strong> {modal.data.start_date} {modal.data.start_time} (Duration: {modal.data.duration})</p>
                            <p><strong>Total:</strong> ₹{modal.data.total_amount}</p>
                            <p><strong>Advance:</strong> ₹{modal.data.advance_payment}</p>
                            <p><strong>Status:</strong> {modal.data.status}</p>
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

            {modal.type === 'deleteBooking' && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Confirm Delete</h2>
                        <p>Are you sure you want to delete this booking?</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="action-btn btn-delete" onClick={() => handleDeleteBooking(modal.data.id)}>Yes, Delete</button>
                            <button className="action-btn" style={{ background: '#ccc' }} onClick={() => setModal({ type: null })}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

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
