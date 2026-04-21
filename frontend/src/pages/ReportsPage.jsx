import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import UploadCard from './components/AdminDashboard/UploadCard';

const quarterOptions = [
    { value: 1, label: 'Q1 (Jan - Mar)' },
    { value: 2, label: 'Q2 (Apr - Jun)' },
    { value: 3, label: 'Q3 (Jul - Sep)' },
    { value: 4, label: 'Q4 (Oct - Dec)' },
];

export default function ReportsPage() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const today = new Date();
    const defaultYear = today.getFullYear();
    const defaultQuarter = Math.floor(today.getMonth() / 3) + 1;

    const [year, setYear] = useState(defaultYear);
    const [quarter, setQuarter] = useState(defaultQuarter);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [billingFile, setBillingFile] = useState(null);
    const [billingStatus, setBillingStatus] = useState('');
    const [billingError, setBillingError] = useState('');
    const [billingLoading, setBillingLoading] = useState(false);

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

    const handleUploadPayments = async (event) => {
        event.preventDefault();
        setUploadStatus('');
        setUploadError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setUploadError('Session expired. Please log in again.');
            return;
        }

        if (!uploadFile) {
            setUploadError('Please choose a CSV or XLSX file first.');
            return;
        }

        setUploadLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', uploadFile);

            const response = await fetch(`${API_URL}/foxpro/payments/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setUploadError(data.message || 'Upload failed. Please try again.');
                return;
            }

            setUploadStatus(
                `Upload complete: ${data.inserted} inserted, ${data.skipped} skipped.`,
            );
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError('Upload failed. Please try again.');
        } finally {
            setUploadLoading(false);
        }
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || role !== 'admin') {
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
            <div className="hidden md:block">
                <Sidebar />
            </div>

            <DashboardNav
                onLogout={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('accountId');
                    navigate('/login');
                }}
                accountId="ADMIN"
                classification="ADMIN"
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

                        {error && (
                            <div className="rounded-lg border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        <UploadCard
                            title="Upload FoxPro Payments (CSV/XLSX)"
                            description="Required headers: PAYDATE, AMTPAID, ORNO, PAYCAT, KEYSEARCH, APPLICABLE"
                            onSubmit={handleUploadPayments}
                            onFileChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                            loading={uploadLoading}
                            buttonLabel="Upload Payments"
                            status={uploadStatus}
                            error={uploadError}
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
        </div>
    );
}
