import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAdminIdentity } from '../../../utils/adminIdentity';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function useLoginPageController() {
    const [loginType, setLoginType] = useState('homeowner');
    const [username, setUsername] = useState('');
    const [accountId, setAccountId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpStep, setOtpStep] = useState(false);
    const [otpTarget, setOtpTarget] = useState('');
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!otpStep || otpCooldown <= 0) {
            return undefined;
        }

        const timer = setInterval(() => {
            setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [otpStep, otpCooldown]);

    const startOtpCooldown = (seconds) => {
        if (!seconds || seconds <= 0) return;
        setOtpCooldown(seconds);
    };

    const formatCooldown = (seconds) => {
        const safeSeconds = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(safeSeconds / 60);
        const remaining = safeSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
    };

    const resetLoginFields = () => {
        setError('');
        setAccountId('');
        setUsername('');
        setPassword('');
        setOtpCode('');
        setOtpStep(false);
        setOtpTarget('');
    };

    const handleLoginTypeChange = (type) => {
        setLoginType(type);
        resetLoginFields();
    };

    const storeHomeownerSession = (data) => {
        clearAdminIdentity();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userRole', 'homeowner');
        localStorage.setItem('accountId', data.accountId || accountId);

        if (data.requirePasswordChange) {
            localStorage.setItem('mustChangePassword', 'true');
        } else {
            localStorage.removeItem('mustChangePassword');
        }

        navigate('/homeowner/dashboard');
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError('');

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

            if (data.otpRequired) {
                setOtpStep(true);
                setOtpTarget(data.gmail || '');
                setOtpCode('');
                startOtpCooldown(data.cooldownSeconds || 180);
                return;
            }

            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('userRole', data.role || 'admin');
                localStorage.setItem('adminUsername', data.username || username.trim());
                if (data.fullName) {
                    localStorage.setItem('adminFullName', data.fullName);
                } else {
                    localStorage.removeItem('adminFullName');
                }

                if (data.requirePasswordChange) {
                    localStorage.setItem('mustChangePassword', 'true');
                    navigate('/admin/change-password');
                    return;
                }

                localStorage.removeItem('mustChangePassword');
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleHomeownerOtpVerify = async (e) => {
        e.preventDefault();
        setError('');

        if (!otpCode.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login/homeowner/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId, otp: otpCode }),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Verification failed. Please try again.');
                return;
            }

            if (data.access_token) storeHomeownerSession(data);
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Verification error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');

        if (!accountId.trim() || !password.trim()) {
            setError('Please enter both account ID and password');
            return;
        }

        if (otpCooldown > 0) {
            setError(`Please wait ${otpCooldown} seconds before requesting a new code.`);
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
                setError(data.message || 'Failed to resend verification code.');
                return;
            }

            if (data.otpRequired) {
                setOtpStep(true);
                setOtpTarget(data.gmail || '');
                setOtpCode('');
                startOtpCooldown(data.cooldownSeconds || 180);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Resend OTP error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleHomeownerLogin = async (e) => {
        e.preventDefault();
        setError('');

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

            if (data.otpRequired) {
                setOtpStep(true);
                setOtpTarget(data.gmail || '');
                setOtpCode('');
                startOtpCooldown(data.cooldownSeconds || 180);
                return;
            }

            if (data.access_token) storeHomeownerSession(data);
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        accountId,
        error,
        formatCooldown,
        handleAdminLogin,
        handleHomeownerLogin,
        handleHomeownerOtpVerify,
        handleLoginTypeChange,
        handleResendOtp,
        loading,
        loginType,
        navigateHome: () => navigate('/'),
        otpCode,
        otpCooldown,
        otpStep,
        otpTarget,
        password,
        setAccountId,
        setOtpCode,
        setPassword,
        setShowPassword,
        setUsername,
        showPassword,
        username,
    };
}
