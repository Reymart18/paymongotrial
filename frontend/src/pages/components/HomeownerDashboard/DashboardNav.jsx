import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import avatarImg from '../../../images/avatar.png';

export default function DashboardNav({ onLogout, onProfile, accountId, classification }) {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const navigate = useNavigate();

    return (
        <nav className="flex items-center justify-between bg-transparent px-6 py-4 md:ml-64">
            <h1 className="text-lg md:text-xl font-bold text-slate-900">Dashboard</h1>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Notification Bell */}
                <button className="relative text-slate-600 hover:text-slate-900 transition">
                    <svg
                        className="w-5 h-5 md:w-6 md:h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0018 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                    </svg>
                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Avatar */}
                <img src={avatarImg} alt="Avatar" className="h-8 w-8 md:h-10 md:w-10 rounded-full" />

                {/* Profile Section */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 rounded-lg hover:bg-slate-100 transition"
                    >
                        <div className="flex flex-col items-end hidden md:flex">
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
                            <button
                                onClick={() => {
                                    setShowProfileDropdown(false);
                                    navigate('/homeowner/profile');
                                }}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50 border-b border-slate-200 transition"
                            >
                                Profile
                            </button>
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
