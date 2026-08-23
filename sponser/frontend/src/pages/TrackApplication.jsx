import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
    Search, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    FileText, 
    Shield, 
    Activity, 
    MapPin, 
    DollarSign, 
    FileSignature, 
    Radio, 
    Sparkles, 
    ChevronRight, 
    ExternalLink, 
    Copy, 
    Check, 
    Phone, 
    Wrench,
    Bike as BikeIcon,
    ArrowRight,
    Award,
    Printer,
    HelpCircle,
    CheckCheck,
    Navigation,
    Zap,
    TrendingUp,
    ShieldCheck,
    Calendar,
    ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STAGE_CONFIG = [
    {
        number: 1,
        title: 'Application & Docs Submitted',
        tagline: 'Initial Registration & Document Vault',
        desc: 'Vehicle specifications, identity verification, and legal documents (RC, Insurance, PUC) uploaded by sponsor.',
        icon: FileText,
        color: 'from-cyan-500 to-blue-600',
        cardBg: 'bg-white',
        borderColor: 'border-cyan-200',
        badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-300',
        accentColor: '#06b6d4',
        accentText: 'text-cyan-600',
        eta: 'Completed in < 1 hr'
    },
    {
        number: 2,
        title: 'Document & Vehicle Review',
        tagline: 'RTO & Compliance Verification',
        desc: 'RentHub legal desk verified original RC records, active insurance tenure, pollution fitness, and photo authenticity.',
        icon: ShieldCheck,
        color: 'from-indigo-500 to-purple-600',
        cardBg: 'bg-white',
        borderColor: 'border-indigo-200',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-300',
        accentColor: '#6366f1',
        accentText: 'text-indigo-600',
        eta: '12 - 24 hours'
    },
    {
        number: 3,
        title: 'Physical Survey Visit',
        tagline: 'Doorstep Field Inspection',
        desc: 'RentHub certified automotive engineer dispatched to inspect vehicle chassis, body condition, and roadworthiness.',
        icon: MapPin,
        color: 'from-sky-500 to-blue-600',
        cardBg: 'bg-white',
        borderColor: 'border-sky-200',
        badgeBg: 'bg-sky-50 text-sky-700 border-sky-300',
        accentColor: '#0284c7',
        accentText: 'text-sky-600',
        eta: 'Within 48 hours'
    },
    {
        number: 4,
        title: 'Survey Inspection Scorecard',
        tagline: 'Certified Mechanical Audit',
        desc: 'Complete 24-point diagnostic scorecard generated covering tyre tread depth, brake pads, engine compression, and lighting.',
        icon: Wrench,
        color: 'from-emerald-500 to-teal-600',
        cardBg: 'bg-white',
        borderColor: 'border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        accentColor: '#10b981',
        accentText: 'text-emerald-600',
        eta: 'Same-day audit'
    },
    {
        number: 5,
        title: 'Price & Revenue Share Terms',
        tagline: 'Hourly Rate & 70% Revenue Share Terms',
        desc: 'Competitive hourly rental price set with maximum 70% sponsor payout share and 30% platform management fee.',
        icon: DollarSign,
        color: 'from-amber-500 to-orange-600',
        cardBg: 'bg-white',
        borderColor: 'border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
        accentColor: '#f59e0b',
        accentText: 'text-amber-600',
        eta: 'Instant proposal'
    },
    {
        number: 6,
        title: 'Sponsor Agreement Signing',
        tagline: 'E-Sign Legal Contract',
        desc: 'Sponsor digitally reviews pricing terms, insurance liabilities, weekly payout cycle, and e-signs agreement.',
        icon: FileSignature,
        color: 'from-rose-500 to-pink-600',
        cardBg: 'bg-white',
        borderColor: 'border-rose-200',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-300',
        accentColor: '#f43f5e',
        accentText: 'text-rose-600',
        eta: 'Awaiting e-sign'
    },
    {
        number: 7,
        title: 'Contract Officially Activated',
        tagline: 'Legal Binding & Fleet Registration',
        desc: 'Agreement officially executed. Vehicle allocated an asset slot in the RentHub municipal fleet registry.',
        icon: Award,
        color: 'from-purple-600 to-indigo-700',
        cardBg: 'bg-white',
        borderColor: 'border-purple-200',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-300',
        accentColor: '#8b5cf6',
        accentText: 'text-purple-600',
        eta: 'Instant activation'
    },
    {
        number: 8,
        title: 'Anti-Theft GPS Installation',
        tagline: 'Hardware Fitment & Telemetry Pairing',
        desc: 'Military-grade 4G AIS-140 GPS tracker and remote engine immobilizer fitted with real-time live telemetry paired.',
        icon: Radio,
        color: 'from-blue-600 to-cyan-500',
        cardBg: 'bg-white',
        borderColor: 'border-blue-200',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-300',
        accentColor: '#2563eb',
        accentText: 'text-blue-600',
        eta: '2 - 4 hours'
    },
    {
        number: 9,
        title: 'Vehicle Goes LIVE in Fleet',
        tagline: 'Active Earning & Customer Availability',
        desc: 'Vehicle published to thousands of verified RentHub riders! Instant real-time booking availability and automated payouts active.',
        icon: Sparkles,
        color: 'from-emerald-500 via-teal-500 to-green-600',
        cardBg: 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/80',
        borderColor: 'border-emerald-300',
        badgeBg: 'bg-emerald-500 text-white font-black shadow-md shadow-emerald-200',
        accentColor: '#059669',
        accentText: 'text-emerald-600',
        eta: '🟢 Live Fleet Active'
    }
];

