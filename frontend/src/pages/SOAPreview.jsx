import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import headerImage from '../images/pvhai.png';
import AccountInfo from './components/SOAPreview/AccountInfo';
import SoaHeader from './components/SOAPreview/SoaHeader';
import StatusMessage from './components/SOAPreview/StatusMessage';
import SummaryCard from './components/SOAPreview/SummaryCard';

export default function SOAPreview() {
    const { accountId } = useParams();
    const [account, setAccount] = useState(null);
    const [statementRows, setStatementRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const navigate = useNavigate();
    const pdfRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        const storedAccountId = localStorage.getItem('accountId');

        if (!token || !accountId) {
            navigate('/login');
            return;
        }

        if (role === 'homeowner' && storedAccountId && storedAccountId !== accountId) {
            navigate('/homeowner/dashboard');
            return;
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
    }, [API_URL, accountId, navigate]);

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

    const getEffectiveRowDate = (row) => {
        const dateValue = row?.dateTo || row?.dateFrom || row?.date;
        const parsed = dateValue ? new Date(dateValue) : null;
        if (!parsed || Number.isNaN(parsed.getTime())) {
            return null;
        }

        return parsed;
    };

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

    const previousUnpaidBalance = useMemo(() => {
        if (!selectedBillingYear) {
            return 0;
        }

        const previousYear = selectedBillingYear - 1;
        const rowsInPreviousYear = statementRows.filter((row) => {
            const rowYear = getRowYear(row);
            return rowYear === previousYear;
        });

        if (rowsInPreviousYear.length === 0) {
            return 0;
        }

        const sortedRows = [...rowsInPreviousYear].sort((a, b) => {
            const dateA = getEffectiveRowDate(a)?.getTime() ?? 0;
            const dateB = getEffectiveRowDate(b)?.getTime() ?? 0;

            if (dateA !== dateB) {
                return dateA - dateB;
            }

            if (a.type === b.type) {
                return 0;
            }

            return a.type === 'payment' ? 1 : -1;
        });

        const latestRow = sortedRows[sortedRows.length - 1] || null;

        return latestRow ? Number(latestRow.totalBalance || 0) : 0;
    }, [selectedBillingYear, statementRows]);

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

    const currentBillingLabel = useMemo(() => {
        if (billingRowsForYear.length === 0) {
            return selectedBillingYear ? String(selectedBillingYear) : '';
        }

        const latestBilling = billingRowsForYear[billingRowsForYear.length - 1];
        const billingDate = getEffectiveRowDate(latestBilling);
        return billingDate ? formatDate(billingDate) : String(selectedBillingYear ?? '');
    }, [billingRowsForYear, selectedBillingYear]);

    const billingYearTotal = useMemo(
        () => billingRowsForYear.reduce(
            (sum, row) => sum
                + Number(row.amountDue || 0)
                + Number(row.interest || 0)
                + Number(row.penalty || 0),
            Number(previousUnpaidBalance || 0),
        ),
        [billingRowsForYear, previousUnpaidBalance],
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

    const netBalance = useMemo(
        () => billingYearTotal - totalPayments,
        [billingYearTotal, totalPayments],
    );

    function formatDate(value) {
        if (!value) {
            return '-';
        }

        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '-';
        }

        return date.toLocaleDateString();
    }

    const formatMoney = (value) => {
        const amount = Number(value || 0);
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatSignedMoney = (value) => {
        const amount = Number(value || 0);
        const formatted = formatMoney(Math.abs(amount));
        return amount < 0 ? `-${formatted}` : formatted;
    };

    const getMonthSpan = (fromValue, toValue) => {
        if (!fromValue || !toValue) {
            return '-';
        }

        const fromDate = new Date(fromValue);
        const toDate = new Date(toValue);
        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
            return '-';
        }

        const yearDiff = toDate.getFullYear() - fromDate.getFullYear();
        const monthDiff = toDate.getMonth() - fromDate.getMonth();
        return Math.max(1, yearDiff * 12 + monthDiff + 1);
    };

    const lotSizeLabel = account?.propertySizeSqm
        ? `${Number(account.propertySizeSqm).toFixed(2)} sqm`
        : '-';

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
                onclone: (clonedDoc) => {
                    const exportRoot = clonedDoc.querySelector('[data-export-root="true"]');
                    if (exportRoot) {
                        exportRoot.classList.add('export-safe');
                        exportRoot.style.transform = 'scale(1.2)';
                        exportRoot.style.transformOrigin = 'top left';
                        exportRoot.style.width = '83.3333%';
                    }

                    const style = clonedDoc.createElement('style');
                    style.textContent = `
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
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            basePdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                basePdf.addPage();
                basePdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            basePdf.save(`soa-${accountId || 'account'}.pdf`);
        } catch (exportError) {
            console.error('Failed to export PDF:', exportError);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white text-slate-900">
            <div className="no-print flex items-center gap-2 px-4 pt-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                >
                    Back
                </button>
            </div>
            <div
                ref={pdfRef}
                data-export-root="true"
                className="relative min-h-screen w-full bg-white text-slate-900"
            >
                <img
                    src={headerImage}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-[70%] h-[450px] w-auto -translate-x-1/2 -translate-y-1/2 opacity-10"
                />

                <SoaHeader />
                <div className="soa-divider mx-auto mt-3 h-px w-4/5 bg-black" />

                {loading && <StatusMessage variant="loading" message="Loading SOA preview..." />}
                {error && <StatusMessage variant="error" message={error} />}

                {!loading && !error && (
                    <>
                        <AccountInfo
                            account={account}
                            accountId={accountId}
                            lotSizeLabel={lotSizeLabel}
                            billingDate={latestBillDate}
                            formatDate={formatDate}
                            onExportPdf={handleExportPdf}
                            isExporting={isExporting}
                        />
                        <SummaryCard
                            previousUnpaidBalance={previousUnpaidBalance}
                            selectedBillingYear={selectedBillingYear}
                            billingRowsForYear={billingRowsForYear}
                            formatDate={formatDate}
                            getMonthSpan={getMonthSpan}
                            formatMoney={formatMoney}
                            billingYearTotal={billingYearTotal}
                            paymentRows={paymentRows}
                            totalPayments={totalPayments}
                            currentBillingLabel={currentBillingLabel}
                            netBalance={netBalance}
                            formatSignedMoney={formatSignedMoney}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
