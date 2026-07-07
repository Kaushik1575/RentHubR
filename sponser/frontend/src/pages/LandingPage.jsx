import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    BarChart3,
    Bike,
    ShieldCheck,
    Wallet,
    Zap,
    Menu,
    X,
    ChevronRight
} from 'lucide-react';

const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isAuthenticated = !!localStorage.getItem('token');

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden font-sans text-slate-800 selection:bg-brand-100 selection:text-brand-900">

            {/* ---------------- ENHANCED NAVBAR ---------------- */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                        ? "py-4 bg-white/80 backdrop-blur-lg shadow-lg border-b border-slate-200/50"
                        : "py-6 bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-full p-2 pr-3 border border-white/40 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-white/80">

                        {/* Logo Section */}
                        <div className="flex items-center gap-3 pl-2">
                            <div className="relative group cursor-pointer">
                                <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-cyan-400 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                                    R
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-cyan-600 leading-tight">
                                    RentHub
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Sponsor
                                </span>
                            </div>
                        </div>

                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center gap-8 px-8">
                            {["Features", "Earnings", "How it Works"].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                                    className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors relative group"
                                >
                                    {item}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 transition-all duration-300 group-hover:w-full"></span>
                                </a>
                            ))}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            <Link
                                to={isAuthenticated ? "/dashboard" : "/login"}
                                className="hidden sm:block text-sm font-semibold text-slate-700 hover:text-brand-700 px-4 py-2 rounded-full hover:bg-slate-100 transition-all"
                            >
                                {isAuthenticated ? "Dashboard" : "Sign In"}
                            </Link>
                            <Link
                                to={isAuthenticated ? "/dashboard" : "/register"}
                                className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 transition-all flex items-center gap-2 group"
                            >
                                {isAuthenticated ? "Enter App" : "Get Started"}
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            {/* Mobile Menu Toggle */}
                            <button
                                className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-full left-0 right-0 p-4 mx-4 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 md:hidden z-50"
                        >
                            <div className="flex flex-col gap-2">
                                {["Features", "Earnings", "How it Works"].map((item) => (
                                    <a key={item} href="#" className="px-4 py-3 rounded-xl hover:bg-slate-50 font-medium text-slate-700 flex justify-between items-center">
                                        {item}
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                    </a>
                                ))}
                                <div className="h-px bg-slate-100 my-2"></div>
                                <Link to="/login" className="px-4 py-3 rounded-xl hover:bg-slate-50 font-bold text-brand-600 text-center">
                                    Sign In
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ---------------- HERO SECTION ---------------- */}
            <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Elements */}
                {/* Top-Right Blob */}
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-100/40 to-brand-100/40 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob"></div>
                {/* Bottom-Left Blob */}
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-brand-100/40 to-purple-100/40 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-100 shadow-sm mb-8">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                                </span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Live: Instant Payouts Now Active</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                                Turn Your Vehicles into <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-500">
                                    Recurring Revenue
                                </span>
                            </h1>
                            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Join thousands of sponsors managing their fleets, tracking earnings, and growing their business with RentHub's advanced sponsor dashboard.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    to={isAuthenticated ? "/dashboard" : "/register"}
                                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {isAuthenticated ? "Go to Dashboard" : "Start Earning Today"}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                {!isAuthenticated && (
                                    <Link
                                        to="/login"
                                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-700 border border-slate-200 font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex items-center justify-center"
                                    >
                                        Sponsor Login
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ---------------- STATS SECTION ---------------- */}
            <section className="py-12 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
                        {[
                            { label: "Active Sponsors", value: "2,000+" },
                            { label: "Daily Bookings", value: "500+" },
                            { label: "Cities Covered", value: "15+" },
                            { label: "Total Payouts", value: "$3M+" },
                        ].map((stat, index) => (
                            <div key={index} className="px-4">
                                <div className="text-4xl font-bold text-slate-900 mb-1">{stat.value}</div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------------- FEATURES GRID ---------------- */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-lg font-bold text-brand-600 uppercase tracking-widest mb-2">Why Choose RentHub?</h2>
                        <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Everything You Need to Scale</h3>
                        <p className="text-xl text-slate-600">Powerful tools designed specifically for vehicle owners to maximize utilization and profits.</p>
                    </div>

                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        {[
                            {
                                icon: <BarChart3 className="w-8 h-8 text-white" />,
                                color: "bg-blue-500",
                                title: "Real-Time Analytics",
                                description: "Track your earnings, booking frequency, and vehicle performance in real-time with our intuitive dashboard."
                            },
                            {
                                icon: <Bike className="w-8 h-8 text-white" />,
                                color: "bg-emerald-500",
                                title: "Fleet Management",
                                description: "Easily add, update, or remove vehicles. Manage maintenance schedules and availability with just a few clicks."
                            },
                            {
                                icon: <Wallet className="w-8 h-8 text-white" />,
                                color: "bg-purple-500",
                                title: "Secure Payments",
                                description: "Get paid directly to your bank account with our automated and secure payout system. Transparent and fast."
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8 text-white" />,
                                color: "bg-orange-500",
                                title: "Verified Renters",
                                description: "Peace of mind comes standard. We verify every renter's identity and license before they can book your bike."
                            },
                            {
                                icon: <Zap className="w-8 h-8 text-white" />,
                                color: "bg-amber-500",
                                title: "Instant Booking",
                                description: "Accept bookings manually or set up instant approval criteria to accept more rides automatically."
                            },
                            {
                                icon: <ArrowRight className="w-8 h-8 text-white" />,
                                color: "bg-cyan-500",
                                title: "24/7 Support",
                                description: "Our dedicated sponsor support team is always available to help you resolve issues and optimize your business."
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                variants={fadeInUp}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ---------------- CTA SECTION ---------------- */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-900 z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-slate-900 to-black z-0"></div>

                {/* Abstract Shapes overlay */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 font-bold text-sm mb-6 backdrop-blur-sm">
                        🔥 Limited Time Offer: 0% Comission for First Month
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">Ready to Start Your Journey?</h2>
                    <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Join the fastest-growing community of bike sponsors and start earning passive income today.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/register"
                            className="px-10 py-5 rounded-full bg-white text-slate-900 font-bold text-lg hover:bg-brand-50 transition-all shadow-xl shadow-brand-900/50 hover:scale-105 flex items-center justify-center gap-2"
                        >
                            Create Sponsor Account <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/login"
                            className="px-10 py-5 rounded-full bg-transparent border border-white/20 text-white font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center"
                        >
                            Sponsor Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* ---------------- FOOTER ---------------- */}
            <footer className="bg-white py-16 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm">R</div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 leading-none">RentHub</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Sponsor</span>
                        </div>
                    </div>

                    <div className="flex gap-8 text-sm font-medium text-slate-500">
                        <a href="#" className="hover:text-slate-900 transition-colors">About Us</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Help</a>
                    </div>

                    <div className="text-slate-400 text-sm font-medium">
                        © {new Date().getFullYear()} RentHub Inc.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
