import AnnouncementActions from './AnnouncementActions';
import AnnouncementBody from './AnnouncementBody';

export default function AnnouncementsFeed({
    announcements,
    announcementsError,
    announcementsLoading,
    carouselIndex,
    carouselSlides,
    editingId,
    expandedRecentIds,
    featuredAnnouncement,
    formatDate,
    formatTarget,
    getAnnouncementImageUrl,
    isSuperAdmin,
    onDeleteAnnouncement,
    onEditAnnouncement,
    onViewImage,
    recentAnnouncements,
    toggleRecentAnnouncement,
}) {
    if (announcementsLoading || announcementsError || announcements.length === 0) return null;

    const actionProps = {
        disabled: editingId !== null,
        onDelete: onDeleteAnnouncement,
        onEdit: onEditAnnouncement,
    };
    const currentSlide = carouselSlides[carouselIndex];

    return (
        <>
            <div className="space-y-4 md:hidden">
                {featuredAnnouncement && (
                    <section className="overflow-hidden rounded-lg border border-orange-100 bg-white shadow-md shadow-orange-100/60">
                        {featuredAnnouncement.image ? (
                            <img
                                src={getAnnouncementImageUrl(featuredAnnouncement.image)}
                                alt={featuredAnnouncement.title}
                                className="h-52 w-full cursor-pointer object-cover sm:h-64"
                                onClick={() => onViewImage(getAnnouncementImageUrl(featuredAnnouncement.image))}
                            />
                        ) : (
                            <div className="flex h-40 items-center justify-center bg-orange-50 text-[#8C4100]">
                                <div className="text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h11zm0 0v1a3 3 0 11-6 0v-1" />
                                        </svg>
                                    </div>
                                    <p className="mt-3 text-[10px] font-bold uppercase text-orange-700">Community Update</p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-3 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase text-[#8C4100]">
                                    Featured
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">
                                    {formatDate(featuredAnnouncement.createdAt)}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold leading-7 text-slate-900">
                                {featuredAnnouncement.title || 'Untitled Announcement'}
                            </h2>
                            <AnnouncementBody announcement={featuredAnnouncement} />
                            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                    {formatTarget(featuredAnnouncement.target)}
                                </span>
                                {featuredAnnouncement.author && <span>Posted by {featuredAnnouncement.author}</span>}
                            </div>
                            {isSuperAdmin && (
                                <div className="flex justify-end gap-2 pt-1">
                                    <AnnouncementActions announcement={featuredAnnouncement} {...actionProps} />
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {recentAnnouncements.length > 0 && (
                    <div className="flex items-end justify-between px-1 pt-2">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-[#8C4100]">Bulletin Feed</p>
                            <h2 className="mt-0.5 text-lg font-bold text-slate-900">Recent Updates</h2>
                        </div>
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                            {recentAnnouncements.length}
                        </span>
                    </div>
                )}

                {recentAnnouncements.length > 0 && (
                    <section className="space-y-3">
                        <div className="space-y-3">
                            {recentAnnouncements.map((announcement) => (
                                <article
                                    key={announcement.id}
                                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="flex gap-3 p-4">
                                        {announcement.image ? (
                                            <button
                                                type="button"
                                                onClick={() => onViewImage(getAnnouncementImageUrl(announcement.image))}
                                                className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100"
                                                aria-label={`View ${announcement.title || 'announcement'} image`}
                                            >
                                                <img
                                                    src={getAnnouncementImageUrl(announcement.image)}
                                                    alt={announcement.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ) : (
                                            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5h6m-7 4h8m-8 4h8m-8 4h5M6 3h12a2 2 0 012 2v16H4V5a2 2 0 012-2z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                                                <span>{formatDate(announcement.createdAt)}</span>
                                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                <span>{formatTarget(announcement.target)}</span>
                                            </div>
                                            <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                                                {announcement.title || 'Untitled Announcement'}
                                            </h3>
                                            <p className={`${expandedRecentIds.includes(announcement.id) ? '' : 'line-clamp-2'} mt-1 text-xs leading-5 text-slate-500`}>
                                                {announcement.content || 'No content provided.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
                                        <button
                                            type="button"
                                            onClick={() => toggleRecentAnnouncement(announcement.id)}
                                            className="text-xs font-bold text-[#8C4100]"
                                        >
                                            {expandedRecentIds.includes(announcement.id) ? 'Show less' : 'Read more'}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-semibold text-slate-400">
                                                {announcement.author || 'HOA'}
                                            </span>
                                            {isSuperAdmin && <AnnouncementActions announcement={announcement} {...actionProps} />}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_400px] md:gap-10 md:items-start">
                <section className="min-w-0 space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                        {currentSlide?.image && (
                            <img
                                src={getAnnouncementImageUrl(currentSlide.image)}
                                alt={currentSlide.title || 'Announcement'}
                                className="h-48 w-full cursor-pointer object-cover lg:h-56"
                                onClick={() => onViewImage(getAnnouncementImageUrl(currentSlide.image))}
                            />
                        )}
                        {!currentSlide?.image && (
                            <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 lg:h-56">
                                Announcement
                            </div>
                        )}

                        <div className="space-y-3 p-4 lg:p-6">
                            <div className="flex items-center gap-2 text-xs text-slate-500 lg:text-sm">
                                <span>{formatDate(currentSlide?.createdAt)}</span>
                                {currentSlide?.author && (
                                    <>
                                        <span className="text-slate-300">|</span>
                                        <span>{currentSlide.author}</span>
                                    </>
                                )}
                                <span className="text-slate-300">|</span>
                                <span>{formatTarget(currentSlide?.target)}</span>
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 lg:text-2xl">
                                {currentSlide?.title || 'Untitled Announcement'}
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-700 lg:text-base">
                                {currentSlide?.content || 'No content provided.'}
                            </p>
                            {isSuperAdmin && (
                                <div className="flex justify-end pt-1">
                                    <AnnouncementActions announcement={currentSlide} {...actionProps} />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <aside className="border-l border-slate-200 pl-8">
                    <div className="rounded-2xl bg-slate-50/70">
                        <h3 className="text-base font-bold text-slate-900">Recent Announcements</h3>
                        <div className="mt-4 min-h-52 rounded-2xl bg-slate-100/70 p-4">
                            {recentAnnouncements.length > 0 ? (
                                <div className="space-y-4">
                                    {recentAnnouncements.map((announcement) => (
                                        <article key={announcement.id} className="rounded-2xl bg-white p-4 shadow-sm">
                                            <div className="flex gap-4">
                                                {announcement.image ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onViewImage(getAnnouncementImageUrl(announcement.image))}
                                                        className="shrink-0 overflow-hidden rounded-xl"
                                                        aria-label={`View ${announcement.title || 'announcement'} image`}
                                                    >
                                                        <img
                                                            src={getAnnouncementImageUrl(announcement.image)}
                                                            alt={announcement.title}
                                                            className="h-20 w-28 object-cover transition duration-200 hover:scale-105"
                                                        />
                                                    </button>
                                                ) : (
                                                    <div className="h-20 w-28 rounded-xl bg-slate-100" />
                                                )}
                                                <div className="min-w-0">
                                                    <div className="text-xs text-slate-500">
                                                        <span>{formatDate(announcement.createdAt)}</span>
                                                        <span className="mx-1 text-slate-300">|</span>
                                                        <span>{formatTarget(announcement.target)}</span>
                                                    </div>
                                                    <div className="mt-1 text-base font-semibold leading-snug text-slate-900">
                                                        {announcement.title || 'Untitled Announcement'}
                                                    </div>
                                                    <p className={`${expandedRecentIds.includes(announcement.id) ? '' : 'line-clamp-3'} mt-2 text-sm leading-relaxed text-slate-600`}>
                                                        {announcement.content || 'No content provided.'}
                                                    </p>
                                                    <div className="mt-2 flex items-center justify-between gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRecentAnnouncement(announcement.id)}
                                                            className="text-sm font-medium text-indigo-600 hover:underline"
                                                        >
                                                            {expandedRecentIds.includes(announcement.id) ? 'Show less' : 'Read more'}
                                                        </button>
                                                        {isSuperAdmin && (
                                                            <div className="shrink-0">
                                                                <AnnouncementActions announcement={announcement} {...actionProps} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full rounded-2xl bg-slate-100/70" />
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
}
