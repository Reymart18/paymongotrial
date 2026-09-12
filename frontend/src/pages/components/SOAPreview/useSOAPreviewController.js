import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getRowYear = (row) => {
    const dateValue = row?.dateTo || row?.dateFrom || row?.date;
    if (!dateValue) {
        return null;
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.getFullYear();
};

const isMembershipDues = (row) => {
    if (!row?.paycat) {
        return false;
    }

    return String(row.paycat).trim().toLowerCase() === 'membership dues';
};

const formatDate = (value) => {
    if (!value) {
        return '-';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString();
};

const formatMoney = (value) => {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const formatSignedMoney = (value) => {
    const amount = Number(value || 0);
    const absAmount = Math.abs(amount);

    if (absAmount < 0.005) {
        return formatMoney(0);
    }

    const formatted = formatMoney(absAmount);
    return amount < 0 ? `-${formatted}` : formatted;
};

const formatSoa = (value) => new Intl.NumberFormat('en-PH', {
    maximumFractionDigits: 0,
}).format(Number(value || 0));

export default function useSOAPreviewController() {
    const { accountId } = useParams();
    const [account, setAccount] = useState(null);
    const [statementRows, setStatementRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const navigate = useNavigate();
    const pdfRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        const storedAccountId = localStorage.getItem('accountId');

        if (!token || !accountId) {
            navigate('/login');
            return undefined;
        }

        if (role === 'homeowner' && storedAccountId && storedAccountId !== accountId) {
            navigate('/homeowner/dashboard');
            return undefined;
        }

        const controller = new AbortController();

        const fetchData = async () => {
            setLoading(true);
            setError('');

            try {
                const [accountResponse, statementResponse] = await Promise.all([
                    fetch(`${API_URL}/property/account/${accountId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }),
                    fetch(`${API_URL}/statements/${accountId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }),
                ]);

                const accountData = await accountResponse.json();
                const statementData = await statementResponse.json();

                if (!accountResponse.ok) {
                    setError(accountData.message || 'Failed to load account details.');
                    return;
                }

                if (!statementResponse.ok) {
                    setError(statementData.message || 'Failed to load statement.');
                    return;
                }

                setAccount(accountData);
                setStatementRows(Array.isArray(statementData) ? statementData : []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('SOA preview error:', err);
                    setError('Failed to load SOA preview. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        return () => controller.abort();
    }, [accountId, navigate]);

    const latestDate = useMemo(() => {
        if (statementRows.length === 0) {
            return null;
        }

        return statementRows.reduce((latest, row) => {
            const current = new Date(row.date);
            if (Number.isNaN(current.getTime())) {
                return latest;
            }

            if (!latest) {
                return current;
            }

            return current > latest ? current : latest;
        }, null);
    }, [statementRows]);

    const billingRows = useMemo(
        () => statementRows.filter((row) => row.type === 'billing'),
        [statementRows],
    );

    const latestBillDate = useMemo(() => {
        if (billingRows.length === 0) {
            return null;
        }

        return billingRows.reduce((latest, row) => {
            const current = row?.BILLDATE ? new Date(row.BILLDATE) : null;
            if (!current || Number.isNaN(current.getTime())) {
                return latest;
            }

            if (!latest) {
                return current;
            }

            return current > latest ? current : latest;
        }, null);
    }, [billingRows]);

    const selectedBillingYear = useMemo(() => {
        if (billingRows.length === 0) {
            const fallback = latestDate || new Date();
            return fallback.getFullYear();
        }

        return billingRows.reduce((latestYear, row) => {
            const rowYear = getRowYear(row);
            if (!rowYear) {
                return latestYear;
            }

            if (!latestYear || rowYear > latestYear) {
                return rowYear;
            }

            return latestYear;
        }, null);
    }, [billingRows, latestDate]);

    const billingRowsForYear = useMemo(() => {
        if (!selectedBillingYear) {
            return [];
        }

        return billingRows
            .filter((row) => getRowYear(row) === selectedBillingYear)
            .sort((a, b) => {
                const dateA = new Date(a.dateFrom || a.date);
                const dateB = new Date(b.dateFrom || b.date);
                return dateA.getTime() - dateB.getTime();
            });
    }, [billingRows, selectedBillingYear]);

    const latestBillingRow = useMemo(
        () => (billingRowsForYear.length > 0
            ? billingRowsForYear[billingRowsForYear.length - 1]
            : null),
        [billingRowsForYear],
    );

    const paymentRows = useMemo(
        () => statementRows
            .filter((row) => row.type === 'payment')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [statementRows],
    );

    const paymentRowsForYear = useMemo(
        () => paymentRows.filter((row) => getRowYear(row) === selectedBillingYear),
        [paymentRows, selectedBillingYear],
    );

    const totalPayments = useMemo(
        () => paymentRowsForYear.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0),
        [paymentRowsForYear],
    );

    const balanceBreakdown = useMemo(() => {
        const principal = Number(account?.principal ?? 0);
        const interest = Number(account?.interest ?? 0);
        const penalties = Number(account?.penalty ?? 0);
        const total = Number(account?.balance ?? principal + interest + penalties);
        return {
            principal,
            interest,
            penalties,
            total,
        };
    }, [account]);

    const currentChargesBreakdown = useMemo(() => {
        const principal = Number(latestBillingRow?.prinCurr ?? latestBillingRow?.amountDue ?? 0);
        const interest = Number(latestBillingRow?.intCurr ?? latestBillingRow?.interest ?? 0);
        const penalties = Number(latestBillingRow?.penCurr ?? latestBillingRow?.penalty ?? 0);
        return {
            principal,
            interest,
            penalties,
            total: principal + interest + penalties,
        };
    }, [latestBillingRow]);

    const amountDue = balanceBreakdown.total;

    const balanceAsOfLabel = latestBillingRow?.dateFrom
        ? (() => {
            const dateBeforeCurrent = new Date(latestBillingRow.dateFrom);
            dateBeforeCurrent.setDate(dateBeforeCurrent.getDate() - 1);
            return formatDate(dateBeforeCurrent);
        })()
        : '-';

    const currentChargesLabel = latestBillingRow?.dateFrom && latestBillingRow?.dateTo
        ? `${formatDate(latestBillingRow.dateFrom)} - ${formatDate(latestBillingRow.dateTo)}`
        : selectedBillingYear
            ? String(selectedBillingYear)
            : '-';

    const amountDueAsOfLabel = latestBillingRow?.dateTo
        ? formatDate(latestBillingRow.dateTo)
        : selectedBillingYear
            ? String(selectedBillingYear)
            : '-';

    const lotSizeLabel = account?.propertySizeSqm
        ? `${Number(account.propertySizeSqm).toFixed(2)} sqm`
        : '-';

    const soaPrefix = 'for dec 2025 reference -';
    const soaValueLabel =
        account?.soa !== undefined && account?.soa !== null
            ? `SOA ${formatSoa(account.soa)}`
            : 'SOA -';

    const handleExportPdf = async () => {
        if (!pdfRef.current || isExporting) {
            return;
        }

        setIsExporting(true);

        try {
            const canvas = await html2canvas(pdfRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: 1440,
                onclone: (clonedDoc) => {
                    const exportRoot = clonedDoc.querySelector('[data-export-root="true"]');
                    if (exportRoot) {
                        exportRoot.classList.add('export-safe');
                        exportRoot.style.transform = 'none';
                        exportRoot.style.transformOrigin = 'top left';
                        exportRoot.style.width = '900px';
                        exportRoot.style.minWidth = '900px';
                        exportRoot.style.maxWidth = '900px';
                        exportRoot.style.margin = '0';
                    }

                    const style = clonedDoc.createElement('style');
                    style.textContent = `
                        .export-safe {
                            width: 900px !important;
                            min-width: 900px !important;
                            max-width: 900px !important;
                            box-sizing: border-box !important;
                            padding-bottom: 24px !important;
                        }

                        .export-safe .md\\:grid-cols-2 {
                            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        }

                        .export-safe .md\\:block {
                            display: block !important;
                        }

                        .export-safe .md\\:flex-row {
                            flex-direction: row !important;
                        }

                        .export-safe .md\\:px-6 {
                            padding-left: 1.5rem !important;
                            padding-right: 1.5rem !important;
                        }

                        .export-safe, .export-safe * {
                            color: #0f172a !important;
                            border-color: #e2e8f0 !important;
                        }

                        .export-safe .text-alert {
                            color: #dc2626 !important;
                        }

                        .export-safe {
                            background-color: #ffffff !important;
                            font-size: 110% !important;
                        }

                        .export-safe .bg-white {
                            background-color: #ffffff !important;
                        }

                        .export-safe .bg-black {
                            background-color: #000000 !important;
                        }

                        .export-safe .soa-divider {
                            background-color: #000000 !important;
                            height: 1px !important;
                        }

                        .export-safe .no-print {
                            display: none !important;
                        }

                        .export-safe .border-slate-900 {
                            border-color: #0f172a !important;
                        }

                        .export-safe [class*="bg-"] {
                            background-color: transparent !important;
                        }

                        .export-safe .soa-contact-email {
                            display: block !important;
                            width: fit-content !important;
                            overflow: visible !important;
                            white-space: nowrap !important;
                            line-height: 1.8 !important;
                            padding-top: 2px !important;
                            padding-bottom: 8px !important;
                            margin-bottom: 8px !important;
                        }

                        .export-safe table,
                        .export-safe thead,
                        .export-safe tbody,
                        .export-safe tr,
                        .export-safe td,
                        .export-safe th {
                            background-color: #ffffff !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                },
            });
            const imgData = canvas.toDataURL('image/png');
            const basePdf = new jsPDF('p', 'pt', 'a4');
            const pageWidth = basePdf.internal.pageSize.getWidth();
            const pageHeight = basePdf.internal.pageSize.getHeight();
            const margin = 8;
            const availableWidth = pageWidth - margin * 2;
            const availableHeight = pageHeight - margin * 2;
            const ratio = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
            const imgWidth = canvas.width * ratio;
            const imgHeight = canvas.height * ratio;
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            basePdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            basePdf.save(`soa-${accountId || 'account'}.pdf`);
        } catch (exportError) {
            console.error('Failed to export PDF:', exportError);
        } finally {
            setIsExporting(false);
        }
    };

    return {
        account,
        accountId,
        amountDue,
        amountDueAsOfLabel,
        balanceAsOfLabel,
        balanceBreakdown,
        currentChargesBreakdown,
        currentChargesLabel,
        dueDate: latestBillingRow?.dueDate,
        duesRate: latestBillingRow?.duesRate,
        error,
        formatDate,
        formatMoney,
        formatSignedMoney,
        handleBack: () => navigate(-1),
        handleExportPdf,
        isExporting,
        latestBillDate,
        loading,
        lotSizeLabel,
        paymentRows,
        pdfRef,
        selectedBillingYear,
        soaPrefix,
        soaValueLabel,
        totalPayments,
    };
}
