import AdminLoginForm from './components/Login/AdminLoginForm';
import HomeownerLoginForm from './components/Login/HomeownerLoginForm';
import LoginBranding from './components/Login/LoginBranding';
import LoginHelpGuide from './components/Login/LoginHelpGuide';
import LoginTabs from './components/Login/LoginTabs';
import useLoginPageController from './components/Login/useLoginPageController';
import login1Image from '../images/Rectangle1.png';

export default function LoginPage() {
    const {
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
        navigateHome,
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
    } = useLoginPageController();

    const isAdminLogin = loginType === 'admin';
    const isHomeownerLogin = loginType === 'homeowner';
    const homeownerSubmit = otpStep ? handleHomeownerOtpVerify : handleHomeownerLogin;
    const togglePassword = () => setShowPassword((isVisible) => !isVisible);
    const pageClassName = 'min-h-screen w-full bg-[#E89B58] flex relative overflow-y-auto';
    const formPanelClassName =
        'w-full px-8 py-10 lg:ml-[50%] lg:w-1/2 min-h-screen flex flex-col justify-center';

    return (
        <div className={pageClassName}>
            <div className="pointer-events-none fixed inset-0 z-0 lg:hidden">
                <img
                    src={login1Image}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover opacity-55"
                />
                <div className="absolute inset-0 bg-[#E89B58]/75"></div>
            </div>
            <button
                onClick={navigateHome}
                className="fixed top-0 right-0 rounded-bl-2xl bg-[#FFFAFA]/70 px-6 py-3 text-sm font-semibold text-[#363232] shadow-lg transition hover:py-5 hover:shadow-xl z-50"
                aria-label="Go back to home"
            >
                Home
            </button>

            <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
                <div className="fixed inset-y-0 left-0 z-0 hidden h-screen w-1/2 overflow-hidden lg:flex">
                    <img
                        src={login1Image}
                        alt="Login"
                        className="h-full w-full rounded-br-[65%] object-fill"
                    />
                </div>

                <div className={formPanelClassName}>
                    <LoginBranding />
                    <LoginTabs
                        loginType={loginType}
                        onChange={handleLoginTypeChange}
                    />

                    {error && (
                        <div className="mt-4 rounded-lg border-l-4 border-rose-500 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    {isAdminLogin && (
                        <AdminLoginForm
                            loading={loading}
                            onPasswordChange={setPassword}
                            onSubmit={handleAdminLogin}
                            onTogglePassword={togglePassword}
                            onUsernameChange={setUsername}
                            password={password}
                            showPassword={showPassword}
                            username={username}
                        />
                    )}

                    {isHomeownerLogin && (
                        <HomeownerLoginForm
                            accountId={accountId}
                            formatCooldown={formatCooldown}
                            loading={loading}
                            onAccountIdChange={setAccountId}
                            onOtpChange={setOtpCode}
                            onPasswordChange={setPassword}
                            onResendOtp={handleResendOtp}
                            onSubmit={homeownerSubmit}
                            onTogglePassword={togglePassword}
                            otpCode={otpCode}
                            otpCooldown={otpCooldown}
                            otpStep={otpStep}
                            otpTarget={otpTarget}
                            password={password}
                            showPassword={showPassword}
                        />
                    )}

                    <LoginHelpGuide />
                </div>
            </div>
        </div>
    );
}
