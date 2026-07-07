import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Bike, CalendarDays, DollarSign, User, X, Banknote, ShieldCheck } from 'lucide-react';

const Sidebar = ({ onClose = () => { } }) => {
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/add-bike', label: 'Add Bike', icon: PlusCircle },
        { path: '/my-bikes', label: 'My Bikes', icon: Bike },
        { path: '/bookings', label: 'Bookings', icon: CalendarDays },
        { path: '/revenue', label: 'Revenue', icon: DollarSign },

        { path: '/withdrawal', label: 'Withdrawal', icon: Banknote },
        { path: '/profile', label: 'Profile', icon: User },
        { path: '/terms', label: 'Terms & Conditions', icon: ShieldCheck },
    ];

    return (
        <div className="bg-white h-full w-64 flex flex-col border-r border-gray-100 shadow-xl md:shadow-none">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-brand-600 bg-gradient-to-r from-brand-600 to-cyan-500 bg-clip-text text-transparent">
                    Sponsor Panel
                </h1>
                {/* Mobile close button only visible on mobile inside Sidebar if not handled by parent overlay */}
                <button onClick={onClose} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onClose} // Auto-close on mobile selection
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-brand-50 text-brand-600 font-medium shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-brand-500'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-brand-500'}`} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <div className="bg-gradient-to-br from-brand-500 to-cyan-400 rounded-xl p-4 text-white">
                    <p className="text-xs font-medium opacity-80 mb-1">Need Help?</p>
                    <p className="text-sm font-semibold mb-2">Contact Support</p>
                    <a href="tel:9040757683" className="block text-center text-xs bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg w-full">
                        Get Support
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
