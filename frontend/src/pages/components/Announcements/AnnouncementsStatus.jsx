export default function AnnouncementsStatus({
    announcements,
    announcementsError,
    announcementsLoading,
}) {
    if (announcementsLoading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                <div className="flex justify-center mb-3">
                    <svg className="w-8 h-8 text-slate-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
                <p className="text-slate-600">Loading announcements...</p>
            </div>
        );
    }

    if (announcementsError) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18zm0 2a7 7 0 100 14 7 7 0 000-14z" />
                    </svg>
                    <div>
                        <h3 className="font-semibold text-rose-900">Error</h3>
                        <p className="text-sm text-rose-800 mt-1">{announcementsError}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (announcements.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-sm text-center">
                <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No announcements yet</h3>
                <p className="text-slate-600">Check back soon for community updates and news.</p>
            </div>
        );
    }

    return null;
}
