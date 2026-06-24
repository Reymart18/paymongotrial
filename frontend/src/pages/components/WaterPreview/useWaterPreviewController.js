import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

const formatWholeNumber = (value) =>
    Number(value || 0).toLocaleString('en-PH', {
        maximumFractionDigits: 0,
    });

const formatMoney = (value) => `PHP ${formatNumber(value)}`;

export default function useWaterPreviewController() {
    const { accountId } = useParams();
    const [waterBillings, setWaterBillings] = useState([]);
    const [selectedBillingId, setSelectedBillingId] = useState('');
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

        if (role === 'homeowner' && storedAccountId !== accountId) {
            navigate('/homeowner/water-dashboard');
            return undefined;
        }

        if (role !== 'homeowner' && role !== 'admin' && role !== 'super_admin') {
            navigate('/login');
            return undefined;
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
    }, [accountId, navigate]);

    const selectedBilling = useMemo(() => {
        if (waterBillings.length === 0) {
            return null;
        }

        return waterBillings.find((billing) => String(billing.id) === selectedBillingId) || waterBillings[0];
    }, [selectedBillingId, waterBillings]);

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
                windowWidth: 1440,
                onclone: (clonedDoc) => {
                    const exportRoot = clonedDoc.querySelector('[data-export-root="true"]');
                    if (exportRoot) {
                        exportRoot.classList.add('export-safe');
                        exportRoot.style.width = '794px';
                        exportRoot.style.maxWidth = '794px';
                        exportRoot.style.minWidth = '794px';
                        exportRoot.style.margin = '0';
                    }

                    const style = clonedDoc.createElement('style');
                    style.textContent = `
                        .export-safe {
                            width: 794px !important;
                            max-width: 794px !important;
                            min-width: 794px !important;
                        }

                        .export-safe .md\\:grid-cols-2 {
                            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        }

                        .export-safe .md\\:block {
                            display: block !important;
                        }

                        .export-safe .md\\:px-12 {
                            padding-left: 3rem !important;
                            padding-right: 3rem !important;
                        }

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

    return {
        accountId,
        error,
        formatDate,
        formatMoney,
        formatWholeNumber,
        handleBack: () => navigate(-1),
        handleExportPdf,
        isExporting,
        loading,
        pdfRef,
        selectedBilling,
        selectedBillingId,
        setSelectedBillingId,
        waterBillings,
    };
}
