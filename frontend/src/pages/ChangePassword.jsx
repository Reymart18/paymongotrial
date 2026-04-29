import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';

export default function ChangePassword() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('Please fill out all fields.');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Session expired. Please log in again.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/property/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Password update failed.');
                return;
            }

            setStatus('Password updated. Redirecting to dashboard...');
            localStorage.removeItem('mustChangePassword');
            setTimeout(() => navigate('/homeowner/dashboard'), 800);
        } catch (err) {
            console.error('Change password error:', err);
            setError('Password update failed. Please try again.');
        } finally {
            setLoading(false);
        }
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
                onLogout={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('accountId');
                    navigate('/login');
                }}
                onProfile={() => navigate('/homeowner/profile')}
                accountId={localStorage.getItem('accountId') || 'User'}
                classification="HOMEOWNER"
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            <div className="flex flex-1 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className="space-y-6 px-4 md:px-6 py-6 md:py-8">
                        <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-slate-800">Change Password</h3>
                            <div className="mt-3 rounded-lg border-l-4 border-indigo-500 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                                You need to change your password first to secure your account.
                            </div>
                            {error && (
                                <div className="mt-4 rounded-lg border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {error}
                                </div>
                            )}
                            {status && (
                                <div className="mt-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                    {status}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label htmlFor="old-password" className="text-sm font-medium text-slate-700">
                                        Current Password
                                    </label>
                                    <input
                                        id="old-password"
                                        type="password"
                                        placeholder="Enter current password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        disabled={loading}
                                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="new-password" className="text-sm font-medium text-slate-700">
                                        New Password
                                    </label>
                                    <input
                                        id="new-password"
                                        type="password"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={loading}
                                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
                                        Confirm New Password
                                    </label>
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
