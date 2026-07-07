import { LogOut, Bell, Search, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ onToggleSidebar }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100/50 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                {/* Mobile Sidebar Toggle */}
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="md:hidden p-2 text-gray-500 hover:text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent hidden sm:block">
                    Welcome, {user.fullName ? user.fullName.split(' ')[0] : 'Sponsor'}
                </h1>
                {/* Mobile title visible only if space allows or simplified */}
                <h1 className="text-lg font-bold text-gray-800 sm:hidden">
                    Dashboard
                </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-6">
                <div className="relative group hidden md:block">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-48 md:w-64 transition-all"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <button className="relative p-2 text-gray-500 hover:text-brand-600 transition-colors rounded-full hover:bg-gray-50">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>

                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

                <div className="flex items-center gap-3 cursor-pointer group relative">
                    <button onClick={handleLogout} className="md:hidden p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Logout">
                        <LogOut className="w-5 h-5" />
                    </button>

                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-cyan-400 p-0.5">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                {(user.profilePicture || user.profile_picture) ? (
                                    <img src={user.profilePicture || user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-gray-400 group-hover:text-brand-500 transition-colors" />
                                )}
                            </div>
                        </div>
                        <div onClick={() => navigate('/profile')} className="hidden lg:block text-left">
                            <p className="text-sm font-semibold text-gray-700 group-hover:text-brand-600 transition-colors">
                                {user.fullName || user.full_name || 'Sponsor'}
                            </p>
                            <p className="text-xs text-gray-500">View Profile</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all ml-2"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
