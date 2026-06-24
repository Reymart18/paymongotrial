import lockImage from '../../../images/lock.png';
import vecImage from '../../../images/vec.png';

export default function HomeownerLoginForm({
    accountId,
    formatCooldown,
    loading,
    onAccountIdChange,
    onOtpChange,
    onPasswordChange,
    onResendOtp,
    onSubmit,
    onTogglePassword,
    otpCode,
    otpCooldown,
    otpStep,
    otpTarget,
    password,
    showPassword,
}) {
    return (
        <form onSubmit={onSubmit} className="mt-8 mx-auto w-full max-w-sm space-y-6">
            {otpStep && (
                <div className="rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-xs text-white/90">
                    Verification code sent to {otpTarget || 'your Gmail address'}.
                </div>
            )}

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
                    onChange={(e) => onAccountIdChange(e.target.value.toUpperCase())}
                    disabled={loading || otpStep}
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
                    onChange={(e) => onPasswordChange(e.target.value)}
                    disabled={loading || otpStep}
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

            {otpStep && (
                <div className="relative group">
                    <input
                        id="homeowner-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="Enter 8-digit verification code"
                        value={otpCode}
                        onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        disabled={loading}
                        className="w-full px-4 pr-28 py-4 rounded-2xl border border-slate-200 bg-white/70 text-sm text-slate-900 shadow-sm transition focus:border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:shadow-[inset_-10px_0_0_0_rgb(140,65,0)] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    <button
                        type="button"
                        onClick={onResendOtp}
                        disabled={loading || otpCooldown > 0}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading
                            ? 'Sending...'
                            : otpCooldown > 0
                                ? `Resend ${formatCooldown(otpCooldown)}`
                                : 'Resend Code'}
                    </button>
                </div>
            )}

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
                {loading ? 'Logging in...' : otpStep ? 'VERIFY CODE' : 'LOG IN'}
            </button>
        </form>
    );
}
