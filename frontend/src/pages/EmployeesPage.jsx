import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import AdminStatusMessage from './components/AdminDashboard/AdminStatusMessage';
import pvhaiImg from '../images/pvhai.png';

export default function EmployeesPage() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formValues, setFormValues] = useState({
        username: '',
        fullName: '',
        password: '',
        role: 'admin',
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formStatus, setFormStatus] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const loadAdmins = async (token, signal) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/admin`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                signal,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to load admin accounts.');
                return;
            }

            setAdmins(Array.isArray(data) ? data : []);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Fetch admins error:', err);
                setError('Failed to load admin accounts. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || role !== 'super_admin') {
            navigate('/login');
            return;
        }

        const controller = new AbortController();
        loadAdmins(token, controller.signal);

        return () => controller.abort();
    }, [API_URL, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        navigate('/login');
    };

    const handleCreateAdmin = async (event) => {
        event.preventDefault();
        setFormError('');
        setFormStatus('');

        if (!formValues.username.trim() || !formValues.fullName.trim() || !formValues.password.trim()) {
            setFormError('Please fill out all fields.');
            return;
        }

        if (formValues.password.length < 6) {
            setFormError('Password must be at least 6 characters.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setFormError('Session expired. Please log in again.');
            return;
        }

        setFormLoading(true);

        try {
            const response = await fetch(`${API_URL}/admin/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: formValues.username.trim(),
                    fullName: formValues.fullName.trim(),
                    password: formValues.password,
                    role: formValues.role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setFormError(data.message || 'Failed to create admin.');
                return;
            }

            setFormStatus('Admin account created successfully.');
            setFormValues({
                username: '',
                fullName: '',
                password: '',
                role: 'admin',
            });
            await loadAdmins(token);
        } catch (err) {
            console.error('Create admin error:', err);
            setFormError('Failed to create admin. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFAFA' }}>
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <DashboardNav
                onLogout={handleLogout}
                accountId="SUPER ADMIN"
                classification="SUPER ADMIN"
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                avatarImage={pvhaiImg}
            />

            <div className="flex flex-1 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className="px-8 py-8 space-y-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-semibold text-slate-900">Employees</h1>
                            <p className="text-sm text-slate-500">Manage admin and super admin accounts.</p>
                        </div>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Create admin account</h2>
                                    <p className="text-xs text-slate-500">Add a new admin or super admin account.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm((prev) => !prev)}
                                    className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                    {showCreateForm ? 'Hide Form' : 'Create Admin'}
                                </button>
                            </div>

                            {showCreateForm && (
                                <form onSubmit={handleCreateAdmin} className="mt-4 grid gap-4 md:grid-cols-2">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Username
                                        <input
                                            type="text"
                                            value={formValues.username}
                                            onChange={(e) => setFormValues((prev) => ({ ...prev, username: e.target.value }))}
                                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            disabled={formLoading}
                                        />
                                    </label>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Full Name
                                        <input
                                            type="text"
                                            value={formValues.fullName}
                                            onChange={(e) => setFormValues((prev) => ({ ...prev, fullName: e.target.value }))}
                                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            disabled={formLoading}
                                        />
                                    </label>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Password
                                        <input
                                            type="password"
                                            value={formValues.password}
                                            onChange={(e) => setFormValues((prev) => ({ ...prev, password: e.target.value }))}
                                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            disabled={formLoading}
                                        />
                                    </label>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Role
                                        <select
                                            value={formValues.role}
                                            onChange={(e) => setFormValues((prev) => ({ ...prev, role: e.target.value }))}
                                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            disabled={formLoading}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </label>
                                    <div className="md:col-span-2 flex flex-wrap gap-3">
                                        <button
                                            type="submit"
                                            className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                                            disabled={formLoading}
                                        >
                                            {formLoading ? 'Creating...' : 'Create Admin'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {formStatus && (
                                <AdminStatusMessage
                                    variant="success"
                                    message={formStatus}
                                    className="mt-4"
                                />
                            )}
                            {formError && (
                                <AdminStatusMessage
                                    variant="error"
                                    message={formError}
                                    className="mt-4"
                                />
                            )}
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Admin accounts</h2>
                                    <p className="text-xs text-slate-500">All admin and super admin users.</p>
                                </div>
                            </div>

                            {loading && (
                                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    Loading accounts...
                                </div>
                            )}
                            {!loading && error && (
                                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {error}
                                </div>
                            )}
                            {!loading && !error && admins.length === 0 && (
                                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    No admin accounts found.
                                </div>
                            )}

                            {!loading && !error && admins.length > 0 && (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-xs md:text-sm">
                                        <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">Username</th>
                                                <th className="px-4 py-3">Full Name</th>
                                                <th className="px-4 py-3">Role</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {admins.map((admin) => (
                                                <tr key={admin.id || admin.username}>
                                                    <td className="px-4 py-3 font-semibold text-slate-700">
                                                        {admin.username}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {admin.fullName}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {admin.role || 'admin'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
