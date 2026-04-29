import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import login1Image from '../images/login1.png';
import pvhaiImage from '../images/pvhai.png';
import vecImage from '../images/vec.png';
import lockImage from '../images/lock.png';

export default function LoginPage() {
    const [loginType, setLoginType] = useState('homeowner'); // 'admin' or 'homeowner'
    const [username, setUsername] = useState('');
    const [accountId, setAccountId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="h-screen w-full bg-[#E89B58] flex relative">
            {/* Home Button */}
            <button
                onClick={() => navigate('/')}
                className="fixed top-0 right-0 rounded-bl-2xl bg-[#FFFAFA]/70 px-6 py-3 text-sm font-semibold text-[#363232] shadow-lg transition hover:py-5 hover:shadow-xl z-50"
                aria-label="Go back to home"
            >
                Home
            </button>

            <div className="flex w-full h-screen">
                {/* Left Panel - Image */}
                <div className="hidden w-1/2 lg:flex overflow-hidden h-screen -mt-[0.5%]">
                    <img
                        src={login1Image}
                        alt="Login"
                        className="w-full h-[105%] object-fill"
                    />
                </div>

                {/* Right Panel - Login Form */}
                <div className="w-full px-8 py-10 lg:w-1/2 h-screen flex flex-col justify-center">
                    <div className="text-center">
                        <img
                            src={pvhaiImage}
                            alt="PVHAI"
                            className="mx-auto h-40 w-auto"
                        />
                        <h2 className="mt-4 text-2xl font-medium font-abhaya text-white">
                            Welcome!
                        </h2>
                        <p className="mt-2 text-sm font-poppins font-light text-white/80">
                            A secure portal for homeowners to view announcements, manage dues, and access association services.
                        </p>
                    </div>

                    {/* Tab selection */}
                    <div className="mt-6 flex gap-2 border-b border-white/30 mx-auto w-full max-w-sm px-6">
                        <button
                            className={`flex-1 border-b-4 px-3 py-2 text-sm font-semibold transition ${loginType === 'homeowner'
                                ? 'border-white text-white'
                                : 'border-transparent text-white/60 hover:text-white'
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
                        <button
                            className={`flex-1 border-b-4 px-3 py-2 text-sm font-semibold transition ${loginType === 'admin'
                                ? 'border-white text-white'
                                : 'border-transparent text-white/60 hover:text-white'
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
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mt-4 rounded-lg border-l-4 border-rose-500 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    {/* Admin Login Form */}
                    {loginType === 'admin' && (
                        <form onSubmit={handleAdminLogin} className="mt-8 mx-auto w-full max-w-sm space-y-6">
                            <div className="relative group">
                                <img
                                    src={vecImage}
                                    alt=""
                                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 z-10"
                                    aria-hidden="true"
                                />
                                <input
                                    id="admin-username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl border border-slate-200 bg-white/70 text-sm text-slate-900 shadow-sm transition focus:border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:shadow-[inset_-10px_0_0_0_rgb(140,65,0)] disabled:cursor-not-allowed disabled:bg-slate-100 relative"
                                />
                            </div>

                            <div className="relative group">
                                <img
                                    src={lockImage}
                                    alt=""
                                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 z-10"
                                    aria-hidden="true"
                                />
                                <input
                                    id="admin-password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl border border-slate-200 bg-white/70 text-sm text-slate-900 shadow-sm transition focus:border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:shadow-[inset_-10px_0_0_0_rgb(140,65,0)] disabled:cursor-not-allowed disabled:bg-slate-100 relative"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-2xl bg-[#FFFAFA]/70 px-4 py-4 text-sm font-semibold text-[#363232] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? 'Logging in...' : 'LOG IN'}
                            </button>
                        </form>
                    )}

                    {/* Homeowner Login Form */}
                    {loginType === 'homeowner' && (
                        <form onSubmit={handleHomeownerLogin} className="mt-8 mx-auto w-full max-w-sm space-y-6">
                            <div className="relative group">
                                <img
                                    src={vecImage}
                                    alt=""
                                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 z-10"
                                    aria-hidden="true"
                                />
                                <input
                                    id="homeowner-accountid"
                                    type="text"
                                    placeholder="Enter your account ID (e.g., A001001)"
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value.toUpperCase())}
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl border border-slate-200 bg-white/70 text-sm text-slate-900 shadow-sm transition focus:border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:shadow-[inset_-10px_0_0_0_rgb(140,65,0)] disabled:cursor-not-allowed disabled:bg-slate-100 relative"
                                />
                            </div>

                            <div className="relative group">
                                <img
                                    src={lockImage}
                                    alt=""
                                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 z-10"
                                    aria-hidden="true"
                                />
                                <input
                                    id="homeowner-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-10 pr-12 py-4 rounded-2xl border border-slate-200 bg-white/70 text-sm text-slate-900 shadow-sm transition focus:border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:shadow-[inset_-10px_0_0_0_rgb(140,65,0)] disabled:cursor-not-allowed disabled:bg-slate-100 relative"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition disabled:opacity-50 z-20"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '⊙' : '◯'}
                                </button>
                            </div>

                            <div className="pt-2">
                                <p className="text-xs font-poppins font-light text-white/80">
                                    For forgotten passwords, kindly reach out to the HOA office.
                                </p>
                                <div className="mt-2 h-px bg-white/30"></div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-2xl bg-[#FFFAFA]/70 px-4 py-4 text-sm font-semibold text-[#363232] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? 'Logging in...' : 'LOG IN'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
