import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardCards from './components/AdminDashboard/AdminDashboardCards';
import AdminStatusMessage from './components/AdminDashboard/AdminStatusMessage';
import UploadCard from './components/AdminDashboard/UploadCard';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';

export default function AdminDashboard() {
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [billingFile, setBillingFile] = useState(null);
    const [billingStatus, setBillingStatus] = useState('');
    const [billingError, setBillingError] = useState('');
    const [billingLoading, setBillingLoading] = useState(false);
    const [summary, setSummary] = useState({
        currentBillingLabel: '-',
        unpaidAccountsCount: 0,
        overpaidAccountsCount: 0,
        totalCollectedPayments: 0,
    });
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState('');
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || role !== 'admin') {
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        navigate('/login');
    };

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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <div className="hidden md:block">
                <Sidebar />
            </div>

            <DashboardNav
                onLogout={handleLogout}
                accountId="ADMIN"
                classification="ADMIN"
            />

            <div className="flex flex-1 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className="space-y-6 px-4 md:px-6 py-6 md:py-8">
                        <AdminDashboardCards
                            currentBillingLabel={summary.currentBillingLabel}
                            unpaidAccountsCount={summary.unpaidAccountsCount}
                            overpaidAccountsCount={summary.overpaidAccountsCount}
                            totalCollectedPayments={summary.totalCollectedPayments}
                            loading={summaryLoading}
                        />

                        {summaryError && (
                            <AdminStatusMessage
                                variant="error"
                                message={summaryError}
                            />
                        )}

                        <UploadCard
                            title="Upload FoxPro Payments (CSV/XLSX)"
                            description="Required headers: PAYDATE, AMTPAID, ORNO, PAYCAT, KEYSEARCH, APPLICABLE"
                            onSubmit={handleUploadPayments}
                            onFileChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            loading={uploadLoading}
                            buttonLabel="Upload Payments"
                            status={uploadStatus}
                            error={uploadError}
                        />

                        <UploadCard
                            title="Upload FoxPro Billings (CSV/XLSX)"
                            description="Required headers: BILLDATE, DATEFROM, DATETO, DUEDATE, PRINBAL, INTBAL, PENBAL, PRINCURR, INTCURR, PENCURR, KEYSEARCH"
                            onSubmit={handleUploadBillings}
                            onFileChange={(e) => setBillingFile(e.target.files?.[0] || null)}
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
