import axios from 'axios';

// Default to localhost:3005 if not set in .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401/403 errors (unauthorized/expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;
            const errorMsg = (error.response.data?.error || '').toLowerCase();

            if (status === 401 || (status === 400 && errorMsg.includes('token')) || status === 403) {
                // Prevent redirect loop if already on login or register page
                const path = window.location.pathname;
                if (path !== '/login' && path !== '/register') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
