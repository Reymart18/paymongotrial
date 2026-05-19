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
        settledAccountsCount: 0,
        totalCollectedPayments: 0,
    });
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState('');
    const [activityItems, setActivityItems] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityError, setActivityError] = useState('');
    const [settledItems, setSettledItems] = useState([]);
    const [settledLoading, setSettledLoading] = useState(false);
    const [settledError, setSettledError] = useState('');
    const [settledBillingLabel, setSettledBillingLabel] = useState('-');
    const [showSettledModal, setShowSettledModal] = useState(false);
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
                    settledAccountsCount: Number(data?.settledAccountsCount || 0),
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

    const formatDate = (value) => {
        if (!value) {
            return '-';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '-';
        }

        return date.toLocaleDateString('en-PH');
    };

    const formatMoney = (value) => new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

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

    const handleGenerateSettledReport = async () => {
        if (settledLoading) {
            return;
        }

        setSettledError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setSettledError('Session expired. Please log in again.');
            return;
        }

        setSettledLoading(true);

        try {
            const response = await fetch(`${API_URL}/admin/settled-accounts`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setSettledError(data.message || 'Failed to load settled accounts.');
                return;
            }

            setSettledItems(Array.isArray(data?.items) ? data.items : []);
            setSettledBillingLabel(data?.currentBillingLabel || '-');
            setShowSettledModal(true);
        } catch (err) {
            console.error('Settled report error:', err);
            setSettledError('Failed to load settled accounts. Please try again.');
        } finally {
            setSettledLoading(false);
        }
    };

    const handlePrintSettled = () => {
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) {
            return;
        }

        const rowsHtml = settledItems.map((item, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.accountId || '-'}</td>
                    <td>${item.memberName || '-'}</td>
                    <td>${item.neighborhood || '-'}</td>
                    <td>${item.block || '-'}</td>
                    <td>${item.lot || '-'}</td>
                    <td>PHP ${formatMoney(item.amountDue || 0)}</td>
                    <td>${formatDate(item.lastPaymentDate)}</td>
                    <td>${settledBillingLabel || '-'}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Settled Accounts</title>
                <style>
                    @page { size: landscape; margin: 16mm; }
                    body { font-family: Arial, sans-serif; color: #0f172a; }
                    h1 { font-size: 18px; margin: 0 0 6px; }
                    p { margin: 0 0 12px; font-size: 12px; color: #475569; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    thead { display: table-header-group; }
                    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
                    th { background: #f8fafc; text-transform: uppercase; letter-spacing: .04em; font-size: 10px; }
                    tr { page-break-inside: avoid; }
                </style>
            </head>
            <body>
                <h1>Settled Accounts</h1>
                <p>Amount due/excess equals 0.00 for the current billing period (${settledBillingLabel || '-'}).</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Account ID</th>
                            <th>Name</th>
                            <th>Neighborhood</th>
                            <th>Block</th>
                            <th>Lot</th>
                            <th>Amount Due / Excess</th>
                            <th>Last Payment</th>
                            <th>Current Billing</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="9">No settled accounts found.</td></tr>'}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };



    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <style>{`
                @media print {
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .print-settled, .print-settled * {
                        visibility: visible;
                    }
                    .print-settled {
                        position: static !important;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        background: #fff;
                    }
                    .print-settled .print-settled-table {
                        max-height: none !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .print-settled * {
                        overflow: visible !important;
                    }
                    .print-settled table {
                        width: 100% !important;
                        border-collapse: collapse;
                        page-break-inside: auto;
                    }
                    .print-settled thead {
                        display: table-header-group;
                    }
                    .print-settled tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print-settled tbody {
                        page-break-inside: auto;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
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
                            settledAccountsCount={summary.settledAccountsCount}
                            totalCollectedPayments={summary.totalCollectedPayments}
                            loading={summaryLoading}
                            onGenerateSettledReport={handleGenerateSettledReport}
                            settledReportLoading={settledLoading}
                        />

                        {summaryError && (
                            <AdminStatusMessage
                                variant="error"
                                message={summaryError}
                            />
                        )}

                        {settledError && (
                            <AdminStatusMessage
                                variant="error"
                                message={settledError}
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
            {showSettledModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 no-print" onClick={() => setShowSettledModal(false)} />
                    <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl print-settled">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Settled Accounts</h2>
                                <p className="text-xs text-slate-500">Amount due/excess equals 0.00 for the current billing period.</p>
                            </div>
                            <div className="flex flex-wrap gap-2 no-print">
                                <button
                                    onClick={handlePrintSettled}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowSettledModal(false)}
                                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100 print-settled-table">
                            <table className="min-w-full divide-y divide-slate-100 text-xs md:text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Account ID</th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Neighborhood</th>
                                        <th className="px-4 py-3">Block</th>
                                        <th className="px-4 py-3">Lot</th>
                                        <th className="px-4 py-3">Amount Due / Excess</th>
                                        <th className="px-4 py-3">Last Payment</th>
                                        <th className="px-4 py-3">Current Billing</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {settledItems.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-6 text-center text-slate-400">
                                                No settled accounts found.
                                            </td>
                                        </tr>
                                    )}
                                    {settledItems.map((item, index) => (
                                        <tr key={`${item.accountId}-${index}`}>
                                            <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">
                                                {item.accountId || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.memberName || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.neighborhood || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.block || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.lot || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                PHP {formatMoney(item.amountDue || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {formatDate(item.lastPaymentDate)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {settledBillingLabel}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
