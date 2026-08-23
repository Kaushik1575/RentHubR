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
    ArrowRight
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STAGES = [
    { number: 1, title: 'Application & Docs Submitted', desc: 'Sponsor submitted vehicle details and legal documents.', icon: FileText },
    { number: 2, title: 'Document & Vehicle Review', desc: 'RentHub operations verified RC, Insurance, and PUC certificates.', icon: Shield },
    { number: 3, title: 'Physical Survey Visit', desc: 'Field engineers scheduled on-site inspection visit.', icon: MapPin },
    { number: 4, title: 'Survey Inspection Report', desc: 'Mechanical scorecard compiled (Engine, Tyres, Brakes, Lights).', icon: Wrench },
    { number: 5, title: 'Price & Revenue Share Decision', desc: 'Hourly rental rate and 70% sponsor split proposed.', icon: DollarSign },
    { number: 6, title: 'Sponsor Agreement Signing', desc: 'Terms & conditions digitally accepted by sponsor.', icon: FileSignature },
    { number: 7, title: 'Contract Officially Activated', desc: 'Legally binding onboarding agreement activated.', icon: CheckCircle2 },
    { number: 8, title: 'Anti-Theft GPS Installation', desc: 'Hardware GPS tracker fitted and telemetry calibrated.', icon: Radio },
    { number: 9, title: 'Vehicle Goes LIVE in Fleet', desc: 'Vehicle published for real-time customer bookings!', icon: Sparkles }
];

