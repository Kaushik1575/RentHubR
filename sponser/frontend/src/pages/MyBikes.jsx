import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    PlusCircle, Edit, Trash2, Clock, DollarSign, Calendar, Eye, X, Save,
    AlertTriangle, CheckCircle, ShieldCheck, MapPin, Wrench, FileCheck,
    ChevronRight, ArrowRight, Award, Compass, Sparkles, Navigation
} from 'lucide-react';
import DateAvailabilityChecker from '../components/DateAvailabilityChecker';

const STAGES = [
    { number: 1, key: 'SUBMITTED', title: '1. Bike & Docs Submitted', subtitle: 'Sponsor submits bike specifications, RC, Insurance, and PUC.', icon: '📝' },
    { number: 2, key: 'DOC_REVIEW', title: '2. Document & Bike Review', subtitle: 'RentHub verification desk verifies authenticity of all paperwork.', icon: '🔍' },
    { number: 3, key: 'PHYSICAL_SURVEY', title: '3. Physical Survey Visit', subtitle: 'RentHub field engineer inspects the bike at sponsor location.', icon: '🏠' },
    { number: 4, key: 'SURVEY_REPORT', title: '4. Survey Inspection Report', subtitle: 'Scorecard generated for tyres, brakes, engine, and electricals.', icon: '📋' },
    { number: 5, key: 'PRICE_DECISION', title: '5. Price & Revenue Split Decision', subtitle: 'Rental price per hour and 70% sponsor payout terms proposed.', icon: '💰' },
    { number: 6, key: 'SPONSOR_AGREEMENT', title: '6. Sponsor Agreement', subtitle: 'Sponsor reviews and digitally accepts partnership terms.', icon: '🤝' },
    { number: 7, key: 'CONTRACT_ACTIVATED', title: '7. Contract Activated', subtitle: 'Partnership contract officially validated and signed.', icon: '✅' },
    { number: 8, key: 'GPS_INSTALLATION', title: '8. GPS Tracker Installation', subtitle: 'Anti-theft GPS hardware installed and linked to live telemetry.', icon: '📍' },
    { number: 9, key: 'BIKE_LIVE', title: '9. Bike Goes LIVE', subtitle: 'Vehicle is active on RentHub customer app for bookings.', icon: '🟢' }
];

