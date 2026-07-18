import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useAdminDashboardController() {
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
    const [activityPage, setActivityPage] = useState(1);
    const [activityMeta, setActivityMeta] = useState({
        page: 1,
        limit: 6,
        total: 0,
        totalPages: 1,
    });
    const [settledItems, setSettledItems] = useState([]);
    const [settledLoading, setSettledLoading] = useState(false);
    const [settledError, setSettledError] = useState('');
    const [settledBillingLabel, setSettledBillingLabel] = useState('-');
    const [showSettledModal, setShowSettledModal] = useState(false);
    const [settledFilter, setSettledFilter] = useState('ALL');
    const [unpaidItems, setUnpaidItems] = useState([]);
    const [unpaidLoading, setUnpaidLoading] = useState(false);
    const [unpaidError, setUnpaidError] = useState('');
    const [unpaidBillingLabel, setUnpaidBillingLabel] = useState('-');
    const [unpaidBillingEndDateKey, setUnpaidBillingEndDateKey] = useState(null);
    const [showUnpaidModal, setShowUnpaidModal] = useState(false);
    const [unpaidFilter, setUnpaidFilter] = useState('ALL');
    const [overpaidItems, setOverpaidItems] = useState([]);
    const [overpaidLoading, setOverpaidLoading] = useState(false);
    const [overpaidError, setOverpaidError] = useState('');
    const [overpaidBillingLabel, setOverpaidBillingLabel] = useState('-');
    const [overpaidBillingEndDateKey, setOverpaidBillingEndDateKey] = useState(null);
    const [showOverpaidModal, setShowOverpaidModal] = useState(false);
    const [overpaidFilter, setOverpaidFilter] = useState('ALL');
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
    const [syncInfo, setSyncInfo] = useState(null);
    const [syncStatusLoading, setSyncStatusLoading] = useState(false);
    const [syncStatusError, setSyncStatusError] = useState('');
    const [syncRequestStatus, setSyncRequestStatus] = useState('');
    const [syncRequestError, setSyncRequestError] = useState('');
    const [syncRequestLoading, setSyncRequestLoading] = useState({
        members: false,
        payments: false,
        billing: false,
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const userRole = localStorage.getItem('userRole');
    const adminLabel = userRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN';

    const fetchSyncStatus = useCallback(async (signal) => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || (role !== 'admin' && role !== 'super_admin')) {
            return;
        }

        setSyncStatusLoading(true);
        setSyncStatusError('');

        try {
            const response = await fetch(`${API_URL}/sync/status`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                signal,
            });
            const data = await response.json();

            if (!response.ok) {
                setSyncStatusError(data.message || 'Failed to load sync status.');
                return;
            }

            setSyncInfo(data);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setSyncStatusError('Failed to load sync status.');
            }
        } finally {
            setSyncStatusLoading(false);
        }
    }, [API_URL]);

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
                const response = await fetch(`${API_URL}/admin/activities?limit=6&page=${activityPage}`, {
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

                if (Array.isArray(data)) {
                    setActivityItems(data);
                    setActivityMeta({
                        page: activityPage,
                        limit: 6,
                        total: data.length,
                        totalPages: 1,
                    });
                    return;
                }

                setActivityItems(Array.isArray(data?.items) ? data.items : []);
                setActivityMeta({
                    page: Number(data?.page || activityPage),
                    limit: Number(data?.limit || 6),
                    total: Number(data?.total || 0),
                    totalPages: Number(data?.totalPages || 1),
                });
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
    }, [API_URL, activityPage]);

    useEffect(() => {
        const controller = new AbortController();
        fetchSyncStatus(controller.signal);
        const interval = window.setInterval(() => {
            fetchSyncStatus(controller.signal);
        }, 5000);

        return () => {
            window.clearInterval(interval);
            controller.abort();
        };
    }, [fetchSyncStatus]);

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

    const filterAccountsByClassification = useCallback((items, filter) => {
        if (filter === 'ALL') {
            return items;
        }

        const normalizedFilter = filter.toLowerCase();
        return items.filter((item) => {
            const classification = String(item?.classification || '').toLowerCase();
            return classification === normalizedFilter;
        });
    }, []);

    const filteredSettledItems = useMemo(
        () => filterAccountsByClassification(settledItems, settledFilter),
        [filterAccountsByClassification, settledFilter, settledItems],
    );
    const filteredUnpaidItems = useMemo(
        () => filterAccountsByClassification(unpaidItems, unpaidFilter),
        [filterAccountsByClassification, unpaidFilter, unpaidItems],
    );
    const filteredOverpaidItems = useMemo(
        () => filterAccountsByClassification(overpaidItems, overpaidFilter),
        [filterAccountsByClassification, overpaidFilter, overpaidItems],
    );

    const filteredNotGoodStandingItems = useMemo(() => {
        return filterAccountsByClassification(notGoodStandingItems, notGoodStandingFilter);
    }, [filterAccountsByClassification, notGoodStandingFilter, notGoodStandingItems]);

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

    const requestSync = async (type) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setSyncRequestError('Session expired. Please log in again.');
            return;
        }

        const endpoint = type === 'billing' ? 'billing' : type;
        setSyncRequestLoading((current) => ({ ...current, [type]: true }));
        setSyncRequestError('');
        setSyncRequestStatus('');

        try {
            const response = await fetch(`${API_URL}/sync/request/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to request sync.');
            }

            const label = type === 'billing' ? 'Billing' : type.charAt(0).toUpperCase() + type.slice(1);
            setSyncRequestStatus(`${label} sync requested.`);
            await fetchSyncStatus();
        } catch (err) {
            setSyncRequestError(err.message || 'Failed to request sync.');
        } finally {
            setSyncRequestLoading((current) => ({ ...current, [type]: false }));
        }
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

        const rowsHtml = filteredSettledItems.map((item, index) => {
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
                <p>Amount due/excess equals 0.00 for the current billing period (${settledBillingLabel || '-'}). Classification: ${settledFilter}.</p>
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
        const formattedAsOf = formatDateKey(notGoodStandingBillingEndDateKey);
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

        const rowsHtml = filteredOverpaidItems.map((item, index) => {
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
                <p>Amount Due / Excess as of ${formattedAsOf}. Classification: ${overpaidFilter}.</p>
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

        const totalAmountDue = filteredUnpaidItems.reduce((sum, item) => sum + Number(item.amountDue || 0), 0);

        const rowsHtml = filteredUnpaidItems.map((item, index) => {
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
                <p>Amount Due as of ${formattedAsOf}. Classification: ${unpaidFilter}.</p>
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



    const alertMessages = [
        { key: 'summary', value: summaryError },
        { key: 'settled', value: settledError },
        { key: 'unpaid', value: unpaidError },
        { key: 'overpaid', value: overpaidError },
        { key: 'not-good-standing', value: notGoodStandingError },
        { key: 'payments', value: paymentsReportError },
        { key: 'paycat', value: paycatReportError },
        { key: 'sync-status', value: syncStatusError },
        { key: 'sync-request', value: syncRequestError },
    ].filter((message) => message.value);

    return {
        adminLabel,
        alertMessages,
        sidebarOpen,
        setSidebarOpen,
        summary,
        summaryLoading,
        syncInfo,
        syncStatusLoading,
        syncRequestLoading,
        syncRequestStatus,
        requestSync,
        activityItems,
        activityLoading,
        activityError,
        activityPage,
        activityMeta,
        setActivityPage,
        activityTitle,
        formatTimestamp,
        formatDate,
        formatDateKey,
        formatMoney,
        handleLogout,
        handleGenerateUnpaidReport,
        handleGenerateSettledReport,
        handleGenerateOverpaidReport,
        handleGenerateNotGoodStandingReport,
        handleGeneratePaymentsReport,
        handleGeneratePaycatReport,
        unpaidLoading,
        settledLoading,
        overpaidLoading,
        notGoodStandingLoading,
        paymentsReportLoading,
        filteredSettledItems,
        settledFilter,
        setSettledFilter,
        settledBillingLabel,
        showSettledModal,
        setShowSettledModal,
        handlePrintSettled,
        filteredOverpaidItems,
        overpaidFilter,
        setOverpaidFilter,
        overpaidBillingLabel,
        overpaidBillingEndDateKey,
        showOverpaidModal,
        setShowOverpaidModal,
        handlePrintOverpaid,
        filteredUnpaidItems,
        unpaidFilter,
        setUnpaidFilter,
        unpaidBillingLabel,
        unpaidBillingEndDateKey,
        showUnpaidModal,
        setShowUnpaidModal,
        handlePrintUnpaid,
        filteredNotGoodStandingItems,
        notGoodStandingStatus,
        notGoodStandingFilter,
        setNotGoodStandingFilter,
        notGoodStandingBillingLabel,
        notGoodStandingBillingEndDateKey,
        showNotGoodStandingModal,
        setShowNotGoodStandingModal,
        handlePrintNotGoodStanding,
        paymentsReportItems,
        paymentsBillingLabel,
        showPaymentsModal,
        setShowPaymentsModal,
        handlePrintPayments,
        paycatReportLoading,
        selectedPaycat,
        paycatReportItems,
        paycatBillingLabel,
        showPaycatModal,
        setShowPaycatModal,
        handlePrintPaycat,
    };
}
