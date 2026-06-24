import lockImage from '../../../images/lock.png';
import vecImage from '../../../images/vec.png';

export default function AdminLoginForm({
    loading,
    onPasswordChange,
    onSubmit,
    onTogglePassword,
    onUsernameChange,
    password,
    showPassword,
    username,
}) {
    return (
        <form onSubmit={onSubmit} className="mt-8 mx-auto w-full max-w-sm space-y-6">
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
                    onChange={(e) => onUsernameChange(e.target.value)}
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-12 py-4 rounded-2xl border border-slate-200 bg-white/70 text-sm text-slate-900 shadow-sm transition focus:border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:shadow-[inset_-10px_0_0_0_rgb(140,65,0)] disabled:cursor-not-allowed disabled:bg-slate-100 relative"
                />
                <button
                    type="button"
                    onClick={onTogglePassword}
                    disabled={loading}
                    className="absolute right-3 top-1/2 z-20 -translate-y-1/2 text-slate-600 transition hover:text-slate-900 disabled:opacity-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.3A10.8 10.8 0 0112 4c5.5 0 9 5 9 5a15.2 15.2 0 01-2.1 2.8M6.2 6.2C4.2 7.5 3 9 3 9s3.5 5 9 5c1.2 0 2.3-.2 3.2-.6" />
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                            <circle cx="12" cy="12" r="2.5" strokeWidth={1.8} />
                        </svg>
                    )}
                </button>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#FFFAFA]/70 px-4 py-4 text-sm font-semibold text-[#363232] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
                {loading ? 'Logging in...' : 'LOG IN'}
            </button>
        </form>
    );
}
