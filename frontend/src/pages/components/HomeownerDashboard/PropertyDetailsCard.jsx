export default function PropertyDetailsCard({ account }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">Property Details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Neighborhood</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {account.neighborhood}
                    </p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Block</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {account.block}
                    </p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Lot</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {account.lot}
                    </p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Member Name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {account.memberName}
                    </p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Property Size (sqm)</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {account.propertySizeSqm}
                    </p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Classification</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {account.classification}
                    </p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                    <span className="mt-1 inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {account.status}
                    </span>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Current Balance</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {Number(account.balance || 0).toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}
