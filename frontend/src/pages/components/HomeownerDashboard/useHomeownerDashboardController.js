import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function useHomeownerDashboardController() {
    const [account, setAccount] = useState(null);
    const [accountId, setAccountId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statementRows, setStatementRows] = useState([]);
    const [statementLoading, setStatementLoading] = useState(false);
    const [statementError, setStatementError] = useState('');
    const [overdueNotice, setOverdueNotice] = useState(null);
    const [overdueLoading, setOverdueLoading] = useState(false);
    const [mustChangePassword] = useState(localStorage.getItem('mustChangePassword') === 'true');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedAccountId = localStorage.getItem('accountId');

        if (!token || !storedAccountId) {
            navigate('/login');
            return undefined;
        }

        setAccountId(storedAccountId);
        const controller = new AbortController();

        const fetchAccount = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(`${API_URL}/property/account/${storedAccountId}`, {
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
                const response = await fetch(`${API_URL}/statements/${storedAccountId}`, {
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

        const fetchOverdueNotice = async () => {
            setOverdueLoading(true);

            try {
                const response = await fetch(`${API_URL}/reports/overdue/self`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                });
                const responseText = await response.text();
                let data = null;

                if (responseText.trim()) {
                    try {
                        data = JSON.parse(responseText);
                    } catch (parseError) {
                        console.error('Overdue notice response parse error:', parseError);
                    }
                }

                if (!response.ok) {
                    if (response.status === 401) return;

                    console.error('Overdue notice error:', data?.message || 'Failed to load overdue notice.');
                    return;
                }

                setOverdueNotice(data?.accountId ? data : null);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Overdue notice fetch error:', err);
                }
            } finally {
                setOverdueLoading(false);
            }
        };

        fetchAccount();
        fetchStatement();
        fetchOverdueNotice();

        return () => controller.abort();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        localStorage.removeItem('mustChangePassword');
        localStorage.removeItem('propertyDetails');
        navigate('/login');
    };

    const handleProfile = () => {
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
        });
    };

    return {
        account,
        accountId,
        error,
        handleLogout,
        handleProfile,
        loading,
        mustChangePassword,
        navigate,
        overdueLoading,
        overdueNotice,
        setSidebarOpen,
        sidebarOpen,
        statementError,
        statementLoading,
        statementRows,
    };
}
