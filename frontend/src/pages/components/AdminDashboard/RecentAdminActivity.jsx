export default function RecentAdminActivity({
    activityLoading,
    activityError,
    activityItems,
    activityTitle,
    formatTimestamp,
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Recent admin activity</h2>
                    <p className="text-sm text-slate-500">Latest updates from admin actions.</p>
                </div>
            </div>
            <div className="mt-4 space-y-3">
                {activityLoading && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Loading recent activity...
                    </div>
                )}
                {!activityLoading && activityError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {activityError}
                    </div>
                )}
                {!activityLoading && !activityError && activityItems.length === 0 && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        No recent activity yet.
                    </div>
                )}
                {!activityLoading && !activityError && activityItems.map((activity) => (
                    <div
                        key={activity.id}
                        className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">{activityTitle(activity)}</p>
                            <span className="text-xs text-slate-500">
                                {formatTimestamp(activity.createdAt)}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600">{activity.details || 'No details provided.'}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
