import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountHeaderCard from './components/HomeownerDashboard/AccountHeaderCard';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import HomeownerStatusMessage from './components/HomeownerDashboard/HomeownerStatusMessage';
import MustChangePasswordModal from './components/HomeownerDashboard/MustChangePasswordModal';
import PropertyDetailsCard from './components/HomeownerDashboard/PropertyDetailsCard';
import StatementSection from './components/HomeownerDashboard/StatementSection';

export default function HomeownerDashboard() {
    const [account, setAccount] = useState(null);
    const [accountId, setAccountId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statementRows, setStatementRows] = useState([]);
    const [statementLoading, setStatementLoading] = useState(false);
    const [statementError, setStatementError] = useState('');
    const [mustChangePassword, setMustChangePassword] = useState(
        localStorage.getItem('mustChangePassword') === 'true',
    );
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
        fetchStatement();

        return () => controller.abort();
    }, [API_URL, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        localStorage.removeItem('mustChangePassword');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <DashboardNav onLogout={handleLogout} />

            <div className="space-y-6 px-6 py-8">
                <AccountHeaderCard accountId={accountId} />

                {loading && (
                    <HomeownerStatusMessage variant="loading" message="Loading account details..." />
                )}

                {error && (
                    <HomeownerStatusMessage variant="error" message={error} />
                )}

                {!loading && !error && account && (
                    <PropertyDetailsCard account={account} />
                )}

                {mustChangePassword && (
                    <MustChangePasswordModal
                        onChangePassword={() => navigate('/homeowner/change-password')}
                    />
                )}

                <StatementSection
                    accountId={accountId}
                    statementLoading={statementLoading}
                    statementError={statementError}
                    statementRows={statementRows}
                    onPreview={() => navigate(`/soa-preview/${accountId}`)}
                />
            </div>
        </div>
    );
}
