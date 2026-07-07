import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Menu, X } from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static md:shadow-none
            `}>
                <div className="h-full flex flex-col">
                    {/* Mobile Close Button */}
                    <div className="md:hidden absolute top-4 right-4">
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Re-use Sidebar content logic or component */}
                    {/* Since Sidebar component is self-contained currently, we might need to modify it to accept className or structure */}
                    {/* Ideally Sidebar component should just return the nav content, not the outer div with fixed position if we are controlling it here. */}
                    {/* But Sidebar.jsx has fixed position baked in previously. I need to update Sidebar.jsx to be flexible or lift the state. */}
                    {/* For now, I will render Sidebar component and override its classes via props if possible, or just replace Sidebar.jsx content with passed props. */}
                    {/* Let's REWRITE Sidebar.jsx to be cleaner and useable here. */}
                    <Sidebar onClose={() => setIsSidebarOpen(false)} />
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Topbar with Mobile Toggle */}
                <Topbar onToggleSidebar={toggleSidebar} />

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
