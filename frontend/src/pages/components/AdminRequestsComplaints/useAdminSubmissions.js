import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function useAdminSubmissions() {
    const [requests, setRequests] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [activeTab, setActiveTab] = useState('requests');
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [statusDraft, setStatusDraft] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [statusError, setStatusError] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const token = localStorage.getItem('token');

        const loadSubmissions = async () => {
            setLoading(true);
            setError('');
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [requestResponse, complaintResponse] = await Promise.all([
                    fetch(`${API_URL}/service-requests`, { headers, signal: controller.signal }),
                    fetch(`${API_URL}/service-requests/complaints`, { headers, signal: controller.signal }),
                ]);
                const [requestData, complaintData] = await Promise.all([
                    requestResponse.json(),
                    complaintResponse.json(),
                ]);
                if (!requestResponse.ok || !complaintResponse.ok) {
                    throw new Error(requestData.message || complaintData.message || 'Failed to load submissions.');
                }
                setRequests(Array.isArray(requestData) ? requestData : []);
                setComplaints(Array.isArray(complaintData) ? complaintData : []);
            } catch (fetchError) {
                if (fetchError.name !== 'AbortError') {
                    setError(fetchError.message || 'Failed to load submissions.');
                }
            } finally {
                setLoading(false);
            }
        };

        loadSubmissions();
        return () => controller.abort();
    }, []);

    const summary = useMemo(() => {
        const isPending = (item) => ['under review', 'pending'].includes(String(item.status || '').toLowerCase());
        const sevenDaysAgo = Date.now() - SEVEN_DAYS_MS;
        return {
            pendingRequests: requests.filter(isPending).length,
            pendingComplaints: complaints.filter(isPending).length,
            acceptedRequests: requests.filter((item) => String(item.status || '').toLowerCase() === 'accepted').length,
            rejectedRequests: requests.filter((item) => String(item.status || '').toLowerCase() === 'rejected').length,
            resolvedComplaints: complaints.filter((item) => String(item.status || '').toLowerCase() === 'resolved').length,
            overdueComplaints: complaints.filter((item) => (
                String(item.status || '').toLowerCase() === 'under review'
                && new Date(item.createdAt).getTime() <= sevenDaysAgo
            )).length,
        };
    }, [requests, complaints]);

    const visibleItems = useMemo(() => {
        const items = activeTab === 'requests' ? requests : complaints;
        const normalizedSearch = search.trim().toLowerCase();
        return items.filter((item) => {
            const normalizedStatus = String(item.status || '').toLowerCase();
            const matchesStatus = statusFilter === 'all'
                || normalizedStatus === statusFilter
                || (statusFilter === 'under-review-7-days'
                    && normalizedStatus === 'under review'
                    && new Date(item.createdAt).getTime() <= Date.now() - SEVEN_DAYS_MS);
            const searchable = [
                item.accountId,
                item.account?.memberName,
                item.subject,
                item.requestType,
                item.complaintType,
                item.location,
            ].join(' ').toLowerCase();
            return matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch));
        });
    }, [activeTab, complaints, requests, search, statusFilter]);

    const openCardFilter = (tab, status = 'all') => {
        setActiveTab(tab);
        setStatusFilter(status);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setStatusFilter('all');
    };

    const openDetails = (item) => {
        setSelectedItem(item);
        setStatusDraft(item.status || 'Under Review');
        setStatusError('');
    };

    const handleStatusUpdate = async () => {
        if (!selectedItem || statusDraft === selectedItem.status) return;

        setStatusUpdating(true);
        setStatusError('');
        try {
            const endpoint = selectedItem.kind === 'complaint'
                ? `${API_URL}/service-requests/complaints/${selectedItem.id}/status`
                : `${API_URL}/service-requests/${selectedItem.id}/status`;
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ status: statusDraft }),
            });
            const updated = await response.json();
            if (!response.ok) throw new Error(updated.message || 'Failed to update status.');

            const updateItems = (items) => items.map((item) => (
                item.id === selectedItem.id ? { ...item, ...updated } : item
            ));
            if (selectedItem.kind === 'complaint') setComplaints(updateItems);
            else setRequests(updateItems);
            setSelectedItem((current) => ({ ...current, ...updated }));
        } catch (updateError) {
            setStatusError(updateError.message || 'Failed to update status.');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleStatusDraftChange = (status) => {
        setStatusDraft(status);
        setStatusError('');
    };

    return {
        apiUrl: API_URL,
        requests,
        complaints,
        summary,
        loading,
        queueProps: {
            activeTab,
            error,
            loading,
            onActiveTabChange: handleTabChange,
            onOpenDetails: openDetails,
            onSearchChange: setSearch,
            onStatusFilterChange: setStatusFilter,
            search,
            statusFilter,
            visibleItems,
        },
        modalProps: {
            item: selectedItem,
            onClose: () => setSelectedItem(null),
            onSaveStatus: handleStatusUpdate,
            onStatusDraftChange: handleStatusDraftChange,
            statusDraft,
            statusError,
            statusUpdating,
        },
        openCardFilter,
    };
}
