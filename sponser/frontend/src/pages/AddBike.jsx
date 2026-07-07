import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Upload, Bike, FileText, CheckCircle, Car, Truck, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import TermsPopup from '../components/TermsPopup';

const AddBike = () => {
    const navigate = useNavigate();
    const [sponsorId, setSponsorId] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        bikeNumber: '',
        model: '',
        year: '',
        pricePerHour: '',
        type: 'bike'
    });

    useEffect(() => {
        const fetchSponsorId = async () => {
            try {
                // Check if user is authenticated
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Please login to add a vehicle');
                    navigate('/login');
                    return;
                }

                const response = await api.get('/sponsor/profile');
                if (response.data && response.data.sponsor && response.data.sponsor.id) {
                    setSponsorId(response.data.sponsor.id);
                } else if (response.data && response.data.id) {
                    // Fallback in case API changes
                    setSponsorId(response.data.id);
                }
            } catch (error) {
                console.error("Failed to fetch sponsor ID:", error);
                // If API call fails due to authentication, redirect to login
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    toast.error('Please login to add a vehicle');
                    navigate('/login');
                }
            }
        };
        fetchSponsorId();
    }, [navigate]);
    const [files, setFiles] = useState({
        image: null,
        rc: null,
        insurance: null,
        puc: null,
    });
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFiles({ ...files, [e.target.name]: e.target.files[0] });
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFiles({ ...files, image: e.dataTransfer.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        Object.keys(files).forEach(key => {
            if (files[key]) data.append(key, files[key]);
        });

        try {
            await api.post('/sponsor/add-bike', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Vehicle added successfully! Waiting for approval.');
            navigate('/my-bikes');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to add vehicle.');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = () => {
        if (formData.type === 'car') return <Car className="w-6 h-6 text-white" />;
        // if (formData.type === 'scooty') return <Bike className="w-6 h-6 text-white" />;
        return <Bike className="w-6 h-6 text-white" />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white pb-20 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto pt-10">

                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/my-bikes')}
                            className="p-2 rounded-full bg-white shadow-sm hover:shadow-md text-gray-600 hover:text-indigo-600 transition-all duration-300 group"
                        >
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                                Add New Vehicle
                            </h1>
                            <p className="text-gray-500 mt-1 text-sm font-medium">Wait for approval & start earning</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

                    {/* Progress / Decoration Bar */}
                    <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                    <div className="p-8 md:p-10 space-y-10">

                        {/* Section 1: Vehicle Details */}
                        <div className="animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                                    {getIcon()}
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Vehicle Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Sponsor ID (Read Only) */}
                                <div className="space-y-2 group">
                                    <label className="text-sm font-semibold text-gray-700 tracking-wide">Sponsor ID <span className="text-xs text-gray-400 font-normal">(Auto-filled)</span></label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={sponsorId || 'Loading...'}
                                            readOnly
                                            className="w-full pl-5 pr-10 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 font-mono text-sm cursor-not-allowed select-none"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Type Selector */}
                                <div className="space-y-2 group">
                                    <label className="text-sm font-semibold text-gray-700 tracking-wide group-hover:text-indigo-600 transition-colors">Vehicle Type</label>
// ... (rest of type selector)
                                    <div className="relative">
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="w-full pl-5 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium cursor-pointer hover:bg-gray-100"
                                        >
                                            <option value="bike">Motorcycle / Bike</option>
                                            <option value="car">Car / SUV</option>
                                            <option value="scooty">Scooter / Scooty</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle Name */}
                                <div className="space-y-2 group">
                                    <label className="text-sm font-semibold text-gray-700 tracking-wide group-hover:text-indigo-600 transition-colors">Vehicle Model Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder={formData.type === 'car' ? "e.g. Maruti Swift Dzire" : "e.g. Royal Enfield Classic 350"}
                                        required
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium placeholder-gray-400"
                                    />
                                </div>

                                {/* Registration Number */}
                                <div className="space-y-2 group">
                                    <label className="text-sm font-semibold text-gray-700 tracking-wide group-hover:text-indigo-600 transition-colors">Registration Number</label>
                                    <input
                                        type="text"
                                        name="bikeNumber"
                                        placeholder="KA-01-AB-1234"
                                        required
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium uppercase tracking-widest placeholder-gray-400"
                                    />
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-gray-700 tracking-wide group-hover:text-indigo-600 transition-colors">Year</label>
                                        <input
                                            type="number"
                                            name="year"
                                            placeholder="2024"
                                            required
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-gray-700 tracking-wide group-hover:text-indigo-600 transition-colors">Model Variant</label>
                                        <input
                                            type="text"
                                            name="model"
                                            placeholder="ABS / Std"
                                            required
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="md:col-span-2 space-y-2 group">
                                    <label className="text-sm font-semibold text-gray-700 tracking-wide group-hover:text-indigo-600 transition-colors">Hourly Rental Price (₹)</label>
                                    <div className="relative group-focus-within:text-indigo-600 text-gray-400 transition-colors">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-lg">₹</div>
                                        <input
                                            type="number"
                                            name="pricePerHour"
                                            placeholder="0.00"
                                            required
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg text-gray-800"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                            / hr
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Section 2: Uploads */}
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-pink-500 rounded-xl shadow-lg shadow-pink-200">
                                    <ImageIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Photos & Documents</h2>
                                    <p className="text-sm text-gray-500">Upload clear images for faster approval</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Image Upload - Featured */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Main Vehicle Photo</label>
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all duration-300 group cursor-pointer overflow-hidden
                                            ${dragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-indigo-400'}
                                            ${files.image ? 'border-green-500 bg-green-50' : ''}
                                        `}
                                    >
                                        <input
                                            type="file"
                                            name="image"
                                            accept="image/*"
                                            required
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />

                                        {files.image ? (
                                            <div className="text-center z-0 relative animate-fade-in">
                                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                                </div>
                                                <p className="text-sm font-bold text-green-700">{files.image.name}</p>
                                                <p className="text-xs text-green-600 mt-1">Ready to upload</p>
                                            </div>
                                        ) : (
                                            <div className="text-center z-0 group-hover:-translate-y-1 transition-transform duration-300">
                                                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                    <Upload className="w-8 h-8 text-indigo-600" />
                                                </div>
                                                <p className="text-base font-semibold text-gray-700">Click or drag photo here</p>
                                                <p className="text-xs text-gray-400 mt-2">Supports JPG, PNG, WEBP (Max 5MB)</p>
                                            </div>
                                        )}

                                        {/* Decoration */}
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
                                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-100 to-transparent rounded-tr-full -ml-10 -mb-10 opacity-50 pointer-events-none"></div>
                                    </div>
                                </div>

                                {/* Document Uploads (Compact) */}
                                {['rc', 'insurance', 'puc'].map((docKey) => (
                                    <div key={docKey} className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">{docKey === 'rc' ? 'RC Document' : docKey === 'puc' ? 'PUC Certificate' : 'Insurance Policy'}</label>
                                        <div className={`
                                            relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300
                                            ${files[docKey]
                                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm'
                                                : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                                            }
                                        `}>
                                            <div className={`p-2.5 rounded-xl ${files[docKey] ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'} transition-colors`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${files[docKey] ? 'text-green-800' : 'text-gray-600'}`}>
                                                    {files[docKey] ? files[docKey].name : `Upload ${docKey.toUpperCase()}`}
                                                </p>
                                                {!files[docKey] && <p className="text-xs text-gray-400">PDF or Image</p>}
                                            </div>

                                            {files[docKey] ? (
                                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                            ) : (
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    Browse
                                                </span>
                                            )}

                                            <input
                                                type="file"
                                                name={docKey}
                                                accept=".pdf,image/*"
                                                required
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ))}

                            </div>
                        </div>

                        {/* Submit Actions */}

                        {/* Section 3: Terms & Agreement */}
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100/50 shadow-sm hover:shadow-md transition-shadow duration-300 group">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-lg shadow-sm text-indigo-600 shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">Sponsor Agreement</h3>
                                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                            By adding this vehicle, you agree to comply with RentHub's policies regarding vehicle maintenance, insurance validity, and 70/30 revenue share model.
                                        </p>

                                        <div
                                            onClick={() => setAgreed(!agreed)}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 select-none
                                                ${agreed
                                                    ? 'bg-white border-green-500 shadow-md shadow-green-100'
                                                    : 'bg-white/50 border-gray-200 hover:border-indigo-300 hover:bg-white'
                                                }
                                            `}
                                        >
                                            <div
                                                onClick={() => {
                                                    if (agreed) setAgreed(false);
                                                    else setShowTerms(true);
                                                }}
                                                className={`
                                                w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0
                                                ${agreed
                                                        ? 'bg-green-500 border-green-500 scale-110'
                                                        : 'bg-gray-50 border-gray-300'
                                                    }
                                            `}>
                                                <CheckCircle className={`w-4 h-4 text-white transition-opacity duration-200 ${agreed ? 'opacity-100' : 'opacity-0'}`} />
                                            </div>
                                            <span className={`text-sm font-semibold transition-colors flex-1 ${agreed ? 'text-green-700' : 'text-gray-600'}`}>
                                                I agree to the <button type="button" onClick={(e) => { e.stopPropagation(); setShowTerms(true); }} className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-2 decoration-indigo-200 hover:decoration-indigo-500 transition-all">Terms & Conditions</button>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex items-center justify-end gap-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate('/my-bikes')}
                                className="px-6 py-3.5 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !agreed}
                                className={`
                                    relative px-8 py-3.5 rounded-xl text-white font-bold shadow-lg overflow-hidden group
                                    ${loading || !agreed
                                        ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]'
                                    }
                                    transition-all duration-300
                                `}
                            >
                                <span className={`flex items-center gap-2 relative z-10 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                                    Submit Vehicle <CheckCircle className="w-5 h-5" />
                                </span>
                                {loading && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20">
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    </div>
                                )}
                                {/* Shine Effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                            </button>
                        </div>

                    </div>
                </form>
                <TermsPopup
                    isOpen={showTerms}
                    onClose={() => setShowTerms(false)}
                    onAccept={() => setAgreed(true)}
                />
            </div >
        </div >
    );
};

export default AddBike;
