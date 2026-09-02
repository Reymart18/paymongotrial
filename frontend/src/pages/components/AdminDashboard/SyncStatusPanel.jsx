import AdminStatusMessage from './AdminStatusMessage';

const labels = {
    members: 'Members',
    payments: 'Payments',
    billing: 'Billing',
    adjustments: 'Adjustments',
};

export default function SyncStatusPanel({
    syncInfo,
    loading,
    requestLoading,
    requestStatus,
    onRequestSync,
    formatTimestamp,
}) {
    const status = syncInfo?.syncStatus || 'idle';
    const serverStatus = syncInfo?.serverStatus || 'offline';
    const lastTable = labels[syncInfo?.lastSyncedTable] || '-';
    const lastSyncTime = syncInfo?.lastSyncTime ? formatTimestamp(syncInfo.lastSyncTime) : '-';
    const recordsUpdated = Number(syncInfo?.recordsUpdated || 0);
    const isBusy = status === 'pending' || status === 'processing';

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">Sync Status</h2>
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-400">Server PC</p>
                            <p className={serverStatus === 'online' ? 'text-emerald-700' : 'text-rose-700'}>
                                {serverStatus}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-400">Status</p>
                            <p>{loading ? 'Loading...' : status}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-400">Last Table</p>
                            <p>{lastTable}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-400">Records Updated</p>
                            <p>{recordsUpdated}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-400">Last Sync</p>
                            <p>{lastSyncTime}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['members', 'payments', 'billing', 'adjustments'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => onRequestSync(type)}
                            disabled={isBusy || requestLoading[type]}
                            className="rounded-lg border border-slate-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {requestLoading[type] ? 'Requesting...' : `Sync ${labels[type]}`}
                        </button>
                    ))}
                </div>
            </div>
            {requestStatus && (
                <AdminStatusMessage variant="success" message={requestStatus} className="mt-4" />
            )}
            {syncInfo?.errorMessage && (
                <AdminStatusMessage variant="error" message={syncInfo.errorMessage} className="mt-4" />
            )}
        </section>
    );
}
