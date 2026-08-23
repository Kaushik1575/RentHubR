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
    Gauge,
    Cpu,
    Award,
    Printer,
    HelpCircle,
    CheckCheck,
    Navigation,
    Zap,
    TrendingUp,
    ShieldCheck,
    Car,
    BatteryCharging
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STAGE_CONFIG = [
    {
        number: 1,
        title: 'Application & Docs Submitted',
        tagline: 'Initial Registration & Document Vault',
        desc: 'Vehicle specifications, identity verification, and legal documentation (RC, Insurance, PUC) uploaded by sponsor.',
        icon: FileText,
        color: 'from-cyan-500 to-blue-600',
        lightBg: 'bg-cyan-50/70 border-cyan-200 text-cyan-900',
        badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        accentColor: '#06b6d4',
        eta: 'Completed in < 1 hour'
    },
    {
        number: 2,
        title: 'Document & Vehicle Review',
        tagline: 'RTO & Compliance Verification',
        desc: 'RentHub legal desk verified original RC records, insurance active tenure, pollution fitness, and photo authenticity.',
        icon: ShieldCheck,
        color: 'from-indigo-500 to-purple-600',
        lightBg: 'bg-indigo-50/70 border-indigo-200 text-indigo-900',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        accentColor: '#6366f1',
        eta: '12 - 24 hours'
    },
    {
        number: 3,
        title: 'Physical Survey Visit',
        tagline: 'Doorstep Field Inspection',
        desc: 'RentHub certified automotive engineer dispatched to inspect vehicle chassis, body condition, and roadworthiness.',
        icon: MapPin,
        color: 'from-sky-500 to-blue-600',
        lightBg: 'bg-sky-50/70 border-sky-200 text-sky-900',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
        accentColor: '#0284c7',
        eta: 'Scheduled within 48 hours'
    },
    {
        number: 4,
        title: 'Survey Inspection Scorecard',
        tagline: 'Certified Mechanical Audit',
        desc: 'Complete 24-point diagnostic scorecard generated covering tyre tread depth, brake pads, engine compression, and lighting.',
        icon: Wrench,
        color: 'from-emerald-500 to-teal-600',
        lightBg: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        accentColor: '#10b981',
        eta: 'Same-day audit release'
    },
    {
        number: 5,
        title: 'Price & Revenue Share Terms',
        tagline: 'Earnings Proposal & ROI Projection',
        desc: 'Competitive hourly rental price set with maximum 70% sponsor payout share and 30% platform management fee.',
        icon: DollarSign,
        color: 'from-amber-500 to-orange-600',
        lightBg: 'bg-amber-50/70 border-amber-200 text-amber-900',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        accentColor: '#f59e0b',
        eta: 'Instant automated proposal'
    },
    {
        number: 6,
        title: 'Sponsor Agreement Signing',
        tagline: 'E-Sign Legal Contract',
        desc: 'Sponsor digitally reviews pricing terms, insurance liabilities, weekly payout cycle, and e-signs agreement.',
        icon: FileSignature,
        color: 'from-rose-500 to-pink-600',
        lightBg: 'bg-rose-50/70 border-rose-200 text-rose-900',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        accentColor: '#f43f5e',
        eta: 'Awaiting sponsor sign'
    },
    {
        number: 7,
        title: 'Contract Officially Activated',
        tagline: 'Legal Binding & Fleet Registration',
        desc: 'Agreement officially executed. Vehicle allocated an asset slot in the RentHub municipal fleet registry.',
        icon: Award,
        color: 'from-purple-600 to-indigo-700',
        lightBg: 'bg-purple-50/70 border-purple-200 text-purple-900',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
        accentColor: '#8b5cf6',
        eta: 'Instant verification'
    },
    {
        number: 8,
        title: 'Anti-Theft GPS Installation',
        tagline: 'Hardware Fitment & Telemetry Pairing',
        desc: 'Military-grade 4G AIS-140 GPS tracker and remote engine immobilizer fitted with real-time live telemetry paired.',
        icon: Radio,
        color: 'from-blue-600 to-cyan-500',
        lightBg: 'bg-blue-50/70 border-blue-200 text-blue-900',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
        accentColor: '#2563eb',
        eta: '2 - 4 hours'
    },
    {
        number: 9,
        title: 'Vehicle Goes LIVE in Fleet',
        tagline: 'Active Earning & Customer Availability',
        desc: 'Vehicle published to thousands of verified RentHub riders! Instant real-time booking availability and automated payouts active.',
        icon: Sparkles,
        color: 'from-emerald-500 via-teal-500 to-green-600',
        lightBg: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950',
        badgeBg: 'bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/30',
        accentColor: '#059669',
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
    const [stageFilter, setStageFilter] = useState('all'); // 'all', 'completed', 'active', 'upcoming'
    const [calcHours, setCalcHours] = useState(6); // Revenue calculator hours/day

    // Fetch sponsor's own vehicles for quick-select chips
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
    const projectedMonthly = (sponsorHourlyShare * calcHours * 30).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-28 font-sans selection:bg-indigo-500 selection:text-white">
            
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/10 to-transparent blur-[140px] rounded-full"></div>
                <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-emerald-500/10 blur-[130px] rounded-full"></div>
            </div>

            <div className="relative z-10 space-y-8">
                
                {/* Futuristic Hero Header Card */}
                <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/80 p-6 md:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
                    {/* Glowing Top Border Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 via-purple-500 to-emerald-500"></div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="max-w-2xl space-y-3">
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 text-cyan-300 text-xs font-bold tracking-wide backdrop-blur-md shadow-inner">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                9-Stage Asset Lifecycle Telemetry
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                                Live Vehicle <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">Onboarding Radar</span>
                            </h1>

                            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                Real-time diagnostic telemetry, mechanical survey reports, revenue sharing agreement contracts, and anti-theft GPS hardware pairing.
                            </p>

                            {/* Tracking Search Input */}
                            <form onSubmit={(e) => { e.preventDefault(); performLookup(searchId); }} className="pt-2 flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                                    <input
                                        type="text"
                                        value={searchId}
                                        onChange={(e) => setSearchId(e.target.value)}
                                        placeholder="Enter Tracking ID (e.g. RH-REQ-7049, OD-02-AB-1234)..."
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-sm font-semibold tracking-wide shadow-inner"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
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

                        {/* Quick Live Status Gauge Card */}
                        {trackingData && (
                            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl min-w-[280px] backdrop-blur-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>
                                
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Current Milestone</span>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                        STAGE {currentStageNum}/9
                                    </span>
                                </div>

                                <div className="flex items-end gap-3 mb-3">
                                    <span className="text-4xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                                        {progressPercent}%
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium pb-1.5">Completed</span>
                                </div>

                                {/* Multi-Color Gradient Progress Bar */}
                                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700/80 mb-3 shadow-inner">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 via-amber-400 to-emerald-400 transition-all duration-1000 shadow-sm"
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>

                                <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                                    <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>{STAGE_CONFIG[currentStageNum - 1]?.title}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Switch Pills for User's Registered Vehicles */}
                {userVehicles.length > 0 && (
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 md:p-5 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <BikeIcon className="w-4 h-4 text-cyan-400" />
                                Your Registered Fleet Vehicles ({userVehicles.length})
                            </span>
                            <Link to="/my-bikes" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                                Manage Fleet in My Bikes <ChevronRight className="w-3 h-3" />
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
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer border ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-white border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                                                : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                        <span>{v.name}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono text-cyan-300">{tid}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                {trackingData ? (
                    <div className="space-y-8 animate-fade-in">
                        
                        {/* Vehicle Profile Command Card */}
                        <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 rounded-3xl border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                                
                                <div className="flex items-start gap-5">
                                    {trackingData.image_url ? (
                                        <div className="relative group">
                                            <img
                                                src={trackingData.image_url}
                                                alt={trackingData.name}
                                                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-xl group-hover:scale-105 transition-all duration-300"
                                            />
                                            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10"></div>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center text-cyan-400 border border-indigo-500/40 shadow-xl">
                                            <BikeIcon className="w-12 h-12" />
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 text-cyan-300 text-xs font-mono font-black border border-cyan-500/30">
                                                <span>{trackingData.tracking_id}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(trackingData.tracking_id)}
                                                    className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                                                    title="Copy ID"
                                                >
                                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>

                                            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                                                trackingData.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                                trackingData.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                                                'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                            }`}>
                                                {trackingData.status === 'approved' ? '🟢 Live Fleet Active' :
                                                 trackingData.status === 'rejected' ? '❌ Rejected' : '🟡 In Review Pipeline'}
                                            </span>

                                            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                                                {trackingData.vehicle_type || 'bike'}
                                            </span>
                                        </div>

                                        <h2 className="text-2xl md:text-3xl font-black text-white">
                                            {trackingData.name}
                                        </h2>

                                        <p className="text-slate-400 text-sm flex flex-wrap items-center gap-2 font-medium">
                                            <span>{trackingData.model}</span>
                                            <span>•</span>
                                            <span>Year {trackingData.year}</span>
                                            <span>•</span>
                                            <span className="text-slate-200 font-mono font-bold bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                                                {trackingData.registration_number || 'Registration Pending'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Rate & Earnings Snippet */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3.5 text-center min-w-[130px]">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Rental Rate</span>
                                        <span className="text-lg font-black text-cyan-300">₹{hourlyRate}<small className="text-xs text-slate-400">/hr</small></span>
                                    </div>
                                    <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3.5 text-center min-w-[130px]">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Sponsor Share</span>
                                        <span className="text-lg font-black text-emerald-400">70% <small className="text-xs text-slate-400">(₹{sponsorHourlyShare.toFixed(1)}/h)</small></span>
                                    </div>
                                </div>
                            </div>

                            {/* Document Verification Row */}
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mr-2">Digital Vault:</span>
                                    
                                    {trackingData.rc_url ? (
                                        <a href={trackingData.rc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition-colors shadow-sm">
                                            <FileText className="w-3.5 h-3.5 text-cyan-400" /> RC Book <ExternalLink className="w-3 h-3 text-slate-400" />
                                        </a>
                                    ) : <span className="text-xs text-slate-500 italic bg-slate-900/60 px-2.5 py-1 rounded-lg">Missing RC</span>}

                                    {trackingData.insurance_url ? (
                                        <a href={trackingData.insurance_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-slate-700 transition-colors shadow-sm">
                                            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Insurance <ExternalLink className="w-3 h-3 text-slate-400" />
                                        </a>
                                    ) : <span className="text-xs text-slate-500 italic bg-slate-900/60 px-2.5 py-1 rounded-lg">Missing Insurance</span>}

                                    {trackingData.puc_url ? (
                                        <a href={trackingData.puc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-purple-300 text-xs font-bold border border-slate-700 transition-colors shadow-sm">
                                            <Activity className="w-3.5 h-3.5 text-purple-400" /> PUC <ExternalLink className="w-3 h-3 text-slate-400" />
                                        </a>
                                    ) : <span className="text-xs text-slate-500 italic bg-slate-900/60 px-2.5 py-1 rounded-lg">Missing PUC</span>}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Printer className="w-3.5 h-3.5 text-slate-400" /> Print Summary
                                </button>
                            </div>
                        </div>

                        {/* Interactive Timeline Controls & Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                    <Navigation className="w-5 h-5 text-cyan-400" />
                                    Interactive Milestone Highway
                                </h3>
                                <p className="text-xs text-slate-400">Step-by-step audit verification, mechanical testing, and contract milestones.</p>
                            </div>

                            {/* Filter Tabs */}
                            <div className="inline-flex rounded-2xl bg-slate-900/90 p-1 border border-slate-800 text-xs font-bold">
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
                                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                                            stageFilter === tab.id
                                                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 9-Stage Modern Metro Timeline Nodes */}
                        <div className="space-y-4">
                            {filteredStages.map((s) => {
                                const isPassed = currentStageNum > s.number;
                                const isCurrent = currentStageNum === s.number;
                                const isPending = currentStageNum < s.number;

                                return (
                                    <div
                                        key={s.number}
                                        className={`rounded-3xl border transition-all duration-300 overflow-hidden relative ${
                                            isCurrent
                                                ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border-cyan-400/80 shadow-2xl shadow-cyan-500/10 ring-2 ring-cyan-400/30'
                                                : isPassed
                                                ? 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                                                : 'bg-slate-950/60 border-slate-900 opacity-60'
                                        }`}
                                    >
                                        {/* Colored Accent Stripe */}
                                        <div className={`h-1.5 w-full bg-gradient-to-r ${s.color} ${isPending ? 'opacity-20' : 'opacity-100'}`}></div>

                                        <div className="p-5 md:p-7">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                
                                                <div className="flex items-start gap-4">
                                                    {/* Glowing Stage Number Node */}
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg transition-all ${
                                                        isPassed
                                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
                                                            : isCurrent
                                                            ? `bg-gradient-to-br ${s.color} text-white ring-4 ring-cyan-400/40 shadow-xl shadow-cyan-500/30 animate-pulse`
                                                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                                                    }`}>
                                                        {isPassed ? (
                                                            <Check className="w-6 h-6 stroke-[3]" />
                                                        ) : (
                                                            <s.icon className="w-6 h-6" />
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                                                                STAGE {s.number}
                                                            </span>
                                                            <h4 className="text-base md:text-lg font-black text-white">
                                                                {s.title}
                                                            </h4>
                                                            {isCurrent && (
                                                                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-wider animate-bounce shadow-md">
                                                                    Active Action
                                                                </span>
                                                            )}
                                                            {isPassed && (
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                                                                    ✓ Verified
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="text-xs font-semibold text-cyan-400">
                                                            {s.tagline}
                                                        </div>

                                                        <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-3xl">
                                                            {s.desc}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* ETA / Status Tag */}
                                                <div className="text-left md:text-right shrink-0">
                                                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Milestone Timeline</span>
                                                    <span className="text-xs font-bold text-slate-300">
                                                        {isPassed ? '✅ Completed' : isCurrent ? '⚡ In Progress' : s.eta}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* EXPANDED RICH STAGE PANELS */}

                                            {/* STAGE 3: Scheduled Survey Date Card */}
                                            {s.number === 3 && trackingData.survey_scheduled_date && (
                                                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-sky-950/80 to-slate-900 border border-sky-500/40 text-sky-200 text-xs flex items-center justify-between gap-4 shadow-md">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
                                                            <MapPin className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-sky-400 block">Confirmed Inspection Date</span>
                                                            <span className="text-sm font-black text-white">
                                                                {new Date(trackingData.survey_scheduled_date).toLocaleDateString('en-IN', { dateStyle: 'full' })}
                                                            </span>
                                                            <p className="text-sky-300/80 text-[11px] mt-0.5">RentHub field engineers will visit your registered address during daylight hours.</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-3 py-1 bg-sky-500/20 text-sky-300 rounded-xl font-bold text-xs border border-sky-500/30 shrink-0">
                                                        Confirmed Slot
                                                    </span>
                                                </div>
                                            )}

                                            {/* STAGE 4: Mechanical Inspection Scorecard */}
                                            {s.number === 4 && trackingData.survey_report && (
                                                <div className="mt-4 p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-lg space-y-3">
                                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                                        <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                                                            <Award className="w-4 h-4 text-emerald-400" />
                                                            Certified Roadworthy Diagnostic Scorecard
                                                        </div>
                                                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40">
                                                            {trackingData.survey_report.overall_rating || 'GRADE A CERTIFIED'}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Tyres & Tread</span>
                                                            <span className="font-extrabold text-sm text-emerald-300">{trackingData.survey_report.tyres || 'Good (85%)'}</span>
                                                        </div>
                                                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Braking & Abs</span>
                                                            <span className="font-extrabold text-sm text-emerald-300">{trackingData.survey_report.brakes || 'Tested & Passed'}</span>
                                                        </div>
                                                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Engine & Compression</span>
                                                            <span className="font-extrabold text-sm text-emerald-300">{trackingData.survey_report.engine || 'Smooth Output'}</span>
                                                        </div>
                                                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Electricals & Lights</span>
                                                            <span className="font-extrabold text-sm text-emerald-300">{trackingData.survey_report.lights || 'Fully Functional'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* STAGE 5: Live Pricing & Interactive Earnings Calculator */}
                                            {s.number === 5 && (
                                                <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 shadow-lg space-y-4">
                                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                                        <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                                                            <TrendingUp className="w-4 h-4 text-amber-400" />
                                                            Live Revenue Share Terms & Earnings Calculator
                                                        </div>
                                                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40">
                                                            70% Payout Ratio
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Customer Hourly Rent</span>
                                                            <span className="text-2xl font-black text-white">₹{hourlyRate}<small className="text-xs text-slate-400">/hr</small></span>
                                                            <span className="text-[11px] text-slate-500 block mt-1">Platform Commission: 30%</span>
                                                        </div>

                                                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Your Net Payout Rate</span>
                                                            <span className="text-2xl font-black text-emerald-400">₹{sponsorHourlyShare.toFixed(2)}<small className="text-xs text-slate-400">/hr</small></span>
                                                            <span className="text-[11px] text-emerald-400/80 block mt-1">Direct bank / UPI transfers</span>
                                                        </div>

                                                        <div className="bg-gradient-to-br from-amber-950/60 to-slate-900 p-4 rounded-xl border border-amber-500/30">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[10px] text-amber-300 uppercase font-bold">Projected Monthly</span>
                                                                <span className="text-[10px] font-bold text-slate-400">{calcHours} hrs/day</span>
                                                            </div>
                                                            <span className="text-2xl font-black text-amber-300">₹{projectedMonthly}</span>
                                                            
                                                            <input
                                                                type="range"
                                                                min="2"
                                                                max="14"
                                                                value={calcHours}
                                                                onChange={(e) => setCalcHours(parseInt(e.target.value))}
                                                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 mt-2"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* STAGE 6: Interactive Digital Agreement Signing Card */}
                                            {s.number === 6 && (currentStageNum === 5 || currentStageNum === 6) && !trackingData.agreement_accepted_at && (
                                                <div className="mt-4 p-6 rounded-2xl bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-950 border-2 border-rose-500/60 shadow-xl space-y-4">
                                                    <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
                                                        <FileSignature className="w-5 h-5 text-rose-400" />
                                                        Digital Agreement Signature Required
                                                    </div>
                                                    <p className="text-xs text-slate-300 leading-relaxed">
                                                        Please review the proposed rental rate (<strong>₹{hourlyRate}/hr</strong>) and <strong>70% sponsor revenue payout</strong>. Check the agreement acknowledgment below to digitally execute your vehicle contract.
                                                    </p>

                                                    <label className="flex items-start gap-3 text-xs text-slate-200 font-bold cursor-pointer bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                                                        <input
                                                            type="checkbox"
                                                            checked={agreementAgreed}
                                                            onChange={(e) => setAgreementAgreed(e.target.checked)}
                                                            className="w-4 h-4 text-rose-600 rounded mt-0.5 cursor-pointer accent-rose-500"
                                                        />
                                                        <span>I agree to the proposed rental pricing, 70% sponsor payout share, weekly automated bank settlements, and RentHub vehicle terms.</span>
                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={handleAcceptAgreement}
                                                        disabled={acceptingAgreement || !agreementAgreed}
                                                        className="px-7 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-105"
                                                    >
                                                        {acceptingAgreement ? 'Digitally Signing...' : '🤝 Accept & Digitally Sign Agreement'}
                                                    </button>
                                                </div>
                                            )}

                                            {/* STAGE 8: Anti-Theft GPS Radar & Telemetry Card */}
                                            {s.number === 8 && trackingData.gps_tracking && (
                                                <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-950 border border-blue-500/40 shadow-lg space-y-3">
                                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                                        <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
                                                            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                                                            Live Anti-Theft GPS Telemetry & Hardware Status
                                                        </div>
                                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40">
                                                            🟢 4G ONLINE
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Device IMEI</span>
                                                            <span className="font-mono font-black text-cyan-300">{trackingData.gps_tracking.device_imei}</span>
                                                        </div>
                                                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Hardware Model</span>
                                                            <span className="font-bold text-white">RentHub SafeTrack 4G AIS-140</span>
                                                        </div>
                                                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Engine Immobilizer</span>
                                                            <span className="font-bold text-emerald-400">Armed & Ready</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* STAGE 9: Vehicle LIVE Celebration Card */}
                                            {s.number === 9 && currentStageNum === 9 && (
                                                <div className="mt-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/60 shadow-2xl space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-lg">
                                                            🚀
                                                        </div>
                                                        <div>
                                                            <h4 className="text-base font-black text-white">Vehicle is LIVE in RentHub Customer Fleet!</h4>
                                                            <p className="text-xs text-emerald-300">Customers can now book your vehicle. Track live ride hours and payouts in your Revenue dashboard.</p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 flex flex-wrap gap-3">
                                                        <Link
                                                            to="/my-bikes"
                                                            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md"
                                                        >
                                                            Manage Live Vehicle in My Fleet →
                                                        </Link>
                                                        <Link
                                                            to="/revenue"
                                                            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700"
                                                        >
                                                            View Revenue & Payouts →
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 24/7 Helpline Card */}
                        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                            <div className="space-y-1">
                                <h4 className="text-lg font-black text-white flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-cyan-400" />
                                    Have questions about your inspection or agreement?
                                </h4>
                                <p className="text-slate-400 text-xs md:text-sm">
                                    Our dedicated onboarding team and automotive engineers are available 24x7 to assist you.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <a
                                    href="tel:9040757683"
                                    className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                                >
                                    <Phone className="w-4 h-4" />
                                    Call 24x7 Desk: +91 90407 57683
                                </a>
                            </div>
                        </div>
                    </div>
                ) : !loading && (
                    /* Empty / Search Prompt State */
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center shadow-xl backdrop-blur-md">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-inner">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-2">Track Any Vehicle Application</h3>
                        <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto mb-6">
                            Enter your Tracking ID (`#RH-REQ-XXXX`) in the top search bar or select one of your registered vehicles to monitor milestone progression.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default TrackApplication;
