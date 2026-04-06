import { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

export default function AdminDashboard() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [billingFile, setBillingFile] = useState(null);
    const [billingStatus, setBillingStatus] = useState('');
    const [billingError, setBillingError] = useState('');
    const [billingLoading, setBillingLoading] = useState(false);
    const [expandedAccountId, setExpandedAccountId] = useState(null);
    const [paymentsByAccount, setPaymentsByAccount] = useState({});
    const [paymentsLoading, setPaymentsLoading] = useState({});
    const [paymentsError, setPaymentsError] = useState({});
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

        const fetchAccounts = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(`${API_URL}/admin/property-accounts`, {
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
                        setError('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        return;
                    }

                    setError(data.message || 'Failed to load homeowner accounts.');
                    return;
                }

                setAccounts(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch accounts error:', err);
                    setError('Failed to load homeowner accounts. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();

        return () => controller.abort();
    }, [API_URL, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        navigate('/login');
    };

    const fetchPayments = async (accountId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setPaymentsError((prev) => ({
                ...prev,
                [accountId]: 'Session expired. Please log in again.',
            }));
            return;
        }

        setPaymentsLoading((prev) => ({ ...prev, [accountId]: true }));
        setPaymentsError((prev) => ({ ...prev, [accountId]: '' }));

        try {
            const response = await fetch(`${API_URL}/payments/account/${accountId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setPaymentsError((prev) => ({
                    ...prev,
                    [accountId]: data.message || 'Failed to load payments.',
                }));
                return;
            }

            setPaymentsByAccount((prev) => ({
                ...prev,
                [accountId]: Array.isArray(data) ? data : [],
            }));
        } catch (err) {
            console.error('Fetch payments error:', err);
            setPaymentsError((prev) => ({
                ...prev,
                [accountId]: 'Failed to load payments. Please try again.',
            }));
        } finally {
            setPaymentsLoading((prev) => ({ ...prev, [accountId]: false }));
        }
    };

    const togglePayments = (accountId) => {
        if (expandedAccountId === accountId) {
            setExpandedAccountId(null);
            return;
        }

        setExpandedAccountId(accountId);

        if (!paymentsByAccount[accountId]) {
            fetchPayments(accountId);
        }
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

            const response = await fetch(`${API_URL}/payments/upload`, {
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

            // Refresh accounts table
            setLoading(true);
            setError('');
            const refreshed = await fetch(`${API_URL}/admin/property-accounts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const refreshedData = await refreshed.json();
            if (refreshed.ok) {
                setAccounts(Array.isArray(refreshedData) ? refreshedData : []);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError('Upload failed. Please try again.');
        } finally {
            setUploadLoading(false);
            setLoading(false);
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

            const response = await fetch(`${API_URL}/billings/upload`, {
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
        <div className="dashboard-container">
            <nav className="navbar">
                <h1>Admin Dashboard</h1>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </nav>

            <div className="dashboard-content">
                <div className="welcome-card">
                    <h2>Homeowner Accounts</h2>
                    <p>Manage all property accounts</p>
                </div>

                <div className="account-card">
                    <h3>Upload Payments (CSV/XLSX)</h3>
                    <form onSubmit={handleUploadPayments} className="upload-form">
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        />
                        <button type="submit" disabled={uploadLoading} className="upload-button">
                            {uploadLoading ? 'Uploading...' : 'Upload Payments'}
                        </button>
                    </form>
                    {uploadStatus && <div className="success-message">{uploadStatus}</div>}
                    {uploadError && <div className="error-message">{uploadError}</div>}
                </div>

                <div className="section-spacer"></div>

                <div className="account-card">
                    <h3>Upload Billings (CSV/XLSX)</h3>
                    <form onSubmit={handleUploadBillings} className="upload-form">
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => setBillingFile(e.target.files?.[0] || null)}
                        />
                        <button type="submit" disabled={billingLoading} className="upload-button">
                            {billingLoading ? 'Uploading...' : 'Upload Billings'}
                        </button>
                    </form>
                    {billingStatus && <div className="success-message">{billingStatus}</div>}
                    {billingError && <div className="error-message">{billingError}</div>}
                </div>

                <div className="section-spacer"></div>

                {loading && <div className="loading">Loading homeowner accounts...</div>}

                {error && <div className="error-message">{error}</div>}

                {!loading && !error && (
                    <div className="table-card">
                        <div className="table-wrapper">
                            <table className="accounts-table">
                                <thead>
                                    <tr>
                                        <th>Account ID</th>
                                        <th>Neighborhood</th>
                                        <th>Block</th>
                                        <th>Lot</th>
                                        <th>Member Name</th>
                                        <th>Property Size (sqm)</th>
                                        <th>Classification</th>
                                        <th>Owner Type</th>
                                        <th>Status</th>
                                        <th>Balance</th>
                                        <th>Payments</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.length === 0 && (
                                        <tr>
                                            <td colSpan="11" className="empty-state">
                                                No homeowner accounts found.
                                            </td>
                                        </tr>
                                    )}
                                    {accounts.map((account) => (
                                        <Fragment key={account.id || account.accountId}>
                                            <tr>
                                                <td>{account.accountId}</td>
                                                <td>{account.neighborhood}</td>
                                                <td>{account.block}</td>
                                                <td>{account.lot}</td>
                                                <td>{account.memberName}</td>
                                                <td>{account.propertySizeSqm}</td>
                                                <td>{account.classification}</td>
                                                <td>{account.ownerType}</td>
                                                <td>
                                                    <span className="status-pill">{account.status}</span>
                                                </td>
                                                <td>{Number(account.balance || 0).toFixed(2)}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="expand-button"
                                                        onClick={() => togglePayments(account.accountId)}
                                                    >
                                                        {expandedAccountId === account.accountId
                                                            ? 'Hide'
                                                            : 'View'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedAccountId === account.accountId && (
                                                <tr className="nested-row">
                                                    <td colSpan="11">
                                                        {paymentsLoading[account.accountId] && (
                                                            <div className="loading">Loading payments...</div>
                                                        )}
                                                        {paymentsError[account.accountId] && (
                                                            <div className="error-message">
                                                                {paymentsError[account.accountId]}
                                                            </div>
                                                        )}
                                                        {!paymentsLoading[account.accountId] &&
                                                            !paymentsError[account.accountId] && (
                                                                <div className="nested-table">
                                                                    <table className="payments-table">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Date</th>
                                                                                <th>Amount Paid</th>
                                                                                <th>Balance After</th>
                                                                                <th>Description</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {(paymentsByAccount[account.accountId] || [])
                                                                                .length === 0 && (
                                                                                    <tr>
                                                                                        <td
                                                                                            colSpan="4"
                                                                                            className="empty-state"
                                                                                        >
                                                                                            No payments found.
                                                                                        </td>
                                                                                    </tr>
                                                                                )}
                                                                            {(paymentsByAccount[account.accountId] || []).map(
                                                                                (payment) => (
                                                                                    <tr key={payment.id}>
                                                                                        <td>
                                                                                            {payment.paymentDate
                                                                                                ? new Date(
                                                                                                    payment.paymentDate,
                                                                                                ).toLocaleDateString()
                                                                                                : '-'}
                                                                                        </td>
                                                                                        <td>
                                                                                            {Number(
                                                                                                payment.amountPaid || 0,
                                                                                            ).toFixed(2)}
                                                                                        </td>
                                                                                        <td>
                                                                                            {Number(
                                                                                                payment.balanceAfterPayment ||
                                                                                                0,
                                                                                            ).toFixed(2)}
                                                                                        </td>
                                                                                        <td>{payment.description || '-'}</td>
                                                                                    </tr>
                                                                                ),
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
