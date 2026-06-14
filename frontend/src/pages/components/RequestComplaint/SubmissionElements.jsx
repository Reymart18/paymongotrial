export function SubmissionIcon({ kind }) {
    const isComplaint = kind === 'complaint';
    return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d={isComplaint
                    ? 'M12 9v4m0 4h.01M10.3 4.4L3.5 17a2 2 0 001.76 3h13.48a2 2 0 001.76-3L13.7 4.4a2 2 0 00-3.4 0z'
                    : 'M9 5h6m-7 3h8m-8 4h8m-8 4h5M7 3h10a2 2 0 012 2v16H5V5a2 2 0 012-2z'}
            />
        </svg>
    );
}

export function ServiceIcon({ tone, children }) {
    const styles = tone === 'red'
        ? 'bg-rose-100 text-rose-500'
        : 'bg-emerald-100 text-emerald-700';
    return (
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg md:h-14 md:w-14 ${styles}`}>
            {children}
        </div>
    );
}

export function StatusBadge({ status }) {
    const normalizedStatus = String(status || '').toLowerCase();
    const styles = normalizedStatus === 'resolved' || normalizedStatus === 'accepted'
        ? 'bg-emerald-100 text-emerald-700'
        : normalizedStatus === 'rejected'
            ? 'bg-rose-100 text-rose-700'
            : 'bg-amber-100 text-amber-700';
    return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${styles}`}>{status}</span>;
}