const TrackApplication = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('id') || searchParams.get('track') || '';

    const [searchId, setSearchId] = useState(initialQuery);
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userVehicles, setUserVehicles] = useState([]);
    const [copied, setCopied] = useState(false);
    const [agreementAgreed, setAgreementAgreed] = useState(false);
    const [acceptingAgreement, setAcceptingAgreement] = useState(false);
    const [respondingTerms, setRespondingTerms] = useState(false);
    const [showCounterForm, setShowCounterForm] = useState(false);
    const [counterPrice, setCounterPrice] = useState('');
    const [counterReason, setCounterReason] = useState('');
    const [stageFilter, setStageFilter] = useState('all'); // 'all', 'completed', 'active', 'upcoming'

    // Load sponsor's own vehicles for quick chips
    useEffect(() => {
        const fetchUserBikes = async () => {
            try {
                const res = await api.get('/sponsor/my-bikes');
                const bikes = res.data || [];
                setUserVehicles(bikes);

                if (initialQuery) {
                    performLookup(initialQuery);
                } else if (bikes.length > 0) {
                    const firstTid = bikes[0].tracking_id || bikes[0].id;
                    setSearchId(firstTid);
                    performLookup(firstTid);
                }
            } catch (err) {
                console.error('Failed to load vehicles for tracking:', err);
            }
        };

        fetchUserBikes();
    }, []);

    const performLookup = async (idToSearch) => {
        const query = (idToSearch || searchId || '').trim();
        if (!query) {
            toast.error('Please enter a Tracking ID or Request ID');
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/sponsor/track/${encodeURIComponent(query)}`);
            setTrackingData(res.data);
            setSearchParams({ id: query });
            if (res.data?.counter_offer_price) {
                setCounterPrice(String(res.data.counter_offer_price));
            }
        } catch (err) {
            console.error('Track lookup failed:', err);
            const msg = err.response?.data?.error || 'Vehicle application not found. Please check your Tracking ID.';
            toast.error(msg);
            setTrackingData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Tracking ID copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRespondTerms = async (agreed, customPrice = null, customReason = null) => {
        if (!trackingData?.id) return;
        setRespondingTerms(true);
        try {
            const priceToSend = customPrice || (counterPrice ? parseFloat(counterPrice) : null);
            const reasonToSend = customReason || counterReason || (agreed ? null : 'Sponsor requested pricing review');

            const res = await api.post(`/sponsor/vehicle-requests/${trackingData.id}/respond-terms`, {
                agreed,
                counter_price: agreed ? null : priceToSend,
                decline_reason: reasonToSend
            });

            if (agreed) {
                toast.success(res.data.message || 'Pricing terms accepted! Progression unlocked.');
                setShowCounterForm(false);
                setCounterPrice('');
                setCounterReason('');
                setTrackingData(prev => ({
                    ...prev,
                    terms_accepted: true,
                    terms_declined: false,
                    counter_offer_price: null,
                    sponsor_requested_price: null,
                    sponsor_price_remarks: null,
                    agreement_accepted_at: new Date().toISOString(),
                    current_stage: Math.max(prev?.current_stage || 5, 6)
                }));
            } else {
                toast.success(res.data.message || 'Counter-offer sent to admin for review!');
                setShowCounterForm(false);
                setTrackingData(prev => ({
                    ...prev,
                    terms_accepted: false,
                    terms_declined: true,
                    counter_offer_price: priceToSend,
                    sponsor_requested_price: priceToSend,
                    sponsor_price_remarks: reasonToSend
                }));
            }
            performLookup(trackingData.tracking_id || trackingData.id);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Failed to submit pricing decision');
        } finally {
            setRespondingTerms(false);
        }
    };

    const handleAcceptAgreement = async () => {
        if (!agreementAgreed) {
            toast.error('Please check the agreement box before accepting.');
            return;
        }
        if (!trackingData?.id) return;

        setAcceptingAgreement(true);
        try {
            const res = await api.post(`/sponsor/vehicle-requests/${trackingData.id}/accept-agreement`, {
                agreed: true
            });
            toast.success(res.data.message || 'Agreement successfully signed! Stage updated to Contract Activated.');
            performLookup(trackingData.tracking_id || trackingData.id);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Failed to accept agreement');
        } finally {
            setAcceptingAgreement(false);
        }
    };

    const currentStageNum = trackingData ? (trackingData.current_stage || (trackingData.status === 'approved' ? 9 : 1)) : 1;
    const progressPercent = Math.round((currentStageNum / 9) * 100);

    const filteredStages = STAGE_CONFIG.filter((s) => {
        if (stageFilter === 'completed') return currentStageNum > s.number;
        if (stageFilter === 'active') return currentStageNum === s.number;
        if (stageFilter === 'upcoming') return currentStageNum < s.number;
        return true;
    });

    const hourlyRate = trackingData?.pricing_terms?.proposed_price || trackingData?.price || 65;
    const sponsorHourlyShare = (hourlyRate * 0.70);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/40 text-slate-800 p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-28 font-sans">
            
            {/* Header / Hero Section in Light Theme */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-10 shadow-xl shadow-indigo-100/50 relative overflow-hidden">
                {/* Top Glowing Color Accent Stripe */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 via-purple-500 to-emerald-500"></div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                            </span>
                            9-Stage Asset Lifecycle Radar
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                            Track Your Vehicle <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Application</span>
                        </h1>

                        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                            Monitor real-time progress across all 9 onboarding milestones, inspect physical survey scorecards, review revenue terms, and track anti-theft GPS telemetry.
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={(e) => { e.preventDefault(); performLookup(searchId); }} className="pt-2 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                                <input
                                    type="text"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    placeholder="Enter Tracking ID (e.g. RH-REQ-7049, OD-02-AB-1234)..."
                                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold tracking-wide shadow-inner"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 text-yellow-300" />
                                        <span>Scan Telemetry</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Progress Gauge Snapshot Card */}
                    {trackingData && (
                        <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100 rounded-3xl p-6 shadow-md min-w-[280px] relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Live Status</span>
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-sm">
                                    STAGE {currentStageNum}/9
                                </span>
                            </div>

                            <div className="flex items-end gap-3 mb-3">
                                <span className="text-4xl font-black text-slate-900">
                                    {progressPercent}%
                                </span>
                                <span className="text-xs text-slate-500 font-bold pb-1.5">Completed</span>
                            </div>

                            {/* Multi-Color Progress Bar */}
                            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5 mb-3 shadow-inner">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 via-amber-400 to-emerald-500 transition-all duration-1000 shadow-sm"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>

                            <div className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                                <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{STAGE_CONFIG[currentStageNum - 1]?.title}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Select Chips for Sponsor's Registered Bikes */}
            {userVehicles.length > 0 && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <BikeIcon className="w-4 h-4 text-indigo-600" />
                            Your Registered Fleet Vehicles ({userVehicles.length})
                        </span>
                        <Link to="/my-bikes" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            Manage in My Bikes <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    
                    <div className="flex flex-wrap gap-2.5">
                        {userVehicles.map((v) => {
                            const tid = v.tracking_id || `RH-REQ-${v.id}`;
                            const isSelected = trackingData && (trackingData.tracking_id === tid || trackingData.id === v.id);

                            return (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => {
                                        setSearchId(tid);
                                        performLookup(tid);
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer border ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                                            : 'bg-slate-50 hover:bg-indigo-50/50 text-slate-700 border-slate-200'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></span>
                                    <span>{v.name}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>{tid}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Vehicle Main Details Section */}
            {trackingData ? (
                <div className="space-y-8 animate-fade-in">
                    
                    {/* Vehicle Profile Command Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xl shadow-slate-100/80 relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                            
                            <div className="flex items-start gap-5">
                                {trackingData.image_url ? (
                                    <div className="relative group">
                                        <img
                                            src={trackingData.image_url}
                                            alt={trackingData.name}
                                            className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-indigo-100 shadow-md group-hover:scale-105 transition-all duration-300"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-md">
                                        <BikeIcon className="w-12 h-12" />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-mono font-black border border-indigo-200">
                                            <span>{trackingData.tracking_id}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(trackingData.tracking_id)}
                                                className="text-indigo-400 hover:text-indigo-900 transition-colors cursor-pointer ml-1"
                                                title="Copy ID"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>

                                        <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                                            trackingData.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                            trackingData.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                            'bg-amber-100 text-amber-800 border border-amber-300'
                                        }`}>
                                            {trackingData.status === 'approved' ? '🟢 Live Fleet Active' :
                                             trackingData.status === 'rejected' ? '❌ Rejected' : '🟡 In Review Pipeline'}
                                        </span>

                                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                            {trackingData.vehicle_type || 'bike'}
                                        </span>
                                    </div>

                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                                        {trackingData.name}
                                    </h2>

                                    <p className="text-slate-500 text-sm flex flex-wrap items-center gap-2 font-medium">
                                        <span>{trackingData.model}</span>
                                        <span>•</span>
                                        <span>Year {trackingData.year}</span>
                                        <span>•</span>
                                        <span className="text-slate-800 font-mono font-bold bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                            {trackingData.registration_number || 'Registration Pending'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Quick Rate & Earnings Snippet */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center min-w-[130px]">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Rental Rate</span>
                                    <span className="text-lg font-black text-indigo-700">₹{hourlyRate}<small className="text-xs text-slate-500">/hr</small></span>
                                </div>
                                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-center min-w-[130px]">
                                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">Sponsor Share</span>
                                    <span className="text-lg font-black text-emerald-700">70% <small className="text-xs text-emerald-600">(₹{sponsorHourlyShare.toFixed(1)}/h)</small></span>
                                </div>
                            </div>
                        </div>

                        {/* Document Verification Row */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mr-2">Digital Vault:</span>
                                
                                {trackingData.rc_url ? (
                                    <a href={trackingData.rc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200 transition-colors shadow-sm">
                                        <FileText className="w-3.5 h-3.5 text-cyan-600" /> RC Book <ExternalLink className="w-3 h-3 text-cyan-400" />
                                    </a>
                                ) : <span className="text-xs text-slate-400 italic bg-slate-100 px-2.5 py-1 rounded-lg">Missing RC</span>}

                                {trackingData.insurance_url ? (
                                    <a href={trackingData.insurance_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors shadow-sm">
                                        <Shield className="w-3.5 h-3.5 text-emerald-600" /> Insurance <ExternalLink className="w-3 h-3 text-emerald-400" />
                                    </a>
                                ) : <span className="text-xs text-slate-400 italic bg-slate-100 px-2.5 py-1 rounded-lg">Missing Insurance</span>}

                                {trackingData.puc_url ? (
                                    <a href={trackingData.puc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-colors shadow-sm">
                                        <Activity className="w-3.5 h-3.5 text-purple-600" /> PUC <ExternalLink className="w-3 h-3 text-purple-400" />
                                    </a>
                                ) : <span className="text-xs text-slate-400 italic bg-slate-100 px-2.5 py-1 rounded-lg">Missing PUC</span>}
                            </div>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Slip
                            </button>
                        </div>
                    </div>

                    {/* Rejection Notice Banner (If Rejected by Admin) */}
                    {(trackingData.status === 'rejected' || trackingData.rejection_reason) && (
                        <div className="bg-gradient-to-br from-rose-50 via-white to-red-50 border-2 border-rose-400 rounded-3xl p-6 md:p-8 shadow-xl shadow-rose-100/50 relative overflow-hidden animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 border border-rose-300 flex items-center justify-center font-black text-2xl shrink-0 shadow-sm">
                                        🛑
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-md shadow-rose-200">
                                                Application Not Approved
                                            </span>
                                            <span className="text-xs text-rose-700 font-bold font-mono">
                                                Stage {trackingData.rejected_by_stage || trackingData.current_stage || 1} Audit Review
                                            </span>
                                            {trackingData.rejected_at && (
                                                <span className="text-xs text-slate-500">
                                                    • {new Date(trackingData.rejected_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-black text-slate-900">
                                            Reason for Rejection
                                        </h3>
                                        <div className="bg-white border border-rose-200 rounded-2xl p-4 md:p-5 mt-2 shadow-sm">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 block mb-1">
                                                Auditor Remarks / Feedback:
                                            </span>
                                            <p className="text-sm md:text-base text-rose-950 font-semibold leading-relaxed">
                                                "{trackingData.rejection_reason || 'Vehicle does not meet current RentHub compliance or physical safety requirements.'}"
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-500 pt-1">
                                            📩 An official notice with these remarks has been sent to your registered email. You may resolve the issue and submit a new vehicle application.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                                    <Link
                                        to="/add-bike"
                                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-extrabold text-xs shadow-lg shadow-rose-200 text-center transition-all"
                                    >
                                        Submit New Application →
                                    </Link>
                                    <a
                                        href="tel:9040757683"
                                        className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 text-center flex items-center justify-center gap-2 transition-all shadow-sm"
                                    >
                                        <Phone className="w-3.5 h-3.5 text-rose-600" />
                                        Call Support Desk
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timeline Controls & Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <Navigation className="w-6 h-6 text-indigo-600" />
                                Onboarding Highway Timeline
                            </h3>
                            <p className="text-xs md:text-sm text-slate-500">Step-by-step milestone progression from initial review to live customer fleet launch.</p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="inline-flex rounded-2xl bg-white p-1 border border-slate-200 text-xs font-bold shadow-sm">
                            {[
                                { id: 'all', label: 'All 9 Stages' },
                                { id: 'completed', label: 'Completed' },
                                { id: 'active', label: 'Current Step' },
                                { id: 'upcoming', label: 'Upcoming' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setStageFilter(tab.id)}
                                    className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                                        stageFilter === tab.id
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* ALTERNATING CENTER-LINE TIMELINE LAYOUT (LEFT SIDE / RIGHT SIDE) */}
                    {/* ========================================================================= */}
                    <div className="relative py-8 md:py-12">
                        
                        {/* Central Spine Line on Desktop */}
                        <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-1.5 -translate-x-1/2 bg-gradient-to-b from-cyan-400 via-indigo-500 via-purple-500 via-amber-400 to-emerald-500 rounded-full shadow-inner"></div>
                        
                        {/* Vertical Line on Mobile */}
                        <div className="md:hidden absolute left-6 top-4 bottom-4 w-1 bg-gradient-to-b from-cyan-400 via-indigo-500 to-emerald-500 rounded-full"></div>

                        <div className="space-y-8 md:space-y-12">
                            {filteredStages.map((s, index) => {
                                const isPassed = currentStageNum > s.number;
                                const isCurrent = currentStageNum === s.number;
                                const isPending = currentStageNum < s.number;
                                
                                // Alternating left vs right on desktop (Odd numbers on LEFT, Even numbers on RIGHT)
                                const isLeft = s.number % 2 !== 0;

                                return (
                                    <div key={s.number} className="relative flex flex-col md:flex-row items-center w-full">
                                        
                                        {/* Center Node Circle (Positioned in the middle on desktop) */}
                                        <div className={`
                                            absolute z-20 w-12 h-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center font-black text-sm text-white transition-all
                                            left-6 -translate-x-1/2 md:left-1/2 md:-translate-x-1/2
                                            ${isPassed
                                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'
                                                : isCurrent
                                                ? `bg-gradient-to-br ${s.color} ring-4 ring-indigo-300 shadow-indigo-300 animate-pulse scale-110`
                                                : 'bg-slate-300 text-slate-600'
                                            }
                                        `}>
                                            {isPassed ? (
                                                <Check className="w-6 h-6 stroke-[3]" />
                                            ) : (
                                                <s.icon className="w-5 h-5" />
                                            )}
                                        </div>

                                        {/* Desktop Alternating Card Architecture */}
                                        <div className={`w-full flex ${isLeft ? 'md:justify-start' : 'md:justify-end'} pl-16 md:pl-0`}>
                                            <div className={`
                                                w-full md:w-[45%] rounded-3xl border-2 transition-all duration-300 overflow-hidden shadow-lg
                                                ${isCurrent
                                                    ? 'bg-white border-indigo-500 shadow-indigo-100/80 ring-2 ring-indigo-200 scale-[1.02]'
                                                    : isPassed
                                                    ? `${s.cardBg} ${s.borderColor} shadow-slate-100 hover:shadow-md`
                                                    : 'bg-slate-50/80 border-slate-200 opacity-60'
                                                }
                                            `}>
                                                
                                                {/* Header Gradient Top Stripe */}
                                                <div className={`h-2 w-full bg-gradient-to-r ${s.color} ${isPending ? 'opacity-30' : 'opacity-100'}`}></div>

                                                <div className="p-6 md:p-7 space-y-4">
                                                    
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-[11px] font-black font-mono px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                                    STAGE {s.number}
                                                                </span>
                                                                {isCurrent && (
                                                                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-black text-[10px] uppercase tracking-wider animate-bounce shadow-sm">
                                                                        Current Action
                                                                    </span>
                                                                )}
                                                                {isPassed && (
                                                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                                                                        ✓ Completed
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="text-lg font-black text-slate-900 pt-0.5">
                                                                {s.title}
                                                            </h4>
                                                            <p className={`text-xs font-bold ${s.accentText}`}>
                                                                {s.tagline}
                                                            </p>
                                                        </div>

                                                        <span className="text-[11px] font-bold text-slate-400 shrink-0">
                                                            {isPassed ? 'Done' : s.eta}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                                                        {s.desc}
                                                    </p>

                                                    {/* STAGE-SPECIFIC INTERACTIVE WIDGETS */}

                                                    {/* Stage 3: Confirmed Survey Date */}
                                                    {s.number === 3 && trackingData.survey_scheduled_date && (
                                                        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center justify-between gap-3 shadow-inner">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2.5 rounded-xl bg-sky-200 text-sky-800">
                                                                    <MapPin className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-bold text-sky-600 block">Inspection Date</span>
                                                                    <span className="text-sm font-black text-slate-900">
                                                                        {new Date(trackingData.survey_scheduled_date).toLocaleDateString('en-IN', { dateStyle: 'full' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className="px-2.5 py-1 bg-sky-200 text-sky-900 rounded-lg font-bold text-[10px]">Slot Confirmed</span>
                                                        </div>
                                                    )}

                                                    {/* Stage 4: Mechanical Diagnostic Scorecard */}
                                                    {s.number === 4 && trackingData.survey_report && (
                                                        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                                                            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                                                                <span className="text-emerald-800 font-extrabold text-xs uppercase flex items-center gap-1.5">
                                                                    <Award className="w-4 h-4 text-emerald-600" />
                                                                    Roadworthy Audit Scorecard
                                                                </span>
                                                                <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                                                                    trackingData.survey_report.overall_status === 'FAILED'
                                                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                                                        : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                                                }`}>
                                                                    {trackingData.survey_report.overall_status === 'FAILED' ? 'FAILED' : 'PASSED'} • {trackingData.survey_report.overall_rating || 'Grade A'}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                                                {[
                                                                    { label: 'Tyres', val: String(trackingData.survey_report.tyres || 'Good').replace(/[^\w\s\+\(\)\-]/g, '').trim() },
                                                                    { label: 'Brakes', val: String(trackingData.survey_report.brakes || 'Good').replace(/[^\w\s\+\(\)\-]/g, '').trim() },
                                                                    { label: 'Engine', val: String(trackingData.survey_report.engine || 'Good').replace(/[^\w\s\+\(\)\-]/g, '').trim() },
                                                                    { label: 'Lights', val: String(trackingData.survey_report.lights || 'Good').replace(/[^\w\s\+\(\)\-]/g, '').trim() },
                                                                    { label: 'Chassis', val: String(trackingData.survey_report.chassis || 'Good').replace(/[^\w\s\+\(\)\-]/g, '').trim() }
                                                                ].map((item, idx) => {
                                                                    const isEx = item.val.includes('Excellent');
                                                                    const isGood = item.val.includes('Good');
                                                                    const isFair = item.val.includes('Fair');
                                                                    const isRepair = item.val.includes('Repair');

                                                                    return (
                                                                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-emerald-100 flex flex-col justify-between">
                                                                            <span className="text-[10px] text-slate-400 block font-bold mb-1 uppercase tracking-wider">{item.label}</span>
                                                                            <span className={`font-extrabold text-[11px] px-2 py-0.5 rounded w-fit ${
                                                                                isEx ? 'bg-emerald-100 text-emerald-800' :
                                                                                isGood ? 'bg-green-100 text-green-800' :
                                                                                isFair ? 'bg-amber-100 text-amber-900' :
                                                                                isRepair ? 'bg-orange-100 text-orange-800' :
                                                                                'bg-rose-100 text-rose-800'
                                                                            }`}>
                                                                                {item.val || 'Good'}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Stage 5: Live Pricing Terms (Shown only after Admin proposes/sends the price) */}
                                                    {s.number === 5 && (
                                                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                                                            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                                                                <span className="text-amber-900 font-extrabold text-xs uppercase flex items-center gap-1.5">
                                                                    <TrendingUp className="w-4 h-4 text-amber-600" />
                                                                    70% Sponsor Revenue Share
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                                                                    currentStageNum >= 5 ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                                                                }`}>
                                                                    {currentStageNum >= 5 ? 'Official Proposal' : 'Pending Review'}
                                                                </span>
                                                            </div>

                                                            {currentStageNum < 5 ? (
                                                                /* Before Admin sends price */
                                                                <div className="p-3.5 bg-white/90 rounded-xl border border-amber-100 text-center space-y-1">
                                                                    <span className="text-xs font-bold text-slate-800 block">
                                                                        ⏳ Awaiting Pricing Proposal from Admin
                                                                    </span>
                                                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                                                        Admin will calculate and send the official customer rental rate and revenue split after completing the vehicle inspection.
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                /* After Admin sends price */
                                                                <>
                                                                    {/* Revision Notice Banner if admin revised price after sponsor counter */}
                                                                    {((trackingData.previous_proposed_price && trackingData.previous_proposed_price !== hourlyRate) || trackingData.previous_counter_price) && !trackingData.terms_accepted && (
                                                                        <div className="p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 space-y-1.5">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-[11px] font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1">
                                                                                    🔄 Revised Admin Proposal
                                                                                </span>
                                                                                <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 font-extrabold text-[10px]">
                                                                                    Price Updated
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                                                                {trackingData.previous_proposed_price && trackingData.previous_proposed_price !== hourlyRate && (
                                                                                    <span className="bg-white px-2 py-1 rounded-lg border border-indigo-100 text-slate-500 font-medium">
                                                                                        Initial: <span className="line-through text-slate-400">₹{trackingData.previous_proposed_price}/hr</span>
                                                                                    </span>
                                                                                )}
                                                                                {trackingData.previous_counter_price && (
                                                                                    <span className="bg-white px-2 py-1 rounded-lg border border-indigo-100 text-purple-700 font-medium">
                                                                                        Your Counter: <strong>₹{trackingData.previous_counter_price}/hr</strong>
                                                                                    </span>
                                                                                )}
                                                                                <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-black">
                                                                                    New Rate: ₹{hourlyRate}/hr (70%: ₹{sponsorHourlyShare.toFixed(1)}/hr)
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Pricing Comparison Grid */}
                                                                    <div className={`grid gap-2 text-xs ${(!trackingData.terms_accepted && !trackingData.agreement_accepted_at && (trackingData.current_stage < 6) && trackingData.counter_offer_price) ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
                                                                        <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-sm">
                                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Proposed Rent</span>
                                                                            <span className="text-base font-black text-slate-900">₹{hourlyRate}<small className="text-xs text-slate-500">/hr</small></span>
                                                                        </div>
                                                                        <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-sm">
                                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Your Share (70%)</span>
                                                                            <span className="text-base font-black text-emerald-700">₹{sponsorHourlyShare.toFixed(1)}<small className="text-xs text-slate-500">/hr</small></span>
                                                                        </div>
                                                                        {(!trackingData.terms_accepted && !trackingData.agreement_accepted_at && (trackingData.current_stage < 6) && trackingData.counter_offer_price) && (
                                                                            <>
                                                                                <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 shadow-sm">
                                                                                    <span className="text-[10px] text-purple-700 block uppercase font-bold">Your Counter Rate</span>
                                                                                    <span className="text-base font-black text-purple-900">₹{trackingData.counter_offer_price}<small className="text-xs text-purple-600">/hr</small></span>
                                                                                </div>
                                                                                <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 shadow-sm">
                                                                                    <span className="text-[10px] text-purple-700 block uppercase font-bold">Counter Share (70%)</span>
                                                                                    <span className="text-base font-black text-purple-800">₹{(trackingData.counter_offer_price * 0.70).toFixed(1)}<small className="text-xs text-purple-600">/hr</small></span>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {/* Sponsor Agreement Decision Block */}
                                                                    {(trackingData.terms_accepted || trackingData.agreement_accepted_at || trackingData.current_stage >= 6) ? (
                                                                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-2">
                                                                            <div>
                                                                                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Sponsor Decision</span>
                                                                                <strong className="text-xs font-black">✓ Pricing Terms Accepted & Approved</strong>
                                                                                <span className="text-[11px] text-emerald-700 block">Official Rate: ₹{hourlyRate}/hr • 70% Payout: ₹{sponsorHourlyShare.toFixed(1)}/hr</span>
                                                                            </div>
                                                                            <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 font-extrabold text-[10px] shrink-0">
                                                                                Accepted
                                                                            </span>
                                                                        </div>
                                                                    ) : showCounterForm ? (
                                                                        /* Inline Counter Offer Input Form inside Card */
                                                                        <div className="p-3.5 rounded-xl bg-white border-2 border-indigo-300 shadow-sm space-y-3">
                                                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                                                <span className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                                                                                    💬 Propose Custom Rental Rate
                                                                                </span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setShowCounterForm(false)}
                                                                                    className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                                                                                >
                                                                                    ✕ Cancel
                                                                                </button>
                                                                            </div>

                                                                            <div>
                                                                                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                                                                                    Expected Hourly Rent (₹/hr) *
                                                                                </label>
                                                                                <input
                                                                                    type="number"
                                                                                    min="20"
                                                                                    max="1000"
                                                                                    placeholder="e.g. 75"
                                                                                    value={counterPrice}
                                                                                    onChange={(e) => setCounterPrice(e.target.value)}
                                                                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-black text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none box-border"
                                                                                />
                                                                                {counterPrice && parseFloat(counterPrice) > 0 && (
                                                                                    <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                                                                                        Your 70% Share will be: ₹{(parseFloat(counterPrice) * 0.7).toFixed(1)}/hr
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            <div>
                                                                                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                                                                                    Remarks for Admin (Optional)
                                                                                </label>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="e.g. 2024 model with low mileage & premium accessories."
                                                                                    value={counterReason}
                                                                                    onChange={(e) => setCounterReason(e.target.value)}
                                                                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:border-indigo-500 outline-none box-border"
                                                                                />
                                                                            </div>

                                                                            <div className="flex gap-2 pt-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        if (!counterPrice || parseFloat(counterPrice) <= 0) {
                                                                                            toast.error('Please enter a valid hourly rate');
                                                                                            return;
                                                                                        }
                                                                                        handleRespondTerms(false, parseFloat(counterPrice), counterReason);
                                                                                    }}
                                                                                    disabled={respondingTerms || !counterPrice}
                                                                                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                                                                                >
                                                                                    {respondingTerms ? 'Sending...' : `Send Counter-Offer (₹${counterPrice || hourlyRate}/hr) 🚀`}
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setShowCounterForm(false)}
                                                                                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : trackingData.counter_offer_price ? (
                                                                        /* Counter Offer Active Status inside Card */
                                                                        <div className="p-3.5 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-950 space-y-2.5">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div>
                                                                                    <span className="text-[10px] uppercase font-bold text-purple-600 block">Counter-Offer Submitted</span>
                                                                                    <strong className="text-xs font-black text-purple-900">Requested Rate: ₹{trackingData.counter_offer_price}/hr</strong>
                                                                                    <span className="text-[11px] text-purple-700 block">70% Share: ₹{(trackingData.counter_offer_price * 0.70).toFixed(1)}/hr</span>
                                                                                </div>
                                                                                <span className="px-2.5 py-1 rounded-full bg-purple-200 text-purple-900 font-extrabold text-[10px] shrink-0">
                                                                                    Pending Review
                                                                                </span>
                                                                            </div>
                                                                            {trackingData.sponsor_price_remarks && (
                                                                                <p className="text-[11px] text-purple-900 bg-white/90 p-2 rounded-lg border border-purple-100 italic">
                                                                                    "{trackingData.sponsor_price_remarks}"
                                                                                </p>
                                                                            )}
                                                                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRespondTerms(true)}
                                                                                    disabled={respondingTerms}
                                                                                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                                                                >
                                                                                    {respondingTerms ? 'Updating...' : `Accept Admin's ₹${hourlyRate}/hr Instead`}
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setCounterPrice(String(trackingData.counter_offer_price || ''));
                                                                                        setCounterReason(trackingData.sponsor_price_remarks || '');
                                                                                        setShowCounterForm(true);
                                                                                    }}
                                                                                    className="py-2 px-3 rounded-xl bg-white hover:bg-purple-100/50 text-purple-700 border border-purple-300 font-bold text-xs transition-all cursor-pointer"
                                                                                >
                                                                                    Edit Counter Price
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        /* Initial Sponsor Decision Actions (Agree & Accept / Disagree & Custom Price) */
                                                                        <div className="pt-2 border-t border-amber-200/80 space-y-2.5">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-xs font-extrabold text-slate-800">
                                                                                    Sponsor Terms Approval:
                                                                                </span>
                                                                                <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">Action Required</span>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRespondTerms(true)}
                                                                                    disabled={respondingTerms}
                                                                                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                                                                >
                                                                                    {respondingTerms ? 'Processing...' : '✓ Agree & Accept'}
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setCounterPrice(String(Math.round(hourlyRate * 1.15)));
                                                                                        setShowCounterForm(true);
                                                                                    }}
                                                                                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                                                >
                                                                                    ✕ Disagree / Custom Price
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Stage 6: Digital Agreement Confirmation */}
                                                    {s.number === 6 && (
                                                        <div className={`p-4 rounded-2xl border space-y-3 ${
                                                            (trackingData.agreement_accepted_at || trackingData.terms_accepted)
                                                                ? 'bg-emerald-50/70 border-emerald-200'
                                                                : 'bg-slate-50 border-slate-200'
                                                        }`}>
                                                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                                                <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                                                                    <FileSignature className="w-4 h-4 text-indigo-600" />
                                                                    Digital Agreement Contract
                                                                </div>
                                                                <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                                                                    (trackingData.agreement_accepted_at || trackingData.terms_accepted)
                                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                                                }`}>
                                                                    {(trackingData.agreement_accepted_at || trackingData.terms_accepted) ? '✓ Contract Verified' : 'Awaiting Stage 5 Approval'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-600">
                                                                {(trackingData.agreement_accepted_at || trackingData.terms_accepted)
                                                                    ? 'Partner agreement digitally accepted and verified. Automatic weekly settlement enabled.'
                                                                    : 'Terms must be agreed in Step 5 before the digital contract is activated.'
                                                                }
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Stage 8: GPS Radar Telemetry Box */}
                                                    {s.number === 8 && trackingData.gps_tracking && (
                                                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                                                            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                                                <span className="text-blue-900 font-extrabold text-xs uppercase flex items-center gap-1.5">
                                                                    <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                                                                    4G GPS AIS-140 Telemetry
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-black text-[10px]">
                                                                    🟢 PAIRED
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                                                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">IMEI</span>
                                                                    <span className="font-mono font-black text-blue-700">{trackingData.gps_tracking.device_imei}</span>
                                                                </div>
                                                                <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                                                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Immobilizer</span>
                                                                    <span className="font-bold text-emerald-700">Armed & Ready</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Stage 9: Live Fleet Launch Celebration */}
                                                    {s.number === 9 && currentStageNum === 9 && (
                                                        <div className="p-4 rounded-2xl bg-emerald-100/70 border border-emerald-300 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xl">🚀</span>
                                                                <h5 className="font-black text-slate-900 text-sm">Vehicle LIVE in RentHub Fleet!</h5>
                                                            </div>
                                                            <p className="text-xs text-slate-600">Customers can now book this vehicle in real-time.</p>
                                                            <div className="pt-2 flex gap-2">
                                                                <Link to="/my-bikes" className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm">
                                                                    Manage in Fleet →
                                                                </Link>
                                                                <Link to="/revenue" className="px-3.5 py-1.5 bg-white text-slate-700 rounded-xl text-xs font-bold border border-slate-200">
                                                                    View Earnings →
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 24/7 Helpline Card in Light Theme */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-200">
                        <div className="space-y-1">
                            <h4 className="text-lg md:text-xl font-black flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-indigo-200" />
                                Need help with your onboarding or survey schedule?
                            </h4>
                            <p className="text-indigo-100 text-xs md:text-sm">
                                Our fleet onboarding engineers and customer desk are available 24x7.
                            </p>
                        </div>
                        <a
                            href="tel:9040757683"
                            className="px-6 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-black/10 shrink-0"
                        >
                            <Phone className="w-4 h-4 text-indigo-600" />
                            Call 24x7 Desk: +91 90407 57683
                        </a>
                    </div>

                </div>
            ) : !loading && (
                /* Empty Prompt State */
                <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-lg">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Track Any Vehicle Application</h3>
                    <p className="text-slate-500 text-xs md:text-sm max-w-md mx-auto">
                        Enter your Tracking ID (`#RH-REQ-XXXX`) in the top search bar or select one of your registered fleet vehicles above.
                    </p>
                </div>
            )}

        </div>
    );
};

export default TrackApplication;
