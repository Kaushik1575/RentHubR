import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast'; // Assuming we installed this
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/login', formData);
            const { token, sponsor } = response.data;

            if (!sponsor || !sponsor.isApproved) {
                // Note: Controller already checks isApproved but good to double check or handle pending status if 403
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(sponsor)); // Saving as 'user' for compatibility or 'sponsor'

            toast.success('Login Successful!');
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            if (error.response?.status === 403 && error.response?.data?.status === 'pending_approval') {
                toast.error('Account pending approval. Please contact admin.');
            } else {
                toast.error(error.response?.data?.error || 'Login failed. Please check credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md z-10 border border-gray-100 backdrop-blur-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Welcome Back</h1>
                    <p className="text-gray-500 mt-2">Sign in to manage your bike rentals</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-gray-700"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                required
                                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-gray-700"
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300" />
                            <span className="text-gray-500">Remember me</span>
                        </label>
                        <a href="#" className="text-brand-600 font-semibold hover:text-brand-700">Forgot Password?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account?
                    <Link to="/register" className="text-brand-600 font-bold hover:text-brand-700 ml-1">
                        Become a Sponsor
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
