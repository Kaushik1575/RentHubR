import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './Footer.css';

const Footer = () => {
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (!newsletterEmail || !newsletterEmail.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        setIsSubscribed(true);
        toast.success('🎉 Welcome to RentHub Explorers Club! ₹250 coupon sent to your inbox.');
        setNewsletterEmail('');
    };

    return (
        <footer className="renthub-modern-footer">
            {/* Ambient Background Glows */}
            <div className="footer-ambient-pod footer-glow-cyan" aria-hidden="true"></div>
            <div className="footer-ambient-pod footer-glow-emerald" aria-hidden="true"></div>

            <div className="footer-container">

                {/* 1. Value Proposition & Trust Strip */}
                <div className="footer-trust-strip">
                    <div className="trust-pillar-card">
                        <div className="trust-icon-box icon-cyan">
                            <i className="fas fa-qrcode"></i>
                        </div>
                        <div className="trust-info">
                            <h4>Instant QR Gate-Pass</h4>
                            <p>Contactless 90-sec key handover</p>
                        </div>
                    </div>

                    <div className="trust-pillar-card">
                        <div className="trust-icon-box icon-emerald">
                            <i className="fas fa-wallet"></i>
                        </div>
                        <div className="trust-info">
                            <h4>30% Advance Token</h4>
                            <p>Reserve slot without heavy deposit</p>
                        </div>
                    </div>

                    <div className="trust-pillar-card">
                        <div className="trust-icon-box icon-purple">
                            <i className="fas fa-robot"></i>
                        </div>
                        <div className="trust-info">
                            <h4>24/7 Voice AI SOS</h4>
                            <p>Live GPS recovery & roadside Aarohi</p>
                        </div>
                    </div>

                    <div className="trust-pillar-card">
                        <div className="trust-icon-box icon-amber">
                            <i className="fas fa-shield-alt"></i>
                        </div>
                        <div className="trust-info">
                            <h4>28-Point Sanitized</h4>
                            <p>Deep-steamed before every ride</p>
                        </div>
                    </div>
                </div>

                {/* 2. Newsletter & Exclusive Perks Strip */}
                <div className="footer-newsletter-banner">
                    <div className="newsletter-intro">
                        <div className="newsletter-badge">
                            <i className="fas fa-gift"></i>
                        </div>
                        <div className="newsletter-text">
                            <h3>Join RentHub Explorers Club</h3>
                            <p>
                                Subscribe for secret weekend vouchers and get <span className="highlight-perk">₹250 FLAT OFF</span> your next self-drive trip.
                            </p>
                        </div>
                    </div>

                    <form className="newsletter-form-dock" onSubmit={handleNewsletterSubmit}>
                        <div className="newsletter-input-wrap">
                            <i className="far fa-envelope"></i>
                            <input 
                                type="email" 
                                placeholder="Enter your email address..."
                                className="newsletter-email-input"
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="newsletter-submit-btn">
                            <span>{isSubscribed ? 'Subscribed!' : 'Claim ₹250 Off'}</span>
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    </form>
                </div>

                {/* 3. Main Multi-Column Navigation Grid */}
                <div className="footer-main-grid">

                    {/* Col 1: Brand Profile & Mission */}
                    <div className="footer-brand-col">
                        <Link to="/" className="brand-emblem-lockup">
                            <img 
                                src="/renthub-logo.png" 
                                alt="RentHub Official Emblem" 
                                className="footer-brand-logo"
                            />
                            <div className="brand-title-group">
                                <h3>Rent<span className="logo-hub">Hub</span></h3>
                                <p className="brand-subtitle-tag">Smart Mobility</p>
                            </div>
                        </Link>

                        <p className="brand-mission-desc">
                            India's next-gen self-drive vehicle platform. Engineered for seamless urban commutes, 
                            scenic mountain expeditions, and frictionless contactless rentals.
                        </p>

                        <div className="footer-live-status-pill">
                            <span className="footer-status-pulse"></span>
                            <span>15,000+ Verified Trips • 24/7 Operations</span>
                        </div>

                        {/* Social Icons with glowing hover */}
                        <div className="footer-social-row">
                            <a 
                                href="https://wa.me/917077733320?text=Hello%20RentHub%20Support" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="footer-social-icon whatsapp-link"
                                aria-label="WhatsApp"
                                title="Chat on WhatsApp"
                            >
                                <i className="fab fa-whatsapp"></i>
                            </a>
                            <a 
                                href="https://instagram.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="footer-social-icon instagram-link"
                                aria-label="Instagram"
                                title="Follow us on Instagram"
                            >
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a 
                                href="https://twitter.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="footer-social-icon twitter-link"
                                aria-label="Twitter / X"
                                title="Follow us on X"
                            >
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a 
                                href="https://youtube.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="footer-social-icon youtube-link"
                                aria-label="YouTube"
                                title="Watch on YouTube"
                            >
                                <i className="fab fa-youtube"></i>
                            </a>
                            <a 
                                href="https://linkedin.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="footer-social-icon linkedin-link"
                                aria-label="LinkedIn"
                                title="Connect on LinkedIn"
                            >
                                <i className="fab fa-linkedin-in"></i>
                            </a>
                        </div>
                    </div>

                    {/* Col 2: Fleet Catalog */}
                    <div className="footer-nav-col">
                        <h4 className="footer-col-title">Fleet Catalog</h4>
                        <ul className="footer-nav-list">
                            <li>
                                <Link to="/#bikes-section" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Motorcycles & Sport Bikes</span>
                                    <span className="nav-tag-badge tag-hot">Popular</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/#scooters-section" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>City Scooters & EV</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/#cars-section" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Premium Sedans & SUVs</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/#vehicle-showcase-section" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Weekend Expedition Fleet</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/#vehicle-showcase-section" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Monthly Long-Term Lease</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Col 3: Rider Support & SOS */}
                    <div className="footer-nav-col">
                        <h4 className="footer-col-title">Rider Support</h4>
                        <ul className="footer-nav-list">
                            <li>
                                <Link to="/sos-activate" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>24/7 Voice AI SOS ('Aarohi')</span>
                                    <span className="nav-tag-badge tag-new">AI Live</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/track-booking" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Track Active Booking</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/my-bookings" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>My Bookings & Invoices</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/support" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Support & Help Center</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/e-query" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Raise E-Query / Ticket</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/track-issue" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Track Issue Status</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Col 4: Company & Community */}
                    <div className="footer-nav-col">
                        <h4 className="footer-col-title">Company</h4>
                        <ul className="footer-nav-list">
                            <li>
                                <Link to="/about" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>About RentHub</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Contact Hub Specialists</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/#testimonials-section" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Verified Rider Reviews</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/register-user" className="footer-nav-link">
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Create Rider Account</span>
                                </Link>
                            </li>
                            <li>
                                <a 
                                    href="https://wa.me/917077733320?text=Hi%2C%20I%20want%20to%20host%20my%20vehicle%20on%20RentHub" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="footer-nav-link"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                    <span>Host Your Vehicle</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Col 5: Direct Hub Contact & SOS Hotline */}
                    <div className="footer-nav-col">
                        <h4 className="footer-col-title">Hub Headquarters</h4>
                        <div className="footer-contact-details">
                            <div className="footer-contact-item">
                                <div className="contact-item-icon">
                                    <i className="fas fa-headset"></i>
                                </div>
                                <div className="contact-item-content">
                                    <span className="contact-label">24/7 Support Hotline</span>
                                    <a href="tel:+917077733320" className="contact-value">+91 70777 33320</a>
                                </div>
                            </div>

                            <div className="footer-contact-item">
                                <div className="contact-item-icon">
                                    <i className="far fa-envelope"></i>
                                </div>
                                <div className="contact-item-content">
                                    <span className="contact-label">Official Inquiries</span>
                                    <a href="mailto:support@renthub.in" className="contact-value">support@renthub.in</a>
                                </div>
                            </div>

                            <div className="footer-contact-item">
                                <div className="contact-item-icon">
                                    <i className="fas fa-map-marker-alt"></i>
                                </div>
                                <div className="contact-item-content">
                                    <span className="contact-label">Central Pickup Corridor</span>
                                    <span className="contact-value">Plot 42, Aerocity Expressway, India</span>
                                </div>
                            </div>

                            {/* 24/7 SOS Emergency Hotline Banner */}
                            <Link to="/sos-activate" className="footer-sos-hotline-card">
                                <div className="sos-card-icon">
                                    <i className="fas fa-phone-volume"></i>
                                </div>
                                <div className="sos-card-content">
                                    <span className="sos-card-title">Emergency Roadside SOS</span>
                                    <span className="sos-card-number">AI Assisted Dispatch</span>
                                </div>
                            </Link>
                        </div>
                    </div>

                </div>

                {/* 4. Security & Payment Strip */}
                <div className="footer-security-strip">
                    <div className="security-badges-group">
                        <div className="security-badge-item">
                            <i className="fas fa-lock"></i>
                            <span>256-Bit SSL Encrypted</span>
                        </div>
                        <div className="security-badge-item">
                            <i className="fas fa-shield-check"></i>
                            <span>PCI-DSS Level 1 Compliant</span>
                        </div>
                        <div className="security-badge-item">
                            <i className="fas fa-id-card"></i>
                            <span>Govt RTO Registered Fleet</span>
                        </div>
                        <div className="security-badge-item">
                            <i className="fas fa-undo-alt"></i>
                            <span>Instant 100% UPI Refunds</span>
                        </div>
                    </div>

                    <div className="payment-gateways-group">
                        <span>Accepted Payments:</span>
                        <div className="payment-chips">
                            <span className="payment-chip">UPI</span>
                            <span className="payment-chip">Google Pay</span>
                            <span className="payment-chip">PhonePe</span>
                            <span className="payment-chip">Cards</span>
                            <span className="payment-chip">NetBanking</span>
                        </div>
                    </div>
                </div>

                {/* 5. Bottom Legal & Copyright Bar */}
                <div className="footer-bottom-bar">
                    <p className="copyright-text">
                        &copy; {new Date().getFullYear()} <strong>RentHub Mobility Technologies Pvt. Ltd.</strong> All rights reserved. Crafted for Indian Explorers.
                    </p>

                    <div className="footer-legal-links">
                        <Link to="/about" className="legal-link-item">Privacy Policy</Link>
                        <span style={{ color: '#334155' }}>•</span>
                        <Link to="/about" className="legal-link-item">Terms of Service</Link>
                        <span style={{ color: '#334155' }}>•</span>
                        <Link to="/about" className="legal-link-item">Refund Deed</Link>
                        <span style={{ color: '#334155' }}>•</span>
                        <Link to="/login" className="legal-link-item admin-portal-link">
                            <i className="fas fa-lock"></i>
                            <span>Admin Portal</span>
                        </Link>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
