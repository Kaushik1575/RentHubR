import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AddBike from './pages/AddBike';
import MyBikes from './pages/MyBikes';
import Bookings from './pages/Bookings';
import Revenue from './pages/Revenue';
import Profile from './pages/Profile';
import Withdrawal from './pages/Withdrawal';
import TermsConditions from './pages/TermsConditions';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import FleetManager from './pages/FleetManager';
import AdminWithdrawals from './pages/AdminWithdrawals';
import AdminSponsorReport from './pages/AdminSponsorReport';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#363636',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #d1fae5',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #fee2e2',
              },
            },
            loading: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Fleet Setup Tool (Temporary/Admin) */}
          <Route path="/fleet-manager" element={<FleetManager />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/admin/sponsor-report" element={<AdminSponsorReport />} />

          {/* Protected Routes (Sponsor only) */}
          <Route element={<ProtectedRoute allowedRoles={['sponsor']} />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add-bike" element={<AddBike />} />
              <Route path="/my-bikes" element={<MyBikes />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/revenue" element={<Revenue />} />
              <Route path="/withdrawal" element={<Withdrawal />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/terms" element={<TermsConditions />} />
            </Route>
          </Route>

          {/* Catch all - Redirect to Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
