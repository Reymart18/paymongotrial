const formatDate = (value) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-PH');
};

export default function MonthlySubmissionsReport({
    year,
    month,
    onYearChange,
    onMonthChange,
    kind,
    onKindChange,
    onGenerate,
    onPrint,
    items,
    show,
    onClose,
    loading,
}) {
    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-PH', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <>
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Monthly Requests & Complaints Report</h2>
                        <p className="mt-1 text-sm text-slate-500">Generate a list of submissions created during a selected month.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Month
                            <select
                                value={month}
                                onChange={(event) => onMonthChange(Number(event.target.value))}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:w-44"
                            >
                                {Array.from({ length: 12 }, (_, index) => (
                                    <option key={index + 1} value={index + 1}>
                                        {new Date(2000, index, 1).toLocaleDateString('en-PH', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Year
                            <input
                                type="number"
                                value={year}
                                onChange={(event) => onYearChange(Number(event.target.value))}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-28"
                            />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Type
                            <select
                                value={kind}
                                onChange={(event) => onKindChange(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:w-36"
                            >
                                <option value="all">All</option>
                                <option value="request">Requests</option>
                                <option value="complaint">Complaints</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={onGenerate}
                            disabled={loading}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                </div>
            </section>

            {show && (
                <div className="fixed inset-0 z-100 flex min-h-screen items-center justify-center overflow-y-auto bg-black/50 px-4 py-6">
                    <button type="button" aria-label="Close monthly report" className="absolute inset-0" onClick={onClose} />
                    <section className="relative z-10 max-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-auto rounded-lg bg-white p-6 shadow-xl md:p-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Monthly Requests & Complaints</h2>
                                <p className="mt-1 text-sm text-slate-500">{monthLabel}</p>
                            </div> 
                            <div className="flex gap-2">
                                <button type="button" onClick={onPrint} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                                    Print
                                </button>
                                <button type="button" onClick={onClose} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Account ID</th>
                                        <th className="px-4 py-3">Member</th>
                                        <th className="px-4 py-3">Subject</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-slate-500">No submissions found for this month.</td>
                                        </tr>
                                    )}
                                    {items.map((item, index) => (
                                        <tr key={`${item.kind}-${item.id}`}>
                                            <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">{item.reference}</td>
                                            <td className="px-4 py-3">
                                                {item.kind === 'complaint'
                                                    ? item.complaintType || 'Complaint'
                                                    : item.requestType || 'Request'}
                                            </td>
                                            <td className="px-4 py-3">{item.accountId || '-'}</td>
                                            <td className="px-4 py-3">{item.account?.memberName || '-'}</td>
                                            <td className="px-4 py-3">{item.subject || '-'}</td>
                                            <td className="px-4 py-3">{item.status || '-'}</td>
                                            <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
