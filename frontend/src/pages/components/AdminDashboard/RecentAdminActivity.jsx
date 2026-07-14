export default function RecentAdminActivity({
    activityLoading,
    activityError,
    activityItems,
    activityPage,
    activityMeta,
    onActivityPageChange,
    activityTitle,
    formatTimestamp,
}) {
    const totalPages = Math.max(Number(activityMeta?.totalPages || 1), 1);
    const currentPage = Math.min(Math.max(Number(activityPage || activityMeta?.page || 1), 1), totalPages);
    const total = Number(activityMeta?.total || 0);
    const limit = Number(activityMeta?.limit || activityItems.length || 6);
    const startItem = total > 0 ? (currentPage - 1) * limit + 1 : 0;
    const endItem = total > 0 ? Math.min(startItem + activityItems.length - 1, total) : 0;
    const canGoPrevious = currentPage > 1 && !activityLoading;
    const canGoNext = currentPage < totalPages && !activityLoading;

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
            {!activityError && totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        Showing {startItem}-{endItem} of {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onActivityPageChange(currentPage - 1)}
                            disabled={!canGoPrevious}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => onActivityPageChange(currentPage + 1)}
                            disabled={!canGoNext}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
