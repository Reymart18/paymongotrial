import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import UploadCard from './components/AdminDashboard/UploadCard';
import pvhaiImg from '../images/pvhai.png';
import cbIcon from '../images/cb.png';
import rpIcon from '../images/rp.png';
import toIcon from '../images/to.png';

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
    const [paymentFile, setPaymentFile] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [overdueItems, setOverdueItems] = useState([]);
    const [overdueLoading, setOverdueLoading] = useState(false);
    const [overdueError, setOverdueError] = useState('');
    const [showOverdueModal, setShowOverdueModal] = useState(false);
    const [outstandingTotal, setOutstandingTotal] = useState(0);
    const [outstandingLoading, setOutstandingLoading] = useState(false);
    const [outstandingError, setOutstandingError] = useState('');
    const [outstandingItems, setOutstandingItems] = useState([]);
    const [outstandingBillingLabel, setOutstandingBillingLabel] = useState('-');
    const [outstandingBillingEndDateKey, setOutstandingBillingEndDateKey] = useState(null);
    const [showOutstandingModal, setShowOutstandingModal] = useState(false);
    const [outstandingReportLoading, setOutstandingReportLoading] = useState(false);
    const [outstandingFilter, setOutstandingFilter] = useState('ALL');
    const [quarterDueItems, setQuarterDueItems] = useState([]);
    const [quarterDueLoading, setQuarterDueLoading] = useState(false);
    const [quarterDueError, setQuarterDueError] = useState('');
    const [showQuarterDueModal, setShowQuarterDueModal] = useState(false);
    const [quarterDueFilter, setQuarterDueFilter] = useState('ALL');
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [currentPaymentCardIndex, setCurrentPaymentCardIndex] = useState(0);
    const [currentBillingCardIndex, setCurrentBillingCardIndex] = useState(0);

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
    const overdueTotal = useMemo(
        () => overdueItems.reduce((sum, item) => sum + Number(item?.amountDue || 0), 0),
        [overdueItems],
    );
    const filteredOutstandingItems = useMemo(() => {
        if (outstandingFilter === 'ALL') {
            return outstandingItems;
        }

        const normalizedFilter = outstandingFilter.toLowerCase();
        return outstandingItems.filter((item) => {
            const classification = String(item?.classification || '').toLowerCase();
            return classification === normalizedFilter;
        });
    }, [outstandingFilter, outstandingItems]);
    const filteredQuarterDueItems = useMemo(() => {
        if (quarterDueFilter === 'ALL') {
            return quarterDueItems;
        }

        const normalizedFilter = quarterDueFilter.toLowerCase();
        return quarterDueItems.filter((item) => {
            const classification = String(item?.classification || '').toLowerCase();
            return classification === normalizedFilter;
        });
    }, [quarterDueFilter, quarterDueItems]);

    const handlePrevCard = () => {
        setCurrentCardIndex((prev) => (prev === 0 ? 1 : prev - 1));
    };

    const handleNextCard = () => {
        setCurrentCardIndex((prev) => (prev === 1 ? 0 : prev + 1));
    };

    const handlePrevPaymentCard = () => {
        setCurrentPaymentCardIndex((prev) => (prev === 0 ? 1 : prev - 1));
    };

    const handleNextPaymentCard = () => {
        setCurrentPaymentCardIndex((prev) => (prev === 1 ? 0 : prev + 1));
    };

    const handlePrevBillingCard = () => {
        setCurrentBillingCardIndex((prev) => (prev === 0 ? 1 : prev - 1));
    };

    const handleNextBillingCard = () => {
        setCurrentBillingCardIndex((prev) => (prev === 1 ? 0 : prev + 1));
    };

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
            setBillingError('Please choose a DBF file first.');
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
                `Upload complete: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped.`,
            );
        } catch (err) {
            console.error('Billing upload error:', err);
            setBillingError('Upload failed. Please try again.');
        } finally {
            setBillingLoading(false);
        }
    };

    const handleUploadPayments = async (event) => {
        event.preventDefault();
        setPaymentStatus('');
        setPaymentError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setPaymentError('Session expired. Please log in again.');
            return;
        }

        if (!paymentFile) {
            setPaymentError('Please choose a DBF file first.');
            return;
        }

        setPaymentLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', paymentFile);

            const response = await fetch(`${API_URL}/foxpro/payments/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setPaymentError(data.message || 'Upload failed. Please try again.');
                return;
            }

            setPaymentStatus(
                `Upload complete: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped.`,
            );
        } catch (err) {
            console.error('Payment upload error:', err);
            setPaymentError('Upload failed. Please try again.');
        } finally {
            setPaymentLoading(false);
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

    const handleGenerateOutstanding = async () => {
        if (outstandingReportLoading) {
            return;
        }

        setOutstandingError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setOutstandingError('Session expired. Please log in again.');
            return;
        }

        setOutstandingReportLoading(true);

        try {
            const response = await fetch(`${API_URL}/admin/unpaid-accounts`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setOutstandingError(data.message || 'Failed to load outstanding accounts.');
                return;
            }

            setOutstandingItems(Array.isArray(data?.items) ? data.items : []);
            setOutstandingBillingLabel(data?.currentBillingLabel || '-');
            setOutstandingBillingEndDateKey(data?.billingEndDateKey || null);
            setShowOutstandingModal(true);
        } catch (err) {
            console.error('Outstanding report error:', err);
            setOutstandingError('Failed to load outstanding accounts. Please try again.');
        } finally {
            setOutstandingReportLoading(false);
        }
    };

    const handleGenerateQuarterDue = async () => {
        if (quarterDueLoading) {
            return;
        }

        setQuarterDueError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setQuarterDueError('Session expired. Please log in again.');
            return;
        }

        setQuarterDueLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/reports/quarter-due-charges?year=${year}&quarter=${quarter}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                setQuarterDueError(data.message || 'Failed to load due list.');
                return;
            }

            setQuarterDueItems(Array.isArray(data?.items) ? data.items : []);
            setShowQuarterDueModal(true);
        } catch (err) {
            console.error('Quarter due report error:', err);
            setQuarterDueError('Failed to load due list. Please try again.');
        } finally {
            setQuarterDueLoading(false);
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
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) {
            return;
        }

        const rowsHtml = overdueItems.map((item, index) => {
            const address = [item.neighborhood, item.block, item.lot]
                .filter(Boolean)
                .join(' ');
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.accountId || '-'}</td>
                    <td>${item.memberName || '-'}</td>
                    <td>${address || '-'}</td>
                    <td>${formatDate(item.lastPaymentDate)}</td>
                    <td>PHP ${formatMoney(item.amountDue || 0)}</td>
                    <td>${formatDate(item.latestBillingDate)}</td>
                </tr>
            `;
        }).join('');
        const totalRowHtml = overdueItems.length
            ? `
                <tr>
                    <td colspan="5" style="text-align: right; font-weight: 600;">Grand Total</td>
                    <td style="font-weight: 600;">PHP ${formatMoney(overdueTotal)}</td>
                    <td></td>
                </tr>
            `
            : '';
        const bodyHtml = rowsHtml
            ? `${rowsHtml}${totalRowHtml}`
            : '<tr><td colspan="7">No overdue accounts found.</td></tr>';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Overdue Accounts</title>
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
                <h1>Overdue Accounts</h1>
                <p>Amount due/excess as of latest billing, no payment for 12 months.</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Account ID</th>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Last Payment</th>
                            <th>Amount Due / Excess</th>
                            <th>Current Billing</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bodyHtml}
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

    const handlePrintOutstanding = () => {
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) {
            return;
        }

        const rowsHtml = filteredOutstandingItems.map((item, index) => {
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
                    <td>${outstandingBillingLabel || '-'}</td>
                </tr>
            `;
        }).join('');

        const formattedAsOf = outstandingBillingEndDateKey
            ? formatDate(new Date(`${outstandingBillingEndDateKey}T00:00:00.000Z`))
            : '-';
        const outstandingTotal = filteredOutstandingItems.reduce(
            (sum, item) => sum + Number(item.amountDue || 0),
            0,
        );
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Outstanding Accounts</title>
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
                <h1>Outstanding Accounts</h1>
                <p>Amount Due as of ${formattedAsOf}. Filter: ${outstandingFilter}.</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Account ID</th>
                            <th>Name</th>
                            <th>Neighborhood</th>
                            <th>Block</th>
                            <th>Lot</th>
                            <th>Amount Due</th>
                            <th>Last Payment</th>
                            <th>Current Billing</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="9">No outstanding accounts found.</td></tr>'}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6" style="text-align: right; font-weight: 600;">Grand Total</td>
                            <td style="font-weight: 600;">PHP ${formatMoney(outstandingTotal)}</td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
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

    const handlePrintQuarterDue = () => {
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) {
            return;
        }

        const rowsHtml = filteredQuarterDueItems.map((item, index) => {
            const address = [item.neighborhood, item.block, item.lot]
                .filter(Boolean)
                .join(' ');
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.accountId || '-'}</td>
                    <td>${item.memberName || '-'}</td>
                    <td>${address || '-'}</td>
                    <td>PHP ${formatMoney(item.balanceTotal || 0)}</td>
                    <td>PHP ${formatMoney(item.currentChargesTotal || 0)}</td>
                    <td>PHP ${formatMoney(item.amountDue || 0)}</td>
                    <td>${formatDate(item.lastPaymentDate)}</td>
                </tr>
            `;
        }).join('');

        const totalCollectibles = filteredQuarterDueItems.reduce((sum, item) => {
            const currentCharges = Number(item.currentChargesTotal || 0);
            const amountDue = Number(item.amountDue || 0);
            const collectibles = amountDue >= currentCharges ? currentCharges : amountDue;
            return sum + collectibles;
        }, 0);

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Due vs Charges</title>
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
                <h1>Net Collection (This Quarter)</h1>
                <p>Quarter: Q${quarter} ${year}. Filter: ${quarterDueFilter}.</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Account ID</th>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Previous Balance</th>
                            <th>Total Current Charges</th>
                            <th>Amount Due</th>
                            <th>Last Payment</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="8">No matching accounts found.</td></tr>'}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6" style="text-align: right; font-weight: 600;">Total Collectibles (This Quarter)</td>
                            <td style="font-weight: 600;">PHP ${formatMoney(totalCollectibles)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || (role !== 'admin' && role !== 'super_admin')) {
            return;
        }

        const fetchOutstandingTotal = async () => {
            setOutstandingLoading(true);
            setOutstandingError('');

            try {
                const response = await fetch(`${API_URL}/admin/unpaid-accounts`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    setOutstandingError(data.message || 'Failed to load total outstanding.');
                    return;
                }

                const items = Array.isArray(data?.items) ? data.items : [];
                const total = items.reduce((sum, item) => sum + Number(item?.amountDue || 0), 0);
                setOutstandingTotal(total);
            } catch (err) {
                console.error('Outstanding total error:', err);
                setOutstandingError('Failed to load total outstanding. Please try again.');
            } finally {
                setOutstandingLoading(false);
            }
        };

        fetchOutstandingTotal();
    }, [API_URL]);

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
                    .print-overdue, .print-overdue * {
                        visibility: visible;
                    }
                    .print-overdue {
                        position: static !important;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        background: #fff;
                    }
                    .print-overdue .print-overdue-table {
                        max-height: none !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .print-overdue * {
                        overflow: visible !important;
                    }
                    .print-overdue table {
                        width: 100% !important;
                        border-collapse: collapse;
                        page-break-inside: auto;
                    }
                    .print-overdue thead {
                        display: table-header-group;
                    }
                    .print-overdue tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print-overdue tbody {
                        page-break-inside: auto;
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
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6">
                            <div>
                                <h2 className="text-3xl font-semibold text-slate-900">Quarterly Reports</h2>
                                <p className="text-sm text-slate-500">
                                    Total billed, collected, and outstanding balances by quarter.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="number"
                                    className="w-full sm:w-28 rounded-lg px-3 py-2 text-sm bg-[#F3E4C9]"
                                    value={year}
                                    onChange={(event) => setYear(Number(event.target.value))}
                                />
                                <select
                                    className="w-full sm:w-52 rounded-lg  px-3 py-2 text-sm bg-[#F3E4C9]"
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

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    title: 'Total Billed (This Quarter)',
                                    value: (
                                        <div className="flex flex-col">
                                            <span className="text-2xl text-gray-700">PHP</span>
                                            <span className="text-2xl font-bold">
                                                {formatMoney(totals.billed)}
                                            </span>
                                        </div>
                                    ),
                                    comparison: comparison.billedPercent,
                                    icon: cbIcon,
                                },
                                {
                                    title: 'Total Collected (This Quarter)',
                                    value: (
                                        <div className="flex flex-col">
                                            <span className="text-2xl text-gray-700">PHP</span>
                                            <span className="text-2xl font-bold">
                                                {formatMoney(totals.collected)}
                                            </span>
                                        </div>
                                    ),
                                    comparison: comparison.collectedPercent,
                                    icon: toIcon,
                                },
                                {
                                    title: 'Net Collection (This Quarter)',
                                    value: (
                                        <div className="flex flex-col">
                                            <span className="text-2xl text-gray-700">PHP</span>
                                            <span className="text-2xl font-bold">
                                                {formatMoney(totals.outstanding)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleGenerateQuarterDue}
                                                disabled={quarterDueLoading}
                                                className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition bg-amber-50 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {quarterDueLoading ? 'Generating...' : 'Generate Report'}
                                            </button>
                                        </div>
                                    ),
                                    comparison: comparison.outstandingPercent,
                                    compareMode: 'inverse',
                                    icon: rpIcon,
                                    error: quarterDueError,
                                },
                                {
                                    title: 'Total Outstanding (As of Today)',
                                    value: (
                                        <div className="flex flex-col">
                                            <span className="text-2xl text-gray-700">PHP</span>
                                            <span className="text-2xl font-bold">
                                                {formatMoney(outstandingTotal)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleGenerateOutstanding}
                                                disabled={outstandingReportLoading}
                                                className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition bg-amber-50 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {outstandingReportLoading ? 'Generating...' : 'Generate Report'}
                                            </button>
                                        </div>
                                    ),
                                    hideComparison: true,
                                    icon: rpIcon,
                                    error: outstandingError,
                                },
                            ].map((card) => {
                                const adjustedComparison = card.compareMode === 'inverse' && typeof card.comparison === 'number'
                                    ? -card.comparison
                                    : card.comparison;
                                const hasComparison = typeof adjustedComparison === 'number';
                                const isPositive = hasComparison && adjustedComparison > 0;
                                const isNegative = hasComparison && adjustedComparison < 0;
                                return (
                                    <div
                                        key={card.title}
                                        className="relative rounded-2xl border border-slate-200 bg-white p-6 pt-10 shadow-sm transition hover:shadow-md"
                                    >
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white shadow-md border-2 border-[#E89B58]/33">
                                                <img src={card.icon} alt="" className="h-7 w-7" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-slate-600 whitespace-nowrap">{card.title}</p>
                                        </div>
                                        <p className="mt-3 text-2xl font-semibold text-slate-900 text-center">
                                            {loading || outstandingLoading ? 'Loading...' : card.value}
                                        </p>
                                        {!card.hideComparison && (
                                            <p className={`mt-2 text-xs text-center ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-slate-500'}`}>
                                                vs previous quarter: <span className="font-semibold">{formatPercent(adjustedComparison)}</span>
                                            </p>
                                        )}
                                        {card.error && (
                                            <p className="mt-2 text-xs text-center text-rose-600">{card.error}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {error && (
                            <div className="rounded-lg border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                            {/* Payments Section */}
                            <div className="relative flex flex-col items-center justify-center overflow-hidden">
                                <button
                                    onClick={handlePrevPaymentCard}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 text-slate-700"
                                    title="Previous"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>

                                <div className="w-full flex items-center justify-center px-8">
                                    {currentPaymentCardIndex === 0 && (
                                        <UploadCard
                                            title="Sync FoxPro Payments (DBF)"
                                            description="Manual sync from payments.DBF to update payment records."
                                            onSubmit={handleSyncPayments}
                                            loading={syncLoading}
                                            loadingLabel="Syncing..."
                                            buttonLabel="SYNC"
                                            status={syncStatus}
                                            error={syncError}
                                            showFileInput={false}
                                        />
                                    )}

                                    {currentPaymentCardIndex === 1 && (
                                        <UploadCard
                                            title="Upload FoxPro Payments (DBF)"
                                            onFileChange={(event) => setPaymentFile(event.target.files?.[0] || null)}
                                            loading={paymentLoading}
                                            buttonLabel="Upload Payments"
                                            status={paymentStatus}
                                            error={paymentError}
                                            inputAccept=".dbf"
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={handleNextPaymentCard}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 text-slate-700"
                                    title="Next"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>

                                <div className="flex items-center justify-center gap-2 mt-4">
                                    {[0, 1].map((index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentPaymentCardIndex(index)}
                                            className={`w-2 h-2 rounded-full transition ${index === currentPaymentCardIndex ? 'bg-slate-900' : 'bg-slate-300'
                                                }`}
                                            title={`Payment Card ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Billings Section */}
                            <div className="relative flex flex-col items-center justify-center overflow-hidden">
                                <button
                                    onClick={handlePrevBillingCard}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 text-slate-700"
                                    title="Previous"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>

                                <div className="w-full flex items-center justify-center px-8">
                                    {currentBillingCardIndex === 0 && (
                                        <UploadCard
                                            title="Sync FoxPro Billings (DBF)"
                                            description="Manual sync from BILLING.DBF to update billing records."
                                            onSubmit={handleSyncBillings}
                                            loading={billingSyncLoading}
                                            loadingLabel="Syncing..."
                                            buttonLabel="SYNC"
                                            status={billingSyncStatus}
                                            error={billingSyncError}
                                            showFileInput={false}
                                        />
                                    )}

                                    {currentBillingCardIndex === 1 && (
                                        <UploadCard
                                            title="Upload FoxPro Billings (DBF)"
                                            onSubmit={handleUploadBillings}
                                            onFileChange={(event) => setBillingFile(event.target.files?.[0] || null)}
                                            loading={billingLoading}
                                            buttonLabel="Upload Billings"
                                            status={billingStatus}
                                            error={billingError}
                                            inputAccept=".dbf"
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={handleNextBillingCard}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 text-slate-700"
                                    title="Next"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>

                                <div className="flex items-center justify-center gap-2 mt-4">
                                    {[0, 1].map((index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentBillingCardIndex(index)}
                                            className={`w-2 h-2 rounded-full transition ${index === currentBillingCardIndex ? 'bg-slate-900' : 'bg-slate-300'
                                                }`}
                                            title={`Billing Card ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="relative flex flex-col justify-center">
                                <div className="relative rounded-2xl border border-slate-700 p-5 shadow-sm transition hover:shadow-md" style={{ backgroundColor: '#0E0E0E' }}>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Disclaimer: No payment for 12 months and equivalent to 12 months’ amount due.
                                    </p>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">⚠️</span>
                                            <h3 className="text-sm font-medium text-white">Overdue Accounts</h3>
                                        </div>
                                        <button
                                            onClick={handleGenerateOverdue}
                                            className="rounded-lg bg-white px-1 py-1 text-[11px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60"
                                            disabled={overdueLoading}
                                        >
                                            {overdueLoading ? 'Generating...' : 'Generate Report'}
                                        </button>
                                    </div>
                                    {overdueError && (
                                        <div className="mt-3 rounded-lg border border-rose-400 bg-rose-900/30 px-3 py-2 text-[11px] text-rose-200">
                                            {overdueError}
                                        </div>
                                    )}
                                    <div className="mt-4 rounded-xl border border-slate-600 px-4 py-3" style={{ backgroundColor: '#1a1a1a' }}>
                                        <p className="text-xs text-slate-400">Total accounts</p>
                                        <p className="text-lg font-semibold text-white">
                                            {overdueItems.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
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

                        <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100 print-overdue-table">
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
                                    {overdueItems.length > 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-3 text-right font-semibold text-slate-700">
                                                Grand Total
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">
                                                {formatMoney(overdueTotal)}
                                            </td>
                                            <td className="px-4 py-3"></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {showOutstandingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 no-print" onClick={() => setShowOutstandingModal(false)} />
                    <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Outstanding Accounts</h2>
                                <p className="text-xs text-slate-500">
                                    Amount Due as of {outstandingBillingEndDateKey
                                        ? formatDate(new Date(`${outstandingBillingEndDateKey}T00:00:00.000Z`))
                                        : '-'}.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Classification
                                    <select
                                        value={outstandingFilter}
                                        onChange={(event) => setOutstandingFilter(event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                    >
                                        <option value="ALL">All</option>
                                        <option value="HOMEOWNER">Homeowner</option>
                                        <option value="LOT OWNER">Lot Owner</option>
                                    </select>
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-2 no-print">
                                <button
                                    onClick={handlePrintOutstanding}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowOutstandingModal(false)}
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
                                        <th className="px-4 py-3">Neighborhood</th>
                                        <th className="px-4 py-3">Block</th>
                                        <th className="px-4 py-3">Lot</th>
                                        <th className="px-4 py-3">Amount Due</th>
                                        <th className="px-4 py-3">Last Payment</th>
                                        <th className="px-4 py-3">Current Billing</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {outstandingItems.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-6 text-center text-slate-400">
                                                No outstanding accounts found.
                                            </td>
                                        </tr>
                                    )}
                                    {filteredOutstandingItems.map((item, index) => (
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
                                            <td className="px-4 py-3 font-semibold text-rose-600">
                                                PHP {formatMoney(item.amountDue || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {formatDate(item.lastPaymentDate)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {outstandingBillingLabel || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end text-sm font-semibold text-slate-700">
                            Grand Total: PHP {formatMoney(filteredOutstandingItems.reduce((sum, item) => sum + Number(item.amountDue || 0), 0))}
                        </div>
                    </div>
                </div>
            )}

            {showQuarterDueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 no-print" onClick={() => setShowQuarterDueModal(false)} />
                    <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Net Collection (This Quarter)</h2>
                                <p className="text-xs text-slate-500">Quarter: Q{quarter} {year}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Classification
                                    <select
                                        value={quarterDueFilter}
                                        onChange={(event) => setQuarterDueFilter(event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                    >
                                        <option value="ALL">All</option>
                                        <option value="HOMEOWNER">Homeowner</option>
                                        <option value="LOT OWNER">Lot Owner</option>
                                    </select>
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-2 no-print">
                                <button
                                    onClick={handlePrintQuarterDue}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowQuarterDueModal(false)}
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
                                        <th className="px-4 py-3">Previous Balance</th>
                                        <th className="px-4 py-3">Total Current Charges</th>
                                        <th className="px-4 py-3">Amount Due</th>
                                        <th className="px-4 py-3">Last Payment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredQuarterDueItems.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-6 text-center text-slate-400">
                                                No matching accounts found.
                                            </td>
                                        </tr>
                                    )}
                                    {filteredQuarterDueItems.map((item, index) => {
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
                                                    PHP {formatMoney(item.balanceTotal || 0)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    PHP {formatMoney(item.currentChargesTotal || 0)}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-rose-600">
                                                    PHP {formatMoney(item.amountDue || 0)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {formatDate(item.lastPaymentDate)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex flex-col items-end gap-1 text-sm font-semibold text-slate-700">
                            <div>
                                Total Collectibles (This Quarter): PHP {formatMoney(
                                    filteredQuarterDueItems.reduce((sum, item) => {
                                        const currentCharges = Number(item.currentChargesTotal || 0);
                                        const amountDue = Number(item.amountDue || 0);
                                        const collectibles = amountDue >= currentCharges ? currentCharges : amountDue;
                                        return sum + collectibles;
                                    }, 0),
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
