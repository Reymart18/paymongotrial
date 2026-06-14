import { formatDate, reference, statusClass } from './requestComplaintUtils';

export default function SubmissionQueue({
    activeTab,
    complaintCount,
    error,
    loading,
    onActiveTabChange,
    onOpenDetails,
    onSearchChange,
    onStatusFilterChange,
    requestCount,
    search,
    statusFilter,
    visibleItems,
}) {
    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md shadow-slate-200/50">
            <div className="border-b border-slate-200 px-5 pb-5 pt-6 md:flex md:items-end md:justify-between md:px-8 md:pb-7 md:pt-8">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Submission Queue</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Requests and complaints are separated for clearer review.</p>
                </div>
                <div className="mt-5 flex gap-2 rounded-lg bg-slate-100 p-1.5 md:mt-0">
                    {['requests', 'complaints'].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => onActiveTabChange(tab)}
                            className={`rounded-md px-5 py-2.5 text-sm font-bold capitalize transition ${activeTab === tab ? 'bg-white text-[#8C4100] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            {tab} ({tab === 'requests' ? requestCount : complaintCount})
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 border-b border-slate-100 bg-slate-50/70 p-5 md:grid-cols-[1fr_240px] md:px-8 md:py-6">
                <label className="relative block">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search account, homeowner, subject, or type"
                        className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#E89B58] focus:ring-2 focus:ring-orange-100"
                    />
                </label>
                <select
                    value={statusFilter}
                    onChange={(event) => onStatusFilterChange(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#E89B58]"
                >
                    <option value="all">All statuses</option>
                    <option value="under review">Under Review</option>
                    {activeTab === 'requests' ? (
                        <>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                        </>
                    ) : (
                        <>
                            <option value="resolved">Resolved</option>
                            <option value="under-review-7-days">Under Review for 7 Days</option>
                        </>
                    )}
                </select>
            </div>

            {error && <p className="m-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 md:m-6">{error}</p>}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                        <tr>
                            <th className="px-5 py-4 md:px-8">Reference</th>
                            <th className="px-5 py-4">Homeowner</th>
                            <th className="px-5 py-4">Type & Subject</th>
                            <th className="px-5 py-4">{activeTab === 'requests' ? 'Preferred Date' : 'Incident'}</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 md:px-8">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-500">Loading submissions...</td></tr>}
                        {!loading && visibleItems.length === 0 && <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-500">No matching {activeTab} found.</td></tr>}
                        {!loading && visibleItems.map((item) => (
                            <tr key={`${activeTab}-${item.id}`} className="transition hover:bg-orange-50/40">
                                <td className="whitespace-nowrap px-5 py-6 font-bold text-slate-700 md:px-8">{reference(item, activeTab === 'requests' ? 'request' : 'complaint')}</td>
                                <td className="px-5 py-6">
                                    <p className="font-semibold text-slate-800">{item.account?.memberName || '-'}</p>
                                    <p className="mt-1 text-xs text-slate-500">{item.accountId}</p>
                                </td>
                                <td className="min-w-64 px-5 py-6">
                                    <p className="font-semibold text-slate-800">{item.requestType || item.complaintType}</p>
                                    <p className="mt-1 truncate text-xs text-slate-500">{item.subject}</p>
                                </td>
                                <td className="whitespace-nowrap px-5 py-6 text-slate-600">
                                    {activeTab === 'requests' ? formatDate(item.preferredDate) : `${formatDate(item.incidentDate)} ${item.incidentTime || ''}`}
                                </td>
                                <td className="whitespace-nowrap px-5 py-6">
                                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{item.status}</span>
                                </td>
                                <td className="px-5 py-6 md:px-8">
                                    <button
                                        type="button"
                                        onClick={() => onOpenDetails({ ...item, kind: activeTab === 'requests' ? 'request' : 'complaint' })}
                                        className="rounded-lg border border-[#E89B58]/50 bg-orange-50 px-3 py-2 text-xs font-bold text-[#8C4100] transition hover:border-[#E89B58] hover:bg-orange-100"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
