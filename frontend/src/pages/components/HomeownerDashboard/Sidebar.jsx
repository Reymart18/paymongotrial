import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../../../images/pvhai.png';

function formatNotificationCount(count) {
    return count > 99 ? '99+' : count;
}

function SidebarNotificationBadge({ count, active }) {
    if (!count) return null;

    return (
        <span
            className={`z-10 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold shadow-sm ring-2 ring-white md:h-5 md:min-w-5 md:px-1 md:text-[11px] ${active
                ? 'bg-[#8C4100] text-white'
                : 'bg-red-600 text-white'
                }`}
        >
            {formatNotificationCount(count)}
        </span>
    );
}

function getActiveItemFromPath(pathname) {
    if (pathname.includes('requests-complaints')) return 'requests-complaints';
    if (pathname.includes('water-dashboard')) return 'water-dashboard';
    if (pathname.includes('reports')) return 'reports';
    if (pathname.includes('members')) return 'members';
    if (pathname.includes('employees')) return 'employees';
    if (pathname.includes('bod-announcements')) return 'bod-announcements';
    if (pathname.includes('announcements')) return 'announcements';
    return 'dashboard';
}

export default function Sidebar({ isOpen = false, onToggle }) {
    const [announcementCount, setAnnouncementCount] = useState(0);
    const [bodAnnouncementCount, setBodAnnouncementCount] = useState(0);
    const [serviceSubmissionCount, setServiceSubmissionCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const role = localStorage.getItem('userRole');
    const accountId = localStorage.getItem('accountId') || role || 'unknown';
    const announcementReadKey = `announcementsLastReadAt:${accountId}`;
    const serviceSubmissionReadKey = `serviceSubmissionsLastReadAt:${accountId}`;
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isSuperAdmin = role === 'super_admin';
    const activeItem = getActiveItemFromPath(location.pathname);

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
                const unreadItems = items.filter((item) => {
                    const createdTime = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
                    return createdTime > safeLastReadTime;
                });

                const unreadAll = unreadItems.filter((item) =>
                    String(item?.target || 'all').toLowerCase() !== 'bod',
                ).length;
                const unreadBod = unreadItems.filter((item) =>
                    String(item?.target || 'all').toLowerCase() === 'bod',
                ).length;

                setAnnouncementCount(unreadAll);
                setBodAnnouncementCount(role === 'admin' ? unreadBod : 0);
            } catch (err) {
                console.error('Announcement count fetch error:', err);
            }
        };

        fetchAnnouncementCount();
    }, [API_URL, location.pathname, announcementReadKey, role]);

    useEffect(() => {
        const fetchServiceSubmissionCount = async () => {
            const servicePagePath = isAdmin
                ? '/admin/requests-complaints'
                : '/homeowner/requests-complaints';

            if (location.pathname === servicePagePath) {
                localStorage.setItem(serviceSubmissionReadKey, new Date().toISOString());
                setServiceSubmissionCount(0);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setServiceSubmissionCount(0);
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };
                const [requestsResponse, complaintsResponse] = await Promise.all([
                    fetch(`${API_URL}/service-requests${isAdmin ? '' : '/self'}`, { headers }),
                    fetch(`${API_URL}/service-requests/complaints${isAdmin ? '' : '/self'}`, { headers }),
                ]);

                if (requestsResponse.status === 401 || complaintsResponse.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('accountId');
                    navigate('/login');
                    return;
                }

                if (!requestsResponse.ok || !complaintsResponse.ok) {
                    return;
                }

                const [requests, complaints] = await Promise.all([
                    requestsResponse.json(),
                    complaintsResponse.json(),
                ]);
                const lastReadRaw = localStorage.getItem(serviceSubmissionReadKey);
                const lastReadTime = lastReadRaw ? new Date(lastReadRaw).getTime() : 0;
                const safeLastReadTime = Number.isNaN(lastReadTime) ? 0 : lastReadTime;
                const submissions = [
                    ...(Array.isArray(requests) ? requests : []),
                    ...(Array.isArray(complaints) ? complaints : []),
                ];

                setServiceSubmissionCount(submissions.filter((item) => {
                    const createdTime = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
                    const updatedTime = item?.updatedAt ? new Date(item.updatedAt).getTime() : createdTime;

                    if (isAdmin) {
                        return createdTime > safeLastReadTime;
                    }

                    const statusChanged = updatedTime > createdTime
                        || String(item?.status || '').toLowerCase() !== 'under review';
                    return statusChanged && updatedTime > safeLastReadTime;
                }).length);
            } catch (err) {
                console.error('Service submission count fetch error:', err);
            }
        };

        fetchServiceSubmissionCount();
        const intervalId = window.setInterval(fetchServiceSubmissionCount, 30000);
        return () => window.clearInterval(intervalId);
    }, [API_URL, isAdmin, location.pathname, navigate, serviceSubmissionReadKey]);

    useEffect(() => {
        if (isAdmin) {
            return;
        }

        const count = announcementCount + serviceSubmissionCount;
        localStorage.setItem('homeownerSidebarNotificationCount', String(count));
        localStorage.setItem('homeownerAnnouncementNotificationCount', String(announcementCount));
        localStorage.setItem('homeownerServiceSubmissionNotificationCount', String(serviceSubmissionCount));
        window.dispatchEvent(new CustomEvent('homeowner-sidebar-notifications', {
            detail: {
                count,
                announcementCount,
                serviceSubmissionCount,
            },
        }));
    }, [announcementCount, isAdmin, serviceSubmissionCount]);

    return (
        <aside className={`fixed left-0 top-0 h-screen w-64 z-40 rounded-r-[40px] transition-transform duration-300 ${isOpen ? 'translate-x-0 overflow-visible' : '-translate-x-full overflow-x-hidden md:translate-x-0 md:overflow-visible'}`}
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

                <div className="mb-1">
                    <img src={logoImg} alt="PV Hai" className="h-20 w-auto" />
                </div>

                <div className="mb-8 h-px bg-[#FFFAFA]/19 -mx-6"></div>

                <nav className="flex flex-col gap-2">
                    <a
                        href="#"
                        onClick={() => {
                            navigate(isAdmin ? '/admin/dashboard' : '/homeowner/dashboard');
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'dashboard'
                            ? `bg-white text-[#8C4100] md:rounded-l-[40px] md:-mr-7 ${isAdmin ? 'md:pr-20' : 'md:pr-8'}`
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
                        <span className="whitespace-nowrap font-medium">
                            {isAdmin ? 'Dashboard' : 'SOA Dashboard'}
                        </span>
                    </a>

                    {!isAdmin && (
                        <a
                            href="#"
                            onClick={(event) => {
                                event.preventDefault();
                                navigate('/homeowner/water-dashboard');
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'water-dashboard'
                                ? 'bg-white text-[#8C4100] md:rounded-l-[40px] md:-mr-7 md:pr-8'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <svg
                                className={`w-5 h-5 shrink-0 ${activeItem === 'water-dashboard' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 3.5S6.5 9.5 6.5 14a5.5 5.5 0 0011 0C17.5 9.5 12 3.5 12 3.5z"
                                />
                            </svg>
                            <span className="whitespace-nowrap font-medium">Water Dashboard</span>
                        </a>
                    )}

                    {!isAdmin && (
                        <a
                            href="#"
                            onClick={(event) => {
                                event.preventDefault();
                                localStorage.setItem(serviceSubmissionReadKey, new Date().toISOString());
                                setServiceSubmissionCount(0);
                                navigate('/homeowner/requests-complaints');
                            }}
                            className={`order-last flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'requests-complaints'
                                ? 'bg-white text-[#8C4100] md:rounded-l-[40px] md:-mr-7 md:pr-8'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <svg
                                className={`w-5 h-5 shrink-0 ${activeItem === 'requests-complaints' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 6h8M8 10h8m-8 4h5m-7 7l-3-3V5a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2H9l-3 3z"
                                />
                            </svg>
                            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                <span className="whitespace-nowrap font-medium">Request & Complaint</span>
                                <SidebarNotificationBadge count={serviceSubmissionCount} active={activeItem === 'requests-complaints'} />
                            </div>
                        </a>
                    )}

                    {isAdmin && (
                        <a
                            href="#"
                            onClick={(event) => {
                                event.preventDefault();
                                localStorage.setItem(serviceSubmissionReadKey, new Date().toISOString());
                                setServiceSubmissionCount(0);
                                navigate('/admin/requests-complaints');
                            }}
                            className={`order-last flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'requests-complaints'
                                ? 'bg-white text-[#8C4100] md:rounded-l-[40px] md:-mr-7 md:pr-20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <svg
                                className={`w-5 h-5 shrink-0 ${activeItem === 'requests-complaints' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 6h8M8 10h8m-8 4h5m-7 7l-3-3V5a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2H9l-3 3z"
                                />
                            </svg>
                            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                <span className="whitespace-nowrap font-medium">Request & Complaint</span>
                                <SidebarNotificationBadge count={serviceSubmissionCount} active={activeItem === 'requests-complaints'} />
                            </div>
                        </a>
                    )}

                    {isAdmin && (
                        <a
                            href="#"
                            onClick={() => {
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
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                            <span className="whitespace-nowrap font-medium">Announcements</span>
                            <SidebarNotificationBadge count={announcementCount} active={activeItem === 'announcements'} />
                        </div>
                    </a>

                    {role === 'admin' && (
                        <a
                            href="#"
                            onClick={() => {
                                navigate('/admin/bod-announcements');
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'bod-announcements'
                                ? 'bg-white text-[#8C4100] md:rounded-l-[40px] md:-mr-7 md:pr-20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <svg
                                className={`w-5 h-5 shrink-0 ${activeItem === 'bod-announcements' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
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
                            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                <span className="whitespace-nowrap font-medium">BOD Updates</span>
                                <SidebarNotificationBadge count={bodAnnouncementCount} active={activeItem === 'bod-announcements'} />
                            </div>
                        </a>
                    )}

                    {isAdmin && (
                        <a
                            href="#"
                            onClick={() => {
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
