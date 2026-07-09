import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateAccountSummary, getBalanceStatus } from './memberBalanceUtils.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MAX_CONCURRENT_BALANCE_REQUESTS = 4;
const ITEMS_PER_PAGE = 10;

export default function useMembersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [ownershipType, setOwnershipType] = useState('');
    const [statusType, setStatusType] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [balances, setBalances] = useState({});
    const [statuses, setStatuses] = useState({});
    const [syncStatus, setSyncStatus] = useState('');
    const [syncError, setSyncError] = useState('');
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncRequestId, setSyncRequestId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewAccount, setViewAccount] = useState(null);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetStatus, setResetStatus] = useState('');
    const [resetError, setResetError] = useState('');
    const [previewingWaterAccountId, setPreviewingWaterAccountId] = useState(null);
    const balanceRequestsControllerRef = useRef(null);
    const previewWaterInProgressRef = useRef(false);
    const navigate = useNavigate();
    const isSuperAdmin = localStorage.getItem('userRole') === 'super_admin';

    const refreshAccounts = useCallback(async (token, signal) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/admin/property-accounts`, {
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                signal,
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error(data.message || 'Failed to load homeowner accounts.');
            }
            setAccounts(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            if (fetchError.name !== 'AbortError') setError(fetchError.message || 'Failed to load homeowner accounts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (!token || !['admin', 'super_admin'].includes(role)) {
            navigate('/login');
            return undefined;
        }
        const controller = new AbortController();
        refreshAccounts(token, controller.signal);
        return () => controller.abort();
    }, [navigate, refreshAccounts]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !accounts.length) return undefined;

        const controller = new AbortController();
        balanceRequestsControllerRef.current = controller;
        let nextIndex = 0;
        const accountIds = accounts.map((account) => account.accountId).filter(Boolean);
        const worker = async () => {
            while (!controller.signal.aborted && nextIndex < accountIds.length) {
                const accountId = accountIds[nextIndex++];
                try {
                    const response = await fetch(`${API_URL}/statements/${accountId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                        signal: controller.signal,
                    });
                    const data = await response.json();
                    if (response.ok && Array.isArray(data)) {
                        const { netBalance } = calculateAccountSummary(data);
                        setBalances((current) => ({ ...current, [accountId]: netBalance }));
                        setStatuses((current) => ({ ...current, [accountId]: getBalanceStatus(netBalance) }));
                    }
                } catch (fetchError) {
                    if (fetchError.name !== 'AbortError') console.error(`Error fetching balance for ${accountId}:`, fetchError);
                }
            }
        };
        const workerCount = Math.min(MAX_CONCURRENT_BALANCE_REQUESTS, accountIds.length);
        Promise.all(Array.from({ length: workerCount }, worker)).catch(() => {});
        return () => {
            controller.abort();
            if (balanceRequestsControllerRef.current === controller) {
                balanceRequestsControllerRef.current = null;
            }
        };
    }, [accounts]);

    useEffect(() => {
        if (!syncRequestId) return undefined;

        const token = localStorage.getItem('token');
        if (!token) {
            setSyncError('Session expired. Please log in again.');
            return undefined;
        }

        const controller = new AbortController();
        const pollStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/sync/status`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to load sync status.');

                if (data.lastSyncedTable !== 'members') {
                    return;
                }

                if (data.syncStatus === 'pending') {
                    setSyncStatus('Members sync requested. Waiting for Server PC.');
                } else if (data.syncStatus === 'processing') {
                    setSyncStatus('Members sync in progress.');
                } else if (data.syncStatus === 'completed') {
                    setSyncStatus(`Members sync complete: ${Number(data.recordsUpdated || 0)} records updated.`);
                    setSyncRequestId(null);
                    await refreshAccounts(token);
                } else if (data.syncStatus === 'failed') {
                    setSyncError(data.errorMessage || 'Members sync failed.');
                    setSyncRequestId(null);
                }
            } catch (pollError) {
                if (pollError.name !== 'AbortError') {
                    setSyncError(pollError.message || 'Failed to load sync status.');
                }
            }
        };

        pollStatus();
        const interval = window.setInterval(pollStatus, 5000);
        return () => {
            window.clearInterval(interval);
            controller.abort();
        };
    }, [refreshAccounts, syncRequestId]);

    const filteredAccounts = useMemo(() => accounts.filter((account) => {
        const query = searchQuery.toLowerCase();
        const searchMatch = account.accountId?.toLowerCase().includes(query)
            || account.memberName?.toLowerCase().includes(query);
        const ownershipMatch = !ownershipType
            || account.classification?.toLowerCase() === ownershipType.toLowerCase();
        const statusMatch = !statusType || statuses[account.accountId] === statusType;
        return searchMatch && ownershipMatch && statusMatch;
    }), [accounts, ownershipType, searchQuery, statusType, statuses]);

    const sortedAccounts = useMemo(() => [...filteredAccounts].sort((a, b) => (
        String(a.accountId || '').localeCompare(String(b.accountId || ''), 'en', { numeric: true, sensitivity: 'base' })
    )), [filteredAccounts]);
    const totalPages = Math.ceil(sortedAccounts.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedAccounts = sortedAccounts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const updateFilter = (setter) => (value) => {
        setter(value);
        setCurrentPage(1);
    };

    const syncMembers = async () => {
        setSyncStatus('');
        setSyncError('');
        const token = localStorage.getItem('token');
        if (!token) return setSyncError('Session expired. Please log in again.');
        setSyncLoading(true);
        try {
            const response = await fetch(`${API_URL}/sync/request/members`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Sync failed. Please try again.');
            setSyncRequestId(data.id);
            setSyncStatus('Members sync requested. Waiting for Server PC.');
        } catch (syncFailure) {
            setSyncError(syncFailure.message || 'Sync failed. Please try again.');
        } finally {
            setSyncLoading(false);
        }
        return undefined;
    };

    const deleteAccount = async (accountId) => {
        if (!isSuperAdmin || !window.confirm(`Delete property account ${accountId}? This will remove related billing and payment records.`)) return;
        const token = localStorage.getItem('token');
        if (!token) return setError('Session expired. Please log in again.');
        try {
            const response = await fetch(`${API_URL}/admin/property-accounts/${accountId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Delete failed. Please try again.');
            await refreshAccounts(token);
        } catch (deleteError) {
            setError(deleteError.message || 'Delete failed. Please try again.');
        }
        return undefined;
    };

    const resetPassword = async (accountId) => {
        if (!isSuperAdmin || !window.confirm(`Generate and email a new temporary password for account ${accountId}?`)) return;
        const token = localStorage.getItem('token');
        if (!token) {
            setResetError('Session expired. Please log in again.');
            return;
        }

        setResetLoading(true);
        setResetStatus('');
        setResetError('');
        try {
            const response = await fetch(`${API_URL}/admin/property-accounts/${accountId}/reset-password`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Password reset failed. Please try again.');
            setResetStatus('A new temporary password was generated and emailed to the member.');
        } catch (resetFailure) {
            setResetError(resetFailure.message || 'Password reset failed. Please try again.');
        } finally {
            setResetLoading(false);
        }
    };

    const closeViewAccount = () => {
        setViewAccount(null);
        setResetStatus('');
        setResetError('');
    };

    const viewDetails = (account) => {
        setViewAccount(account);
        setResetStatus('');
        setResetError('');
    };

    const stopBalanceRequests = useCallback(() => {
        balanceRequestsControllerRef.current?.abort();
        balanceRequestsControllerRef.current = null;
    }, []);

    const previewSoa = useCallback((id) => {
        stopBalanceRequests();
        navigate(`/soa-preview/${id}`);
    }, [navigate, stopBalanceRequests]);

    const previewWater = useCallback((id) => {
        if (previewWaterInProgressRef.current) return;
        previewWaterInProgressRef.current = true;
        setPreviewingWaterAccountId(id);
        stopBalanceRequests();
        navigate(`/water-preview/${id}`);
    }, [navigate, stopBalanceRequests]);

    return {
        balances,
        closeViewAccount,
        currentPage,
        deleteAccount,
        error,
        filteredCount: filteredAccounts.length,
        isSuperAdmin,
        loading,
        ownershipType,
        paginatedAccounts,
        previewSoa,
        previewWater,
        previewingWaterAccountId,
        resetError,
        resetLoading,
        resetPassword,
        resetStatus,
        searchQuery,
        setCurrentPage,
        setOwnershipType: updateFilter(setOwnershipType),
        setSearchQuery: updateFilter(setSearchQuery),
        setStatusType: updateFilter(setStatusType),
        sortedCount: sortedAccounts.length,
        startIndex,
        statusType,
        syncError,
        syncLoading,
        syncMembers,
        syncStatus,
        totalPages,
        viewAccount,
        viewDetails,
        itemsPerPage: ITEMS_PER_PAGE,
    };
}
