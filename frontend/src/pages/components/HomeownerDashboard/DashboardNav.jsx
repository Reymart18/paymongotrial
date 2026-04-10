export default function DashboardNav({ onLogout }) {
    return (
        <nav className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 px-6 py-5 text-white shadow">
            <h1 className="text-lg font-semibold tracking-wide">Homeowner Dashboard</h1>
            <button
                onClick={onLogout}
                className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
                Logout
            </button>
        </nav>
    );
}
