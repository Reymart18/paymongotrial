function ContactRow({ iconPath, label, value }) {
    return (
        <div className="flex min-w-0 items-center gap-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#8C4100]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={iconPath} />
                </svg>
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
                <p className="mt-0.5 wrap-break-word text-sm font-semibold text-slate-800">{value || '-'}</p>
            </div>
        </div>
    );
}

function getInitials(name) {
    return String(name || '')
        .split(/[\s,]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'M';
}

export default function MemberDetailsDrawer({
    account,
    isSuperAdmin,
    onClose,
    onResetPassword,
    resetError,
    resetLoading,
    resetStatus,
}) {
    if (!account) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <aside className="absolute right-0 top-0 flex h-full w-full max-w-md translate-x-0 flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out">
                <header className="flex shrink-0 items-center justify-between border-b border-orange-200 bg-[#E89B58] px-5 py-4 sm:px-6">
                    <div className="min-w-0 pr-3">
                        <h2 className="text-lg font-bold text-white">Member Details</h2>
                        <p className="mt-0.5 text-xs text-orange-50">Homeowner account information</p>
                    </div>
                    <button type="button" aria-label="Close member details" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
                    <section className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xl font-extrabold text-[#8C4100] ring-4 ring-orange-50">
                                {getInitials(account.memberName)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="wrap-break-word text-lg font-extrabold leading-6 text-slate-900">{account.memberName || '-'}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{account.accountId || '-'}</p>
                                <span className="mt-2 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-[#8C4100]">
                                    {account.classification || '-'}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <h3 className="text-sm font-bold text-slate-900">Property Location</h3>
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-slate-100">
                            {[
                                ['Neighborhood', account.neighborhood],
                                ['Block', account.block],
                                ['Lot', account.lot],
                            ].map(([label, value]) => (
                                <div key={label} className="min-w-0 px-2 py-4 text-center">
                                    <p className="text-[9px] font-bold uppercase text-slate-400">{label}</p>
                                    <p className="mt-1 wrap-break-word text-sm font-bold text-slate-800">{value || '-'}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white px-4 shadow-sm">
                        <div className="border-b border-slate-100 py-3">
                            <h3 className="text-sm font-bold text-slate-900">Contact Details</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            <ContactRow label="Gmail" value={account.gmail} iconPath="M3 6l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                            <ContactRow label="Cellphone Number" value={account.celno} iconPath="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm3 15h4" />
                            <ContactRow label="Telephone Number" value={account.telno} iconPath="M3 5a2 2 0 012-2h3l2 5-2 1a14 14 0 007 7l1-2 5 2v3a2 2 0 01-2 2C10.16 21 3 13.84 3 5z" />
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900">Property Information</h3>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[9px] font-bold uppercase text-slate-400">Classification</p>
                                <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-800">{account.classification || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[9px] font-bold uppercase text-slate-400">Property Size</p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">{account.propertySizeSqm ?? '-'} sqm</p>
                            </div>
                        </div>
                    </section>

                    {isSuperAdmin && (
                        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <h3 className="text-sm font-bold text-amber-950">Account Access</h3>
                            <p className="mt-1 text-xs leading-5 text-amber-800">
                                Generate a new temporary password and email it to the member.
                            </p>
                            <button
                                type="button"
                                onClick={() => onResetPassword(account.accountId)}
                                disabled={resetLoading}
                                className="mt-4 w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {resetLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                            {resetStatus && <p role="status" className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold leading-5 text-emerald-800">{resetStatus}</p>}
                            {resetError && <p role="alert" className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-xs font-semibold leading-5 text-rose-700">{resetError}</p>}
                        </section>
                    )}
                </div>
            </aside>
        </div>
    );
}
