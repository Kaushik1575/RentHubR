import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Truck, Check, User, Search } from 'lucide-react';

const FleetManager = () => {
    const [vehicles, setVehicles] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [selectedVehicles, setSelectedVehicles] = useState(new Set());
    const [targetSponsor, setTargetSponsor] = useState('');
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await api.get('/admin/fleet'); // No auth middleware strictly needed for setup
            setVehicles(res.data.vehicles || []);
            setSponsors(res.data.sponsors || []);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load fleet data');
        }
    };

    const toggleSelection = (v) => {
        const newSet = new Set(selectedVehicles);
        const key = `${v.id}-${v.type}`;
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        setSelectedVehicles(newSet);
    };

    const handleAssign = async () => {
        if (!targetSponsor) return toast.error('Please select a sponsor first');
        if (selectedVehicles.size === 0) return toast.error('Please select at least one vehicle');

        setAssigning(true);
        try {
            const assignments = Array.from(selectedVehicles).map(key => {
                const [id, type] = key.split('-');
                return { id, type };
            });

            await api.post('/admin/assign-fleet', {
                sponsorId: targetSponsor,
                assignments
            });

            toast.success('Vehicles assigned successfully!');
            setSelectedVehicles(new Set());
            loadData(); // Refresh to see updated owners
        } catch (error) {
            toast.error('Assignment failed');
        } finally {
            setAssigning(false);
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.registration_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Fleet Manager...</div>;

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm pb-4 border-b border-gray-200 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Fleet Manager Setup</h1>
                            <p className="text-gray-500">Visually assign your 37 vehicles to sponsors</p>
                        </div>

                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-lg border border-indigo-100">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-600" />
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Assign To</label>
                                    <select
                                        value={targetSponsor}
                                        onChange={(e) => setTargetSponsor(e.target.value)}
                                        className="bg-transparent font-bold text-indigo-600 outline-none cursor-pointer min-w-[200px]"
                                    >
                                        <option value="">Select Target Sponsor...</option>
                                        {sponsors.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={handleAssign}
                                disabled={assigning || !targetSponsor || selectedVehicles.size === 0}
                                className={`px-6 py-3 rounded-lg font-bold text-white transition-all transform
                                    ${assigning || !targetSponsor || selectedVehicles.size === 0
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 scale-100 hover:scale-105 active:scale-95'
                                    }
                                `}
                            >
                                {assigning ? 'Assigning...' : `Assign ${selectedVehicles.size} Vehicles`}
                            </button>
                        </div>
                    </div>

                    {/* Search & Stats */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or reg #..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 bg-white shadow-sm"
                            />
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                            <span className="text-indigo-600 font-bold">{selectedVehicles.size}</span> Selected • Showing {filteredVehicles.length} vehicles
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {filteredVehicles.map(v => {
                        const key = `${v.id}-${v.type}`;
                        const isSelected = selectedVehicles.has(key);

                        return (
                            <div
                                key={key}
                                onClick={() => toggleSelection(v)}
                                className={`
                                    relative bg-white rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 select-none
                                    ${isSelected ? 'border-indigo-500 shadow-xl shadow-indigo-100 scale-[1.02] ring-2 ring-indigo-200' : 'border-transparent shadow-sm hover:shadow-md hover:border-gray-200'}
                                `}
                            >
                                {/* Selection Indicator */}
                                <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 shadow-sm
                                    ${isSelected ? 'bg-indigo-600 border-indigo-600 scale-110' : 'bg-white/90 border-gray-300 hover:border-indigo-400'}
                                `}>
                                    {isSelected && <Check className="w-5 h-5 text-white" />}
                                </div>

                                {/* Image */}
                                <div className="h-44 bg-gray-100 relative group">
                                    {v.image_url ? (
                                        <img src={v.image_url} alt={v.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-300">
                                            <Truck className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <p className="text-white font-bold truncate text-lg shadow-black/50 drop-shadow-md">{v.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/30 uppercase tracking-wider">
                                                {v.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Reg. No</p>
                                            <p className="font-semibold text-gray-700 truncate" title={v.registration_number}>{v.registration_number || '---'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Rate</p>
                                            <p className="font-bold text-gray-900">₹{v.price}<span className="text-xs font-normal text-gray-400">/hr</span></p>
                                        </div>
                                    </div>

                                    <div className={`pt-3 mt-1 border-t border-gray-100 flex items-center gap-2 ${v.sponsor_name === 'Unassigned' ? 'bg-amber-50 -mx-4 px-4 py-2 -mb-4 border-t-amber-100' : 'bg-green-50 -mx-4 px-4 py-2 -mb-4 border-t-green-100'}`}>
                                        <div className={`w-2 h-2 rounded-full ${v.sponsor_name === 'Unassigned' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wide">Owner</p>
                                            <p className={`text-sm font-bold truncate ${v.sponsor_name === 'Unassigned' ? 'text-amber-600' : 'text-green-700'}`}>
                                                {v.sponsor_name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FleetManager;
