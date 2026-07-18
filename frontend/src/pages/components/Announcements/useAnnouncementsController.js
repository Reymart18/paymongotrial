import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearAdminIdentity, getAdminDisplayName, getAdminRoleLabel } from '../../../utils/adminIdentity';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const blankAnnouncement = { title: '', content: '', target: 'all' };

export default function useAnnouncementsController() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [announcementsError, setAnnouncementsError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [account, setAccount] = useState(null);
    const [accountId, setAccountId] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState(blankAnnouncement);
    const [announcementImage, setAnnouncementImage] = useState(null);
    const [viewingImage, setViewingImage] = useState(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [expandedRecentIds, setExpandedRecentIds] = useState([]);

    const role = localStorage.getItem('userRole');
    const isStaff = role === 'admin' || role === 'super_admin';
    const isSuperAdmin = role === 'super_admin';
    const isBodOnlyView = location.pathname.includes('/admin/bod-announcements');
    const adminName = getAdminDisplayName();
    const adminLabel = getAdminRoleLabel(role);
    const accountIdKey = localStorage.getItem('accountId') || role || 'unknown';
    const announcementReadKey = `announcementsLastReadAt:${accountIdKey}`;

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        const controller = new AbortController();

        const fetchAnnouncements = async () => {
            setAnnouncementsLoading(true);
            setAnnouncementsError('');

            try {
                const targetQuery = isBodOnlyView
                    ? '?target=bod'
                    : (!isSuperAdmin ? '?target=all' : '');
                const response = await fetch(`${API_URL}/announcements${targetQuery}`, {
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
                        setAnnouncementsError('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        clearAdminIdentity();
                        navigate('/login');
                        return;
                    }

                    setAnnouncementsError(data.message || 'Failed to load announcements.');
                    return;
                }

                const items = Array.isArray(data) ? data : [];
                setAnnouncements(items);
                const latestCreatedAt = items.reduce((maxTime, item) => {
                    const createdTime = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
                    return createdTime > maxTime ? createdTime : maxTime;
                }, 0);
                const readTime = latestCreatedAt > 0 ? latestCreatedAt : Date.now();
                localStorage.setItem(announcementReadKey, new Date(readTime).toISOString());
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch announcements error:', err);
                    setAnnouncementsError('Failed to load announcements. Please try again.');
                }
            } finally {
                setAnnouncementsLoading(false);
            }
        };

        fetchAnnouncements();
        return () => controller.abort();
    }, [announcementReadKey, isBodOnlyView, isSuperAdmin, navigate]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedAccountId = localStorage.getItem('accountId');

        if (!token) {
            navigate('/login');
            return;
        }

        if (isStaff) {
            setAccountId(adminName);
            return;
        }

        if (!storedAccountId) {
            navigate('/login');
            return;
        }

        setAccountId(storedAccountId);
        const controller = new AbortController();

        const fetchAccount = async () => {
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
                    console.error('Failed to fetch account data');
                    return;
                }

                setAccount(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch account error:', err);
                }
            }
        };

        fetchAccount();
        return () => controller.abort();
    }, [adminLabel, isStaff, navigate]);

    const formatDate = (value) => {
        if (!value) return '';

        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTarget = (value) => {
        const target = String(value || 'all').trim().toLowerCase();
        return target === 'bod' ? 'BOD' : 'All Members';
    };

    const getAnnouncementImageUrl = (image) =>
        image ? `${API_URL}/uploads/announcements/${image}` : '';

    const visibleAnnouncements = isBodOnlyView
        ? announcements.filter((item) => String(item?.target || 'all').toLowerCase() === 'bod')
        : isSuperAdmin
            ? announcements
            : announcements.filter((item) => String(item?.target || 'all').toLowerCase() !== 'bod');
    const featuredAnnouncement = visibleAnnouncements[0] || null;
    const recentAnnouncements = visibleAnnouncements.slice(1);
    const carouselSlides = visibleAnnouncements.length > 0
        ? [visibleAnnouncements[0], visibleAnnouncements[1] || visibleAnnouncements[0]]
        : [];

    useEffect(() => {
        if (carouselIndex >= carouselSlides.length) {
            setCarouselIndex(0);
        }
    }, [carouselIndex, carouselSlides.length]);

    const resetForm = () => {
        setEditingId(null);
        setNewAnnouncement(blankAnnouncement);
        setAnnouncementImage(null);
    };

    const handleAddAnnouncement = async (e) => {
        e.preventDefault();

        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

        setIsCreating(true);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', newAnnouncement.title);
            formData.append('content', newAnnouncement.content);
            formData.append('target', newAnnouncement.target || 'all');
            if (announcementImage) formData.append('image', announcementImage);

            const response = await fetch(`${API_URL}/announcements`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Failed to create announcement');
                return;
            }

            setAnnouncements([data, ...announcements]);
            resetForm();
            setShowCreateForm(false);
        } catch (err) {
            console.error('Create announcement error:', err);
            alert('Failed to create announcement');
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditAnnouncement = (announcement) => {
        setEditingId(announcement.id);
        setNewAnnouncement({
            title: announcement.title,
            content: announcement.content,
            target: announcement.target || 'all',
        });
        setAnnouncementImage(null);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();

        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

        setIsEditing(true);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', newAnnouncement.title);
            formData.append('content', newAnnouncement.content);
            formData.append('target', newAnnouncement.target || 'all');
            if (announcementImage) formData.append('image', announcementImage);

            const response = await fetch(`${API_URL}/announcements/${editingId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Failed to update announcement');
                return;
            }

            setAnnouncements(
                announcements.map((ann) =>
                    ann.id === editingId
                        ? { ...ann, title: data.title, content: data.content, image: data.image || ann.image }
                        : ann,
                ),
            );
            resetForm();
        } catch (err) {
            console.error('Edit announcement error:', err);
            alert('Failed to update announcement');
        } finally {
            setIsEditing(false);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/announcements/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const data = await response.json();
                setAnnouncementsError(data.message || 'Failed to delete announcement');
                return false;
            }

            setAnnouncements(announcements.filter((ann) => ann.id !== id));
            return true;
        } catch (err) {
            console.error('Delete announcement error:', err);
            setAnnouncementsError('Failed to delete announcement');
            return false;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        clearAdminIdentity();
        navigate('/login');
    };

    const handleProfile = () => {
        if (isStaff) return;

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

    const handleCancelForm = () => {
        setShowCreateForm(false);
        resetForm();
    };

    const toggleRecentAnnouncement = (announcementId) => {
        setExpandedRecentIds((current) => (
            current.includes(announcementId)
                ? current.filter((id) => id !== announcementId)
                : [...current, announcementId]
        ));
    };

    return {
        account,
        accountId,
        adminLabel,
        announcementImage,
        announcements,
        announcementsError,
        announcementsLoading,
        carouselIndex,
        carouselSlides,
        editingId,
        expandedRecentIds,
        featuredAnnouncement,
        formatDate,
        formatTarget,
        getAnnouncementImageUrl,
        handleAddAnnouncement,
        handleCancelForm,
        handleDeleteAnnouncement,
        handleEditAnnouncement,
        handleLogout,
        handleProfile,
        handleSaveEdit,
        isBodOnlyView,
        isCreating,
        isEditing,
        isStaff,
        isSuperAdmin,
        newAnnouncement,
        recentAnnouncements,
        setAnnouncementImage,
        setCarouselIndex,
        setNewAnnouncement,
        setShowCreateForm,
        setSidebarOpen,
        setViewingImage,
        showCreateForm,
        sidebarOpen,
        toggleRecentAnnouncement,
        viewingImage,
        visibleAnnouncements,
    };
}
