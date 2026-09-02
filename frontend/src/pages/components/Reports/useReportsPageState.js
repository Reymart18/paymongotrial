import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAdminIdentity, getAdminDisplayName, getAdminRoleLabel } from '../../../utils/adminIdentity';

export default function useReportsPageState() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const syncMode = import.meta.env.VITE_SYNC_MODE || 'push_api';
    const useLocalDbfSync = syncMode === 'local_dbf';
    const userRole = localStorage.getItem('userRole');
    const adminName = getAdminDisplayName();
    const adminLabel = getAdminRoleLabel(userRole);

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
    const [syncRequestId, setSyncRequestId] = useState(null);
    const [billingSyncStatus, setBillingSyncStatus] = useState('');
    const [billingSyncError, setBillingSyncError] = useState('');
    const [billingSyncLoading, setBillingSyncLoading] = useState(false);
    const [billingSyncRequestId, setBillingSyncRequestId] = useState(null);
    const [billingFile, setBillingFile] = useState(null);
    const [billingStatus, setBillingStatus] = useState('');
    const [billingError, setBillingError] = useState('');
    const [billingLoading, setBillingLoading] = useState(false);
    const [waterBillingFile, setWaterBillingFile] = useState(null);
    const [waterBillingStatus, setWaterBillingStatus] = useState('');
    const [waterBillingError, setWaterBillingError] = useState('');
    const [waterBillingLoading, setWaterBillingLoading] = useState(false);
    const [paymentFile, setPaymentFile] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [overdueItems, setOverdueItems] = useState([]);
    const [overdueLoading, setOverdueLoading] = useState(false);
    const [overdueError, setOverdueError] = useState('');
    const [showOverdueModal, setShowOverdueModal] = useState(false);
    const [overdueFilter, setOverdueFilter] = useState('ALL');
    const [outstandingTotal, setOutstandingTotal] = useState(0);
    const [outstandingLoading, setOutstandingLoading] = useState(false);
    const [outstandingError, setOutstandingError] = useState('');
    const [outstandingItems, setOutstandingItems] = useState([]);
    const [outstandingBillingLabel, setOutstandingBillingLabel] = useState('-');
    const [outstandingBillingEndDateKey, setOutstandingBillingEndDateKey] = useState(null);
    const [showOutstandingModal, setShowOutstandingModal] = useState(false);
    const [outstandingReportLoading, setOutstandingReportLoading] = useState(false);
    const [outstandingFilter, setOutstandingFilter] = useState('ALL');
    const [outstandingLastPaymentFilter, setOutstandingLastPaymentFilter] = useState('ALL');
    const [quarterDueItems, setQuarterDueItems] = useState([]);
    const [quarterDueLoading, setQuarterDueLoading] = useState(false);
    const [quarterDueError, setQuarterDueError] = useState('');
    const [receivablesLoading, setReceivablesLoading] = useState(false);
    const [receivablesError, setReceivablesError] = useState('');
    const [showQuarterDueModal, setShowQuarterDueModal] = useState(false);
    const [quarterDueFilter, setQuarterDueFilter] = useState('ALL');
    const [quarterDueAmountFilter, setQuarterDueAmountFilter] = useState('ALL');
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
    const calculateReceivablesTotal = useCallback((items) => (
        items.reduce((sum, item) => {
            const currentCharges = Number(item?.currentChargesTotal || 0);
            const amountDue = Number(item?.amountDue || 0);

            if (amountDue <= 0 || currentCharges <= 0) {
                return sum;
            }

            return sum + Math.max(0, Math.min(amountDue, currentCharges));
        }, 0)
    ), []);
    const filteredOverdueItems = useMemo(() => {
        if (overdueFilter === 'ALL') {
            return overdueItems;
        }

        const normalizedFilter = overdueFilter.toLowerCase();
        return overdueItems.filter((item) => {
            const classification = String(item?.classification || '').toLowerCase();
            return classification === normalizedFilter;
        });
    }, [overdueFilter, overdueItems]);
    const filteredOverdueTotal = useMemo(
        () => filteredOverdueItems.reduce((sum, item) => sum + Number(item?.amountDue || 0), 0),
        [filteredOverdueItems],
    );
    const filteredOutstandingItems = useMemo(() => {
        return outstandingItems.filter((item) => {
            if (outstandingFilter !== 'ALL') {
                const classification = String(item?.classification || '').toLowerCase();
                if (classification !== outstandingFilter.toLowerCase()) {
                    return false;
                }
            }

            if (outstandingLastPaymentFilter === 'BEFORE_2025') {
                const lastPaymentDate = item?.lastPaymentDate
                    ? new Date(item.lastPaymentDate)
                    : null;
                const cutoff = new Date('2025-01-01T00:00:00.000Z');

                return !lastPaymentDate
                    || Number.isNaN(lastPaymentDate.getTime())
                    || lastPaymentDate < cutoff;
            }

            return true;
        });
    }, [outstandingFilter, outstandingItems, outstandingLastPaymentFilter]);
    const filteredQuarterDueItems = useMemo(() => {
        const normalizedFilter = quarterDueFilter.toLowerCase();
        return quarterDueItems.filter((item) => {
            if (Number(item?.amountDue || 0) <= 0 || Number(item?.currentChargesTotal || 0) <= 0) {
                return false;
            }

            if (quarterDueFilter !== 'ALL') {
                const classification = String(item?.classification || '').toLowerCase();
                if (classification !== normalizedFilter) {
                    return false;
                }
            }

            if (quarterDueAmountFilter === 'AMOUNT_DUE_10000_PLUS') {
                return Number(item?.amountDue || 0) >= 10000;
            }

            return true;
        });
    }, [quarterDueAmountFilter, quarterDueFilter, quarterDueItems]);

    const quarterDueFilterLabel = useMemo(() => {
        const classificationLabel = quarterDueFilter === 'ALL' ? 'All classifications' : quarterDueFilter;
        const amountLabel = quarterDueAmountFilter === 'AMOUNT_DUE_10000_PLUS'
            ? 'Amount Due PHP 10,000 and above'
            : 'All amount due';

        return `${classificationLabel}; ${amountLabel}`;
    }, [quarterDueAmountFilter, quarterDueFilter]);
    const receivablesTotal = useMemo(
        () => calculateReceivablesTotal(quarterDueItems),
        [calculateReceivablesTotal, quarterDueItems],
    );

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

    useEffect(() => {
        if (useLocalDbfSync || (!syncRequestId && !billingSyncRequestId)) {
            return undefined;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            if (syncRequestId) {
                setSyncError('Session expired. Please log in again.');
            }
            if (billingSyncRequestId) {
                setBillingSyncError('Session expired. Please log in again.');
            }
            return undefined;
        }

        const controller = new AbortController();
        const pollStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/sync/status`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to load sync status.');
                }

                if (syncRequestId && data.lastSyncedTable === 'payments') {
                    if (data.syncStatus === 'pending') {
                        setSyncStatus('Payments sync requested. Waiting for Server PC.');
                    } else if (data.syncStatus === 'processing') {
                        setSyncStatus('Payments sync in progress.');
                    } else if (data.syncStatus === 'completed') {
                        setSyncStatus(`Payments sync complete: ${Number(data.recordsUpdated || 0)} records updated.`);
                        setSyncRequestId(null);
                    } else if (data.syncStatus === 'failed') {
                        setSyncError(data.errorMessage || 'Payments sync failed.');
                        setSyncRequestId(null);
                    }
                }

                if (billingSyncRequestId && data.lastSyncedTable === 'billing') {
                    if (data.syncStatus === 'pending') {
                        setBillingSyncStatus('Billing sync requested. Waiting for Server PC.');
                    } else if (data.syncStatus === 'processing') {
                        setBillingSyncStatus('Billing sync in progress.');
                    } else if (data.syncStatus === 'completed') {
                        setBillingSyncStatus(`Billing sync complete: ${Number(data.recordsUpdated || 0)} records updated.`);
                        setBillingSyncRequestId(null);
                    } else if (data.syncStatus === 'failed') {
                        setBillingSyncError(data.errorMessage || 'Billing sync failed.');
                        setBillingSyncRequestId(null);
                    }
                }
            } catch (pollError) {
                if (pollError.name !== 'AbortError') {
                    if (syncRequestId) {
                        setSyncError(pollError.message || 'Failed to load sync status.');
                    }
                    if (billingSyncRequestId) {
                        setBillingSyncError(pollError.message || 'Failed to load sync status.');
                    }
                }
            }
        };

        pollStatus();
        const interval = window.setInterval(pollStatus, 5000);
        return () => {
            window.clearInterval(interval);
            controller.abort();
        };
    }, [API_URL, billingSyncRequestId, syncRequestId, useLocalDbfSync]);

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
            const response = await fetch(
                `${API_URL}${useLocalDbfSync ? '/foxpro/payments/sync' : '/sync/request/payments'}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

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
                useLocalDbfSync
                    ? `Sync complete: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped. (${timestamp})`
                    : `Payments sync requested. Waiting for Server PC. (${timestamp})`,
            );
            if (!useLocalDbfSync) {
                setSyncRequestId(data.id);
            }
        } catch (err) {
            console.error('Sync error:', err);
            setSyncError('Sync failed. Please try again.');
        } finally {
            setSyncLoading(false);
        }
    }, [API_URL, syncLoading, useLocalDbfSync]);

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
            const response = await fetch(
                `${API_URL}${useLocalDbfSync ? '/foxpro/billings/sync' : '/sync/request/billing'}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

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
                useLocalDbfSync
                    ? `Sync complete: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped. (${timestamp})`
                    : `Billing sync requested. Waiting for Server PC. (${timestamp})`,
            );
            if (!useLocalDbfSync) {
                setBillingSyncRequestId(data.id);
            }
        } catch (err) {
            console.error('Billing sync error:', err);
            setBillingSyncError('Sync failed. Please try again.');
        } finally {
            setBillingSyncLoading(false);
        }
    }, [API_URL, billingSyncLoading, useLocalDbfSync]);

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

    const handleUploadWaterBillings = async (event) => {
        event.preventDefault();
        setWaterBillingStatus('');
        setWaterBillingError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setWaterBillingError('Session expired. Please log in again.');
            return;
        }

        if (!waterBillingFile) {
            setWaterBillingError('Please choose an XLS or XLSX file first.');
            return;
        }

        setWaterBillingLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', waterBillingFile);

            const response = await fetch(`${API_URL}/water-bills/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setWaterBillingError(data.message || 'Upload failed. Please try again.');
                return;
            }

            const validationCount = Array.isArray(data?.validationErrors)
                ? data.validationErrors.length
                : 0;
            const skippedCount = Array.isArray(data?.skippedAccountIds)
                ? data.skippedAccountIds.length
                : 0;
            const skippedPreview = Array.isArray(data?.skippedAccountIds) && data.skippedAccountIds.length
                ? ` Skipped: ${data.skippedAccountIds.slice(0, 8).join(', ')}${data.skippedAccountIds.length > 8 ? ', ...' : ''}.`
                : '';
            const sheetSummary = Array.isArray(data?.sheetSummaries) && data.sheetSummaries.length
                ? ` Sheets: ${data.sheetSummaries
                    .map((sheet) => {
                        const details = [
                            sheet.skippedIncomplete ? `${sheet.skippedIncomplete} incomplete` : '',
                            sheet.validationSkipped ? `${sheet.validationSkipped} accounts not existing yet` : '',
                        ].filter(Boolean);

                        return `${sheet.sheetName} ${sheet.extracted}/${sheet.anchors}${details.length ? ` (${details.join(') (')})` : ''}`;
                    })
                    .join(', ')}.`
                : '';
            setWaterBillingStatus(
                `Upload complete: ${data.inserted || 0} inserted, ${data.updated || 0} updated, ${data.failed || 0} failed, ${skippedCount} skipped, ${data.totalExtracted || 0} total${validationCount ? `, ${validationCount} validation issues` : ''}.${skippedPreview}${sheetSummary}`,
            );
        } catch (err) {
            console.error('Water billing upload error:', err);
            setWaterBillingError('Upload failed. Please try again.');
        } finally {
            setWaterBillingLoading(false);
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

        const rowsHtml = filteredOverdueItems.map((item, index) => {
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
                    <td style="font-weight: 600;">PHP ${formatMoney(filteredOverdueTotal)}</td>
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
                <p>Amount due/excess as of latest billing. Equivalent to 12 months’ amount due. Filter: ${overdueFilter}.</p>
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
                <p>Amount Due as of ${formattedAsOf}. Classification: ${outstandingFilter}; Last payment: ${outstandingLastPaymentFilter === 'BEFORE_2025' ? 'Before 2025' : 'All'}.</p>
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
                        <tr>
                            <td colspan="6" style="text-align: right; font-weight: 600;">Grand Total</td>
                            <td style="font-weight: 600;">PHP ${formatMoney(outstandingTotal)}</td>
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
            const collectibles = Math.max(0, Math.min(amountDue, currentCharges));
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
                <h1>Total Receivables (This Quarter)</h1>
                <p>Quarter: Q${quarter} ${year}. Filters: ${quarterDueFilterLabel}.</p>
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
                        <tr>
                            <td colspan="6" style="text-align: right; font-weight: 600;">Total Receivables (This Quarter)</td>
                            <td style="font-weight: 600;">PHP ${formatMoney(totalCollectibles)}</td>
                            <td></td>
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

        const fetchReceivables = async () => {
            setReceivablesLoading(true);
            setReceivablesError('');

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
                    setReceivablesError(data.message || 'Failed to load total receivables.');
                    return;
                }

                setQuarterDueItems(Array.isArray(data?.items) ? data.items : []);
            } catch (err) {
                console.error('Receivables total error:', err);
                setReceivablesError('Failed to load total receivables. Please try again.');
            } finally {
                setReceivablesLoading(false);
            }
        };

        fetchReceivables();
    }, [API_URL, quarter, year]);

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
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        clearAdminIdentity();
        navigate('/login');
    };

    return {
        adminName,
        adminLabel,
        error,
        year,
        quarter,
        setYear,
        setQuarter,
        sidebarOpen,
        setSidebarOpen,
        handleLogout,
        summaryProps: {
            comparison,
            totals,
            loading,
            outstandingLoading,
            outstandingTotal,
            outstandingReportLoading,
            receivablesTotal,
            receivablesLoading,
            receivablesError,
            quarterDueLoading,
            quarterDueError,
            outstandingError,
            onGenerateQuarterDue: handleGenerateQuarterDue,
            onGenerateOutstanding: handleGenerateOutstanding,
            formatMoney,
            formatPercent,
        },
        dataToolsProps: {
            currentPaymentCardIndex,
            currentBillingCardIndex,
            onPrevPaymentCard: handlePrevPaymentCard,
            onNextPaymentCard: handleNextPaymentCard,
            onSetCurrentPaymentCardIndex: setCurrentPaymentCardIndex,
            onPrevBillingCard: handlePrevBillingCard,
            onNextBillingCard: handleNextBillingCard,
            onSetCurrentBillingCardIndex: setCurrentBillingCardIndex,
            onSyncPayments: handleSyncPayments,
            syncLoading,
            syncStatus,
            syncError,
            onUploadPayments: handleUploadPayments,
            onPaymentFileChange: (event) => setPaymentFile(event.target.files?.[0] || null),
            paymentLoading,
            paymentStatus,
            paymentError,
            onSyncBillings: handleSyncBillings,
            billingSyncLoading,
            billingSyncStatus,
            billingSyncError,
            onUploadBillings: handleUploadBillings,
            onBillingFileChange: (event) => setBillingFile(event.target.files?.[0] || null),
            billingLoading,
            billingStatus,
            billingError,
            onGenerateOverdue: handleGenerateOverdue,
            overdueLoading,
            overdueError,
            overdueCount: overdueItems.length,
        },
        waterBillingProps: {
            onUploadWaterBillings: handleUploadWaterBillings,
            onWaterBillingFileChange: (event) => setWaterBillingFile(event.target.files?.[0] || null),
            waterBillingLoading,
            waterBillingStatus,
            waterBillingError,
        },
        modalsProps: {
            overdue: {
                open: showOverdueModal,
                items: filteredOverdueItems,
                total: filteredOverdueTotal,
                filter: overdueFilter,
                onFilterChange: setOverdueFilter,
                onPrint: handlePrintOverdue,
                onClose: () => setShowOverdueModal(false),
                formatDate,
                formatMoney,
            },
            outstanding: {
                open: showOutstandingModal,
                items: filteredOutstandingItems,
                allItemsCount: outstandingItems.length,
                billingLabel: outstandingBillingLabel,
                billingEndDateKey: outstandingBillingEndDateKey,
                filter: outstandingFilter,
                onFilterChange: setOutstandingFilter,
                lastPaymentFilter: outstandingLastPaymentFilter,
                onLastPaymentFilterChange: setOutstandingLastPaymentFilter,
                onPrint: handlePrintOutstanding,
                onClose: () => setShowOutstandingModal(false),
                formatDate,
                formatMoney,
            },
            quarterDue: {
                open: showQuarterDueModal,
                items: filteredQuarterDueItems,
                year,
                quarter,
                filter: quarterDueFilter,
                onFilterChange: setQuarterDueFilter,
                amountFilter: quarterDueAmountFilter,
                onAmountFilterChange: setQuarterDueAmountFilter,
                onPrint: handlePrintQuarterDue,
                onClose: () => setShowQuarterDueModal(false),
                formatDate,
                formatMoney,
            },
        },
    };
}


