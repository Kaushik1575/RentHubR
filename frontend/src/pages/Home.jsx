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

                setBikes(bikesData.filter(v => v.is_available) || []);
                setScooters(scootersData.filter(v => v.is_available) || []);
                setCars(carsData.filter(v => v.is_available) || []);
            } catch (error) {
                console.error('Error loading vehicles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    const VehicleCard = ({ vehicle, type }) => {
        const bookClass = type === 'bike' ? 'btn-book-bike' : (type === 'scooty' ? 'btn-book-scooty' : 'btn-book-car');
        return (
            <div className="vehicle-card" data-id={vehicle.id} data-type={type}>
                <img src={vehicle.image_url} alt={vehicle.name} />
                <div className="vehicle-details">
                    <h3>{vehicle.name}</h3>
                    <p className="engine-detail"><i className="fas fa-cogs"></i> Engine: {vehicle.engine}</p>
                    <p className="fuel-detail"><i className="fas fa-gas-pump"></i> Fuel: {vehicle.fuel_type}</p>
                    <div className="vehicle-price">
                        <p>Price per day</p>
                        <p>₹{vehicle.price ? vehicle.price.toFixed(2) : '0.00'}</p>
                    </div>
                </div>
                {!vehicle.is_available
                    ? <button className="btn btn-secondary" disabled style={{ background: '#aaa', cursor: 'not-allowed', opacity: 0.7 }}>Unavailable</button>
                    : <Link to={`/booking-form?vehicleId=${vehicle.id}&type=${type}`} className={`btn btn-book ${bookClass}`}>Book Now</Link>
                }
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
                    <h2>Featured Vehicles</h2>

                    {/* Bikes Section */}
                    <h3 className="category-title">Bikes</h3>
                    <div className="vehicle-grid" id="bikesGrid">
                        {loading ? <p>Loading bikes...</p> : bikes.map(bike => <VehicleCard key={bike.id} vehicle={bike} type="bike" />)}
                        {!loading && bikes.length === 0 && <p>No bikes available.</p>}
                    </div>

                    {/* Scooty Section */}
                    <h3 className="category-title">Scooty</h3>
                    <div className="vehicle-grid" id="scootyGrid">
                        {loading ? <p>Loading scooters...</p> : scooters.map(scooter => <VehicleCard key={scooter.id} vehicle={scooter} type="scooty" />)}
                        {!loading && scooters.length === 0 && <p>No scooters available.</p>}
                    </div>

                    {/* Cars Section */}
                    <h3 className="category-title">Cars</h3>
                    <div className="vehicle-grid" id="carsGrid">
                        {loading ? <p>Loading cars...</p> : cars.map(car => <VehicleCard key={car.id} vehicle={car} type="car" />)}
                        {!loading && cars.length === 0 && <p>No cars available.</p>}
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
                            <h3>1. Find Your Ride</h3>
                            <p>Browse our extensive collection and filter by price, type, or features to find the perfect vehicle for your needs.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-icon">
                                <i className="fas fa-calendar-check"></i>
                            </div>
                            <h3>2. Book & Pay</h3>
                            <p>Select your dates, fill out the booking form, and complete the payment securely through our various payment options.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-icon">
                                <i className="fas fa-road"></i>
                            </div>
                            <h3>3. Enjoy the Journey</h3>
                            <p>Pick up your vehicle from the designated location and hit the road. Enjoy your trip with our reliable rentals!</p>
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
                            <h3>Wide Vehicle Selection</h3>
                            <p>From powerful bikes to nimble scooters and comfortable cars, we have a vehicle for every type of adventurer.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <h3>Trusted & Safe</h3>
                            <p>All our vehicles are regularly serviced and maintained to ensure you have a safe and worry-free experience.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-headset"></i>
                            </div>
                            <h3>24/7 Support</h3>
                            <p>Our dedicated support team is available around the clock to assist you with any queries or issues during your rental.</p>
                        </div>
                    </div>
                </div>
            </section>


        </main>
    );
};

export default Home;
