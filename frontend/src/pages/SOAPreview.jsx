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

    const balanceBillingRow = useMemo(
        () => (billingRowsForYear.length > 1
            ? billingRowsForYear[billingRowsForYear.length - 2]
            : null),
        [billingRowsForYear],
    );

    const balanceSourceRow = useMemo(
        () => latestBillingRow || balanceBillingRow,
        [latestBillingRow, balanceBillingRow],
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

    const isMembershipDues = (row) => {
        if (!row?.paycat) {
            return false;
        }

        return String(row.paycat).trim().toLowerCase() === 'membership dues';
    };

    const currentPeriodPayments = useMemo(() => {
        if (!latestBillingRow?.dateFrom || !latestBillingRow?.dateTo) {
            return [];
        }

        const start = new Date(latestBillingRow.dateFrom);
        const end = new Date(latestBillingRow.dateTo);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return [];
        }

        return paymentRows.filter((row) => {
            const paymentDate = new Date(row.date);
            if (Number.isNaN(paymentDate.getTime())) {
                return false;
            }

            return paymentDate >= start && paymentDate <= end;
        });
    }, [latestBillingRow, paymentRows]);

    const currentPeriodMembershipPayments = useMemo(
        () => currentPeriodPayments.filter((row) => isMembershipDues(row)),
        [currentPeriodPayments],
    );

    const currentPeriodPaymentsTotal = useMemo(
        () => currentPeriodMembershipPayments.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0),
        [currentPeriodMembershipPayments],
    );

    const totalPayments = useMemo(
        () => paymentRowsForYear.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0),
        [paymentRowsForYear],
    );

    const balanceBreakdown = useMemo(() => {
        const principal = Number(balanceSourceRow?.prinBal ?? 0);
        const interest = Number(balanceSourceRow?.intBal ?? 0);
        const penalties = Number(balanceSourceRow?.penBal ?? 0);
        const hasParts = [balanceSourceRow?.prinBal, balanceSourceRow?.intBal, balanceSourceRow?.penBal]
            .some((value) => value !== undefined && value !== null);
        const total = hasParts
            ? principal + interest + penalties
            : Number(balanceSourceRow?.previousBalance ?? 0);
        return {
            principal,
            interest,
            penalties,
            total,
        };
    }, [balanceSourceRow]);

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

    const amountDue = useMemo(
        () => balanceBreakdown.total + currentChargesBreakdown.total - currentPeriodPaymentsTotal,
        [balanceBreakdown.total, currentChargesBreakdown.total, currentPeriodPaymentsTotal],
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
        const absAmount = Math.abs(amount);
        // If amount rounds to zero, return positive zero
        if (absAmount < 0.005) {
            return formatMoney(0);
        }
        const formatted = formatMoney(absAmount);
        return amount < 0 ? `-${formatted}` : formatted;
    };

    const balanceAsOfLabel = latestBillingRow?.dateFrom
        ? (() => {
            const dateBeforeCurrent = new Date(latestBillingRow.dateFrom);
            dateBeforeCurrent.setDate(dateBeforeCurrent.getDate() - 1);
            return formatDate(dateBeforeCurrent);
        })()
        : balanceBillingRow?.dateTo
            ? formatDate(balanceBillingRow.dateTo)
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

    const formatSoa = (value) => new Intl.NumberFormat('en-PH', {
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

    const soaPrefix = 'for 2025 reference -';
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

                        .export-safe .soa-contact-email {
                            display: inline-block;
                            line-height: 1.4 !important;
                            padding-bottom: 2px !important;
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
            <div className="no-print flex items-center gap-2 px-4 py-3 md:px-4 md:pt-4">
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
                    className="pointer-events-none absolute left-1/2 top-1/2 h-75 md:h-112.5 w-auto -translate-x-1/2 -translate-y-1/2 opacity-10 hidden md:block"
                />

                <SoaHeader />
                <div className="soa-divider mx-auto mt-3 h-px w-11/12 md:w-4/5 bg-black" />

                {loading && <StatusMessage variant="loading" message="Loading SOA preview..." />}
                {error && <StatusMessage variant="error" message={error} />}

                {!loading && !error && (
                    <>
                        <AccountInfo
                            account={account}
                            accountId={accountId}
                            lotSizeLabel={lotSizeLabel}
                            soaPrefix={soaPrefix}
                            soaValueLabel={soaValueLabel}
                            billingDate={latestBillDate}
                            dueDate={latestBillingRow?.dueDate}
                            duesRate={latestBillingRow?.duesRate}
                            formatDate={formatDate}
                            onExportPdf={handleExportPdf}
                            isExporting={isExporting}
                        />
                        <SummaryCard
                            selectedBillingYear={selectedBillingYear}
                            formatDate={formatDate}
                            formatMoney={formatMoney}
                            balanceAsOfLabel={balanceAsOfLabel}
                            currentChargesLabel={currentChargesLabel}
                            balanceBreakdown={balanceBreakdown}
                            currentChargesBreakdown={currentChargesBreakdown}
                            paymentRows={paymentRows}
                            totalPayments={totalPayments}
                            amountDue={amountDue}
                            amountDueAsOfLabel={amountDueAsOfLabel}
                            formatSignedMoney={formatSignedMoney}
                        />
                        <div className="mx-auto mt-6 max-w-265 text-[11px] md:text-xs text-slate-900">
                            <div className="font-semibold">
                                You may send your payment thru bank account:
                            </div>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-[140px,1fr] gap-y-1">
                                <div className="text-slate-500">Bank:</div>
                                <div>BPI Anabu II Branch, Imus City, Cavite</div>
                                <div className="text-slate-500">Account Name:</div>
                                <div>The Parkplace Village Homeowners' Assosciation Inc.</div>
                                <div className="text-slate-500">Account Type:</div>
                                <div>Current</div>
                                <div className="text-slate-500">Account Number:</div>
                                <div>0951-8890-67</div>
                            </div>
                            <div className="mt-4 text-slate-600">
                                For more inquiries, please contact the PVHAI landline and email at
                            </div>
                            <div className="mt-1">
                                (046) 484-2107 or (046-) 8754674
                            </div>
                            <div className="mt-1 soa-contact-email">theparkplacevillagehoa@gmail.com</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
