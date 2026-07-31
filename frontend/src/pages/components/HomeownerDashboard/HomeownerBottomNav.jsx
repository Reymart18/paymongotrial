import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
    {
        key: 'dashboard',
        label: 'SOA',
        path: '/homeowner/dashboard',
        iconPath: 'M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9',
    },
    {
        key: 'water-dashboard',
        label: 'Water',
        path: '/homeowner/water-dashboard',
        iconPath: 'M12 3.5S6.5 9.5 6.5 14a5.5 5.5 0 0011 0C17.5 9.5 12 3.5 12 3.5z',
    },
    {
        key: 'announcements',
        label: 'Announcements',
        path: '/announcements',
        iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    },
    {
        key: 'requests-complaints',
        label: 'Request & Complaint',
        path: '/homeowner/requests-complaints',
        iconPath: 'M8 6h8M8 10h8m-8 4h5m-7 7l-3-3V5a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2H9l-3 3z',
    },
];

function getActiveItemFromPath(pathname) {
    if (pathname.includes('requests-complaints')) return 'requests-complaints';
    if (pathname.includes('water-dashboard')) return 'water-dashboard';
    if (pathname.includes('announcements')) return 'announcements';
    return 'dashboard';
}

function formatNotificationCount(count) {
    return count > 99 ? '99+' : count;
}

function getStoredCount(key) {
    const count = Number(localStorage.getItem(key) || 0);
    return Number.isFinite(count) ? count : 0;
}

export default function HomeownerBottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const activeItem = getActiveItemFromPath(location.pathname);
    const [notificationCounts, setNotificationCounts] = useState({
        announcements: getStoredCount('homeownerAnnouncementNotificationCount'),
        serviceSubmissions: getStoredCount('homeownerServiceSubmissionNotificationCount'),
    });

    useEffect(() => {
        const handleNotifications = (event) => {
            const announcementCount = Number(event.detail?.announcementCount || 0);
            const serviceSubmissionCount = Number(event.detail?.serviceSubmissionCount || 0);

            setNotificationCounts({
                announcements: Number.isFinite(announcementCount) ? announcementCount : 0,
                serviceSubmissions: Number.isFinite(serviceSubmissionCount) ? serviceSubmissionCount : 0,
            });
        };

        window.addEventListener('homeowner-sidebar-notifications', handleNotifications);
        return () => window.removeEventListener('homeowner-sidebar-notifications', handleNotifications);
    }, []);

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#A45612]/15 bg-[#FFFAFA]/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_28px_rgba(90,54,20,0.16)] backdrop-blur md:hidden">
            <div className="grid h-[72px] grid-cols-4 rounded-t-xl">
                {navItems.map((item) => {
                    const active = item.key === activeItem;
                    const notificationCount = item.key === 'announcements'
                        ? notificationCounts.announcements
                        : item.key === 'requests-complaints'
                            ? notificationCounts.serviceSubmissions
                            : 0;

                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => navigate(item.path)}
                            className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[10px] font-semibold leading-tight min-[390px]:text-[11px] ${active
                                ? 'text-[#A45612]'
                                : 'text-slate-500 hover:text-[#A45612]'
                                }`}
                        >
                            <span className={`relative flex h-8 w-8 items-center justify-center rounded-full transition ${active ? 'bg-[#A45612] text-white shadow-sm shadow-[#A45612]/25' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                                </svg>
                                {notificationCount > 0 && (
                                    <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#FFFAFA]">
                                        {formatNotificationCount(notificationCount)}
                                    </span>
                                )}
                            </span>
                            <span className="max-w-full text-center drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
