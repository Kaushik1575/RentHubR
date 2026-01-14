import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import RegisterUser from './pages/RegisterUser';
import RegisterAdmin from './pages/RegisterAdmin';
import MyBookings from './pages/MyBookings';
import BookingForm from './pages/BookingForm';
import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/ForgotPassword';
import TrackBooking from './pages/TrackBooking';
import SOSActivate from './pages/SOSActivate';
import GlobalAuthCheck from './components/GlobalAuthCheck';

function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  const isSOS = location.pathname === '/sos-activate';
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminRoute = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          const isUserAdmin = user.isAdmin === true || user.is_admin === true;

          // If user is admin AND currently NOT on /admin (and not on login/register/sos pages)
          // We allow /login because that's where they might go after logout
          // If user is admin AND currently NOT on /admin
          // We must enforce this strictly. Even if they go to /login, they should be logged out first.
          // Since we check for token existence, if they are already logged out, this won't trigger loop.
          if (isUserAdmin && location.pathname !== '/admin') {
            console.log("Admin attempted to leave Admin Panel. Auto-logging out.");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Force reload or redirect to login
            navigate('/login');
            window.location.reload();
          }
        } catch (e) {
          console.error("Error parsing user for admin check", e);
        }
      }
    };

    checkAdminRoute();
  }, [location.pathname, navigate]);

  return (
    <div className="App">
      {!isAdmin && !isSOS && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/booking-form" element={<BookingForm />} />
        <Route path="/track-booking" element={<TrackBooking />} />
        <Route path="/sos-activate" element={<SOSActivate />} />
      </Routes>
      {/* WhatsApp Floating Button - Hide on SOS */}
      {!isSOS && (
        <a href="https://wa.me/917077733320?text=Hello%20%F0%9F%91%8B%2C%20I%20have%20a%20query%20regarding%20my%20bike%20booking%20%2F%20other%20services."
          className="whatsapp-floating-btn pulse"
          target="_blank"
          rel="noopener noreferrer"
          title="Chat with us on WhatsApp">
          <i className="fab fa-whatsapp"></i>
        </a>
      )}
      {!isSOS && <Footer />}

      {/* Global authentication check - monitors user block status */}
      <GlobalAuthCheck />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <Layout />
    </Router>
  );
}

export default App;
