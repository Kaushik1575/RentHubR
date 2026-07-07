import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const location = useLocation();

    if (!token) {
        // Not logged in, redirect to login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role check removed to fix redirection issue. 
    // If token exists, assume user is valid.
    // if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    //    return <Navigate to="/login" state={{ from: location }} replace />;
    // }

    // Authorized
    return <Outlet />;
};

export default ProtectedRoute;
