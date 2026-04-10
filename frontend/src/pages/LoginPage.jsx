import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [loginType, setLoginType] = useState('admin'); // 'admin' or 'homeowner'
    const [username, setUsername] = useState('');
    const [accountId, setAccountId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    /**
     * Handle admin login
     */
    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Login failed. Please check your credentials.');
                return;
            }

            // Store JWT token
            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('userRole', 'admin');
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle homeowner login
     */
    const handleHomeownerLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!accountId.trim() || !password.trim()) {
            setError('Please enter both account ID and password');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login/homeowner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Login failed. Please check your credentials.');
                return;
            }

            // Store JWT token
            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('userRole', 'homeowner');
                localStorage.setItem('accountId', data.accountId || accountId);
                if (data.requirePasswordChange) {
                    localStorage.setItem('mustChangePassword', 'true');
                } else {
                    localStorage.removeItem('mustChangePassword');
                }
                navigate('/homeowner/dashboard');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 px-4 py-10 text-slate-900">
            <div className="mx-auto w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur">
                <h1 className="text-center text-3xl font-semibold tracking-tight text-slate-900">
                    HOA Portal
                </h1>

                {/* Tab selection */}
                <div className="mt-8 flex gap-2 border-b border-slate-200">
                    <button
                        className={`flex-1 border-b-4 px-3 py-2 text-sm font-semibold transition ${loginType === 'admin'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-indigo-500'
                            }`}
                        onClick={() => {
                            setLoginType('admin');
                            setError('');
                            setAccountId('');
                            setUsername('');
                            setPassword('');
                        }}
                    >
                        Admin
                    </button>
                    <button
                        className={`flex-1 border-b-4 px-3 py-2 text-sm font-semibold transition ${loginType === 'homeowner'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-indigo-500'
                            }`}
                        onClick={() => {
                            setLoginType('homeowner');
                            setError('');
                            setAccountId('');
                            setUsername('');
                            setPassword('');
                        }}
                    >
                        Homeowner
                    </button>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mt-6 rounded-lg border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {/* Admin Login Form */}
                {loginType === 'admin' && (
                    <form onSubmit={handleAdminLogin} className="mt-6 space-y-5">
                        <div>
                            <label htmlFor="admin-username" className="text-sm font-medium text-slate-700">
                                Username
                            </label>
                            <input
                                id="admin-username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                            />
                        </div>

                        <div>
                            <label htmlFor="admin-password" className="text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <input
                                id="admin-password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                )}

                {/* Homeowner Login Form */}
                {loginType === 'homeowner' && (
                    <form onSubmit={handleHomeownerLogin} className="mt-6 space-y-5">
                        <div>
                            <label htmlFor="homeowner-accountid" className="text-sm font-medium text-slate-700">
                                Account ID
                            </label>
                            <input
                                id="homeowner-accountid"
                                type="text"
                                placeholder="Enter your account ID (e.g., A003005)"
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value.toUpperCase())}
                                disabled={loading}
                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                            />
                        </div>

                        <div>
                            <label htmlFor="homeowner-password" className="text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <input
                                id="homeowner-password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
