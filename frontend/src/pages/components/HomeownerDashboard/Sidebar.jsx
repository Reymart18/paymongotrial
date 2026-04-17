import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../../../images/pvhai.png';

export default function Sidebar() {
    const [activeItem, setActiveItem] = useState('dashboard');
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('userRole');

    useEffect(() => {
        if (location.pathname.includes('reports')) {
            setActiveItem('reports');
        } else if (location.pathname.includes('members')) {
            setActiveItem('members');
        } else if (location.pathname.includes('announcements')) {
            setActiveItem('announcements');
        } else {
            setActiveItem('dashboard');
        }
    }, [location.pathname]);

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 z-40 rounded-r-[40px]"
            style={{ backgroundColor: 'rgba(232, 155, 88, 0.97)' }}>
            <div className="p-6">
                <div className="mb-8">
                    <img src={logoImg} alt="PV Hai" className="h-20 w-auto" />
                </div>

                <nav className="space-y-2">
                    <a
                        href="#"
                        onClick={() => {
                            setActiveItem('dashboard');
                            navigate(role === 'admin' ? '/admin/dashboard' : '/homeowner/dashboard');
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'dashboard'
                            ? 'bg-white text-[#8C4100] rounded-l-[40px] -mr-7 pr-20'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <svg
                            className={`w-5 h-5 flex-shrink-0 ${activeItem === 'dashboard' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
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

                    {role === 'admin' && (
                        <a
                            href="#"
                            onClick={() => {
                                setActiveItem('members');
                                navigate('/admin/members');
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'members'
                                ? 'bg-white text-[#8C4100] rounded-l-[40px] -mr-7 pr-20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <svg
                                className={`w-5 h-5 flex-shrink-0 ${activeItem === 'members' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
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

                    <a
                        href="#"
                        onClick={() => setActiveItem('announcements')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'announcements'
                            ? 'bg-white text-[#8C4100] rounded-l-[40px] -mr-7 pr-20'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <svg
                            className={`w-5 h-5 flex-shrink-0 ${activeItem === 'announcements' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
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
                        <span className="font-medium">Announcements</span>
                    </a>

                    {role === 'admin' && (
                        <a
                            href="#"
                            onClick={() => {
                                setActiveItem('reports');
                                navigate('/admin/reports');
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeItem === 'reports'
                                ? 'bg-white text-[#8C4100] rounded-l-[40px] -mr-7 pr-20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <svg
                                className={`w-5 h-5 flex-shrink-0 ${activeItem === 'reports' ? 'stroke-[#8C4100]' : 'stroke-white'}`}
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
