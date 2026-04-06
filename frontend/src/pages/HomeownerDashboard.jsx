import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

export default function HomeownerDashboard() {
    const [account, setAccount] = useState(null);
    const [accountId, setAccountId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [paymentsError, setPaymentsError] = useState('');
    const [statementRows, setStatementRows] = useState([]);
    const [statementLoading, setStatementLoading] = useState(false);
    const [statementError, setStatementError] = useState('');
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedAccountId = localStorage.getItem('accountId');

        if (!token || !storedAccountId) {
            navigate('/login');
            return;
        }

        setAccountId(storedAccountId);

        const controller = new AbortController();
        const fetchAccount = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(
                    `${API_URL}/property/account/${storedAccountId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        setError('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        localStorage.removeItem('accountId');
                        return;
                    }

                    setError(data.message || 'Failed to load account details.');
                    return;
                }

                setAccount(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch account error:', err);
                    setError('Failed to load account details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        const fetchPayments = async () => {
            setPaymentsLoading(true);
            setPaymentsError('');

            try {
                const response = await fetch(
                    `${API_URL}/payments/account/${storedAccountId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        setPaymentsError('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        localStorage.removeItem('accountId');
                        return;
                    }

                    setPaymentsError(data.message || 'Failed to load payment history.');
                    return;
                }

                setPayments(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch payments error:', err);
                    setPaymentsError('Failed to load payment history. Please try again.');
                }
            } finally {
                setPaymentsLoading(false);
            }
        };

        const fetchStatement = async () => {
            setStatementLoading(true);
            setStatementError('');

            try {
                const response = await fetch(
                    `${API_URL}/statements/${storedAccountId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        setStatementError('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        localStorage.removeItem('accountId');
                        return;
                    }

                    setStatementError(data.message || 'Failed to load statement.');
                    return;
                }

                setStatementRows(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch statement error:', err);
                    setStatementError('Failed to load statement. Please try again.');
                }
            } finally {
                setStatementLoading(false);
            }
        };

        fetchAccount();
        fetchPayments();
        fetchStatement();

        return () => controller.abort();
    }, [API_URL, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <h1>Homeowner Dashboard</h1>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </nav>

            <div className="dashboard-content">
                <div className="welcome-card">
                    <h2>Homeowner Account</h2>
                    <p>Account ID: {accountId}</p>
                </div>

                {loading && <div className="loading">Loading account details...</div>}

                {error && <div className="error-message">{error}</div>}

                {!loading && !error && account && (
                    <div className="account-card">
                        <h3>Property Details</h3>
                        <div className="account-grid">
                            <div className="field-row">
                                <span className="field-label">Neighborhood</span>
                                <span className="field-value">{account.neighborhood}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Block</span>
                                <span className="field-value">{account.block}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Lot</span>
                                <span className="field-value">{account.lot}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Member Name</span>
                                <span className="field-value">{account.memberName}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Property Size (sqm)</span>
                                <span className="field-value">{account.propertySizeSqm}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Classification</span>
                                <span className="field-value">{account.classification}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Owner Type</span>
                                <span className="field-value">{account.ownerType}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Status</span>
                                <span className="status-pill">{account.status}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Current Balance</span>
                                <span className="field-value">
                                    {Number(account.balance || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="section-spacer"></div>

                <div className="account-card">
                    <h3>Payment Statement</h3>

                    {paymentsLoading && (
                        <div className="loading">Loading payment history...</div>
                    )}

                    {paymentsError && (
                        <div className="error-message">{paymentsError}</div>
                    )}

                    {!paymentsLoading && !paymentsError && (
                        <div className="table-wrapper">
                            <table className="accounts-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount Paid</th>
                                        <th>Balance After</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="empty-state">
                                                No payments found.
                                            </td>
                                        </tr>
                                    )}
                                    {payments.map((payment) => (
                                        <tr key={payment.id || `${payment.accountId}-${payment.paymentDate}`}>
                                            <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                            <td>{Number(payment.amountPaid).toFixed(2)}</td>
                                            <td>{Number(payment.balanceAfterPayment).toFixed(2)}</td>
                                            <td>{payment.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="section-spacer"></div>

                <div className="account-card">
                    <h3>Monthly Statement</h3>

                    {statementLoading && (
                        <div className="loading">Loading monthly statement...</div>
                    )}

                    {statementError && (
                        <div className="error-message">{statementError}</div>
                    )}

                    {!statementLoading && !statementError && (
                        <div className="table-wrapper">
                            <table className="accounts-table statement-table">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>Previous Balance</th>
                                        <th>Amount Due</th>
                                        <th>Amount Paid</th>
                                        <th>Total Balance</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statementRows.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="empty-state">
                                                No statement entries found.
                                            </td>
                                        </tr>
                                    )}
                                    {statementRows.map((row) => {
                                        const total = Number(row.totalBalance || 0);
                                        const rowClass =
                                            total > 0
                                                ? 'balance-due'
                                                : total < 0
                                                    ? 'balance-credit'
                                                    : '';

                                        return (
                                            <tr key={row.month} className={rowClass}>
                                                <td>{row.month}</td>
                                                <td>{Number(row.previousBalance || 0).toFixed(2)}</td>
                                                <td>{Number(row.amountDue || 0).toFixed(2)}</td>
                                                <td>{Number(row.amountPaid || 0).toFixed(2)}</td>
                                                <td>{Number(row.totalBalance || 0).toFixed(2)}</td>
                                                <td>{row.description || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
