export default function MemberInvitationPanel({
    summary,
    loading,
    error,
    isSuperAdmin,
    onSendNext,
}) {
    if (!isSuperAdmin) return null;

    const batch = summary?.latestBatch;
    const isRunning = batch?.status === 'pending' || batch?.status === 'processing';
    const pending = Number(summary?.pending || 0);

    return (
        <section className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-900">Member Invitations</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                        Members sync only imports data. Send credentials in controlled batches of 50.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onSendNext}
                    disabled={loading || isRunning || pending === 0}
                    className="rounded-lg bg-[#8C4100] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#733600] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isRunning ? 'Invitation batch in progress...' : 'Send next 50 invitations'}
                </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Stat label="Ready to invite" value={pending} />
                <Stat label="Sending" value={summary?.processing || 0} />
                <Stat label="Sent" value={summary?.sent || 0} />
                <Stat label="Failed" value={summary?.failed || 0} tone="text-rose-700" />
                <Stat label="Gmail missing" value={summary?.gmailMissing || 0} />
            </div>

            {batch && (
                <p className="mt-4 text-xs font-medium text-slate-700">
                    Latest batch: {batch.status === 'completed' ? 'complete' : batch.status}
                    {' · '}Sent {batch.sentCount}/{batch.requestedCount}
                    {Number(batch.failedCount || 0) > 0 ? ` · Failed ${batch.failedCount}` : ''}
                </p>
            )}
            {error && <p role="alert" className="mt-3 rounded-md bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}
        </section>
    );
}

function Stat({ label, value, tone = 'text-slate-900' }) {
    return (
        <div className="rounded-md border border-orange-100 bg-white px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1 text-lg font-extrabold ${tone}`}>{Number(value || 0)}</p>
        </div>
    );
}
