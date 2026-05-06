import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardCards from './components/AdminDashboard/AdminDashboardCards';
import AdminStatusMessage from './components/AdminDashboard/AdminStatusMessage';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import pvhaiImg from '../images/pvhai.png';

export default function AdminDashboard() {
    const [summary, setSummary] = useState({
        currentBillingLabel: '-',
        unpaidAccountsCount: 0,
        overpaidAccountsCount: 0,
        totalCollectedPayments: 0,
    });
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState('');
    const [activityItems, setActivityItems] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityError, setActivityError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const userRole = localStorage.getItem('userRole');
    const adminLabel = userRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || (role !== 'admin' && role !== 'super_admin')) {
            navigate('/login');
            return;
        }

        const controller = new AbortController();

        const fetchSummary = async () => {
            setSummaryLoading(true);
            setSummaryError('');

            try {
                const response = await fetch(`${API_URL}/admin/dashboard-summary`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        setSummaryError('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        return;
                    }

                    setSummaryError(data.message || 'Failed to load summary data.');
                    return;
                }

                setSummary({
                    currentBillingLabel: data?.currentBillingLabel || '-',
                    unpaidAccountsCount: Number(data?.unpaidAccountsCount || 0),
                    overpaidAccountsCount: Number(data?.overpaidAccountsCount || 0),
                    totalCollectedPayments: Number(data?.totalCollectedPayments || 0),
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch summary error:', err);
                    setSummaryError('Failed to load summary data. Please try again.');
                }
            } finally {
                setSummaryLoading(false);
            }
        };

        fetchSummary();

        return () => controller.abort();
    }, [API_URL, navigate]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || (role !== 'admin' && role !== 'super_admin')) {
            return;
        }

        const controller = new AbortController();

        const fetchActivities = async () => {
            setActivityLoading(true);
            setActivityError('');

            try {
                const response = await fetch(`${API_URL}/admin/activities?limit=6`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        setActivityError('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        return;
                    }
                    setActivityError(data.message || 'Failed to load recent activity.');
                    return;
                }

                setActivityItems(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch activity error:', err);
                    setActivityError('Failed to load recent activity. Please try again.');
                }
            } finally {
                setActivityLoading(false);
            }
        };

        fetchActivities();

        return () => controller.abort();
    }, [API_URL]);

    const formatTimestamp = (value) => {
        if (!value) {
            return '';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleString();
    };

    const activityTitle = (activity) => {
        switch (activity?.action) {
            case 'upload_payments':
                return 'Payments upload completed';
            case 'upload_billings':
                return 'Billings upload completed';
            case 'upload_masterlist':
                return 'Masterlist updated';
            case 'update_member':
                return 'Member updated';
            case 'delete_member':
                return 'Member deleted';
            case 'reset_password':
                return 'Password reset';
            default:
                return 'Admin activity';
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        navigate('/login');
    };



    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <DashboardNav
                onLogout={handleLogout}
                accountId={adminLabel}
                classification={adminLabel}
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                avatarImage={pvhaiImg}
            />

            <div className="flex flex-1 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className="space-y-6 px-4 md:px-6 py-6 md:py-8">
                        <AdminDashboardCards
                            currentBillingLabel={summary.currentBillingLabel}
                            unpaidAccountsCount={summary.unpaidAccountsCount}
                            overpaidAccountsCount={summary.overpaidAccountsCount}
                            totalCollectedPayments={summary.totalCollectedPayments}
                            loading={summaryLoading}
                        />

                        {summaryError && (
                            <AdminStatusMessage
                                variant="error"
                                message={summaryError}
                            />
                        )}

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Recent admin activity</h2>
                                    <p className="text-sm text-slate-500">Latest updates from admin actions.</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-3">
                                {activityLoading && (
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        Loading recent activity...
                                    </div>
                                )}
                                {!activityLoading && activityError && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        {activityError}
                                    </div>
                                )}
                                {!activityLoading && !activityError && activityItems.length === 0 && (
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        No recent activity yet.
                                    </div>
                                )}
                                {!activityLoading && !activityError && activityItems.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-slate-900">{activityTitle(activity)}</p>
                                            <span className="text-xs text-slate-500">
                                                {formatTimestamp(activity.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{activity.details || 'No details provided.'}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>
                </main>
            </div>
        </div>
    );
}
