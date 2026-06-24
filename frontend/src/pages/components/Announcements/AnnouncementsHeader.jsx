export default function AnnouncementsHeader({
    announcementsError,
    announcementsLoading,
    isBodOnlyView,
    isSuperAdmin,
    onToggleCreate,
    visibleCount,
}) {
    return (
        <>
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:hidden">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#145f46]">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h11zm0 0v1a3 3 0 11-6 0v-1" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-emerald-700">Community Bulletin</p>
                            <h1 className="mt-0.5 truncate text-lg font-bold text-slate-900">
                                {isBodOnlyView ? 'BOD Announcements' : 'Announcements'}
                            </h1>
                            {!announcementsLoading && !announcementsError && (
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {visibleCount} {visibleCount === 1 ? 'community update' : 'community updates'}
                                </p>
                            )}
                        </div>
                    </div>
                    {isSuperAdmin && (
                        <button
                            type="button"
                            onClick={onToggleCreate}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E89B58] text-white transition active:scale-95"
                            aria-label="Add announcement"
                            title="Add announcement"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}
                </div>
            </section>

            <div className="hidden items-start justify-between gap-3 md:flex">
                <div className="min-w-0 flex-1 max-w-2xl">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        {isBodOnlyView ? 'BOD Announcements' : 'Admin Announcements'}
                    </h1>
                    <p className="text-sm md:text-base text-slate-600 mt-1">
                        {isBodOnlyView
                            ? 'Updates intended for BOD members only.'
                            : 'Stay updated with the latest community news and announcements.'}
                    </p>
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={onToggleCreate}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
                        aria-label="Add announcement"
                        title="Add announcement"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )}
            </div>
        </>
    );
}
