import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import headerImage from '../images/pvhai.png';
import StatusMessage from './components/SOAPreview/StatusMessage';

function WaterHeader() {
    return (
        <div className="relative px-4 pt-4 md:px-6">
            <div className="text-center">
                <div className="text-sm font-bold tracking-wide text-slate-900 md:text-base">
                    THE PARKPLACE VILLAGE HOMEOWNERS' ASSOCIATION INC.
                </div>
                <div className="mt-1 text-xs text-slate-600">
                    Km. 23, E. Aguinaldo Highway Anabu 1, Imus, Cavite
                </div>
                <div
                    className="mt-6 text-xl font-extrabold uppercase tracking-[0.3em] text-slate-900 md:text-3xl md:tracking-[0.4em]"
                    style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}
                >
                    WATER BILLING
                </div>
            </div>
        </div>
    );
}

export default function WaterPreview() {
    const { accountId } = useParams();
    const [waterBillings, setWaterBillings] = useState([]);
    const [selectedBillingId, setSelectedBillingId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const navigate = useNavigate();
    const pdfRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || !accountId || (role !== 'admin' && role !== 'super_admin')) {
            navigate('/login');
            return;
        }

        const controller = new AbortController();

        const fetchWaterBillings = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(`${API_URL}/water-bills/account/${accountId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                });
                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || 'Failed to load water billing preview.');
                    return;
                }

                const rows = Array.isArray(data) ? data : [];
                setWaterBillings(rows);
                setSelectedBillingId(rows[0]?.id ? String(rows[0].id) : '');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Water preview error:', err);
                    setError('Failed to load water billing preview. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchWaterBillings();

        return () => controller.abort();
    }, [API_URL, accountId, navigate]);

    const selectedBilling = useMemo(() => {
        if (waterBillings.length === 0) {
            return null;
        }

        return waterBillings.find((billing) => String(billing.id) === selectedBillingId) || waterBillings[0];
    }, [selectedBillingId, waterBillings]);

    const formatDate = (value) => {
        if (!value) {
            return '-';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '-';
        }

        return date.toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatNumber = (value) =>
        Number(value || 0).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const formatMoney = (value) => `PHP ${formatNumber(value)}`;

    const handleExportPdf = async () => {
        if (!pdfRef.current || !selectedBilling) {
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
                    }

                    const style = clonedDoc.createElement('style');
                    style.textContent = `
                        .export-safe, .export-safe * {
                            color: #0f172a !important;
                            border-color: #cbd5e1 !important;
                            box-shadow: none !important;
                        }

                        .export-safe {
                            background-color: #ffffff !important;
                        }

                        .export-safe [class*="bg-"] {
                            background-color: transparent !important;
                        }

                        .export-safe .bg-white,
                        .export-safe .water-panel {
                            background-color: #ffffff !important;
                        }

                        .export-safe .bg-slate-50,
                        .export-safe .bg-slate-100,
                        .export-safe .water-muted {
                            background-color: #f8fafc !important;
                        }

                        .export-safe .water-total {
                            background-color: #0f172a !important;
                        }

                        .export-safe .water-total,
                        .export-safe .water-total * {
                            color: #ffffff !important;
                        }

                        .export-safe .bg-black,
                        .export-safe .water-divider {
                            background-color: #000000 !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                },
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const widthRatio = pageWidth / canvas.width;
            const heightRatio = pageHeight / canvas.height;
            const ratio = Math.min(widthRatio, heightRatio);
            const imgWidth = canvas.width * ratio;
            const imgHeight = canvas.height * ratio;
            const x = (pageWidth - imgWidth) / 2;
            const y = 0;

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

            pdf.save(`water-bill-${selectedBilling.accountId || accountId}.pdf`);
        } catch (err) {
            console.error('Export water preview error:', err);
            setError('Failed to export water billing preview.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-8">
            <div className="no-print flex items-center gap-2 px-4 py-3 md:px-4 md:pt-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                >
                    Back
                </button>
                {waterBillings.length > 1 && (
                    <select
                        value={selectedBillingId}
                        onChange={(event) => setSelectedBillingId(event.target.value)}
                        className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 outline-none transition focus:border-indigo-300"
                    >
                        {waterBillings.map((billing) => (
                            <option key={billing.id} value={billing.id}>
                                {billing.billingPeriod || `Billing ${billing.id}`}
                            </option>
                        ))}
                    </select>
                )}
                <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={!selectedBilling || isExporting}
                    className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
            </div>

            <div
                ref={pdfRef}
                data-export-root="true"
                className="relative mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-8 py-8 text-slate-900 shadow-sm md:px-12"
            >
                <img
                    src={headerImage}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 hidden h-96 w-auto -translate-x-1/2 -translate-y-1/2 opacity-10 md:block"
                />

                <WaterHeader />
                <div className="water-divider mx-auto mt-3 h-px w-11/12 bg-black" />

                {loading && <StatusMessage variant="loading" message="Loading water billing preview..." />}
                {error && <StatusMessage variant="error" message={error} />}

                {!loading && !error && !selectedBilling && (
                    <StatusMessage variant="info" message="No water billing entries found." />
                )}

                {!loading && !error && selectedBilling && (
                    <div className="relative mt-8">
                        <div className="text-center">
                            <h1 className="text-xl font-bold tracking-wide text-slate-950">EDC WATER BILL</h1>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-4 border-y border-slate-300 py-4 text-sm md:grid-cols-2">
                            <div>
                                <div className="text-xs font-semibold uppercase text-slate-500">Account ID</div>
                                <div className="mt-1 text-base font-bold text-slate-950">
                                    {selectedBilling.accountId || accountId}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold uppercase text-slate-500">Member Name</div>
                                <div className="mt-1 text-base font-bold text-slate-950">
                                    {selectedBilling.memberName || '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold uppercase text-slate-500">Billing Period</div>
                                <div className="mt-1 font-semibold text-slate-800">
                                    {selectedBilling.billingPeriod || '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold uppercase text-slate-500">Due Date</div>
                                <div className="mt-1 font-semibold text-slate-800">
                                    {formatDate(selectedBilling.dueDate)}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <section className="water-panel border border-slate-300">
                                <h2 className="water-muted border-b border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold uppercase tracking-wide">
                                    Current Charges
                                </h2>
                                <div className="divide-y divide-slate-200 text-sm">
                                    <div className="flex justify-between px-4 py-3">
                                        <span>Current Reading</span>
                                        <span className="font-semibold">{formatNumber(selectedBilling.currentReading)}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-3">
                                        <span>Previous Reading</span>
                                        <span className="font-semibold">{formatNumber(selectedBilling.previousReading)}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-3">
                                        <span>Consumption</span>
                                        <span className="font-semibold">{formatNumber(selectedBilling.consumption)}</span>
                                    </div>
                                    <div className="water-muted flex justify-between bg-slate-50 px-4 py-3 font-bold">
                                        <span>Total Current Charges</span>
                                        <span>{formatMoney(selectedBilling.currentCharges)}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="water-panel border border-slate-300">
                                <h2 className="water-muted border-b border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold uppercase tracking-wide">
                                    Outstanding Charges
                                </h2>
                                <div className="divide-y divide-slate-200 text-sm">
                                    <div className="flex justify-between px-4 py-3">
                                        <span>Previous Balance</span>
                                        <span className="font-semibold">{formatMoney(selectedBilling.previousBalance)}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-3">
                                        <span>Add Current Charges</span>
                                        <span className="font-semibold">{formatMoney(selectedBilling.currentCharges)}</span>
                                    </div>
                                    <div className="water-total flex justify-between bg-slate-900 px-4 py-4 text-base font-bold text-white">
                                        <span>Total Due</span>
                                        <span>{formatMoney(selectedBilling.totalDue)}</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="mt-8 border border-slate-300 px-5 py-4 text-sm leading-6 text-slate-700">
                            <div className="text-center text-sm font-bold uppercase text-slate-950">Important</div>
                            <p className="mt-3">
                                Please pay the total amount due at the PVHAI Admin office on or before the due date
                                to avoid disconnection of water services. If payment has been made, please disregard
                                this bill.
                            </p>
                            <p className="mt-2">
                                For any discrepancy or inquiries, please visit or call PVHAI office at 046-484-2107.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
