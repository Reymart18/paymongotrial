import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MEMBER_AGREEMENT_VERSION = '2026-09-16';

export default function MemberAgreement() {
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        localStorage.removeItem('mustChangePassword');
        localStorage.removeItem('mustAcceptMemberAgreement');
        navigate('/login');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!agreed) return;

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/property/member-agreement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ version: MEMBER_AGREEMENT_VERSION }),
            });
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    handleLogout();
                    return;
                }
                setError(data.message || 'Unable to save your agreement. Please try again.');
                return;
            }

            localStorage.removeItem('mustAcceptMemberAgreement');
            navigate('/homeowner/dashboard', { replace: true });
        } catch (requestError) {
            console.error('Member agreement error:', requestError);
            setError('Unable to save your agreement. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-6 md:py-12">
            <main className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
                        HOA Community Portal – Member Agreement
                    </h1>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Log out
                    </button>
                </div>

                <p className="mt-6 text-sm leading-6 text-slate-700">
                    By accessing and using the HOA Community Portal, I acknowledge and agree that:
                </p>

                <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-700">
                    <li>The information displayed in the portal is provided for my account and HOA-related transactions.</li>
                    <li>I will keep my login credentials confidential and will not share them with others.</li>
                    <li>I understand that some account balances or records may be subject to ongoing verification and adjustment.</li>
                    <li>I will report any incorrect or suspicious information to the HOA Administration.</li>
                    <li>I agree to use the portal responsibly and only for legitimate HOA-related purposes.</li>
                </ul>

                {error && (
                    <div className="mt-6 rounded-lg border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-7">
                    <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-slate-800">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(event) => setAgreed(event.target.checked)}
                            disabled={loading}
                            className="mt-1 h-4 w-4 accent-indigo-600"
                        />
                        <span>I have read and agree to the terms above.</span>
                    </label>
                    <button
                        type="submit"
                        disabled={!agreed || loading}
                        className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Agree & Continue'}
                    </button>
                </form>
            </main>
        </div>
    );
}
