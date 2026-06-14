import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import avatarImg from '../../../images/avatar.png';

export default function DashboardNav({ onLogout, onProfile, accountId, classification, onSidebarToggle, avatarImage }) {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [sidebarNotificationCount, setSidebarNotificationCount] = useState(() => {
        const savedCount = Number(localStorage.getItem('homeownerSidebarNotificationCount') || 0);
        return Number.isFinite(savedCount) ? savedCount : 0;
    });
    const location = useLocation();
    const displayAvatar = avatarImage || avatarImg;
    const isHomeowner = localStorage.getItem('userRole') === 'homeowner';

    useEffect(() => {
        const handleSidebarNotifications = (event) => {
            const count = Number(event.detail?.count || 0);
            setSidebarNotificationCount(Number.isFinite(count) ? count : 0);
        };

        window.addEventListener('homeowner-sidebar-notifications', handleSidebarNotifications);
        return () => window.removeEventListener('homeowner-sidebar-notifications', handleSidebarNotifications);
    }, []);

    // Determine the current page title based on location
    const getPageTitle = () => {
        if (location.pathname.includes('requests-complaints')) {
            return 'Request & Complaint';
        } else if (location.pathname.includes('water-dashboard')) {
            return 'Water Dashboard';
        } else if (location.pathname.includes('reports')) {
            return 'Reports';
        } else if (location.pathname.includes('members')) {
            return 'Members';
        } else if (location.pathname.includes('employees')) {
            return 'Employees';
        } else if (location.pathname.includes('announcements')) {
            return 'Announcements';
        } else if (location.pathname === '/homeowner/dashboard') {
            return 'SOA Dashboard';
        } else {
            return 'Dashboard';
        }
    };

    const pageTitle = getPageTitle();

    return (
        <nav className="flex items-center justify-between bg-transparent px-6 py-4 md:ml-64">
            <div className="flex items-center gap-4">
                {/* Hamburger Menu Button - Mobile Only */}
                {onSidebarToggle && (
                    <button
                        onClick={onSidebarToggle}
                        className="relative md:hidden text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition"
                        aria-label="Toggle sidebar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        {isHomeowner && sidebarNotificationCount > 0 && (
                            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm">
                                {sidebarNotificationCount}
                            </span>
                        )}
                    </button>
                )}
                <h1 className="text-lg md:text-xl font-bold text-slate-900">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Avatar */}
                <img src={displayAvatar} alt="Avatar" className="h-8 w-8 md:h-10 md:w-10 rounded-full" />

                {/* Profile Section */}
                <div className="relative -ml-1 md:-ml-6">
                    <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className="flex items-center gap-2 md:gap-3  px-2 md:px-4 py-2 rounded-lg hover:bg-slate-100 transition"
                    >
                        <div className=" flex-col items-end hidden md:flex">
                            <p className="text-sm font-semibold text-slate-900">{accountId}</p>
                            <p className="text-xs text-slate-500">{classification}</p>
                        </div>
                        <svg
                            className={`w-4 h-4 text-slate-600 transition-transform ${showProfileDropdown ? 'rotate-180' : ''
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                            {onProfile && (
                                <button
                                    onClick={() => {
                                        setShowProfileDropdown(false);
                                        onProfile();
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition border-b border-slate-100"
                                >
                                    Profile
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setShowProfileDropdown(false);
                                    onLogout();
                                }}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