const MyBikes = () => {
    const [searchParams] = useSearchParams();
    const [bikes, setBikes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewModal, setViewModal] = useState(null);
    const [editModal, setEditModal] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [timelineModal, setTimelineModal] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [signingAgreement, setSigningAgreement] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);

    useEffect(() => {
        fetchBikes();
    }, []);

    // If query has ?track=RH-REQ-XXXX, auto open timeline modal
    useEffect(() => {
        const trackQuery = searchParams.get('track');
        if (trackQuery && bikes.length > 0) {
            const matched = bikes.find(b =>
                (b.tracking_id === trackQuery) ||
                (String(b.id) === trackQuery.replace('RH-REQ-', ''))
            );
            if (matched) {
                setTimelineModal(matched);
            }
        }
    }, [searchParams, bikes]);

    // Sync viewModal and timelineModal with updated bikes data
    useEffect(() => {
        if (viewModal) {
            const updatedBike = bikes.find(b => (b.id || b._id) === (viewModal.id || viewModal._id));
            if (updatedBike) setViewModal(updatedBike);
        }
        if (timelineModal) {
            const updatedBike = bikes.find(b => (b.id || b._id) === (timelineModal.id || timelineModal._id));
            if (updatedBike) setTimelineModal(updatedBike);
        }
    }, [bikes]);

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

    const handleAcceptAgreement = async (requestId) => {
        if (!termsAgreed) {
            toast.error('Please check the box to accept the agreement terms');
            return;
        }
        setSigningAgreement(true);
        try {
            await api.post(`/sponsor/vehicle-requests/${requestId}/accept-agreement`);
            toast.success('🎉 Agreement signed and Contract activated successfully!');
            await fetchBikes();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to sign agreement');
        } finally {
            setSigningAgreement(false);
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
        <div className="p-6 bg-slate-50 min-h-screen pb-20 font-sans">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">My Fleet & Onboarding</h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Manage your active fleet and track multi-stage vehicle approvals.</p>
                </div>
                <Link to="/add-bike" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-100 font-bold text-sm">
                    <PlusCircle className="w-5 h-5" />
                    Add New Bike
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bikes.map((bike) => {
                    const isApproved = bike.status === 'approved' || bike.approval_status === 'approved';
                    const isRejected = bike.status === 'rejected' || bike.approval_status === 'rejected';
                    const currentStage = bike.current_stage || (isApproved ? 9 : 1);
                    const progressPercent = Math.round((currentStage / 9) * 100);
                    const trackingId = bike.tracking_id || `RH-REQ-${bike.id || '1001'}`;

                    return (
                        <div key={bike._id || bike.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between">
                            <div>
                                <div className="relative h-48 bg-slate-100 overflow-hidden">
                                    <img
                                        src={bike.image || bike.image_url || "https://placehold.co/600x400?text=No+Image"}
                                        alt={bike.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-3">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-slate-900/80 backdrop-blur-md text-amber-300 shadow-sm border border-slate-700/50">
                                            {trackingId}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            isApproved ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' :
                                            isRejected ? 'bg-rose-500 text-white' :
                                            'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                        }`}>
                                            {isApproved ? '🟢 Active LIVE' : isRejected ? '🔴 Rejected' : `Stage ${currentStage}/9`}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-black text-slate-800 truncate" title={bike.name}>{bike.name}</h3>
                                        {isApproved && (
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
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3 font-mono font-semibold">{bike.bikeNumber || bike.registration_number}</p>

                                    {/* Onboarding Progress Track Bar */}
                                    <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                        <div className="flex justify-between items-center text-xs mb-1.5">
                                            <span className="font-bold text-indigo-700">
                                                {STAGES[currentStage - 1]?.title || `Stage ${currentStage}`}
                                            </span>
                                            <span className="font-extrabold text-slate-700">{progressPercent}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isApproved ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                                                }`}
                                                style={{ width: `${progressPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {isApproved ? (
                                        <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 mb-4 text-center">
                                            <div>
                                                <p className="text-xs text-slate-400 mb-0.5 flex justify-center"><Calendar className="w-3 h-3" /></p>
                                                <p className="text-sm font-bold text-slate-700">{bike.totalBookings || 0}</p>
                                            </div>
                                            <div className="border-l border-r border-slate-100">
                                                <p className="text-xs text-slate-400 mb-0.5 flex justify-center"><Clock className="w-3 h-3" /></p>
                                                <p className="text-sm font-bold text-slate-700">{formatRideTime(bike.totalRideHours || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 mb-0.5 flex justify-center"><DollarSign className="w-3 h-3" /></p>
                                                <p className="text-sm font-bold text-emerald-600">₹{bike.totalRevenue || 0}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-4">
                                            {(currentStage === 5 || currentStage === 6) && !bike.agreement_accepted_at ? (
                                                <button
                                                    onClick={() => setTimelineModal(bike)}
                                                    className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-100 hover:scale-[1.02] transition-transform animate-pulse"
                                                >
                                                    🤝 Review & Accept Agreement →
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setTimelineModal(bike)}
                                                    className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    📍 Track Live Timeline ({currentStage}/9) →
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-5 pb-5 pt-0 flex gap-2 border-t border-slate-100 pt-3">
                                <button
                                    onClick={() => setTimelineModal(bike)}
                                    title="Track Onboarding Timeline"
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                                >
                                    📍 Timeline
                                </button>
                                <button
                                    onClick={() => handleEdit(bike)}
                                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-medium transition-colors"
                                    title="Edit Price"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewModal(bike)}
                                    title="View Specs"
                                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteModal(bike)}
                                    title="Delete"
                                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                <Link to="/add-bike" className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all min-h-[350px] p-6 text-center group">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-indigo-600">
                        <PlusCircle className="w-8 h-8" />
                    </div>
                    <span className="font-black text-slate-700 group-hover:text-indigo-600 text-base">Add Another Vehicle</span>
                    <span className="text-xs text-slate-400 mt-1">Start a new 9-stage onboarding request</span>
                </Link>
            </div>

            {/* 11-Stage Interactive Timeline Tracking Modal */}
            {timelineModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setTimelineModal(null)}>
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-center z-20">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        {timelineModal.tracking_id || `RH-REQ-${timelineModal.id || '1001'}`}
                                    </span>
                                    <h2 className="text-xl font-black text-slate-800">Onboarding Timeline</h2>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {timelineModal.name} ({timelineModal.bikeNumber || timelineModal.registration_number})
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    to={`/track-application?id=${timelineModal.tracking_id || timelineModal.id}`}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all"
                                >
                                    <span>🚀 Full Radar View</span>
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                                <button onClick={() => setTimelineModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Interactive Digital Agreement Card (Stage 5/6 Action Required) */}
                            {(timelineModal.current_stage === 5 || timelineModal.current_stage === 6) && !timelineModal.agreement_accepted_at && (
                                <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-50 border-2 border-amber-400 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-200">
                                            <Award className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-200 text-amber-900 uppercase">
                                                Action Required
                                            </span>
                                            <h3 className="text-lg font-black text-slate-900 mt-0.5">Sponsor Partnership Agreement</h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-amber-200">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Proposed Hourly Rent</span>
                                            <div className="text-2xl font-black text-indigo-700">
                                                ₹{timelineModal.pricing_terms?.proposed_price || timelineModal.price || 65}<span className="text-sm font-medium text-slate-500">/hr</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Your Revenue Payout</span>
                                            <div className="text-2xl font-black text-emerald-600">
                                                {timelineModal.pricing_terms?.sponsor_percentage || 70}% <span className="text-xs font-medium text-slate-500">(30% platform)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-xs text-slate-600 space-y-1.5 mb-5 bg-white/70 rounded-xl p-3 border border-amber-100">
                                        <p>• RentHub guarantees verified customer identity KYC checks before every ride.</p>
                                        <p>• Weekly automatic bank/UPI payouts for all accumulated rental hours.</p>
                                        <p>• Comprehensive roadside assistance & anti-theft GPS hardware fitment included.</p>
                                    </div>

                                    <label className="flex items-start gap-3 mb-5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={termsAgreed}
                                            onChange={(e) => setTermsAgreed(e.target.checked)}
                                            className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-semibold text-slate-700">
                                            I accept the proposed rental pricing (₹{timelineModal.pricing_terms?.proposed_price || timelineModal.price || 65}/hr), 70% revenue split, and RentHub vehicle custody terms.
                                        </span>
                                    </label>

                                    <button
                                        onClick={() => handleAcceptAgreement(timelineModal.id)}
                                        disabled={signingAgreement || !termsAgreed}
                                        className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                                            signingAgreement || !termsAgreed
                                                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:scale-[1.02] shadow-orange-500/25'
                                        }`}
                                    >
                                        {signingAgreement ? 'Activating Contract...' : '🤝 Accept & Digitally Sign Agreement →'}
                                    </button>
                                </div>
                            )}

                            {/* Stepper Visual Timeline */}
                            <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                                {STAGES.map((s) => {
                                    const isDone = (timelineModal.current_stage || 1) >= s.number;
                                    const isCurrent = (timelineModal.current_stage || 1) === s.number;

                                    return (
                                        <div key={s.number} className="relative group">
                                            {/* Step Circle Indicator */}
                                            <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                                isDone
                                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                                                    : 'bg-slate-200 text-slate-500 border border-white'
                                            } ${isCurrent ? 'ring-4 ring-indigo-100 scale-110' : ''}`}>
                                                {isDone ? '✓' : s.number}
                                            </div>

                                            <div className={`p-4 rounded-2xl border transition-all ${
                                                isCurrent
                                                    ? 'bg-indigo-50/60 border-indigo-200 shadow-sm'
                                                    : isDone
                                                    ? 'bg-white border-slate-200/80'
                                                    : 'bg-slate-50/50 border-slate-100 opacity-60'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                                        <span>{s.icon}</span> {s.title}
                                                    </h4>
                                                    {isCurrent && (
                                                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">
                                                            Current Stage
                                                        </span>
                                                    )}
                                                    {isDone && !isCurrent && (
                                                        <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Completed
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.subtitle}</p>

                                                {/* Survey Report Details Box (Stage 4 & 5) */}
                                                {s.number === 4 && (timelineModal.survey_report || isDone) && (
                                                    <div className="mt-3 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-slate-700">
                                                        <span className="font-black text-emerald-800 block mb-1.5">📋 Inspection Scorecard:</span>
                                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                            <div>• Tyres: <strong className="text-slate-900">{timelineModal.survey_report?.tyres || 'Good (85%)'}</strong></div>
                                                            <div>• Brakes: <strong className="text-slate-900">{timelineModal.survey_report?.brakes || 'Tested & Working'}</strong></div>
                                                            <div>• Engine: <strong className="text-slate-900">{timelineModal.survey_report?.engine || 'Smooth Performance'}</strong></div>
                                                            <div>• Lights: <strong className="text-slate-900">{timelineModal.survey_report?.lights || 'Fully Functional'}</strong></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* GPS Tracker Details Box (Stage 8 & 9) */}
                                                {s.number === 8 && (timelineModal.gps_tracking || isDone) && (
                                                    <div className="mt-3 bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 text-xs text-slate-700">
                                                        <span className="font-black text-indigo-800 block mb-1">📍 Anti-Theft GPS Hardware Paired:</span>
                                                        <p className="text-[11px] text-slate-600">
                                                            Device IMEI: <strong className="font-mono text-indigo-900">{timelineModal.gps_tracking?.device_imei || '864209048123456'}</strong> (24x7 Live Telemetry)
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    </div>
                </div>
            )}

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
