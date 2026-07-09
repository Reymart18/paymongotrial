import { formatDate, reference, statusClass } from './requestComplaintUtils';

export default function SubmissionDetailsModal({
    apiUrl,
    item,
    onClose,
    onSaveStatus,
    onStatusDraftChange,
    statusDraft,
    statusError,
    statusUpdating,
}) {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
            <button type="button" aria-label="Close details" className="absolute inset-0 bg-black/50" onClick={onClose} />
            <section className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl md:p-10">
                <div className="flex items-start justify-between gap-5 border-b border-slate-200 pb-7">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-bold uppercase text-[#8C4100]">{reference(item, item.kind)}</p>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(item.status)}`}>{item.status}</span>
                        </div>
                        <h2 className="mt-2 text-xl font-bold">{item.requestType || item.complaintType}</h2>
                        <p className="mt-1 text-sm text-slate-500">{item.subject}</p>
                    </div>
                    <button type="button" aria-label="Close details" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                    <div><p className="text-xs font-bold uppercase text-slate-400">Homeowner</p><p className="mt-1 font-semibold">{item.account?.memberName || '-'}</p><p className="text-sm text-slate-500">{item.accountId}</p></div>
                    <div><p className="text-xs font-bold uppercase text-slate-400">Address</p><p className="mt-1 text-sm text-slate-700">{item.account?.neighborhood || '-'} Block {item.account?.block || '-'} Lot {item.account?.lot || '-'}</p></div>
                    <div className="sm:col-span-2"><p className="text-xs font-bold uppercase text-slate-400">Description</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.description}</p></div>

                    {item.kind === 'request' ? (
                        <div><p className="text-xs font-bold uppercase text-slate-400">Preferred Date</p><p className="mt-1 text-sm">{formatDate(item.preferredDate)}</p></div>
                    ) : (
                        <>
                            <div><p className="text-xs font-bold uppercase text-slate-400">Incident Date & Time</p><p className="mt-1 text-sm">{formatDate(item.incidentDate)} {item.incidentTime}</p></div>
                            <div><p className="text-xs font-bold uppercase text-slate-400">Location</p><p className="mt-1 text-sm">{item.location}</p></div>
                            <div className="sm:col-span-2">
                                <p className="text-xs font-bold uppercase text-slate-400">Evidence</p>
                                {item.evidenceAttachment ? (
                                    <a href={`${apiUrl}/uploads/complaints/${item.evidenceAttachment}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-bold text-rose-600 hover:underline">
                                        Open {item.evidenceOriginalName || 'attachment'}
                                    </a>
                                ) : <p className="mt-1 text-sm text-slate-500">No evidence attached.</p>}
                            </div>
                        </>
                    )}

                    <div><p className="text-xs font-bold uppercase text-slate-400">Submitted</p><p className="mt-1 text-sm">{formatDate(item.createdAt)}</p></div>
                    <div><p className="text-xs font-bold uppercase text-slate-400">Current Status</p><span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{item.status}</span></div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <label className="min-w-0 flex-1">
                                <span className="text-xs font-bold uppercase text-slate-500">Change Status</span>
                                <select
                                    id="admin-submission-status"
                                    name="adminSubmissionStatus"
                                    value={statusDraft}
                                    onChange={(event) => onStatusDraftChange(event.target.value)}
                                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#E89B58] focus:ring-2 focus:ring-orange-100"
                                >
                                    <option value="Under Review">Under Review</option>
                                    {item.kind === 'request' ? (
                                        <>
                                            <option value="Accepted">Accepted</option>
                                            <option value="Rejected">Rejected</option>
                                        </>
                                    ) : <option value="Resolved">Resolved</option>}
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={onSaveStatus}
                                disabled={statusUpdating || statusDraft === item.status}
                                className="rounded-lg bg-[#8C4100] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#6f3300] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {statusUpdating ? 'Saving...' : 'Save Status'}
                            </button>
                        </div>
                        {statusError && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{statusError}</p>}
                    </div>
                </div>
            </section>
        </div>
    );
}
