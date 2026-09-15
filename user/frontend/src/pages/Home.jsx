import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import HeroAvailabilityWidget from '../components/HeroAvailabilityWidget';
import FloatingBackground from '../components/FloatingBackground';
import './Home.css';

const Home = () => {
    const [bikes, setBikes] = useState([]);
    const [scooters, setScooters] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [offers, setOffers] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Search and sort states
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortBy, setSortBy] = useState('default');

    // FAQ open index state
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    // Reviews continuous marquee state
    const [isReviewPaused, setIsReviewPaused] = useState(false);

    // Availability search states
    const [activeAvailabilityQuery, setActiveAvailabilityQuery] = useState(null);
    const [availabilityResults, setAvailabilityResults] = useState({});
    const [isSearchingAvailability, setIsSearchingAvailability] = useState(false);

    const navigate = useNavigate();

    // Live Timer for auto-refreshing offer states
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const [bikesRes, scootersRes, carsRes] = await Promise.all([
                    fetch('/api/vehicles/bikes'),
                    fetch('/api/vehicles/scooty'),
                    fetch('/api/vehicles/cars')
                ]);

                const bikesData = await bikesRes.json();
                const scootersData = await scootersRes.json();
                const carsData = await carsRes.json();

                setBikes((bikesData || []).filter(v => v.is_available));
                setScooters((scootersData || []).filter(v => v.is_available));
                setCars((carsData || []).filter(v => v.is_available));
            } catch (error) {
                console.error('Error loading vehicles:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchOffers = async () => {
            try {
                const res = await fetch('/api/offers/active');
                const data = await res.json();
                if (data.success) setOffers(data.offers);
            } catch (err) {
                console.error('Error loading offers:', err);
            }
        };

        fetchVehicles();
        fetchOffers();
    }, []);

    // Handle Availability Fleet Search
    const handleSearchAvailability = async (query) => {
        setIsSearchingAvailability(true);
        try {
            const res = await fetch('/api/vehicles/check-fleet-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(query)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const map = {};
                (data.results || []).forEach(r => {
                    map[r.id] = r;
                });
                setAvailabilityResults(map);
                setActiveAvailabilityQuery(query);

                // Auto filter category tab if user searched specific category
                if (query.vehicleType === 'bike') {
                    scrollToSection('bikes-section');
                } else if (query.vehicleType === 'scooty') {
                    scrollToSection('scooters-section');
                } else if (query.vehicleType === 'car') {
                    scrollToSection('cars-section');
                } else {
                    const el = document.getElementById('vehicle-showcase-section');
                    if (el) {
                        const offset = 80;
                        const bodyRect = document.body.getBoundingClientRect().top;
                        const elRect = el.getBoundingClientRect().top;
                        window.scrollTo({
                            top: elRect - bodyRect - offset,
                            behavior: 'smooth'
                        });
                    }
                }

                toast.success(`Found ${data.summary.availableCount} available rides for your slot!`);
            } else {
                toast.error(data.error || 'Failed to check availability.');
            }
        } catch (err) {
            console.error('Error checking fleet availability:', err);
            toast.error('Network error checking availability.');
        } finally {
            setIsSearchingAvailability(false);
        }
    };

    const handleResetAvailability = () => {
        setActiveAvailabilityQuery(null);
        setAvailabilityResults({});
        toast.success('Availability filter reset. Showing full fleet.');
    };

    // Scroll to specific section
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 120;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveCategory(id);
        } else if (id === 'All') {
            const el = document.getElementById('vehicle-showcase-section');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
            setActiveCategory('All');
        }
    };

    // Filter and Sort helper
    const filterAndSortVehicles = (list) => {
        let items = [...list];
        if (searchKeyword.trim()) {
            const q = searchKeyword.toLowerCase();
            items = items.filter(v => 
                v.name?.toLowerCase().includes(q) || 
                v.engine?.toLowerCase().includes(q) || 
                v.fuel_type?.toLowerCase().includes(q)
            );
        }
        if (sortBy === 'price-asc') {
            items.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        } else if (sortBy === 'price-desc') {
            items.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        }
        return items;
    };

    // Industrial Vehicle Card Component
    const VehicleCard = ({ vehicle, type }) => {
        const rating = (4.6 + ((vehicle.id % 5) * 0.08)).toFixed(1);
        const avail = activeAvailabilityQuery ? availabilityResults[vehicle.id] : null;
        const isAvailableForSlot = avail ? avail.isAvailable : true;

        let rentUrl = `/booking-form?vehicleId=${vehicle.id}&type=${type}`;
        if (activeAvailabilityQuery) {
            rentUrl += `&startDate=${activeAvailabilityQuery.startDate}&startTime=${activeAvailabilityQuery.startTime}&duration=${activeAvailabilityQuery.duration}`;
        }

        const handleCardMouseMove = (e) => {
            const card = e.currentTarget;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rotX = ((y - cy) / cy) * -7;
            const rotY = ((x - cx) / cx) * 7;
            card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-5px)`;
            card.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
            card.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
            card.style.setProperty('--glare-opacity', '1');
        };

        const handleCardMouseLeave = (e) => {
            const card = e.currentTarget;
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
            card.style.setProperty('--glare-opacity', '0');
        };

        return (
            <div 
                className="industrial-vehicle-card" 
                data-id={vehicle.id} 
                data-type={type}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                style={{
                    opacity: (avail && !isAvailableForSlot) ? 0.78 : 1,
                    borderColor: (avail && isAvailableForSlot) ? '#10b981' : (avail && !isAvailableForSlot) ? '#fca5a5' : undefined
                }}
            >
                {/* 3D Holographic Specular Glare */}
                <div className="card-glare-overlay" aria-hidden="true" />

                {/* Visual Top Preview */}
                <div className="card-top-preview">
                    <Link to={`/vehicle/${type}/${vehicle.id}`} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                            src={vehicle.image_url} 
                            alt={vehicle.name} 
                            className="card-vehicle-image" 
                            loading="lazy"
                        />
                    </Link>

                    {/* Category Type Pill */}
                    <span className={`card-type-pill ${type === 'car' ? 'pill-car' : type === 'scooty' ? 'pill-scooty' : 'pill-bike'}`}>
                        {type === 'car' ? '🚗 Car' : type === 'scooty' ? '🛵 Scooty' : '🏍️ Bike'}
                    </span>

                    {/* Star Rating & Review Count Badge */}
                    <span className="card-rating-badge">
                        <i className="fas fa-star"></i> {rating}
                        <span style={{ fontSize: '0.68rem', color: '#78350f', marginLeft: '3px', fontWeight: '700' }}>
                            ({24 + ((vehicle.id * 7) % 38)})
                        </span>
                    </span>

                    {/* Live Availability Status Bar if Slot Checked */}
                    {activeAvailabilityQuery && (
                        <div className={`card-slot-banner ${isAvailableForSlot ? 'slot-available' : 'slot-booked'}`}>
                            <i className={isAvailableForSlot ? "fas fa-check-circle" : "fas fa-ban"}></i>
                            {isAvailableForSlot ? 'Available for selected slot' : (avail.reason || 'Booked for this time')}
                        </div>
                    )}
                </div>

                {/* Card Content Body */}
                <div className="card-body-content">
                    <div>
                        <div className="card-title-row">
                            <Link to={`/vehicle/${type}/${vehicle.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <h3 className="card-vehicle-title">{vehicle.name}</h3>
                            </Link>
                        </div>

                        {/* High-Contrast Spec Tags */}
                        <div className="card-spec-tags-grid">
                            <span className="spec-badge-item">
                                <i className="fas fa-microchip"></i> {vehicle.engine || (type === 'car' ? '1200cc' : '150cc')}
                            </span>
                            <span className="spec-badge-item">
                                <i className="fas fa-gas-pump"></i> {vehicle.fuel_type || 'Petrol'}
                            </span>
                            <span className="spec-badge-item">
                                <i className="fas fa-cog"></i> Manual
                            </span>
                            <span className="spec-badge-item">
                                <i className="fas fa-shield-alt"></i> Insured
                            </span>
                        </div>
                    </div>

                    {/* Footer: Pricing & Action Buttons */}
                    <div className="card-action-footer">
                        <div className="card-pricing-block">
                            {avail && isAvailableForSlot ? (
                                <>
                                    <span className="price-main-value" style={{ color: '#059669' }}>
                                        ₹{avail.estimatedTotal}
                                    </span>
                                    <span className="price-hourly-sub">
                                        For {activeAvailabilityQuery.duration}h (₹{vehicle.price}/hr)
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="price-main-value">
                                        ₹{vehicle.price}
                                    </span>
                                    <span className="price-hourly-sub">
                                        Per hour • ₹{(vehicle.price * 10).toLocaleString()} / day
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="card-cta-buttons">
                            <Link to={`/vehicle/${type}/${vehicle.id}`} className="btn-card-specs" title="View vehicle technical specifications">
                                Specs
                            </Link>

                            {isAvailableForSlot ? (
                                <Link 
                                    to={rentUrl} 
                                    className="btn-card-rent"
                                    style={{
                                        background: activeAvailabilityQuery ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : undefined
                                    }}
                                >
                                    {activeAvailabilityQuery ? 'Book Slot' : 'Rent Now'} <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
                                </Link>
                            ) : (
                                <Link to={`/vehicle/${type}/${vehicle.id}`} className="btn-card-specs" style={{ color: '#dc2626' }}>
                                    Check Dates
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Filtered lists
    const filteredBikes = filterAndSortVehicles(bikes);
    const filteredScooters = filterAndSortVehicles(scooters);
    const filteredCars = filterAndSortVehicles(cars);
    const totalVehiclesCount = filteredBikes.length + filteredScooters.length + filteredCars.length;

    // FAQ Items
    const faqs = [
        {
            q: 'What documents are required to rent a bike or car?',
            a: 'You only need a valid original Government Driving License (Motorcycle with Gear / LMV) and an Aadhaar card or Passport for identity verification. Verification is 100% digital and takes under 60 seconds.'
        },
        {
            q: 'How does the 30% advance token work?',
            a: 'To guarantee your slot without holding large deposits, you only pay a 30% advance token online via UPI, NetBanking, or Cards. The remaining 70% is payable at the pickup hub upon vehicle handover.'
        },
        {
            q: 'Is fuel included in the hourly rental rate?',
            a: 'Vehicles are handed over with a full or standard tank. You can return the vehicle with the same fuel level, giving you complete freedom without inflated fuel surcharges.'
        },
        {
            q: 'What if my vehicle encounters a flat tyre or emergency on the road?',
            a: 'All RentHub bookings come with complimentary 24/7 Roadside Voice AI SOS Support ("Aarohi"). Our AI dispatches an authorized recovery vehicle or mobile mechanic directly to your live GPS location.'
        },
        {
            q: 'Can I extend my booking duration if my trip gets delayed?',
            a: 'Yes, absolutely! You can extend your active rental directly from your "My Bookings" dashboard with one tap, provided the vehicle is not pre-reserved by another rider for that subsequent slot.'
        }
    ];

    // Rich Verified Customer Reviews Data for the Slider
    const testimonials = [
        {
            id: 1,
            name: "Ankit Roy",
            avatar: "AR",
            avatarBg: "linear-gradient(135deg, #059669 0%, #3b82f6 100%)",
            location: "Bengaluru",
            vehicle: "Royal Enfield Himalayan 450",
            type: "bike",
            tripType: "Spiti Valley Expedition • 6 Days",
            rating: 5,
            date: "2 days ago",
            tag: "Mountain Trail",
            tagColor: "#047857",
            tagBg: "#ecfdf5",
            quote: "Rented the new Himalayan 450 for our Spiti circuit. The bike was fresh out of 28-point inspection with brand new Ceat dual-sport tyres. The 30% advance token made reservation instantaneous without holding huge deposit funds!"
        },
        {
            id: 2,
            name: "Pooja Sharma",
            avatar: "PS",
            avatarBg: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
            location: "Delhi NCR",
            vehicle: "Honda Activa 6G",
            type: "scooty",
            tripType: "City Commute & Client Meets • 2 Days",
            rating: 5,
            date: "Yesterday",
            tag: "Urban Mobility",
            tagColor: "#7c3aed",
            tagBg: "#f5f3ff",
            quote: "The contactless QR gate-pass system is so futuristic! I arrived at the Connaught Place hub, scanned the pass from my phone, received sanitized keys with two clean helmets, and zoomed away in under 90 seconds."
        },
        {
            id: 3,
            name: "Vikram Kulkarni",
            avatar: "VK",
            avatarBg: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
            location: "Mumbai",
            vehicle: "Hyundai Creta SX (O)",
            type: "car",
            tripType: "Mahabaleshwar Family Trip • 3 Days",
            rating: 5,
            date: "3 days ago",
            tag: "Family Highway",
            tagColor: "#0284c7",
            tagBg: "#f0f9ff",
            quote: "100% transparent pricing with zero surprise charges. Plus the 24/7 AI roadside SOS ('Aarohi') gave my entire family peace of mind on night ghat drives. The car was spotless with crisp dual-zone AC."
        },
        {
            id: 4,
            name: "Rohan Deshmukh",
            avatar: "RD",
            avatarBg: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
            location: "Pune",
            vehicle: "KTM Duke 390 Gen-3",
            type: "bike",
            tripType: "Lavasa Ghats Cornering • 1 Day",
            rating: 5,
            date: "4 days ago",
            tag: "Apex Performance",
            tagColor: "#c2410c",
            tagBg: "#fff7ed",
            quote: "Incredible machine condition! The quickshifter slipped into gear effortlessly and the dual-channel ABS gave supreme bite. The pre-handover digital gauge telemetry check on my phone is pure racing-grade attention to detail."
        },
        {
            id: 5,
            name: "Sneha Nair",
            avatar: "SN",
            avatarBg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            location: "Kochi",
            vehicle: "Mahindra Thar 4x4 AT",
            type: "car",
            tripType: "Munnar Off-Road Trail • 4 Days",
            rating: 5,
            date: "5 days ago",
            tag: "4x4 Adventure",
            tagColor: "#0f766e",
            tagBg: "#f0fdfa",
            quote: "Climbed steep rocky tea plantation slopes without breaking a sweat. The 4x4 low-range was silky smooth. Handover took 2 minutes at the airport hub and the security refund was instantly credited back to UPI."
        },
        {
            id: 6,
            name: "Aditya Mehta",
            avatar: "AM",
            avatarBg: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
            location: "Hyderabad",
            vehicle: "BMW G 310 GS",
            type: "bike",
            tripType: "Hampi Heritage Cruise • 3 Days",
            rating: 5,
            date: "1 week ago",
            tag: "Touring Sprint",
            tagColor: "#4338ca",
            tagBg: "#eef2ff",
            quote: "Top tier hospitality! Rented for an interstate sprint from Hyderabad to Hampi. Upright touring ergonomics, zero handlebar buzzing, and returning with the same fuel level saved me from overpriced fuel penalty gimmicks."
        },
        {
            id: 7,
            name: "Kavya Venkatesh",
            avatar: "KV",
            avatarBg: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
            location: "Chennai",
            vehicle: "Yamaha MT-15 V2",
            type: "bike",
            tripType: "ECR Coastal Night Sprint • 2 Days",
            rating: 5,
            date: "1 week ago",
            tag: "Coastal Ride",
            tagColor: "#0891b2",
            tagBg: "#ecfeff",
            quote: "Unbeatable 48+ kmpl mileage along East Coast Road and lightweight agility in evening rush hour. The one-tap trip extension button on the RentHub portal let us extend by 5 hours seamlessly with no phone calls!"
        },
        {
            id: 8,
            name: "Harsh Vardhan",
            avatar: "HV",
            avatarBg: "linear-gradient(135deg, #10b981 0%, #2563eb 100%)",
            location: "Chandigarh",
            vehicle: "Tata Nexon EV Max",
            type: "car",
            tripType: "Kasauli Mountain Retreat • 2 Days",
            rating: 5,
            date: "2 weeks ago",
            tag: "Electric Eco",
            tagColor: "#1d4ed8",
            tagBg: "#eff6ff",
            quote: "First time driving an electric vehicle in the Himalayas! Picked up at 100% battery with 400+ km range. The downhill regenerative braking recharged the battery by 9% going down Kalka. Unbelievable comfort!"
        }
    ];

    // Duplicated testimonials for seamless infinite marquee scroll
    const marqueeReviews = [...testimonials, ...testimonials];

    return (
        <main className="home-page-main">

            {/* 1. SCENIC HERO IMAGE BANNER (Clear, Crisp, High-Res, No Blur, No Text) */}
            <section className="scenic-hero-banner">
                <img 
                    src="https://wallpaperaccess.com/full/526697.jpg" 
                    alt="Scenic Mountain Road Adventure" 
                    className="scenic-hero-img"
                    loading="eager"
                />
            </section>

            {/* 2. DEDICATED BOOKING SEARCH & PLATFORM HIGHLIGHTS (Directly Below Image) */}
            <section className="hero-booking-dock-section">
                {/* Floating Canvas Physics Background with Live Twin Speedometer & Odometer */}
                <FloatingBackground density={28} meterType="speedo" />

                <div className="section-container">
                    <div className="hero-headline-wrap">
                        <div className="hero-trust-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <img 
                                src="/renthub-logo.png" 
                                alt="RentHub" 
                                style={{ 
                                    width: '26px', 
                                    height: '26px', 
                                    borderRadius: '50%', 
                                    objectFit: 'cover',
                                    border: '1.5px solid #00D8FF',
                                    boxShadow: '0 0 10px rgba(0, 195, 255, 0.75)'
                                }} 
                            />
                            <span>RentHub Enterprise Mobility • Instant QR Gate-Pass Ready</span>
                        </div>

                        <h1 className="hero-main-title">
                            Rent High-Performance <span className="headline-gradient">Bikes & Cars</span> In Seconds
                        </h1>

                        <p className="hero-main-desc">
                            Experience frictionless self-drive rentals with zero paperwork, transparent hourly rates, 
                            100% sanitized vehicles, and 24/7 AI roadside assistance.
                        </p>
                    </div>

                    {/* Check Availability Widget (Clean & Unobstructed, Below Image) */}
                    <div className="hero-search-container">
                        <HeroAvailabilityWidget
                            onSearch={handleSearchAvailability}
                            isSearching={isSearchingAvailability}
                            activeQuery={activeAvailabilityQuery}
                            onReset={handleResetAvailability}
                        />
                    </div>

                    {/* Live Platform Stats Strip */}
                    <div className="hero-stats-row-light">
                        <div className="stat-card-light">
                            <div className="stat-icon-halo halo-emerald">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <div className="stat-content">
                                <span className="stat-number">15,000+</span>
                                <span className="stat-label">Verified Trips</span>
                            </div>
                        </div>

                        <div className="stat-card-light">
                            <div className="stat-icon-halo halo-blue">
                                <i className="fas fa-bolt"></i>
                            </div>
                            <div className="stat-content">
                                <span className="stat-number">2 Mins</span>
                                <span className="stat-label">Digital Pass</span>
                            </div>
                        </div>

                        <div className="stat-card-light">
                            <div className="stat-icon-halo halo-amber">
                                <i className="fas fa-star"></i>
                            </div>
                            <div className="stat-content">
                                <span className="stat-number">4.9 / 5</span>
                                <span className="stat-label">Rider Rating</span>
                            </div>
                        </div>

                        <div className="stat-card-light">
                            <div className="stat-icon-halo halo-purple">
                                <i className="fas fa-headset"></i>
                            </div>
                            <div className="stat-content">
                                <span className="stat-number">24x7</span>
                                <span className="stat-label">Voice AI SOS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* 2. DYNAMIC FESTIVE & PROMO DEALS SECTION */}
            {offers && offers.length > 0 && (
                <section className="offers-section">
                    <FloatingBackground density={16} meterType="none" />
                    <div className="section-container">
                        <div className="section-title-wrap">
                            <span className="section-badge badge-indigo">
                                <i className="fas fa-sparkles"></i> Limited Time Perks
                            </span>
                            <h2 className="section-heading">Exclusive Seasonal Rewards</h2>
                            <p className="section-subtitle">
                                Save more on your weekend getaways and daily commutes with our verified promo vouchers.
                            </p>
                        </div>

                        <div className="offers-ribbon" id="offers-container">
                            {offers.map(offer => {
                                const isFuture = offer.start_date && new Date(offer.start_date) > currentTime;
                                return (
                                    <div key={offer.id} className="offer-ticket-card">
                                        <div className="offer-ticket-header">
                                            <img 
                                                src={offer.image_url || 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&q=80&w=800'} 
                                                alt={offer.title} 
                                                className="offer-ticket-img"
                                            />
                                            <div className="offer-discount-ribbon">
                                                {offer.discount_percentage ? `${offer.discount_percentage}% OFF` : `₹${offer.flat_discount} OFF`}
                                            </div>
                                            <div className="offer-expiry-pill">
                                                {isFuture ? '📅 Upcoming' : `Expires ${offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Soon'}`}
                                            </div>
                                        </div>

                                        <div className="offer-ticket-body">
                                            <div>
                                                <h3 className="offer-ticket-title">{offer.title}</h3>
                                                <p className="offer-ticket-desc">{offer.description}</p>
                                            </div>

                                            <div className="offer-promo-action">
                                                <div>
                                                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Promo Voucher</span>
                                                    <div className="promo-code-display">{isFuture ? '••••••' : offer.code}</div>
                                                </div>
                                                <button 
                                                    className="copy-voucher-btn"
                                                    disabled={isFuture}
                                                    onClick={(e) => {
                                                        if (isFuture) return;
                                                        navigator.clipboard.writeText(offer.code);
                                                        toast.success(`Copied "${offer.code}" to clipboard!`);
                                                        const btn = e.currentTarget;
                                                        const orig = btn.innerHTML;
                                                        btn.innerHTML = '<i class="fas fa-check"></i> Copied';
                                                        btn.style.background = '#10b981';
                                                        setTimeout(() => {
                                                            btn.innerHTML = orig;
                                                            btn.style.background = '#3b82f6';
                                                        }, 2000);
                                                    }}
                                                >
                                                    <i className="far fa-copy"></i> Copy
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}


            {/* 3. FLEET SHOWCASE & CONTROL TOOLBAR */}
            <section className="fleet-showcase-section" id="vehicle-showcase-section">
                <FloatingBackground density={24} meterType="none" />
                <div className="section-container">
                    
                    <div className="section-title-wrap">
                        <span className="section-badge badge-emerald">
                            <i className="fas fa-motorcycle"></i> Verified Fleet Catalog
                        </span>
                        <h2 className="section-heading">Featured Vehicles & Bikes</h2>
                        <p className="section-subtitle">
                            Choose from our meticulously maintained fleet of high-performance motorcycles, scooters, and cars.
                        </p>
                    </div>

                    {/* STICKY CONTROL TOOLBAR (Category Pills, Search, Sort) */}
                    <div className="fleet-control-toolbar">
                        <div className="toolbar-category-pills">
                            {[
                                { name: 'All', id: 'All', icon: '✨', count: totalVehiclesCount },
                                { name: 'Bikes', id: 'bikes-section', icon: '🏍️', count: filteredBikes.length },
                                { name: 'Scooty', id: 'scooters-section', icon: '🛵', count: filteredScooters.length },
                                { name: 'Cars', id: 'cars-section', icon: '🚗', count: filteredCars.length },
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    className={`category-pill-btn ${activeCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => scrollToSection(cat.id)}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                    <span className="pill-count-badge">{cat.count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="toolbar-actions">
                            <div className="toolbar-search-box">
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search by vehicle name..."
                                    className="toolbar-search-input"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                />
                            </div>

                            <select 
                                className="toolbar-sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="default">Sort: Recommended</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* BIKES SECTION (With Left & Right Speedometers) */}
            {(activeCategory === 'All' || activeCategory === 'bikes-section') && (
                <section className="fleet-category-section fleet-bike-section" id="bikes-section">
                    <FloatingBackground density={14} meterType="bike" />
                    <div className="section-container">
                        <div className="fleet-category-headline-wrap">
                            <div className="fleet-category-trust-badge">
                                <span className="category-badge-dot"></span>
                                <span>High-Torque Performance • {filteredBikes.length} Bikes Available</span>
                            </div>
                            <h2 className="fleet-category-main-heading">
                                🏍️ Motorcycles & Sport Bikes
                            </h2>
                            <p className="fleet-category-sub-heading">
                                Track-tuned superbikes, rugged Himalayan tourers, and nimble street commuters.
                            </p>
                        </div>

                        <div className="fleet-cards-grid" id="bikesGrid">
                            {loading ? (
                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b' }}>Loading premium bikes...</p>
                            ) : filteredBikes.length > 0 ? (
                                filteredBikes.map(bike => <VehicleCard key={bike.id} vehicle={bike} type="bike" />)
                            ) : (
                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b', padding: '40px' }}>
                                    No bikes match your current search criteria.
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* SCOOTERS SECTION (With Left & Right Speedometers) */}
            {(activeCategory === 'All' || activeCategory === 'scooters-section') && (
                <section className="fleet-category-section fleet-scooty-section" id="scooters-section">
                    <FloatingBackground density={14} meterType="scooty" />
                    <div className="section-container">
                        <div className="fleet-category-headline-wrap">
                            <div className="fleet-category-trust-badge badge-emerald">
                                <span className="category-badge-dot dot-emerald"></span>
                                <span>Urban Agility & EV • {filteredScooters.length} Scooters Available</span>
                            </div>
                            <h2 className="fleet-category-main-heading">
                                🛵 City Scooters & Gearless
                            </h2>
                            <p className="fleet-category-sub-heading">
                                Lightweight, fuel-efficient, and effortless automatic rides for swift city commutes.
                            </p>
                        </div>

                        <div className="fleet-cards-grid" id="scootyGrid">
                            {loading ? (
                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b' }}>Loading scooters...</p>
                            ) : filteredScooters.length > 0 ? (
                                filteredScooters.map(scooter => <VehicleCard key={scooter.id} vehicle={scooter} type="scooty" />)
                            ) : (
                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b', padding: '40px' }}>
                                    No scooters match your current search criteria.
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* CARS SECTION (With Left & Right Speedometers) */}
            {(activeCategory === 'All' || activeCategory === 'cars-section') && (
                <section className="fleet-category-section fleet-car-section" id="cars-section">
                    <FloatingBackground density={14} meterType="car" />
                    <div className="section-container">
                        <div className="fleet-category-headline-wrap">
                            <div className="fleet-category-trust-badge badge-blue">
                                <span className="category-badge-dot dot-blue"></span>
                                <span>Comfort & 4x4 Tourers • {filteredCars.length} Cars Available</span>
                            </div>
                            <h2 className="fleet-category-main-heading">
                                🚗 Premium Sedans & SUVs
                            </h2>
                            <p className="fleet-category-sub-heading">
                                Spacious family cruisers, all-weather 4x4 machines, and smooth highway sedans.
                            </p>
                        </div>

                        <div className="fleet-cards-grid" id="carsGrid">
                            {loading ? (
                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b' }}>Loading cars...</p>
                            ) : filteredCars.length > 0 ? (
                                filteredCars.map(car => <VehicleCard key={car.id} vehicle={car} type="car" />)
                            ) : (
                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b', padding: '40px' }}>
                                    No cars match your current search criteria.
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            )}


            {/* 4. HOW IT WORKS - 4-STEP INDUSTRIAL MILESTONE FLOW */}
            <section className="how-it-works-section">
                <FloatingBackground density={14} meterType="none" />
                <div className="section-container">
                    <div className="section-title-wrap">
                        <span className="section-badge badge-emerald">
                            <i className="fas fa-route"></i> Streamlined Process
                        </span>
                        <h2 className="section-heading">How RentHub Works</h2>
                        <p className="section-subtitle">
                            Zero cumbersome paperwork. Reserve, verify, and hit the highway in 4 easy milestones.
                        </p>
                    </div>

                    <div className="process-steps-grid">
                        <div className="process-card">
                            <span className="step-number-pill">01</span>
                            <div className="process-icon-wrap icon-emerald">
                                <i className="fas fa-calendar-alt"></i>
                            </div>
                            <h3 className="process-card-title">1. Choose & Schedule</h3>
                            <p className="process-card-desc">
                                Select your favorite bike or car, pick your start date, time, and custom rental duration.
                            </p>
                        </div>

                        <div className="process-card">
                            <span className="step-number-pill">02</span>
                            <div className="process-icon-wrap icon-amber">
                                <i className="fas fa-wallet"></i>
                            </div>
                            <h3 className="process-card-title">2. Pay 30% Token</h3>
                            <p className="process-card-desc">
                                Secure your vehicle reservation instantly with a 30% advance token. Pay the rest at handover.
                            </p>
                        </div>

                        <div className="process-card">
                            <span className="step-number-pill">03</span>
                            <div className="process-icon-wrap icon-blue">
                                <i className="fas fa-qrcode"></i>
                            </div>
                            <h3 className="process-card-title">3. Instant QR Gate-Pass</h3>
                            <p className="process-card-desc">
                                Receive a contactless QR digital gate-pass and automated legal deed invoice directly on your phone.
                            </p>
                        </div>

                        <div className="process-card">
                            <span className="step-number-pill">04</span>
                            <div className="process-icon-wrap icon-purple">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <h3 className="process-card-title">4. Zoom & AI SOS</h3>
                            <p className="process-card-desc">
                                Pick up keys at our hub and ride with complete peace of mind backed by 24/7 AI Voice SOS ('Aarohi').
                            </p>
                        </div>
                    </div>
                </div>
            </section>


            {/* 5. WHY RENTHUB - ENTERPRISE ADVANTAGE GRID */}
            <section className="why-renthub-section">
                <FloatingBackground density={14} meterType="none" />
                <div className="section-container">
                    <div className="section-title-wrap">
                        <span className="section-badge badge-indigo">
                            <i className="fas fa-gem"></i> The RentHub Edge
                        </span>
                        <h2 className="section-heading">Why Discerning Riders Choose Us</h2>
                        <p className="section-subtitle">
                            Engineered for safety, transparency, and top-tier performance on every single trip.
                        </p>
                    </div>

                    <div className="advantage-cards-grid">
                        <div className="advantage-card">
                            <div className="advantage-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                                <i className="fas fa-receipt"></i>
                            </div>
                            <div className="advantage-content">
                                <h4>Zero Hidden Charges</h4>
                                <p>100% transparent pricing with honest hourly and daily rates. No surprise taxes or hidden fees.</p>
                            </div>
                        </div>

                        <div className="advantage-card">
                            <div className="advantage-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                <i className="fas fa-robot"></i>
                            </div>
                            <div className="advantage-content">
                                <h4>24/7 Voice AI Roadside SOS</h4>
                                <p>Instant intelligent roadside assistance with automated dispatch of mobile mechanics across all corridors.</p>
                            </div>
                        </div>

                        <div className="advantage-card">
                            <div className="advantage-icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>
                                <i className="fas fa-sparkles"></i>
                            </div>
                            <div className="advantage-content">
                                <h4>Sanitized & Certified Fleet</h4>
                                <p>Every vehicle undergoes a 28-point technical inspection and deep steam sanitization before every handover.</p>
                            </div>
                        </div>

                        <div className="advantage-card">
                            <div className="advantage-icon-box" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className="advantage-content">
                                <h4>One-Tap Trip Extensions</h4>
                                <p>Plans changed? Easily extend your active rental slot on the fly with live dashboard availability synchronization.</p>
                            </div>
                        </div>

                        <div className="advantage-card">
                            <div className="advantage-icon-box" style={{ background: '#fdf2f8', color: '#db2777' }}>
                                <i className="fas fa-coins"></i>
                            </div>
                            <div className="advantage-content">
                                <h4>RentHub Loyalty Rewards</h4>
                                <p>Earn reward credits on every completed trip and redeem them for free hours and seasonal festival discounts.</p>
                            </div>
                        </div>

                        <div className="advantage-card">
                            <div className="advantage-icon-box" style={{ background: '#f0fdfa', color: '#0d9488' }}>
                                <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <div className="advantage-content">
                                <h4>Express Hub Handover</h4>
                                <p>Walk in with your QR gate-pass and ride out within 2 minutes. Fast, polite, and completely contactless.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* 6. VERIFIED RIDER TESTIMONIALS */}
            <section className="testimonials-section">
                <FloatingBackground density={14} meterType="none" />
                <div className="section-container">
                    <div className="section-title-wrap">
                        <span className="section-badge badge-emerald">
                            <i className="fas fa-comment-dots"></i> Community Trust
                        </span>
                        <h2 className="section-heading">Loved By 15,000+ Explorers</h2>
                        <p className="section-subtitle">
                            Hear real stories from weekend adventurers, daily commuters, and cross-country road trippers.
                        </p>
                    </div>

                    {/* CONTINUOUS INFINITE MARQUEE SLIDER */}
                    <div className="review-marquee-wrapper">
                        {/* SLIDER TOP CONTROLS & RATING TRUST BAR */}
                        <div className="review-slider-header-bar">
                            <div className="review-trust-summary">
                                <div className="trust-stars-badge">
                                    <i className="fas fa-star"></i>
                                    <span className="trust-score">4.98 / 5.0</span>
                                </div>
                                <span className="trust-divider">•</span>
                                <span className="trust-meta-text">
                                    <i className="fas fa-shield-alt" style={{ color: '#10b981', marginRight: '5px' }}></i>
                                    <strong>15,200+</strong> Verified Rider Reviews
                                </span>
                            </div>

                            {/* MARQUEE STREAM STATUS & PAUSE / RESUME TOGGLE */}
                            <div className="review-marquee-controls">
                                <div className="review-live-pulse-badge">
                                    <span className="review-pulse-dot"></span>
                                    <span>Continuous Stream</span>
                                </div>

                                <button 
                                    className={`review-marquee-toggle-btn ${isReviewPaused ? 'is-paused' : ''}`}
                                    onClick={() => setIsReviewPaused(!isReviewPaused)}
                                    title={isReviewPaused ? "Resume continuous scroll" : "Pause scroll"}
                                    aria-label={isReviewPaused ? "Resume scroll" : "Pause scroll"}
                                >
                                    <i className={isReviewPaused ? "fas fa-play" : "fas fa-pause"}></i>
                                    <span>{isReviewPaused ? 'Resume' : 'Pause'}</span>
                                </button>
                            </div>
                        </div>

                        {/* MARQUEE TRACK OVERFLOW CONTAINER WITH SEAMLESS EDGE FADES */}
                        <div 
                            className="review-marquee-container"
                            onMouseEnter={() => setIsReviewPaused(true)}
                            onMouseLeave={() => setIsReviewPaused(false)}
                        >
                            <div 
                                className={`review-marquee-track ${isReviewPaused ? 'paused' : ''}`}
                            >
                                {marqueeReviews.map((review, idx) => (
                                    <div 
                                        key={`${review.id}-${idx}`} 
                                        className="review-marquee-item"
                                    >
                                        <div className="review-card-modern">
                                            {/* Card Top Row: Rating, Category Tag */}
                                            <div className="review-card-top">
                                                <div className="review-stars-row">
                                                    {[...Array(review.rating)].map((_, i) => (
                                                        <i key={i} className="fas fa-star"></i>
                                                    ))}
                                                    <span className="review-score-tag">5.0</span>
                                                </div>

                                                <span 
                                                    className="review-category-pill"
                                                    style={{ color: review.tagColor, background: review.tagBg }}
                                                >
                                                    {review.tag}
                                                </span>
                                            </div>

                                            {/* Quote */}
                                            <div className="review-quote-body">
                                                <i className="fas fa-quote-left quote-icon-bg"></i>
                                                <p className="review-quote-text">
                                                    "{review.quote}"
                                                </p>
                                            </div>

                                            {/* Vehicle & Trip Chip */}
                                            <div className="review-trip-chip">
                                                <i className={review.type === 'car' ? "fas fa-car" : "fas fa-motorcycle"}></i>
                                                <span className="trip-vehicle-name">{review.vehicle}</span>
                                                <span className="trip-type-desc">• {review.tripType}</span>
                                            </div>

                                            {/* Author Footer */}
                                            <div className="review-author-footer">
                                                <div className="author-avatar-badge" style={{ background: review.avatarBg }}>
                                                    {review.avatar}
                                                </div>
                                                <div className="author-info-wrap">
                                                    <div className="author-name-row">
                                                        <h4 className="author-full-name">{review.name}</h4>
                                                        <span className="author-verified-check" title="Verified Rider">
                                                            <i className="fas fa-check-circle"></i>
                                                        </span>
                                                    </div>
                                                    <div className="author-sub-detail">
                                                        <span><i className="fas fa-map-marker-alt"></i> {review.location}</span>
                                                        <span className="detail-dot">•</span>
                                                        <span>{review.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BOTTOM STREAM STATUS BAR */}
                        <div className="review-slider-bottom-bar">
                            <div className="review-marquee-speed-info">
                                <i className="fas fa-bolt" style={{ color: '#10b981' }}></i>
                                <span>Always Moving Stream • Verified Community Stories</span>
                            </div>

                            <div className="review-slider-indicator-hint">
                                <i className="fas fa-hand-pointer"></i> Hover on any card to pause and read
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* 7. INTERACTIVE FAQ ACCORDION */}
            <section className="faq-section">
                <FloatingBackground density={12} meterType="none" />
                <div className="section-container">
                    <div className="section-title-wrap">
                        <span className="section-badge badge-indigo">
                            <i className="fas fa-question-circle"></i> Got Questions?
                        </span>
                        <h2 className="section-heading">Frequently Asked Questions</h2>
                        <p className="section-subtitle">
                            Everything you need to know about booking, security deposits, and vehicle pickup.
                        </p>
                    </div>

                    <div className="faq-accordion-list">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className={`faq-accordion-item ${openFaqIndex === idx ? 'faq-open' : ''}`}>
                                <button 
                                    className="faq-trigger-btn"
                                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                >
                                    <span>{faq.q}</span>
                                    <i className="fas fa-chevron-down"></i>
                                </button>
                                {openFaqIndex === idx && (
                                    <div className="faq-answer-body">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* 8. BOTTOM HIGH-CONVERSION CTA BANNER */}
            <section className="bottom-cta-banner">
                <div className="cta-banner-content">
                    <h2 className="cta-banner-title">Ready To Hit The Open Road?</h2>
                    <p className="cta-banner-desc">
                        Lock in your vehicle in under 2 minutes with a 30% advance token and download your instant QR gate-pass.
                    </p>
                    <button 
                        className="cta-action-btn"
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        <span>Find Your Ride Now</span>
                        <i className="fas fa-arrow-up"></i>
                    </button>
                </div>
            </section>

        </main>
    );
};

export default Home;
