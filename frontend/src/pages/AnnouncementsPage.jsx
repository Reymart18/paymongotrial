import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import pvhaiImg from '../images/pvhai.png';

export default function AnnouncementsPage() {
    const navigate = useNavigate();
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
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
    });
    const [announcementImage, setAnnouncementImage] = useState(null);
    const [viewingImage, setViewingImage] = useState(null);

    const role = localStorage.getItem('userRole');
    const isStaff = role === 'admin' || role === 'super_admin';
    const isSuperAdmin = role === 'super_admin';
    const adminLabel = role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN';
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Fetch announcements
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
                const response = await fetch(`${API_URL}/announcements`, {
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
                        navigate('/login');
                        return;
                    }

                    setAnnouncementsError(data.message || 'Failed to load announcements.');
                    return;
                }

                setAnnouncements(Array.isArray(data) ? data : []);
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
    }, [API_URL, navigate]);

    // Fetch account data for classification
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedAccountId = localStorage.getItem('accountId');

        if (!token) {
            navigate('/login');
            return;
        }

        if (isStaff) {
            setAccountId(adminLabel);
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
    }, [API_URL, isStaff, navigate, adminLabel]);

    const formatDate = (value) => {
        if (!value) {
            return '';
        }

        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleAddAnnouncement = async (e) => {
        e.preventDefault();

        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
            return;
        }

        setIsCreating(true);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', newAnnouncement.title);
            formData.append('content', newAnnouncement.content);
            if (announcementImage) {
                formData.append('image', announcementImage);
            }

            const response = await fetch(`${API_URL}/announcements`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Failed to create announcement');
                return;
            }

            setAnnouncements([data, ...announcements]);
            setNewAnnouncement({ title: '', content: '' });
            setAnnouncementImage(null);
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
        });
        setAnnouncementImage(null);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();

        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
            return;
        }

        setIsEditing(true);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', newAnnouncement.title);
            formData.append('content', newAnnouncement.content);
            if (announcementImage) {
                formData.append('image', announcementImage);
            }

            const response = await fetch(`${API_URL}/announcements/${editingId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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
            setEditingId(null);
            setNewAnnouncement({ title: '', content: '' });
            setAnnouncementImage(null);
        } catch (err) {
            console.error('Edit announcement error:', err);
            alert('Failed to update announcement');
        } finally {
            setIsEditing(false);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!confirm('Are you sure you want to delete this announcement?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/announcements/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.message || 'Failed to delete announcement');
                return;
            }

            setAnnouncements(announcements.filter((ann) => ann.id !== id));
        } catch (err) {
            console.error('Delete announcement error:', err);
            alert('Failed to delete announcement');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <DashboardNav
                onLogout={handleLogout}
                accountId={accountId}
                classification={isStaff ? adminLabel : (account?.classification || 'Loading...')}
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                avatarImage={isStaff ? pvhaiImg : undefined}
            />

            <div className="flex flex-1 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className="space-y-6 px-4 md:px-6 py-6 md:py-8">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Announcements</h1>
                                <p className="text-sm md:text-base text-slate-600 mt-1">
                                    Stay updated with the latest community news and announcements.
                                </p>
                            </div>
                            {isSuperAdmin && (
                                <button
                                    onClick={() => setShowCreateForm(!showCreateForm)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                    New Announcement
                                </button>
                            )}
                        </div>

                        {/* Create/Edit Announcement Form */}
                        {isSuperAdmin && (showCreateForm || editingId) && (
                            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                    {editingId ? 'Edit Announcement' : 'Create New Announcement'}
                                </h2>
                                <form
                                    onSubmit={editingId ? handleSaveEdit : handleAddAnnouncement}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-slate-900 mb-1">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={newAnnouncement.title}
                                            onChange={(e) =>
                                                setNewAnnouncement({
                                                    ...newAnnouncement,
                                                    title: e.target.value,
                                                })
                                            }
                                            placeholder="Enter announcement title"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-900 mb-1">
                                            Content
                                        </label>
                                        <textarea
                                            value={newAnnouncement.content}
                                            onChange={(e) =>
                                                setNewAnnouncement({
                                                    ...newAnnouncement,
                                                    content: e.target.value,
                                                })
                                            }
                                            placeholder="Enter announcement content"
                                            rows={4}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none transition resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-900 mb-1">
                                            Image (Optional)
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setAnnouncementImage(e.target.files?.[0] || null)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none transition"
                                        />
                                        {announcementImage && (
                                            <p className="mt-2 text-xs text-slate-600">
                                                Selected: {announcementImage.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={
                                                !newAnnouncement.title.trim() ||
                                                !newAnnouncement.content.trim() ||
                                                isCreating ||
                                                isEditing
                                            }
                                            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                                        >
                                            {editingId
                                                ? isEditing
                                                    ? 'Saving...'
                                                    : 'Save Changes'
                                                : isCreating
                                                    ? 'Posting...'
                                                    : 'Post Announcement'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateForm(false);
                                                setEditingId(null);
                                                setNewAnnouncement({ title: '', content: '' });
                                                setAnnouncementImage(null);
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg bg-slate-200 text-slate-900 font-semibold hover:bg-slate-300 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Loading State */}
                        {announcementsLoading && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                                <div className="flex justify-center mb-3">
                                    <svg
                                        className="w-8 h-8 text-slate-400 animate-spin"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                </div>
                                <p className="text-slate-600">Loading announcements...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {!announcementsLoading && announcementsError && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <svg
                                        className="w-6 h-6 text-rose-600 shrink-0 mt-0.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18zm0 2a7 7 0 100 14 7 7 0 000-14z"
                                        />
                                    </svg>
                                    <div>
                                        <h3 className="font-semibold text-rose-900">Error</h3>
                                        <p className="text-sm text-rose-800 mt-1">{announcementsError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!announcementsLoading && !announcementsError && announcements.length === 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-sm text-center">
                                <svg
                                    className="w-12 h-12 text-slate-400 mx-auto mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">No announcements yet</h3>
                                <p className="text-slate-600">Check back soon for community updates and news.</p>
                            </div>
                        )}

                        {/* Announcements List */}
                        {!announcementsLoading && !announcementsError && announcements.length > 0 && (
                            <div className="space-y-4">
                                {announcements.map((announcement) => (
                                    <div
                                        key={announcement.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                                                    {announcement.title || 'Untitled Announcement'}
                                                </h2>
                                                {announcement.image && (
                                                    <img
                                                        src={`http://localhost:3000/uploads/announcements/${announcement.image}`}
                                                        alt={announcement.title}
                                                        className="w-full h-auto rounded-lg mb-3 max-h-64 object-contain cursor-pointer hover:opacity-80 transition"
                                                        onClick={() => setViewingImage(`http://localhost:3000/uploads/announcements/${announcement.image}`)}
                                                    />
                                                )}
                                                <p className="text-slate-700 leading-relaxed mb-3">
                                                    {announcement.content || 'No content provided.'}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                        {formatDate(announcement.createdAt)}
                                                    </span>
                                                    {announcement.author && (
                                                        <span className="flex items-center gap-1">
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                />
                                                            </svg>
                                                            {announcement.author}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isSuperAdmin && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditAnnouncement(announcement)}
                                                        disabled={editingId !== null}
                                                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Edit announcement"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                                                        disabled={editingId !== null}
                                                        className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Delete announcement"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Image Viewer Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingImage(null)}
                >
                    <div
                        className="relative max-w-4xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={viewingImage}
                            alt="Full view"
                            className="w-full h-auto rounded-lg"
                        />
                        <button
                            onClick={() => setViewingImage(null)}
                            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition"
                            title="Close"
                        >
                            <svg
                                className="w-6 h-6 text-slate-900"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
