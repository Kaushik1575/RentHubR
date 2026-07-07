import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PlusCircle, Edit, Trash2, Clock, DollarSign, Calendar, Eye, X, Save, AlertTriangle } from 'lucide-react';
import DateAvailabilityChecker from '../components/DateAvailabilityChecker';

const MyBikes = () => {
    const [bikes, setBikes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewModal, setViewModal] = useState(null);
    const [editModal, setEditModal] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchBikes();
    }, []);

    // Sync viewModal with updated bikes data to ensure button state reflects changes
    useEffect(() => {
        if (viewModal) {
            const updatedBike = bikes.find(b => (b.id || b._id) === (viewModal.id || viewModal._id));
            if (updatedBike) {
                setViewModal(updatedBike);
            }
        }
    }, [bikes, viewModal]);

    const formatRideTime = (hours) => {
        if (!hours || hours === 0) return '0h 0min';
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}min`;
    };

    const fetchBikes = async () => {
        try {
            const response = await api.get('/sponsor/my-bikes');
            setBikes(response.data.bikes || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load vehicles");
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async (id, currentStatus, type) => {
        try {
            const statusToSet = !currentStatus;
            setBikes(bikes.map(bike =>
                (bike._id === id || bike.id === id) ? { ...bike, isAvailable: statusToSet, is_available: statusToSet } : bike
            ));

            await api.patch(`/sponsor/bikes/${id}/availability`, {
                isAvailable: statusToSet,
                type: type
            });

            toast.success('Availability updated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update availability');
            setBikes(bikes.map(bike =>
                (bike._id === id || bike.id === id) ? { ...bike, isAvailable: currentStatus, is_available: currentStatus } : bike
            ));
        }
    };

    const handleEdit = (bike) => {
        setEditForm({
            id: bike.id || bike._id,
            name: bike.name,
            price: bike.price,
            type: bike.type || 'bike'
        });
        setEditModal(bike);
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await api.patch(`/sponsor/bikes/${editForm.id}`, {
                name: editForm.name,
                price: editForm.price,
                type: editForm.type
            });

            toast.success('Vehicle updated successfully');
            setEditModal(null);
            fetchBikes();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update vehicle');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/sponsor/bikes/${deleteModal.id || deleteModal._id}`, {
                data: { type: deleteModal.type || 'bike' }
            });

            toast.success('Vehicle deleted successfully');
            setDeleteModal(null);
            fetchBikes();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete vehicle');
        }
    };

    if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-20">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Fleet</h1>
                    <p className="text-gray-500 mt-1">Manage all your listed bikes here.</p>
                </div>
                <Link to="/add-bike" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                    <PlusCircle className="w-5 h-5" />
                    Add New Bike
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bikes.map((bike) => (
                    <div key={bike._id || bike.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                        <div className="relative h-48 bg-gray-100 overflow-hidden">
                            <img
                                src={bike.image || bike.image_url || "https://placehold.co/600x400?text=No+Image"}
                                alt={bike.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 right-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${(bike.status === 'approved' || bike.approval_status === 'approved') ? 'bg-green-100 text-green-700' :
                                    (bike.status === 'rejected' || bike.approval_status === 'rejected') ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {bike.status || bike.approval_status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-gray-800 truncate" title={bike.name}>{bike.name}</h3>
                                {(bike.status === 'approved' || bike.approval_status === 'approved') && (
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={bike.isAvailable || bike.is_available}
                                            onChange={() => {
                                                toast.error("Please check date availability in details before toggling", {
                                                    icon: '📅',
                                                    duration: 4000
                                                });
                                                setViewModal(bike);
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mb-4 font-mono">{bike.bikeNumber || bike.registration_number}</p>

                            {(bike.status === 'approved' || bike.approval_status === 'approved') ? (
                                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 mb-4">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-400 mb-1 flex justify-center"><Calendar className="w-3 h-3" /></p>
                                        <p className="text-sm font-semibold text-gray-700">{bike.totalBookings || 0}</p>
                                    </div>
                                    <div className="text-center border-l border-r border-gray-100">
                                        <p className="text-xs text-gray-400 mb-1 flex justify-center"><Clock className="w-3 h-3" /></p>
                                        <p className="text-sm font-semibold text-gray-700">{formatRideTime(bike.totalRideHours || 0)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-400 mb-1 flex justify-center"><DollarSign className="w-3 h-3" /></p>
                                        <p className="text-sm font-semibold text-green-600">₹{bike.totalRevenue || 0}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-3 border-t border-b border-gray-100 mb-4 bg-gray-50 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 italic">
                                        {bike.status === 'rejected' ? 'Action required' : 'Review in progress'}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(bike)}
                                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                                <button
                                    onClick={() => setViewModal(bike)}
                                    title="View Details"
                                    className="p-2 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteModal(bike)}
                                    title="Delete"
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <Link to="/add-bike" className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-brand-500 hover:border-brand-300 hover:bg-brand-50/10 transition-all min-h-[350px]">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <PlusCircle className="w-8 h-8" />
                    </div>
                    <span className="font-medium">Add Another Bike</span>
                </Link>
            </div>

            {/* View Details Modal */}
            {viewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewModal(null)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Vehicle Details</h2>
                            <button onClick={() => setViewModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <img src={viewModal.image || viewModal.image_url} alt={viewModal.name} className="w-full h-64 object-cover rounded-xl mb-6" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Name</p>
                                    <p className="text-lg font-bold text-gray-800">{viewModal.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Price</p>
                                    <p className="text-lg font-bold text-green-600">₹{viewModal.price}/hr</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Type</p>
                                    <p className="text-gray-700 capitalize">{viewModal.type || 'bike'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Status</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${viewModal.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {viewModal.status || 'Pending'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Total Bookings</p>
                                    <p className="text-gray-700">{viewModal.totalBookings || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Total Revenue</p>
                                    <p className="text-gray-700">₹{viewModal.totalRevenue || 0}</p>
                                </div>
                            </div>

                            {/* Date Availability Checker - Only show for approved vehicles */}
                            {(viewModal.status === 'approved' || viewModal.approval_status === 'approved') && (
                                <div className="mt-6">
                                    <DateAvailabilityChecker
                                        vehicle={viewModal}
                                        onAvailabilityToggle={fetchBikes}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
                    <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-gray-200 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Vehicle</h2>
                            <button onClick={() => setEditModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Price per Hour (₹)</label>
                                <input
                                    type="number"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditModal(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteModal(null)}>
                    <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Delete Vehicle?</h2>
                            <p className="text-gray-600 text-center mb-6">
                                Are you sure you want to delete <strong>{deleteModal.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBikes;
