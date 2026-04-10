export default function MustChangePasswordModal({ onChangePassword }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="text-base font-semibold text-slate-800">
                    Password Update Required
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                    Your password is in default. Change your password first to secure
                    your account.
                </p>
                <button
                    type="button"
                    className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-500"
                    onClick={onChangePassword}
                >
                    Change Password
                </button>
            </div>
        </div>
    );
}