const TrackApplication = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('id') || searchParams.get('track') || '';

    const [searchId, setSearchId] = useState(initialQuery);
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userVehicles, setUserVehicles] = useState([]);
    const [vehiclesLoading, setVehiclesLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [agreementAgreed, setAgreementAgreed] = useState(false);
    const [acceptingAgreement, setAcceptingAgreement] = useState(false);

    // Load sponsor's own vehicles for quick lookup pills
    useEffect(() => {
        const fetchUserBikes = async () => {
            try {
                const res = await api.get('/sponsor/my-bikes');
                const bikes = res.data || [];
                setUserVehicles(bikes);

                // If URL contains ID, auto-search it; else default to first bike if available
                if (initialQuery) {
                    performLookup(initialQuery);
                } else if (bikes.length > 0) {
                    const firstTid = bikes[0].tracking_id || bikes[0].id;
                    setSearchId(firstTid);
                    performLookup(firstTid);
                }
            } catch (err) {
                console.error('Failed to load bikes for tracking:', err);
            } finally {
                setVehiclesLoading(false);
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

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-4 backdrop-blur-sm">
                        <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                        Real-Time Vehicle Pipeline Tracking
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                        Track Application Status
                    </h1>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                        Monitor your vehicle onboarding milestone progress in real-time — from physical inspection survey to revenue contract activation and GPS installation.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={(e) => { e.preventDefault(); performLookup(searchId); }} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="Enter Tracking ID (e.g. RH-REQ-7049) or Reg Number..."
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all text-sm font-medium backdrop-blur-md"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Search className="w-4 h-4" />
                                    <span>Track Application</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Quick Lookup Pills for Sponsor's Registered Bikes */}
            {userVehicles.length > 0 && (
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Vehicle Applications ({userVehicles.length})</span>
                        <Link to="/my-bikes" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                            View all in My Bikes <ChevronRight className="w-3 h-3" />
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
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-slate-900 text-white shadow-md ring-2 ring-indigo-500'
                                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                                    }`}
                                >
                                    <BikeIcon className="w-3.5 h-3.5 text-brand-500" />
                                    <span>{v.name}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-black/10 text-[10px] font-mono">{tid}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tracking Result View */}
            {trackingData ? (
                <div className="space-y-6 animate-fade-in">
                    {/* Vehicle Quick Summary Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                            <div className="flex items-start gap-4">
                                {trackingData.image_url ? (
                                    <img
                                        src={trackingData.image_url}
                                        alt={trackingData.name}
                                        className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border border-slate-200 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                        <BikeIcon className="w-10 h-10" />
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-mono font-bold tracking-wide flex items-center gap-1.5 border border-indigo-100">
                                            {trackingData.tracking_id}
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(trackingData.tracking_id)}
                                                className="hover:text-indigo-950 text-indigo-500 transition-colors cursor-pointer"
                                                title="Copy Tracking ID"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                            trackingData.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                            trackingData.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                            'bg-amber-100 text-amber-800'
                                        }`}>
                                            {trackingData.status === 'approved' ? '🟢 Live Fleet Active' :
                                             trackingData.status === 'rejected' ? '❌ Rejected' : '🟡 In Pipeline'}
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                                        {trackingData.name}
                                    </h2>
                                    <p className="text-slate-500 text-sm">
                                        {trackingData.model} • Year {trackingData.year} • Reg: <span className="font-semibold text-slate-700">{trackingData.registration_number || 'Under Verification'}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Progress Percentage Gauge */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-4 min-w-[240px]">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-indigo-600/30">
                                    {progressPercent}%
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Progress</div>
                                    <div className="text-sm font-bold text-slate-800">
                                        Stage {currentStageNum} of 9
                                    </div>
                                    <div className="text-xs text-indigo-600 font-medium truncate max-w-[150px]">
                                        {STAGES[currentStageNum - 1]?.title}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                <span>STAGE 1: SUBMITTED</span>
                                <span>STAGE 5: AGREEMENT</span>
                                <span>STAGE 9: LIVE FLEET</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-600 to-emerald-500 transition-all duration-700 shadow-sm"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Document Chips */}
                        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase mr-2">Submitted Docs:</span>
                            {trackingData.rc_url ? (
                                <a href={trackingData.rc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors">
                                    <FileText className="w-3.5 h-3.5 text-blue-600" /> RC Book <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                            ) : <span className="text-xs text-slate-400 italic">RC Missing</span>}

                            {trackingData.insurance_url ? (
                                <a href={trackingData.insurance_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors">
                                    <Shield className="w-3.5 h-3.5 text-emerald-600" /> Insurance <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                            ) : <span className="text-xs text-slate-400 italic">Insurance Missing</span>}

                            {trackingData.puc_url ? (
                                <a href={trackingData.puc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors">
                                    <Activity className="w-3.5 h-3.5 text-purple-600" /> PUC <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                            ) : <span className="text-xs text-slate-400 italic">PUC Missing</span>}
                        </div>
                    </div>

                    {/* Interactive 9-Stage Timeline Stepper */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Milestone Timeline</h3>
                                <p className="text-xs text-slate-500">Track exact progress and administrative milestones for this bike.</p>
                            </div>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold font-mono">
                                9 Stages
                            </span>
                        </div>

                        <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:left-3 md:before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                            {STAGES.map((s) => {
                                const isPassed = currentStageNum > s.number;
                                const isCurrent = currentStageNum === s.number;
                                const isPending = currentStageNum < s.number;

                                return (
                                    <div key={s.number} className="relative group">
                                        {/* Step Circle Indicator */}
                                        <div className={`absolute -left-6 md:-left-10 top-0.5 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                            isPassed
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                                : isCurrent
                                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-lg shadow-indigo-600/40 animate-pulse'
                                                : 'bg-white border-2 border-slate-200 text-slate-400'
                                        }`}>
                                            {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : s.number}
                                        </div>

                                        {/* Step Content Box */}
                                        <div className={`p-4 md:p-5 rounded-2xl transition-all ${
                                            isCurrent
                                                ? 'bg-indigo-50/70 border-2 border-indigo-200 shadow-sm'
                                                : isPassed
                                                ? 'bg-slate-50/70 border border-slate-200/80'
                                                : 'bg-white border border-slate-100 opacity-60'
                                        }`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm md:text-base text-slate-900">
                                                        {s.title}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                                                            Current Stage
                                                        </span>
                                                    )}
                                                </div>
                                                {isPassed && (
                                                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                                                {s.desc}
                                            </p>

                                            {/* Stage-Specific Metadata Cards */}
                                            {s.number === 3 && trackingData.survey_scheduled_date && (
                                                <div className="mt-3 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center gap-2 font-medium">
                                                    <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                                                    <span><strong>Survey Date:</strong> {new Date(trackingData.survey_scheduled_date).toLocaleDateString('en-IN', { dateStyle: 'full' })} (Field engineer will visit your address)</span>
                                                </div>
                                            )}

                                            {s.number === 4 && trackingData.survey_report && (
                                                <div className="mt-3 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs space-y-2">
                                                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                                                        <Wrench className="w-3.5 h-3.5 text-emerald-600" /> Physical Inspection Scorecard (Certified):
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                                        <div className="bg-white p-2 rounded-lg border border-emerald-100">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Tyres</span>
                                                            <span className="font-bold text-slate-800">{trackingData.survey_report.tyres || 'Good'}</span>
                                                        </div>
                                                        <div className="bg-white p-2 rounded-lg border border-emerald-100">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Brakes</span>
                                                            <span className="font-bold text-slate-800">{trackingData.survey_report.brakes || 'Tested'}</span>
                                                        </div>
                                                        <div className="bg-white p-2 rounded-lg border border-emerald-100">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Engine</span>
                                                            <span className="font-bold text-slate-800">{trackingData.survey_report.engine || 'Smooth'}</span>
                                                        </div>
                                                        <div className="bg-white p-2 rounded-lg border border-emerald-100">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Electricals</span>
                                                            <span className="font-bold text-slate-800">{trackingData.survey_report.lights || 'Functional'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {s.number === 5 && trackingData.pricing_terms && (
                                                <div className="mt-3 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-2">
                                                    <div className="font-bold text-amber-900 flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-amber-600" /> Proposed Revenue Terms:</span>
                                                        <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono font-bold">70% Payout Share</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                                        <div className="bg-white p-2.5 rounded-lg border border-amber-100">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Customer Hourly Rate</span>
                                                            <span className="font-extrabold text-base text-slate-900">₹{trackingData.pricing_terms.proposed_price || trackingData.price}/hr</span>
                                                        </div>
                                                        <div className="bg-white p-2.5 rounded-lg border border-amber-100">
                                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Your Sponsor Earning</span>
                                                            <span className="font-extrabold text-base text-emerald-600">
                                                                ₹{((trackingData.pricing_terms.proposed_price || trackingData.price || 65) * 0.70).toFixed(2)}/hr
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Interactive Digital Agreement Signing Card at Stage 5 / 6 */}
                                            {s.number === 6 && (currentStageNum === 5 || currentStageNum === 6) && !trackingData.agreement_accepted_at && (
                                                <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 border-2 border-amber-300 shadow-md">
                                                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm mb-2">
                                                        <FileSignature className="w-4 h-4 text-amber-600" /> Digital Agreement Signature Required
                                                    </div>
                                                    <p className="text-xs text-amber-800 mb-4 leading-relaxed">
                                                        Please review the proposed rental rate (₹{trackingData.pricing_terms?.proposed_price || trackingData.price}/hr) and 70% sponsor revenue share. Check the acknowledgment below to digitally sign and activate your vehicle contract.
                                                    </p>
                                                    <label className="flex items-start gap-2.5 text-xs text-slate-800 font-semibold cursor-pointer mb-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={agreementAgreed}
                                                            onChange={(e) => setAgreementAgreed(e.target.checked)}
                                                            className="w-4 h-4 text-amber-600 rounded mt-0.5 cursor-pointer"
                                                        />
                                                        <span>I accept the proposed rental pricing, 70% sponsor payout share, and RentHub terms & conditions.</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={handleAcceptAgreement}
                                                        disabled={acceptingAgreement || !agreementAgreed}
                                                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                                    >
                                                        {acceptingAgreement ? 'Signing Agreement...' : '🤝 Accept & Digitally Sign Agreement'}
                                                    </button>
                                                </div>
                                            )}

                                            {s.number === 8 && trackingData.gps_tracking && (
                                                <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs flex items-center justify-between font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Radio className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
                                                        <span><strong>Anti-Theft GPS Fitted:</strong> IMEI {trackingData.gps_tracking.device_imei}</span>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Telemetry Live</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Assistance & Help Box */}
                    <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                        <div>
                            <h4 className="text-lg font-bold mb-1">Need help with your bike onboarding?</h4>
                            <p className="text-slate-400 text-xs md:text-sm">Our field engineering and verification team is available 24/7 to assist sponsors.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href="tel:9040757683"
                                className="px-5 py-3 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center gap-2"
                            >
                                <Phone className="w-3.5 h-3.5 text-brand-600" />
                                Call Support: +91 90407 57683
                            </a>
                            <Link
                                to="/my-bikes"
                                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-2"
                            >
                                My Bikes <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            ) : !loading && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Track Any Vehicle Application</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                        Enter your Tracking ID (`#RH-REQ-XXXX`) above or choose from your submitted vehicles to view real-time stage progress.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TrackApplication;
