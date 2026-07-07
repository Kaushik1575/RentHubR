import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import RegisterAdmin from './pages/RegisterAdmin';
import HomePortal from './pages/HomePortal';

function App() {
  const token = localStorage.getItem('token');
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
      <Routes>
        <Route path="/" element={<HomePortal />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
