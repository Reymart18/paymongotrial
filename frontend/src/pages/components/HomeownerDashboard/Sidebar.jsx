import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../../../images/pvhai.png';

export default function Sidebar({ isOpen = false, onToggle }) {
    const [activeItem, setActiveItem] = useState('dashboard');
    const [announcementCount, setAnnouncementCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const role = localStorage.getItem('userRole');
    const accountId = localStorage.getItem('accountId') || role || 'unknown';
    const announcementReadKey = `announcementsLastReadAt:${accountId}`;
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isSuperAdmin = role === 'super_admin';

    useEffect(() => {
        if (location.pathname.includes('reports')) {
            setActiveItem('reports');
        } else if (location.pathname.includes('members')) {
            setActiveItem('members');
        } else if (location.pathname.includes('employees')) {
            setActiveItem('employees');
        } else if (location.pathname.includes('announcements')) {
            setActiveItem('announcements');
        } else {
            setActiveItem('dashboard');
        }
    }, [location.pathname]);

    useEffect(() => {
        const fetchAnnouncementCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/announcements`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                const items = Array.isArray(data) ? data : [];
                const lastReadRaw = localStorage.getItem(announcementReadKey);
                const lastReadTime = lastReadRaw ? new Date(lastReadRaw).getTime() : 0;
                const safeLastReadTime = Number.isNaN(lastReadTime) ? 0 : lastReadTime;
                const unreadCount = items.filter((item) => {
                    const createdTime = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
                    return createdTime > safeLastReadTime;
                }).length;

                setAnnouncementCount(unreadCount);
            } catch (err) {
                console.error('Announcement count fetch error:', err);
            }
        };

        fetchAnnouncementCount();
    }, [API_URL, location.pathname, announcementReadKey]);

    return (
        <aside className={`fixed left-0 top-0 h-screen w-64 z-40 rounded-r-[40px] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            style={{ backgroundColor: 'rgba(232, 155, 88, 0.97)' }}>
            <div className="p-6">
                {/* Close button for mobile */}
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="md:hidden absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-lg transition"
                        aria-label="Close sidebar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <div className="mb-8">
                    <img src={logoImg} alt="PV Hai" className="h-20 w-auto" />
                </div>

                <nav className="space-y-2">
                    <a
                        href="#"
                        onClick={() => {
                            setActiveItem('dashboard');
                            navigate(isAdmin ? '/admin/dashboard' : '/homeowner/dashboard');
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'dashboard'
                            ? 'bg-white text-[#8C4100] md:rounded-l-[40px] md:-mr-7 md:pr-20'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <svg
                            className={`w-5 h-5 shrink-0 ${activeItem === 'dashboard' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 3l3 3m0 0l3-3m-3 3V7"
                            />
                        </svg>
                        <span className="font-medium">Dashboard</span>
                    </a>

                    {isAdmin && (
                        <a
                            href="#"
                            onClick={() => {
                                setActiveItem('members');
                                navigate('/admin/members');
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'members'
                                ? 'bg-white text-[#8C4100] md:rounded-l-[40px] md:-mr-7 md:pr-20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <svg
                                className={`w-5 h-5 shrink-0 ${activeItem === 'members' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646zm0 12a8 8 0 110-16 8 8 0 010 16zm5.5 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 11a1 1 0 110-2 1 1 0 010 2z"
                                />
                            </svg>
                            <span className="font-medium">Members</span>
                        </a>
                    )}

                    {isSuperAdmin && (
                        <a
                            href="#"
                            onClick={() => {
                                setActiveItem('employees');
                                navigate('/admin/employees');
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'employees'
                                ? 'bg-white text-[#8C4100] md:rounded-l-[40px] md:-mr-7 md:pr-20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <svg
                                className={`w-5 h-5 shrink-0 ${activeItem === 'employees' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0m-9.288 0a3 3 0 10-4.712 0m14 0a3 3 0 10-4.712 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            <span className="font-medium">Employees</span>
                        </a>
                    )}

                    <a
                        href="#"
                        onClick={() => {
                            setActiveItem('announcements');
                            navigate('/announcements');
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'announcements'
                            ? 'bg-white text-[#8C4100] md:rounded-l-[40px] md:-mr-7 md:pr-20'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <svg
                            className={`w-5 h-5 shrink-0 ${activeItem === 'announcements' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Announcements</span>
                            {announcementCount > 0 && (
                                <span
                                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1 text-[11px] font-semibold rounded-full ${activeItem === 'announcements'
                                        ? 'bg-[#8C4100] text-white'
                                        : 'bg-red-600 text-white'
                                        }`}
                                >
                                    {announcementCount}
                                </span>
                            )}
                        </div>
                    </a>

                    {isAdmin && (
                        <a
                            href="#"
                            onClick={() => {
                                setActiveItem('reports');
                                navigate('/admin/reports');
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'reports'
                                ? 'bg-white text-[#8C4100] md:rounded-l-[40px] md:-mr-7 md:pr-20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <svg
                                className={`w-5 h-5 shrink-0 ${activeItem === 'reports' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 3h18v18H3V3zm4 14V7m5 10V10m5 7V5"
                                />
                            </svg>
                            <span className="font-medium">Reports</span>
                        </a>
                    )}
                </nav>
            </div>
        </aside>
    );
}
