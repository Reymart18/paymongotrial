import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import AdminStatusMessage from './components/AdminDashboard/AdminStatusMessage';
import pvhaiImg from '../images/pvhai.png';

export default function MembersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [ownershipType, setOwnershipType] = useState('');
    const [statusType, setStatusType] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedStatementAccountId, setExpandedStatementAccountId] = useState(null);
    const [statementsByAccount, setStatementsByAccount] = useState({});
    const [statementsLoading, setStatementsLoading] = useState({});
    const [statementsError, setStatementsError] = useState({});
    const [calculatedBalances, setCalculatedBalances] = useState({});
    const [calculatedStatuses, setCalculatedStatuses] = useState({});
    const [membersSyncStatus, setMembersSyncStatus] = useState('');
    const [membersSyncError, setMembersSyncError] = useState('');
    const [membersSyncLoading, setMembersSyncLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewAccount, setViewAccount] = useState(null);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const userRole = localStorage.getItem('userRole');
    const isSuperAdmin = userRole === 'super_admin';
    const adminLabel = isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN';
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

    const dateKey = (value) => {
        if (!value) {
            return null;
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date.toISOString().slice(0, 10);
    };

    const isMembershipDues = (row) => {
        if (!row?.paycat) {
            return false;
        }

        return String(row.paycat).trim().toLowerCase() === 'membership dues';
    };

    const calculateAccountSummary = (statements) => {
        if (!statements || statements.length === 0) {
            return { netBalance: 0, currentCharges: 0, carryingBalance: 0 };
        }

        const billingRows = statements.filter((row) => row.type === 'billing');
        const latestDate = statements.reduce((latest, row) => {
            const current = new Date(row.date);
            if (Number.isNaN(current.getTime())) {
                return latest;
            }

            if (!latest) {
                return current;
            }

            return current > latest ? current : latest;
        }, null);

        const selectedBillingYear = billingRows.length
            ? billingRows.reduce((latestYear, row) => {
                const rowYear = getRowYear(row);
                if (!rowYear) {
                    return latestYear;
                }

                if (!latestYear || rowYear > latestYear) {
                    return rowYear;
                }

                return latestYear;
            }, null)
            : (latestDate ? latestDate.getFullYear() : new Date().getFullYear());

        const billingRowsForYear = billingRows
            .filter((row) => getRowYear(row) === selectedBillingYear)
            .sort((a, b) => {
                const dateA = new Date(a.dateFrom || a.date);
                const dateB = new Date(b.dateFrom || b.date);
                return dateA.getTime() - dateB.getTime();
            });

        if (billingRowsForYear.length === 0) {
            return { netBalance: 0, currentCharges: 0, carryingBalance: 0 };
        }

        const latestBilling = billingRowsForYear[billingRowsForYear.length - 1];

        const principalBalance = Number(latestBilling?.prinBal ?? 0);
        const interestBalance = Number(latestBilling?.intBal ?? 0);
        const penaltyBalance = Number(latestBilling?.penBal ?? 0);
        const hasBalanceParts = [latestBilling?.prinBal, latestBilling?.intBal, latestBilling?.penBal]
            .some((value) => value !== undefined && value !== null);
        const carryingBalance = hasBalanceParts
            ? principalBalance + interestBalance + penaltyBalance
            : Number(latestBilling?.previousBalance ?? 0);

        const currentPrincipal = Number(latestBilling?.prinCurr ?? latestBilling?.amountDue ?? 0);
        const currentInterest = Number(latestBilling?.intCurr ?? latestBilling?.interest ?? 0);
        const currentPenalty = Number(latestBilling?.penCurr ?? latestBilling?.penalty ?? 0);
        const currentCharges = currentPrincipal + currentInterest + currentPenalty;

        const start = latestBilling?.dateFrom ? new Date(latestBilling.dateFrom) : null;
        const end = latestBilling?.dateTo ? new Date(latestBilling.dateTo) : null;
        const hasValidRange = start && end
            && !Number.isNaN(start.getTime())
            && !Number.isNaN(end.getTime());

        const currentPeriodPaymentsTotal = hasValidRange
            ? statements
                .filter((row) => row.type === 'payment' && isMembershipDues(row))
                .filter((row) => {
                    const paymentDate = new Date(row.date);
                    if (Number.isNaN(paymentDate.getTime())) {
                        return false;
                    }
                    return paymentDate >= start && paymentDate <= end;
                })
                .reduce((sum, row) => sum + Number(row.amountPaid || 0), 0)
            : 0;

        const amountDue = carryingBalance + currentCharges - currentPeriodPaymentsTotal;

        return { netBalance: amountDue, currentCharges, carryingBalance };
    };

    const fetchAndCalculateBalance = async (accountId, token, signal) => {
        try {
            const response = await fetch(`${API_URL}/statements/${accountId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                signal,
            });

            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                const { netBalance, currentCharges, carryingBalance } = calculateAccountSummary(data);

                setCalculatedBalances((prev) => ({ ...prev, [accountId]: netBalance }));

                // Determine status based on Amount Due / Excess (netBalance)
                let status = 'settled';
                const absBalance = Math.abs(netBalance);
                if (absBalance >= 0.005) {
                    if (netBalance > 0) {
                        status = 'underpaid';
                    } else if (netBalance < 0) {
                        status = 'overpaid';
                    }
                }

                setCalculatedStatuses((prev) => ({
                    ...prev,
                    [accountId]: status,
                }));
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                return;
            }
            console.error(`Error fetching balance for ${accountId}:`, err);
        }
    };

    const formatBalance = (value) => {
        const amount = Number(value || 0);
        const absAmount = Math.abs(amount);
        // If amount rounds to zero, return positive zero
        if (absAmount < 0.005) {
            return '0.00';
        }
        const sign = amount < 0 ? '-' : '';
        return `${sign}${absAmount.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const handleSyncMembers = async () => {
        setMembersSyncStatus('');
        setMembersSyncError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setMembersSyncError('Session expired. Please log in again.');
            return;
        }

        setMembersSyncLoading(true);

        try {
            const response = await fetch(`${API_URL}/foxpro/members/sync`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setMembersSyncError(data.message || 'Sync failed. Please try again.');
                setMembersSyncLoading(false);
                return;
            }

            setMembersSyncStatus(
                `Sync complete: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped.`,
            );

            const refreshedToken = localStorage.getItem('token');
            if (refreshedToken) {
                await refreshAccounts(refreshedToken);
            }
        } catch (err) {
            console.error('Members sync error:', err);
            setMembersSyncError('Sync failed. Please try again.');
        } finally {
            setMembersSyncLoading(false);
        }
    };

    const refreshAccounts = async (token) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/admin/property-accounts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
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
            console.error('Refresh accounts error:', err);
            setError('Failed to load homeowner accounts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatements = async (accountId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setStatementsError((prev) => ({ ...prev, [accountId]: 'Session expired.' }));
            return;
        }

        setStatementsLoading((prev) => ({ ...prev, [accountId]: true }));
        setStatementsError((prev) => ({ ...prev, [accountId]: '' }));

        try {
            const response = await fetch(
                `${API_URL}/statements/${accountId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                setStatementsError((prev) => ({
                    ...prev,
                    [accountId]: data.message || 'Failed to load statements.',
                }));
                return;
            }

            setStatementsByAccount((prev) => ({ ...prev, [accountId]: data }));
        } catch (err) {
            console.error('Fetch statements error:', err);
            setStatementsError((prev) => ({
                ...prev,
                [accountId]: 'Failed to load statements.',
            }));
        } finally {
            setStatementsLoading((prev) => ({ ...prev, [accountId]: false }));
        }
    };

    const toggleStatements = (accountId) => {
        if (expandedStatementAccountId === accountId) {
            setExpandedStatementAccountId(null);
            return;
        }

        setExpandedStatementAccountId(accountId);

        if (!statementsByAccount[accountId]) {
            fetchStatements(accountId);
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (!isSuperAdmin) {
            return;
        }
        const confirmed = window.confirm(
            `Delete property account ${accountId}? This will remove related billing and payment records.`,
        );
        if (!confirmed) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Session expired. Please log in again.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/property-accounts/${accountId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Delete failed. Please try again.');
                return;
            }

            await refreshAccounts(token);
        } catch (err) {
            console.error('Delete account error:', err);
            setError('Delete failed. Please try again.');
        }
    };

    const handlePreviewSoa = (id) => {
        navigate(`/soa-preview/${id}`);
    };

    const handleViewAccount = (account) => {
        setViewAccount(account);
    };

    const closeViewAccount = () => {
        setViewAccount(null);
    };


    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || (role !== 'admin' && role !== 'super_admin')) {
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
    }, [navigate, API_URL]);

    // Filter accounts based on search and filters
    const filteredAccounts = accounts.filter((account) => {
        const searchMatch =
            account.accountId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.memberName?.toLowerCase().includes(searchQuery.toLowerCase());

        const ownershipMatch =
            !ownershipType ||
            account.classification?.toLowerCase() === ownershipType.toLowerCase();

        const computedStatus = calculatedStatuses[account.accountId];
        const statusMatch = !statusType
            || (statusType === 'underpaid' && computedStatus === 'underpaid')
            || (statusType === 'overpaid' && computedStatus === 'overpaid');

        return searchMatch && ownershipMatch && statusMatch;
    });

    // Pagination logic
    const itemsPerPage = 10;
    const sortedAccounts = [...filteredAccounts].sort((a, b) => {
        const left = String(a.accountId || '');
        const right = String(b.accountId || '');
        return left.localeCompare(right, 'en', { numeric: true, sensitivity: 'base' });
    });
    const totalPages = Math.ceil(sortedAccounts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAccounts = sortedAccounts.slice(startIndex, startIndex + itemsPerPage);

    // Preload all account balances for accurate filtering
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || accounts.length === 0) {
            return;
        }

        const controller = new AbortController();

        accounts.forEach((account) => {
            const alreadyLoaded =
                calculatedBalances[account.accountId] !== undefined
                && calculatedStatuses[account.accountId] !== undefined;

            if (!alreadyLoaded) {
                fetchAndCalculateBalance(account.accountId, token, controller.signal);
            }
        });

        return () => controller.abort();
    }, [accounts, calculatedBalances, calculatedStatuses]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || paginatedAccounts.length === 0) {
            return;
        }

        const controller = new AbortController();

        paginatedAccounts.forEach((account) => {
            const alreadyLoaded =
                calculatedBalances[account.accountId] !== undefined
                && calculatedStatuses[account.accountId] !== undefined;

            if (!alreadyLoaded) {
                fetchAndCalculateBalance(account.accountId, token, controller.signal);
            }
        });

        return () => controller.abort();
    }, [paginatedAccounts, calculatedBalances, calculatedStatuses]);

    // Reset to first page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, ownershipType, statusType]);

    return (
        <>
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFAFA' }}>
                {/* Sidebar */}
                <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

                {/* Overlay for mobile when sidebar is open */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Header Nav */}
                <DashboardNav
                    onLogout={handleLogout}
                    accountId={adminLabel}
                    classification={adminLabel}
                    onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                    avatarImage={pvhaiImg}
                />

                {/* Main Content */}
                <div className="flex flex-1 md:ml-64">
                    <main className="flex-1 overflow-auto">
                        {/* Header Section */}
                        <div className="px-8 py-8">
                            <h1 className="text-4xl font-bold text-gray-800 mb-8">Members List</h1>

                            {/* Filter Container */}
                            <div
                                className="p-4 md:p-6 rounded-lg mb-8 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4"
                                style={{ backgroundColor: 'rgba(232, 155, 88, 0.32)' }}
                            >
                                {/* Search Input */}
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full md:w-sm px-4 py-2 bg-white rounded-lg focus:outline-none focus:ring-0 focus:ring-[#E89B58] focus:border-transparent text-sm"
                                    style={{ border: '1px solid rgba(140, 65, 0, 0.58)' }}
                                />

                                {/* Ownership Type Dropdown */}
                                <select
                                    value={ownershipType}
                                    onChange={(e) => setOwnershipType(e.target.value)}
                                    className="md:ml-auto px-4 py-2 rounded-lg focus:outline-none focus:ring-0 focus:ring-[#E89B58] focus:border-transparent bg-white cursor-pointer text-sm"
                                    style={{ border: '1px solid rgba(140, 65, 0, 0.58)' }}
                                >
                                    <option value="">Ownership Type</option>
                                    <option value="homeowner">Homeowner</option>
                                    <option value="lot owner">Lot Owner</option>
                                </select>

                                {/* Status Dropdown */}
                                <select
                                    value={statusType}
                                    onChange={(e) => setStatusType(e.target.value)}
                                    className="px-4 py-2 rounded-lg focus:outline-none focus:ring-0 focus:ring-[#E89B58] focus:border-transparent bg-white cursor-pointer text-sm"
                                    style={{ border: '1px solid rgba(140, 65, 0, 0.58)' }}
                                >
                                    <option value="">Status</option>
                                    <option value="underpaid">Unpaid</option>
                                    <option value="overpaid">Overpaid</option>
                                </select>

                                {/* Sync Members Button */}
                                <button
                                    onClick={handleSyncMembers}
                                    disabled={membersSyncLoading}
                                    className="px-6 py-2 bg-[#E89B58] text-white font-medium rounded-lg hover:bg-[#d88a47] transition text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                    style={{ border: '1px solid rgba(140, 65, 0, 0.58)' }}
                                >
                                    {membersSyncLoading ? 'Syncing...' : 'Sync Members'}
                                </button>
                            </div>

                            {membersSyncStatus && (
                                <AdminStatusMessage
                                    variant="success"
                                    message={membersSyncStatus}
                                    className="mb-6"
                                />
                            )}
                            {membersSyncError && (
                                <AdminStatusMessage
                                    variant="error"
                                    message={membersSyncError}
                                    className="mb-6"
                                />
                            )}

                            {/* Members Table */}
                            <div
                                className="rounded-lg p-3 md:p-6"
                            >
                                <div className="bg-white rounded-lg overflow-x-auto md:overflow-hidden" style={{ boxShadow: '-8px 0 16px rgba(0, 0, 0, 0.1), 8px 0 16px rgba(0, 0, 0, 0.1)' }}>
                                    <table className="w-full text-xs md:text-sm">
                                        {/* Table Header */}
                                        <thead>
                                            <tr style={{ backgroundColor: 'rgba(112, 75, 75, 0.51)' }}>
                                                <th className="px-2 md:px-4 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-white">Account ID</th>
                                                <th className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-white">Neighborhood</th>
                                                <th className="hidden md:table-cell px-2 md:px-4 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-white">Block</th>
                                                <th className="hidden md:table-cell px-2 md:px-4 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-white">Lot</th>
                                                <th className="px-2 md:px-4 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-white">Name</th>
                                                <th className="hidden lg:table-cell px-2 md:px-4 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-white">Size (SQM)</th>
                                                <th className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-white">Classification</th>
                                                <th className="px-2 md:px-4 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-white">Balance</th>
                                                <th className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-white">Statement</th>
                                                <th className="px-2 md:px-4 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-white">Action</th>
                                            </tr>
                                        </thead>

                                        {/* Table Body */}
                                        <tbody>
                                            {loading && (
                                                <tr>
                                                    <td colSpan="10" className="px-4 py-6 text-center text-gray-500">
                                                        Loading accounts...
                                                    </td>
                                                </tr>
                                            )}

                                            {error && (
                                                <tr>
                                                    <td colSpan="10" className="px-4 py-6 text-center text-red-500">
                                                        {error}
                                                    </td>
                                                </tr>
                                            )}

                                            {!loading && !error && filteredAccounts.length === 0 && (
                                                <tr>
                                                    <td colSpan="10" className="px-4 py-6 text-center text-gray-500">
                                                        No members found.
                                                    </td>
                                                </tr>
                                            )}

                                            {!loading &&
                                                !error &&
                                                paginatedAccounts.map((account, index) => (
                                                    <React.Fragment key={account.id || account.accountId}>
                                                        <tr
                                                            style={{
                                                                backgroundColor: index % 2 === 0
                                                                    ? 'rgba(232, 155, 88, 0.32)'
                                                                    : 'rgba(254, 251, 249, 0.60)'
                                                            }}
                                                        >
                                                            <td className="px-2 md:px-4 py-2 md:py-4 text-xs md:text-sm text-gray-800 font-semibold">
                                                                {account.accountId}
                                                            </td>
                                                            <td className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-4 text-xs md:text-sm text-gray-800">
                                                                {account.neighborhood}
                                                            </td>
                                                            <td className="hidden md:table-cell px-1 md:px-3 py-2 md:py-4 text-xs md:text-sm text-gray-800 whitespace-nowrap">
                                                                {account.block}
                                                            </td>
                                                            <td className="hidden md:table-cell px-1 md:px-3 py-2 md:py-4 text-xs md:text-sm text-gray-800 whitespace-nowrap">
                                                                {account.lot}
                                                            </td>
                                                            <td className="px-2 md:px-4 py-2 md:py-4 text-xs md:text-sm text-gray-800">
                                                                {account.memberName}
                                                            </td>
                                                            <td className="hidden lg:table-cell px-1 md:px-3 py-2 md:py-4 text-xs md:text-sm text-gray-800 whitespace-nowrap">
                                                                {account.propertySizeSqm}
                                                            </td>
                                                            <td className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-4 text-xs md:text-sm text-gray-800">
                                                                {account.classification}
                                                            </td>
                                                            <td className="px-2 md:px-4 py-2 md:py-4 text-xs md:text-sm text-gray-800">
                                                                {calculatedBalances[account.accountId] === undefined
                                                                    ? 'Calculating...'
                                                                    : `₱${formatBalance(calculatedBalances[account.accountId])}`}
                                                            </td>
                                                            <td className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-4 text-xs md:text-sm">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <button
                                                                        onClick={() => handlePreviewSoa(account.accountId)}
                                                                        className="text-[#E89B58] hover:underline font-medium text-xs">
                                                                        Preview SOA
                                                                    </button>
                                                                    <button
                                                                        onClick={() => toggleStatements(account.accountId)}
                                                                        className="text-[#E89B58] hover:underline font-medium text-xs">
                                                                        View
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 md:px-4 py-2 md:py-4 text-xs md:text-sm text-center">
                                                                <div className="flex flex-col items-center gap-1 sm:hidden">
                                                                    <button
                                                                        onClick={() => handlePreviewSoa(account.accountId)}
                                                                        className="text-[#E89B58] hover:underline font-medium text-xs"
                                                                    >
                                                                        Preview SOA
                                                                    </button>
                                                                    <button
                                                                        onClick={() => toggleStatements(account.accountId)}
                                                                        className="text-[#E89B58] hover:underline font-medium text-xs"
                                                                    >
                                                                        View
                                                                    </button>
                                                                </div>
                                                                {isSuperAdmin ? (
                                                                    <div className="flex gap-0.5 items-center justify-center">
                                                                        <button
                                                                            onClick={() => handleViewAccount(account)}
                                                                            className="text-[#E89B58] hover:text-[#d88a47] transition p-2"
                                                                            title="View"
                                                                        >
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                                />
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                                />
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteAccount(account.accountId)}
                                                                            className="text-red-500 hover:text-red-700 transition p-2"
                                                                            title="Delete"
                                                                        >
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                                />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">View only</span>
                                                                )}
                                                            </td>
                                                        </tr>

                                                        {/* Statements Row */}
                                                        {expandedStatementAccountId === account.accountId && (
                                                            <tr className="bg-slate-50">
                                                                <td colSpan="10" className="px-4 py-4">
                                                                    {statementsLoading[account.accountId] && (
                                                                        <AdminStatusMessage
                                                                            variant="loading"
                                                                            message="Loading statement..."
                                                                        />
                                                                    )}
                                                                    {statementsError[account.accountId] && (
                                                                        <AdminStatusMessage
                                                                            variant="error"
                                                                            message={statementsError[account.accountId]}
                                                                        />
                                                                    )}
                                                                    {!statementsLoading[account.accountId] &&
                                                                        !statementsError[account.accountId] && (
                                                                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
                                                                                <table className="min-w-full divide-y divide-slate-200 text-xs md:text-sm">
                                                                                    <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                                        <tr>
                                                                                            <th className="px-3 py-3">Type</th>
                                                                                            <th className="px-3 py-3">Previous Balance</th>
                                                                                            <th className="px-3 py-3">Amount Due</th>
                                                                                            <th className="px-3 py-3">Interest</th>
                                                                                            <th className="px-3 py-3">Penalty</th>
                                                                                            <th className="px-3 py-3">Amount Paid</th>
                                                                                            <th className="px-3 py-3">Total Balance</th>
                                                                                            <th className="px-3 py-3">Description</th>
                                                                                            <th className="px-3 py-3">Due Date</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-slate-100">
                                                                                        {(statementsByAccount[account.accountId] || [])
                                                                                            .length === 0 && (
                                                                                                <tr>
                                                                                                    <td
                                                                                                        colSpan="9"
                                                                                                        className="px-4 py-6 text-center text-slate-400"
                                                                                                    >
                                                                                                        No statement entries found.
                                                                                                    </td>
                                                                                                </tr>
                                                                                            )}
                                                                                        {(statementsByAccount[account.accountId] || []).map(
                                                                                            (row) => (
                                                                                                <tr key={`${row.date}-${row.type}`}>
                                                                                                    <td className="px-3 py-3 font-semibold text-slate-700">
                                                                                                        {row.type}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3">
                                                                                                        {Number(row.previousBalance || 0).toFixed(2)}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3">
                                                                                                        {Number(row.amountDue || 0).toFixed(2)}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3">
                                                                                                        {Number(row.interest || 0).toFixed(2)}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3">
                                                                                                        {Number(row.penalty || 0).toFixed(2)}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3">
                                                                                                        {Number(row.amountPaid || 0).toFixed(2)}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3 font-semibold text-slate-700">
                                                                                                        {Number(row.totalBalance || 0).toFixed(2)}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3 text-slate-600">
                                                                                                        {row.description || '-'}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3">
                                                                                                        {new Date(row.date).toLocaleDateString()}
                                                                                                    </td>
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
                                                    </React.Fragment>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {!loading && !error && sortedAccounts.length > 0 && (
                                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-xs md:text-sm text-gray-600">
                                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedAccounts.length)} of {sortedAccounts.length} members
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 rounded-lg border border-slate-300 bg-white text-gray-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                title="Previous"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="p-2 rounded-lg border border-slate-300 bg-white text-gray-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                title="Next"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(totalPages)}
                                                disabled={currentPage === totalPages}
                                                className="p-2 rounded-lg border border-slate-300 bg-white text-gray-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                title="Last"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            {viewAccount && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={closeViewAccount} />
                    <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out translate-x-0">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Member Details</h2>
                                <p className="text-xs text-slate-500">Account ID: {viewAccount.accountId || '-'}</p>
                            </div>
                            <button
                                onClick={closeViewAccount}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                                Close
                            </button>
                        </div>
                        <div className="flex h-[calc(100%-64px)] flex-col px-6 py-4">
                            <div className="grid gap-4 text-slate-700">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Name</div>
                                    <div className="mt-2 text-base font-semibold text-slate-900">{viewAccount.memberName || '-'}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Neighborhood</div>
                                    <div className="mt-2 text-base font-semibold text-slate-900">{viewAccount.neighborhood || '-'}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Block</div>
                                    <div className="mt-2 text-base font-semibold text-slate-900">{viewAccount.block || '-'}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Lot</div>
                                    <div className="mt-2 text-base font-semibold text-slate-900">{viewAccount.lot || '-'}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Classification</div>
                                    <div className="mt-2 text-base font-semibold text-slate-900">{viewAccount.classification || '-'}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Property Size (sqm)</div>
                                    <div className="mt-2 text-base font-semibold text-slate-900">{viewAccount.propertySizeSqm ?? '-'}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Gmail</div>
                                    <div className="mt-2 text-base font-semibold text-slate-900">{viewAccount.gmail || '-'}</div>
                                </div>
                            </div>
                            <div className="mt-4 flex-1 rounded-xl border border-slate-200 bg-slate-50/70" />
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
