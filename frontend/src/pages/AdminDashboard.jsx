import { useEffect, useMemo, useState } from 'react';
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
        notGoodStandingCount: 0,
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
    const [unpaidItems, setUnpaidItems] = useState([]);
    const [unpaidLoading, setUnpaidLoading] = useState(false);
    const [unpaidError, setUnpaidError] = useState('');
    const [unpaidBillingLabel, setUnpaidBillingLabel] = useState('-');
    const [unpaidBillingEndDateKey, setUnpaidBillingEndDateKey] = useState(null);
    const [showUnpaidModal, setShowUnpaidModal] = useState(false);
    const [overpaidItems, setOverpaidItems] = useState([]);
    const [overpaidLoading, setOverpaidLoading] = useState(false);
    const [overpaidError, setOverpaidError] = useState('');
    const [overpaidBillingLabel, setOverpaidBillingLabel] = useState('-');
    const [overpaidBillingEndDateKey, setOverpaidBillingEndDateKey] = useState(null);
    const [showOverpaidModal, setShowOverpaidModal] = useState(false);
    const [notGoodStandingItems, setNotGoodStandingItems] = useState([]);
    const [notGoodStandingLoading, setNotGoodStandingLoading] = useState(false);
    const [notGoodStandingError, setNotGoodStandingError] = useState('');
    const [notGoodStandingBillingLabel, setNotGoodStandingBillingLabel] = useState('-');
    const [notGoodStandingBillingEndDateKey, setNotGoodStandingBillingEndDateKey] = useState(null);
    const [showNotGoodStandingModal, setShowNotGoodStandingModal] = useState(false);
    const [notGoodStandingFilter, setNotGoodStandingFilter] = useState('ALL');
    const [notGoodStandingStatus, setNotGoodStandingStatus] = useState('not');
    const [paymentsReportItems, setPaymentsReportItems] = useState([]);
    const [paymentsReportLoading, setPaymentsReportLoading] = useState(false);
    const [paymentsReportError, setPaymentsReportError] = useState('');
    const [paymentsBillingLabel, setPaymentsBillingLabel] = useState('-');
    const [showPaymentsModal, setShowPaymentsModal] = useState(false);
    const [paycatReportItems, setPaycatReportItems] = useState([]);
    const [paycatReportLoading, setPaycatReportLoading] = useState(false);
    const [paycatReportError, setPaycatReportError] = useState('');
    const [paycatBillingLabel, setPaycatBillingLabel] = useState('-');
    const [selectedPaycat, setSelectedPaycat] = useState('');
    const [showPaycatModal, setShowPaycatModal] = useState(false);
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
                    notGoodStandingCount: Number(data?.notGoodStandingCount || 0),
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

    const formatDateKey = (value) => {
        if (!value) {
            return '-';
        }

        const date = new Date(`${value}T00:00:00.000Z`);
        if (Number.isNaN(date.getTime())) {
            return '-';
        }

        return date.toLocaleDateString('en-PH');
    };

    const formatMoney = (value) => new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

    const filteredNotGoodStandingItems = useMemo(() => {
        if (notGoodStandingFilter === 'ALL') {
            return notGoodStandingItems;
        }

        const normalizedFilter = notGoodStandingFilter.toLowerCase();
        return notGoodStandingItems.filter((item) => {
            const classification = String(item?.classification || '').toLowerCase();
            return classification === normalizedFilter;
        });
    }, [notGoodStandingFilter, notGoodStandingItems]);

    const activityTitle = (activity) => {
        switch (activity?.action) {
            case 'upload_payments':
                return 'Payments upload completed';
            case 'upload_billings':
                return 'Billings upload completed';
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
                    tfoot { display: table-row-group; }
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

    const handleGenerateOverpaidReport = async () => {
        if (overpaidLoading) {
            return;
        }

        setOverpaidError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setOverpaidError('Session expired. Please log in again.');
            return;
        }

        setOverpaidLoading(true);

        try {
            const response = await fetch(`${API_URL}/admin/overpaid-accounts`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setOverpaidError(data.message || 'Failed to load overpaid accounts.');
                return;
            }

            setOverpaidItems(Array.isArray(data?.items) ? data.items : []);
            setOverpaidBillingLabel(data?.currentBillingLabel || '-');
            setOverpaidBillingEndDateKey(data?.billingEndDateKey || null);
            setShowOverpaidModal(true);
        } catch (err) {
            console.error('Overpaid report error:', err);
            setOverpaidError('Failed to load overpaid accounts. Please try again.');
        } finally {
            setOverpaidLoading(false);
        }
    };

    const handleGenerateUnpaidReport = async () => {
        if (unpaidLoading) {
            return;
        }

        setUnpaidError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setUnpaidError('Session expired. Please log in again.');
            return;
        }

        setUnpaidLoading(true);

        try {
            const response = await fetch(`${API_URL}/admin/unpaid-accounts`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setUnpaidError(data.message || 'Failed to load unpaid accounts.');
                return;
            }

            setUnpaidItems(Array.isArray(data?.items) ? data.items : []);
            setUnpaidBillingLabel(data?.currentBillingLabel || '-');
            setUnpaidBillingEndDateKey(data?.billingEndDateKey || null);
            setShowUnpaidModal(true);
        } catch (err) {
            console.error('Unpaid report error:', err);
            setUnpaidError('Failed to load unpaid accounts. Please try again.');
        } finally {
            setUnpaidLoading(false);
        }
    };

    const handleGenerateNotGoodStandingReport = async (status = notGoodStandingStatus) => {
        if (notGoodStandingLoading) {
            return;
        }

        setNotGoodStandingError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setNotGoodStandingError('Session expired. Please log in again.');
            return;
        }

        setNotGoodStandingLoading(true);
        setNotGoodStandingStatus(status);
        if (status !== notGoodStandingStatus) {
            setNotGoodStandingFilter('ALL');
        }

        try {
            const response = await fetch(`${API_URL}/admin/not-good-standing?status=${encodeURIComponent(status)}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setNotGoodStandingError(data.message || 'Failed to load not-in-good-standing accounts.');
                return;
            }

            setNotGoodStandingItems(Array.isArray(data?.items) ? data.items : []);
            setNotGoodStandingBillingLabel(data?.currentBillingLabel || '-');
            setNotGoodStandingBillingEndDateKey(data?.billingEndDateKey || null);
            setShowNotGoodStandingModal(true);
        } catch (err) {
            console.error('Not good standing report error:', err);
            setNotGoodStandingError('Failed to load not-in-good-standing accounts. Please try again.');
        } finally {
            setNotGoodStandingLoading(false);
        }
    };

    const handleGeneratePaymentsReport = async () => {
        if (paymentsReportLoading) {
            return;
        }

        setPaymentsReportError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setPaymentsReportError('Session expired. Please log in again.');
            return;
        }

        setPaymentsReportLoading(true);

        try {
            const response = await fetch(`${API_URL}/admin/payments-collection`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setPaymentsReportError(data.message || 'Failed to load payments collection.');
                return;
            }

            setPaymentsReportItems(Array.isArray(data?.items) ? data.items : []);
            setPaymentsBillingLabel(data?.currentBillingLabel || '-');
            setShowPaymentsModal(true);
        } catch (err) {
            console.error('Payments report error:', err);
            setPaymentsReportError('Failed to load payments collection. Please try again.');
        } finally {
            setPaymentsReportLoading(false);
        }
    };

    const handleGeneratePaycatReport = async (paycat) => {
        if (paycatReportLoading) {
            return;
        }

        const resolvedPaycat = paycat || 'Uncategorized';
        setSelectedPaycat(resolvedPaycat);
        setPaycatReportError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setPaycatReportError('Session expired. Please log in again.');
            return;
        }

        setPaycatReportLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/admin/payments-by-category?paycat=${encodeURIComponent(resolvedPaycat)}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                setPaycatReportError(data.message || 'Failed to load payments for this category.');
                return;
            }

            setPaycatReportItems(Array.isArray(data?.items) ? data.items : []);
            setPaycatBillingLabel(data?.currentBillingLabel || paymentsBillingLabel || '-');
            setShowPaycatModal(true);
        } catch (err) {
            console.error('Payments by category error:', err);
            setPaycatReportError('Failed to load payments for this category. Please try again.');
        } finally {
            setPaycatReportLoading(false);
        }
    };

    const handlePrintPayments = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=800');
        if (!printWindow) {
            return;
        }

        const rowsHtml = paymentsReportItems.map((item, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.paycat || '-'}</td>
                    <td>${item.count || 0}</td>
                    <td>PHP ${formatMoney(item.total || 0)}</td>
                </tr>
            `;
        }).join('');

        const statusLabel = notGoodStandingStatus === 'good'
            ? 'In Good Standing'
            : 'Not In Good Standing';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Payments Collection</title>
                <style>
                    @page { size: portrait; margin: 16mm; }
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
                <h1>Payments Collection</h1>
                <p>Current billing period: ${paymentsBillingLabel || '-'}.</p>
                <table>
                    <thead>
                        <tr>
                        <h1>${statusLabel}</h1>
                        <p>Amount Due / Excess as of ${formattedAsOf}. Status: ${statusLabel}. Filter: ${notGoodStandingFilter}.</p>
                            <th>Transactions</th>
                            <th>Total Collected</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="4">No payments found.</td></tr>'}
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

    const handlePrintPaycat = () => {
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) {
            return;
        }

        const rowsHtml = paycatReportItems.map((item, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.accountId || '-'}</td>
                    <td>${item.memberName || '-'}</td>
                    <td>${formatDate(item.paymentDate)}</td>
                    <td>PHP ${formatMoney(item.amountPaid || 0)}</td>
                    <td>${item.description || '-'}</td>
                    <td>${item.referenceNumber || '-'}</td>
                    <td>${item.paycat || selectedPaycat || '-'}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Payments - ${selectedPaycat || 'Category'}</title>
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
                <h1>Payments - ${selectedPaycat || 'Category'}</h1>
                <p>Current billing period: ${paycatBillingLabel || '-'}</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Account ID</th>
                            <th>Member Name</th>
                            <th>Payment Date</th>
                            <th>Amount Paid</th>
                            <th>Description</th>
                            <th>OR#</th>
                            <th>Pay Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="8">No payments found.</td></tr>'}
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

    const handlePrintOverpaid = () => {
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) {
            return;
        }

        const rowsHtml = overpaidItems.map((item, index) => {
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
                    <td>${overpaidBillingLabel || '-'}</td>
                </tr>
            `;
        }).join('');

        const formattedAsOf = formatDateKey(overpaidBillingEndDateKey);
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Overpaid Accounts</title>
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
                <h1>Overpaid Accounts</h1>
                <p>Amount Due / Excess as of ${formattedAsOf}.</p>
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
                        ${rowsHtml || '<tr><td colspan="9">No overpaid accounts found.</td></tr>'}
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

    const handlePrintUnpaid = () => {
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) {
            return;
        }

        const totalAmountDue = unpaidItems.reduce((sum, item) => sum + Number(item.amountDue || 0), 0);

        const rowsHtml = unpaidItems.map((item, index) => {
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
                    <td>${unpaidBillingLabel || '-'}</td>
                </tr>
            `;
        }).join('');

        const formattedAsOf = formatDateKey(unpaidBillingEndDateKey);
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Unpaid Accounts</title>
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
                <h1>Unpaid Accounts</h1>
                <p>Amount Due as of ${formattedAsOf}.</p>
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
                        ${rowsHtml || '<tr><td colspan="9">No unpaid accounts found.</td></tr>'}
                        <tr>
                            <td colspan="6"></td>
                            <td><strong>PHP ${formatMoney(totalAmountDue)}</strong></td>
                            <td colspan="2"></td>
                        </tr>
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

    const handlePrintNotGoodStanding = () => {
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) {
            return;
        }

        const totalAmountDue = filteredNotGoodStandingItems.reduce(
            (sum, item) => sum + Number(item.amountDue || 0),
            0,
        );

        const rowsHtml = filteredNotGoodStandingItems.map((item, index) => {
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
                    <td>${notGoodStandingBillingLabel || '-'}</td>
                </tr>
            `;
        }).join('');

        const formattedAsOf = formatDateKey(notGoodStandingBillingEndDateKey);
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Not In Good Standing</title>
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
                <h1>Not In Good Standing</h1>
                <p>Amount Due / Excess as of ${formattedAsOf}. Rule: Amount Due / Excess ≥ (Principal x 2). Filter: ${notGoodStandingFilter}.</p>
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
                        ${rowsHtml || '<tr><td colspan="9">No not-in-good-standing accounts found.</td></tr>'}
                        <tr>
                            <td colspan="6" style="text-align: right; font-weight: 600;">Grand Total</td>
                            <td style="font-weight: 600;">PHP ${formatMoney(totalAmountDue)}</td>
                            <td colspan="2"></td>
                        </tr>
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
                    .print-overpaid, .print-overpaid * {
                        visibility: visible;
                    }
                    .print-overpaid {
                        position: static !important;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        background: #fff;
                    }
                    .print-overpaid .print-overpaid-table {
                        max-height: none !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .print-overpaid * {
                        overflow: visible !important;
                    }
                    .print-overpaid table {
                        width: 100% !important;
                        border-collapse: collapse;
                        page-break-inside: auto;
                    }
                    .print-overpaid thead {
                        display: table-header-group;
                    }
                    .print-overpaid tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print-overpaid tbody {
                        page-break-inside: auto;
                    }
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
                            notGoodStandingCount={summary.notGoodStandingCount}
                            totalCollectedPayments={summary.totalCollectedPayments}
                            loading={summaryLoading}
                            onGenerateUnpaidReport={handleGenerateUnpaidReport}
                            unpaidReportLoading={unpaidLoading}
                            onGenerateSettledReport={handleGenerateSettledReport}
                            settledReportLoading={settledLoading}
                            onGenerateOverpaidReport={handleGenerateOverpaidReport}
                            overpaidReportLoading={overpaidLoading}
                            onGenerateNotGoodStandingReport={handleGenerateNotGoodStandingReport}
                            notGoodStandingReportLoading={notGoodStandingLoading}
                            onGeneratePaymentsReport={handleGeneratePaymentsReport}
                            paymentsReportLoading={paymentsReportLoading}
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

                        {unpaidError && (
                            <AdminStatusMessage
                                variant="error"
                                message={unpaidError}
                            />
                        )}

                        {overpaidError && (
                            <AdminStatusMessage
                                variant="error"
                                message={overpaidError}
                            />
                        )}

                        {notGoodStandingError && (
                            <AdminStatusMessage
                                variant="error"
                                message={notGoodStandingError}
                            />
                        )}

                        {paymentsReportError && (
                            <AdminStatusMessage
                                variant="error"
                                message={paymentsReportError}
                            />
                        )}

                        {paycatReportError && (
                            <AdminStatusMessage
                                variant="error"
                                message={paycatReportError}
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
            {showOverpaidModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 no-print" onClick={() => setShowOverpaidModal(false)} />
                    <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl print-overpaid">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Overpaid Accounts</h2>
                                <p className="text-xs text-slate-500">Amount Due / Excess as of {formatDateKey(overpaidBillingEndDateKey)}.</p>
                            </div>
                            <div className="flex flex-wrap gap-2 no-print">
                                <button
                                    onClick={handlePrintOverpaid}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowOverpaidModal(false)}
                                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100 print-overpaid-table">
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
                                    {overpaidItems.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-6 text-center text-slate-400">
                                                No overpaid accounts found.
                                            </td>
                                        </tr>
                                    )}
                                    {overpaidItems.map((item, index) => (
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
                                                {overpaidBillingLabel || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {showUnpaidModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 no-print" onClick={() => setShowUnpaidModal(false)} />
                    <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Unpaid Accounts</h2>
                                <p className="text-xs text-slate-500">Amount Due as of {formatDateKey(unpaidBillingEndDateKey)}.</p>
                            </div>
                            <div className="flex flex-wrap gap-2 no-print">
                                <button
                                    onClick={handlePrintUnpaid}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowUnpaidModal(false)}
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
                                    {unpaidItems.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-6 text-center text-slate-400">
                                                No unpaid accounts found.
                                            </td>
                                        </tr>
                                    )}
                                    {unpaidItems.map((item, index) => (
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
                                                {unpaidBillingLabel || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end text-sm font-semibold text-slate-700">
                            Grand Total: PHP {formatMoney(unpaidItems.reduce((sum, item) => sum + Number(item.amountDue || 0), 0))}
                        </div>
                    </div>
                </div>
            )}

            {showNotGoodStandingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 no-print" onClick={() => setShowNotGoodStandingModal(false)} />
                    <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {notGoodStandingStatus === 'good' ? 'In Good Standing' : 'Not In Good Standing'}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Amount Due / Excess as of {formatDateKey(notGoodStandingBillingEndDateKey)}.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Status
                                    <select
                                        value={notGoodStandingStatus}
                                        onChange={(event) => handleGenerateNotGoodStandingReport(event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                    >
                                        <option value="not">Not In Good Standing</option>
                                        <option value="good">In Good Standing</option>
                                    </select>
                                </label>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Classification
                                    <select
                                        value={notGoodStandingFilter}
                                        onChange={(event) => setNotGoodStandingFilter(event.target.value)}
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
                                    onClick={handlePrintNotGoodStanding}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowNotGoodStandingModal(false)}
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
                                    {filteredNotGoodStandingItems.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-6 text-center text-slate-400">
                                                No not-in-good-standing accounts found.
                                            </td>
                                        </tr>
                                    )}
                                    {filteredNotGoodStandingItems.map((item, index) => (
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
                                                {notGoodStandingBillingLabel || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end text-sm font-semibold text-slate-700">
                            Grand Total: PHP {formatMoney(
                                filteredNotGoodStandingItems.reduce(
                                    (sum, item) => sum + Number(item.amountDue || 0),
                                    0,
                                ),
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showPaymentsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 no-print" onClick={() => setShowPaymentsModal(false)} />
                    <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Payments Collection</h2>
                                <p className="text-xs text-slate-500">Current billing period: {paymentsBillingLabel || '-'}.</p>
                            </div>
                            <div className="flex flex-wrap gap-2 no-print">
                                <button
                                    onClick={handlePrintPayments}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowPaymentsModal(false)}
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
                                        <th className="px-4 py-3">Pay Category</th>
                                        <th className="px-4 py-3">Transactions</th>
                                        <th className="px-4 py-3">Total Collected</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paymentsReportItems.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-6 text-center text-slate-400">
                                                No payments found.
                                            </td>
                                        </tr>
                                    )}
                                    {paymentsReportItems.map((item, index) => (
                                        <tr key={`${item.paycat}-${index}`}>
                                            <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">
                                                {item.paycat || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.count || 0}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                PHP {formatMoney(item.total || 0)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleGeneratePaycatReport(item.paycat || 'Uncategorized')}
                                                    disabled={paycatReportLoading && selectedPaycat === (item.paycat || 'Uncategorized')}
                                                    className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition bg-amber-50 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {paycatReportLoading && selectedPaycat === (item.paycat || 'Uncategorized')
                                                        ? 'Generating...'
                                                        : 'Generate Report'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {showPaycatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 no-print" onClick={() => setShowPaycatModal(false)} />
                    <div className="relative z-10 w-full max-w-6xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Payments - {selectedPaycat || '-'}</h2>
                                <p className="text-xs text-slate-500">Current billing period: {paycatBillingLabel || '-'}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 no-print">
                                <button
                                    onClick={handlePrintPaycat}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowPaycatModal(false)}
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
                                        <th className="px-4 py-3">Member Name</th>
                                        <th className="px-4 py-3">Payment Date</th>
                                        <th className="px-4 py-3">Amount Paid</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3">OR#</th>
                                        <th className="px-4 py-3">Pay Category</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paycatReportItems.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-6 text-center text-slate-400">
                                                No payments found.
                                            </td>
                                        </tr>
                                    )}
                                    {paycatReportItems.map((item, index) => (
                                        <tr key={`${item.accountId}-${item.referenceNumber || index}`}>
                                            <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">
                                                {item.accountId || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.memberName || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {formatDate(item.paymentDate)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                PHP {formatMoney(item.amountPaid || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.description || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.referenceNumber || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.paycat || selectedPaycat || '-'}
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
