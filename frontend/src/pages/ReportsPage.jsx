import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import UploadCard from './components/AdminDashboard/UploadCard';
import pvhaiImg from '../images/pvhai.png';

const quarterOptions = [
    { value: 1, label: 'Q1 (Jan - Mar)' },
    { value: 2, label: 'Q2 (Apr - Jun)' },
    { value: 3, label: 'Q3 (Jul - Sep)' },
    { value: 4, label: 'Q4 (Oct - Dec)' },
];

export default function ReportsPage() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const userRole = localStorage.getItem('userRole');
    const adminLabel = userRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN';

    const today = new Date();
    const defaultYear = today.getFullYear();
    const defaultQuarter = Math.floor(today.getMonth() / 3) + 1;

    const [year, setYear] = useState(defaultYear);
    const [quarter, setQuarter] = useState(defaultQuarter);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [syncStatus, setSyncStatus] = useState('');
    const [syncError, setSyncError] = useState('');
    const [syncLoading, setSyncLoading] = useState(false);
    const [billingSyncStatus, setBillingSyncStatus] = useState('');
    const [billingSyncError, setBillingSyncError] = useState('');
    const [billingSyncLoading, setBillingSyncLoading] = useState(false);
    const [billingFile, setBillingFile] = useState(null);
    const [billingStatus, setBillingStatus] = useState('');
    const [billingError, setBillingError] = useState('');
    const [billingLoading, setBillingLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [overdueItems, setOverdueItems] = useState([]);
    const [overdueLoading, setOverdueLoading] = useState(false);
    const [overdueError, setOverdueError] = useState('');
    const [showOverdueModal, setShowOverdueModal] = useState(false);

    const cacheKey = 'reportsCache';

    const readCache = () => {
        try {
            const raw = localStorage.getItem(cacheKey);
            return raw ? JSON.parse(raw) : {};
        } catch (err) {
            console.error('Report cache read error:', err);
            return {};
        }
    };

    const writeCache = (key, value) => {
        try {
            const existing = readCache();
            localStorage.setItem(cacheKey, JSON.stringify({
                ...existing,
                [key]: value,
            }));
        } catch (err) {
            console.error('Report cache write error:', err);
        }
    };

    const formatMoney = (value) => new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

    const formatPercent = (value) => {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        const rounded = Math.round(value * 10) / 10;
        const sign = rounded > 0 ? '+' : '';
        return `${sign}${rounded}%`;
    };

    const comparison = useMemo(() => report?.comparison || {}, [report]);
    const totals = useMemo(() => report?.totals || {}, [report]);

    const syncPayments = useCallback(async (isAuto = false) => {
        if (syncLoading) {
            return;
        }

        if (!isAuto) {
            setSyncStatus('');
        }
        setSyncError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setSyncError('Session expired. Please log in again.');
            return;
        }

        setSyncLoading(true);

        try {
            const response = await fetch(`${API_URL}/foxpro/payments/sync`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setSyncError(data.message || 'Sync failed. Please try again.');
                return;
            }

            const timestamp = new Date().toLocaleTimeString('en-PH', {
                hour: '2-digit',
                minute: '2-digit',
            });

            setSyncStatus(
                `Sync complete: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped. (${timestamp})`,
            );
        } catch (err) {
            console.error('Sync error:', err);
            setSyncError('Sync failed. Please try again.');
        } finally {
            setSyncLoading(false);
        }
    }, [API_URL, syncLoading]);

    const handleSyncPayments = async (event) => {
        event.preventDefault();
        await syncPayments(false);
    };

    const syncBillings = useCallback(async () => {
        if (billingSyncLoading) {
            return;
        }

        setBillingSyncStatus('');
        setBillingSyncError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setBillingSyncError('Session expired. Please log in again.');
            return;
        }

        setBillingSyncLoading(true);

        try {
            const response = await fetch(`${API_URL}/foxpro/billings/sync`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setBillingSyncError(data.message || 'Sync failed. Please try again.');
                return;
            }

            const timestamp = new Date().toLocaleTimeString('en-PH', {
                hour: '2-digit',
                minute: '2-digit',
            });

            setBillingSyncStatus(
                `Sync complete: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped. (${timestamp})`,
            );
        } catch (err) {
            console.error('Billing sync error:', err);
            setBillingSyncError('Sync failed. Please try again.');
        } finally {
            setBillingSyncLoading(false);
        }
    }, [API_URL, billingSyncLoading]);

    const handleSyncBillings = async (event) => {
        event.preventDefault();
        await syncBillings();
    };

    const handleUploadBillings = async (event) => {
        event.preventDefault();
        setBillingStatus('');
        setBillingError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setBillingError('Session expired. Please log in again.');
            return;
        }

        if (!billingFile) {
            setBillingError('Please choose a CSV or XLSX file first.');
            return;
        }

        setBillingLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', billingFile);

            const response = await fetch(`${API_URL}/foxpro/billings/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setBillingError(data.message || 'Upload failed. Please try again.');
                return;
            }

            setBillingStatus(
                `Upload complete: ${data.inserted} inserted, ${data.skipped} skipped.`,
            );
        } catch (err) {
            console.error('Billing upload error:', err);
            setBillingError('Upload failed. Please try again.');
        } finally {
            setBillingLoading(false);
        }
    };

    const handleGenerateOverdue = async () => {
        setOverdueError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setOverdueError('Session expired. Please log in again.');
            return;
        }

        setOverdueLoading(true);

        try {
            const response = await fetch(`${API_URL}/reports/overdue`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setOverdueError(data.message || 'Failed to load overdue list.');
                return;
            }

            setOverdueItems(Array.isArray(data) ? data : []);
            setShowOverdueModal(true);
        } catch (err) {
            console.error('Overdue report error:', err);
            setOverdueError('Failed to load overdue list. Please try again.');
        } finally {
            setOverdueLoading(false);
        }
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

    const handlePrintOverdue = () => {
        window.print();
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || (role !== 'admin' && role !== 'super_admin')) {
            navigate('/login');
            return;
        }

        const fetchReport = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(
                    `${API_URL}/reports/quarter?year=${year}&quarter=${quarter}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || 'Failed to load report.');
                    return;
                }

                const periodKey = `${year}-Q${quarter}`;
                const totalsValue = data?.totals || {};
                const cached = readCache()[periodKey];

                if (cached?.totals) {
                    const mergedTotals = {
                        billed: Number(totalsValue.billed || 0) === 0
                            ? Number(cached.totals.billed || 0)
                            : totalsValue.billed,
                        collected: Number(totalsValue.collected || 0) === 0
                            ? Number(cached.totals.collected || 0)
                            : totalsValue.collected,
                        outstanding: Number(totalsValue.outstanding || 0) === 0
                            ? Number(cached.totals.outstanding || 0)
                            : totalsValue.outstanding,
                    };

                    const mergedReport = {
                        ...data,
                        totals: mergedTotals,
                    };

                    writeCache(periodKey, mergedReport);
                    setReport(mergedReport);
                    return;
                }

                writeCache(periodKey, data);
                setReport(data);
            } catch (err) {
                console.error('Fetch report error:', err);
                setError('Failed to load report. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [API_URL, navigate, quarter, year]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-overdue, .print-overdue * {
                        visibility: visible;
                    }
                    .print-overdue {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: #fff;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <DashboardNav
                onLogout={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('accountId');
                    navigate('/login');
                }}
                accountId={adminLabel}
                classification={adminLabel}
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                avatarImage={pvhaiImg}
            />

            <div className="flex flex-1 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className="space-y-6 px-4 md:px-6 py-6 md:py-8">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Quarterly Reports</h2>
                                    <p className="text-sm text-slate-500">
                                        Total billed, collected, and outstanding balances by quarter.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="number"
                                        className="w-full sm:w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={year}
                                        onChange={(event) => setYear(Number(event.target.value))}
                                    />
                                    <select
                                        className="w-full sm:w-52 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={quarter}
                                        onChange={(event) => setQuarter(Number(event.target.value))}
                                    >
                                        {quarterOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    title: 'Total Billed (This Quarter)',
                                    value: `PHP ${formatMoney(totals.billed)}`,
                                    comparison: comparison.billedPercent,
                                },
                                {
                                    title: 'Total Collected (This Quarter)',
                                    value: `PHP ${formatMoney(totals.collected)}`,
                                    comparison: comparison.collectedPercent,
                                },
                                {
                                    title: 'Net Collection (This Quarter)',
                                    value: `PHP ${formatMoney(totals.outstanding)}`,
                                    comparison: comparison.outstandingPercent,
                                },
                            ].map((card) => (
                                <div
                                    key={card.title}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <p className="text-sm font-medium text-slate-600">{card.title}</p>
                                    <p className="mt-3 text-2xl font-semibold text-slate-900">
                                        {loading ? 'Loading...' : card.value}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        vs previous quarter: {formatPercent(card.comparison)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">Overdue Accounts</h3>
                                    <p className="text-xs text-slate-500">Amount due as of latest billing, no payment for 12 months.</p>
                                </div>
                                <button
                                    onClick={handleGenerateOverdue}
                                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                    disabled={overdueLoading}
                                >
                                    {overdueLoading ? 'Generating...' : 'Generate Report'}
                                </button>
                            </div>
                            {overdueError && (
                                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                                    {overdueError}
                                </div>
                            )}
                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Total accounts</p>
                                <p className="text-lg font-semibold text-slate-900">
                                    {overdueItems.length}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        <UploadCard
                            title="Sync FoxPro Payments (DBF)"
                            description="Manual sync from payments.DBF. Uses ORNO to prevent duplicates."
                            onSubmit={handleSyncPayments}
                            loading={syncLoading}
                            loadingLabel="Syncing..."
                            buttonLabel="Sync Payments"
                            status={syncStatus}
                            error={syncError}
                            showFileInput={false}
                        />

                        <UploadCard
                            title="Sync FoxPro Billings (DBF)"
                            description="Manual sync from BILLING.DBF. Uses latest DATETO per account to accept new rows."
                            onSubmit={handleSyncBillings}
                            loading={billingSyncLoading}
                            loadingLabel="Syncing..."
                            buttonLabel="Sync Billings"
                            status={billingSyncStatus}
                            error={billingSyncError}
                            showFileInput={false}
                        />

                        <UploadCard
                            title="Upload FoxPro Billings (CSV/XLSX)"
                            description="Required headers: BILLDATE, DATEFROM, DATETO, DUEDATE, PRINBAL, INTBAL, PENBAL, PRINCURR, INTCURR, PENCURR, KEYSEARCH"
                            onSubmit={handleUploadBillings}
                            onFileChange={(event) => setBillingFile(event.target.files?.[0] || null)}
                            loading={billingLoading}
                            buttonLabel="Upload Billings"
                            status={billingStatus}
                            error={billingError}
                        />
                    </div>
                </main>
            </div>

            {showOverdueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 no-print" onClick={() => setShowOverdueModal(false)} />
                    <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl print-overdue">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Overdue Accounts</h2>
                                <p className="text-xs text-slate-500">Amount due/excess as of latest billing, no payment for 12 months.</p>
                            </div>
                            <div className="flex flex-wrap gap-2 no-print">
                                <button
                                    onClick={handlePrintOverdue}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowOverdueModal(false)}
                                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100">
                            <table className="min-w-full divide-y divide-slate-100 text-xs md:text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Account ID</th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Address</th>
                                        <th className="px-4 py-3">Last Payment</th>
                                        <th className="px-4 py-3">Amount Due / Excess</th>
                                        <th className="px-4 py-3">Current Billing</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {overdueItems.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-6 text-center text-slate-400">
                                                No overdue accounts found.
                                            </td>
                                        </tr>
                                    )}
                                    {overdueItems.map((item, index) => {
                                        const address = [item.neighborhood, item.block, item.lot]
                                            .filter(Boolean)
                                            .join(' ');
                                        return (
                                            <tr key={`${item.accountId}-${index}`}>
                                                <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-700">
                                                    {item.accountId || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {item.memberName || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {address || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {formatDate(item.lastPaymentDate)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    PHP {formatMoney(item.amountDue || 0)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {formatDate(item.latestBillingDate)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
