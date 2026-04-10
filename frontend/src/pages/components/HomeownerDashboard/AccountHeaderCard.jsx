export default function AccountHeaderCard({ accountId }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Homeowner Account</h2>
            <p className="mt-2 text-sm text-slate-500">Account ID: {accountId}</p>
        </div>
    );
}
