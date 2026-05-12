import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountHeaderCard from './components/HomeownerDashboard/AccountHeaderCard';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import DashboardCards from './components/HomeownerDashboard/DashboardCards';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import HomeownerStatusMessage from './components/HomeownerDashboard/HomeownerStatusMessage';
import MustChangePasswordModal from './components/HomeownerDashboard/MustChangePasswordModal';
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
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
                localStorage.setItem(
                    'propertyDetails',
                    JSON.stringify({
                        neighborhood: data.neighborhood,
                        block: data.block,
                        lot: data.lot,
                        memberName: data.memberName,
                        propertySizeSqm: data.propertySizeSqm,
                        classification: data.classification,
                    }),
                );
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
        localStorage.removeItem('propertyDetails');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Header Navigation */}
            <DashboardNav
                onLogout={handleLogout}
                onProfile={() =>
                    navigate('/homeowner/profile', {
                        state: {
                            accountId,
                            classification: account?.classification,
                            propertyDetails: account
                                ? {
                                    neighborhood: account.neighborhood,
                                    block: account.block,
                                    lot: account.lot,
                                    memberName: account.memberName,
                                    propertySizeSqm: account.propertySizeSqm,
                                    classification: account.classification,
                                }
                                : null,
                        },
                    })
                }
                accountId={accountId}
                classification={account?.classification || 'Loading...'}
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Main Layout Container */}
            <div className={`flex flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-64'}`}>
                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="space-y-6 px-4 md:px-6 py-6 md:py-8">
                        {/* Dashboard Summary Cards */}
                        {!loading && !error && account && (
                            <DashboardCards account={account} statementRows={statementRows} />
                        )}

                        {loading && (
                            <HomeownerStatusMessage variant="loading" message="Loading account details..." />
                        )}

                        {error && (
                            <HomeownerStatusMessage variant="error" message={error} />
                        )}

                        {!loading && !error && account && (
                            <>
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
                                    className="mt-8"
                                />
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
