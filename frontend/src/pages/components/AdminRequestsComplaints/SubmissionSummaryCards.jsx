function QueueIcon({ kind }) {
    const paths = {
        request: 'M9 5h6m-7 4h8m-8 4h8m-8 4h5M6 3h12a2 2 0 012 2v16H4V5a2 2 0 012-2z',
        complaint: 'M12 9v4m0 4h.01M10.3 4.4L3.5 17a2 2 0 001.76 3h13.48a2 2 0 001.76-3L13.7 4.4a2 2 0 00-3.4 0z',
        accepted: 'M5 13l4 4L19 7',
        rejected: 'M6 18L18 6M6 6l12 12',
        resolved: 'M5 13l4 4L19 7',
        overdue: 'M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
    };

    return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[kind]} />
        </svg>
    );
}

export default function SubmissionSummaryCards({ cards, loading }) {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {cards.map((card) => (
                <button
                    key={card.label}
                    type="button"
                    onClick={card.action}
                    className={`min-h-40 rounded-lg border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-7 ${card.cardClass}`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 md:text-sm">{card.label}</p>
                            <p className="mt-3 text-3xl font-bold text-slate-900">{loading ? '-' : card.value}</p>
                        </div>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}>
                            <QueueIcon kind={card.kind} />
                        </div>
                    </div>
                    <p className="mt-6 text-xs font-semibold text-slate-400">{card.helper || 'View filtered queue'}</p>
                </button>
            ))}
        </div>
    );
}
