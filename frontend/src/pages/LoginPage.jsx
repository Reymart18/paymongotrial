import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

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
                localStorage.setItem('accountId', accountId);
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
        <div className="login-container">
            <div className="login-box">
                <h1>HOA Portal</h1>

                {/* Tab selection */}
                <div className="login-tabs">
                    <button
                        className={`tab ${loginType === 'admin' ? 'active' : ''}`}
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
                        className={`tab ${loginType === 'homeowner' ? 'active' : ''}`}
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
                {error && <div className="error-message">{error}</div>}

                {/* Admin Login Form */}
                {loginType === 'admin' && (
                    <form onSubmit={handleAdminLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="admin-username">Username</label>
                            <input
                                id="admin-username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="admin-password">Password</label>
                            <input
                                id="admin-password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" disabled={loading} className="login-button">
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                )}

                {/* Homeowner Login Form */}
                {loginType === 'homeowner' && (
                    <form onSubmit={handleHomeownerLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="homeowner-accountid">Account ID</label>
                            <input
                                id="homeowner-accountid"
                                type="text"
                                placeholder="Enter your account ID (e.g., A003005)"
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value.toUpperCase())}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="homeowner-password">Password</label>
                            <input
                                id="homeowner-password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" disabled={loading} className="login-button">
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
