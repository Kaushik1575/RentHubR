import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


const Home = () => {
    const [bikes, setBikes] = useState([]);
    const [scooters, setScooters] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

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

                setBikes(bikesData || []);
                setScooters(scootersData || []);
                setCars(carsData || []);
            } catch (error) {
                console.error('Error loading vehicles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    // Scroll Animation Observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        const headers = document.querySelectorAll('.category-header');
        headers.forEach(header => observer.observe(header));

        return () => headers.forEach(header => observer.unobserve(header));
    }, []);

    const VehicleCard = ({ vehicle, type }) => {
        // Mock rating if not present (random between 4.5 and 5.0)
        const rating = (4.5 + Math.random() * 0.5).toFixed(1);

        return (
            <div className="vehicle-card" data-id={vehicle.id} data-type={type}>
                <div className="card-image-wrapper">
                    <Link to={`/vehicle/${type}/${vehicle.id}`}>
                        <img src={vehicle.image_url} alt={vehicle.name} />
                    </Link>
                    <span className="rating-badge"><i className="fas fa-star"></i> {rating}</span>
                </div>
                <div className="vehicle-details">
                    <div className="vehicle-header">
                        <Link to={`/vehicle/${type}/${vehicle.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3>{vehicle.name}</h3>
                        </Link>
                        <span className="engine-badge">{vehicle.engine || 'N/A'}</span>
                    </div>

                    <div className="vehicle-specs">
                        <span><i className="fas fa-gas-pump"></i> {vehicle.fuel_type || 'Petrol'}</span>
                        <span><i className="fas fa-tachometer-alt"></i> Manual</span>
                    </div>

                    <div className="card-divider"></div>

                    <div className="vehicle-footer">
                        <div className="price-info">
                            <span className="price-label">Price per Hour</span>
                            <span className="price-value">₹{vehicle.price}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                            <Link to={`/vehicle/${type}/${vehicle.id}`} className="view-btn" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '10px',
                                border: '1px solid #007bff',
                                borderRadius: '8px',
                                color: '#007bff',
                                textDecoration: 'none',
                                fontWeight: '600',
                                backgroundColor: 'white',
                                fontSize: '1rem',
                                transition: 'all 0.2s ease'
                            }}>
                                View
                            </Link>
                            <Link to={`/booking-form?vehicleId=${vehicle.id}&type=${type}`} className="rent-btn" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '10px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                fontSize: '1rem',
                                height: 'auto',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}>
                                Rent Now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main>


            <section className="hero">
                <div className="hero-content">
                    <h1>Your Adventure Starts Here</h1>
                    <p>Explore our wide range of bikes, scooty, and cars for your next journey.</p>
                </div>
            </section>

            {/* Vehicle Showcase Section */}
            <section className="vehicle-showcase">
                <div className="container">
                    <div className="section-header text-center">
                        <h2>Featured Vehicles & Bikes</h2>
                        <p className="section-subtitle">Choose from our premium fleet of well-maintained vehicles for a safe and comfortable ride.</p>
                    </div>

                    {/* Ride & Earn Promo Banner */}
                    {/* Ride & Earn Promo Banner */}
                    {/* New Split Promo Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', margin: '40px 0' }}>

                        {/* Card 1: Ride & Earn */}
                        <Link to="/rewards" style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
                                borderRadius: '20px',
                                padding: '25px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                boxShadow: '0 10px 25px rgba(255, 152, 0, 0.3)',
                                transition: 'transform 0.2s',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    background: 'rgba(255,255,255,0.25)',
                                    borderRadius: '50%',
                                    width: '70px', height: '70px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '32px',
                                    backdropFilter: 'blur(5px)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                }}>🪙</div>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '22px', fontWeight: '800' }}>Ride & Earn</h3>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.95)', fontSize: '14px', fontWeight: '500' }}>
                                        Get <strong>1 Coin/min</strong> on every ride.<br />Redeem for Free Rides!
                                    </p>
                                </div>
                                {/* Decorative circle */}
                                <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                            </div>
                        </Link>

                        {/* Card 2: Refer & Earn */}
                        <Link to="/rewards" style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '20px',
                                padding: '25px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                                transition: 'transform 0.2s',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    background: 'rgba(255,255,255,0.25)',
                                    borderRadius: '50%',
                                    width: '70px', height: '70px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '32px',
                                    backdropFilter: 'blur(5px)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                }}>🗣️</div>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '22px', fontWeight: '800' }}>Refer & Earn</h3>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.95)', fontSize: '14px', fontWeight: '500' }}>
                                        Invite friends & win <strong>Scratch Cards</strong>.<br />Guaranteed Rewards!
                                    </p>
                                </div>
                                {/* Decorative circle */}
                                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                            </div>
                        </Link>

                    </div>

                    {/* Bikes Section */}
                    <div className="category-section">
                        <h3 className="category-header">Bikes</h3>
                        <div className="vehicle-grid" id="bikesGrid">
                            {loading ? <p>Loading bikes...</p> : bikes.map(bike => <VehicleCard key={bike.id} vehicle={bike} type="bike" />)}
                            {!loading && bikes.length === 0 && <p>No bikes available.</p>}
                        </div>
                    </div>

                    {/* Scooty Section */}
                    <div className="category-section">
                        <h3 className="category-header">Scooters</h3>
                        <div className="vehicle-grid" id="scootyGrid">
                            {loading ? <p>Loading scooters...</p> : scooters.map(scooter => <VehicleCard key={scooter.id} vehicle={scooter} type="scooty" />)}
                            {!loading && scooters.length === 0 && <p>No scooters available.</p>}
                        </div>
                    </div>

                    {/* Cars Section */}
                    <div className="category-section">
                        <h3 className="category-header">Cars</h3>
                        <div className="vehicle-grid" id="carsGrid">
                            {loading ? <p>Loading cars...</p> : cars.map(car => <VehicleCard key={car.id} vehicle={car} type="car" />)}
                            {!loading && cars.length === 0 && <p>No cars available.</p>}
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <div className="container">
                    <h2 className="text-center">How It Works</h2>
                    <div className="steps-container">
                        <div className="step-card">
                            <div className="step-icon">
                                <i className="fas fa-search"></i>
                            </div>
                            <h3>1. Pick Your Ride</h3>
                            <p>Browse our extensive collection of well-maintained bikes and cars. Filter by price or model to find your best fit.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-icon">
                                <i className="fas fa-calendar-check"></i>
                            </div>
                            <h3>2. Quick Booking</h3>
                            <p>Choose your duration, upload your license, and pay securely. No long paperwork, just instant confirmation.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-icon">
                                <i className="fas fa-road"></i>
                            </div>
                            <h3>3. Zoom Away</h3>
                            <p>Reach the pickup point, verify your ID, and start your journey. Enjoy the freedom of the road!</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="why-choose-us">
                <div className="container">
                    <h2 className="text-center">Why Choose Us?</h2>
                    <div className="features-container">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-motorcycle"></i>
                            </div>
                            <h3>Unbeatable Prices</h3>
                            <p>Rent high-quality vehicles at the most competitive daily and hourly rates in the city and save more.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-wallet"></i>
                            </div>
                            <h3>Zero Hidden Charges</h3>
                            <p>Transparency is key. What you see is what you pay—no surprise taxes, insurance fees, or deposits.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-clock"></i>
                            </div>
                            <h3>Flexible Rentals</h3>
                            <p>Need to extend your trip? No problem. Easily extend your booking on the go with our flexible plans.</p>
                        </div>
                    </div>
                </div>
            </section>


        </main >
    );
};

export default Home;
