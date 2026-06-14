import {
    formatDate,
    requestReference,
} from './requestComplaintUtils.js';
import {
    ServiceIcon,
    StatusBadge,
    SubmissionIcon,
} from './SubmissionElements';

const services = [
    { title: 'Submit Request', description: 'Request permits, facilities or maintenance', tone: 'green', kind: 'request' },
    { title: 'File Complaint', description: 'Report violations or any concerns', tone: 'red', kind: 'complaint' },
];

export default function ServicesLanding({
    onOpenComplaint,
    onOpenDetails,
    onOpenRequest,
    recentSubmissions,
    submissionsLoading,
    successMessage,
}) {
    return (
        <div className="mx-auto w-full max-w-5xl px-3 pb-8 md:px-8 md:py-6">
            <section className="flex min-h-52 items-center overflow-hidden rounded-b-3xl bg-emerald-800 px-5 pb-16 pt-9 text-left text-white md:min-h-56 md:rounded-2xl md:px-8 md:pb-20 md:pt-10">
                <div>
                    <h2 className="text-2xl font-bold md:text-3xl">HOA Services</h2>
                    <p className="mt-1 text-sm text-emerald-100">How can we help you today?</p>
                </div>
            </section>

            <div className="-mt-12 space-y-3 px-1 md:-mt-14 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 md:px-5">
                {services.map((service) => (
                    <button
                        key={service.title}
                        type="button"
                        onClick={service.kind === 'request' ? onOpenRequest : onOpenComplaint}
                        className="flex w-full items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                    >
                        <ServiceIcon tone={service.tone}><SubmissionIcon kind={service.kind} /></ServiceIcon>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-slate-900">{service.title}</div>
                            <div className="mt-1 text-xs leading-5 text-slate-500">{service.description}</div>
                        </div>
                        <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ))}
            </div>

            {successMessage && <p role="status" className="mx-1 mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 md:mx-0">{successMessage}</p>}

            <section className="mt-7 px-1 md:px-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Recent Submissions</h3>
                    <button type="button" className="text-xs font-semibold text-slate-500 hover:text-emerald-700">See All</button>
                </div>

                <div className="mt-3 space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    {submissionsLoading && <p className="text-sm text-slate-500">Loading submissions...</p>}
                    {!submissionsLoading && recentSubmissions.length === 0 && <p className="text-sm text-slate-500">No submissions yet.</p>}
                    {recentSubmissions.map((submission) => (
                        <button
                            key={`${submission.submissionKind}-${submission.id}`}
                            type="button"
                            onClick={() => onOpenDetails(submission)}
                            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
                        >
                            <ServiceIcon tone={submission.submissionKind === 'complaint' ? 'red' : 'green'}>
                                <SubmissionIcon kind={submission.submissionKind} />
                            </ServiceIcon>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-bold text-slate-500">{requestReference(submission)}</div>
                                <div className="mt-1 text-xs font-semibold text-slate-900">{submission.complaintType || submission.requestType}</div>
                                <div className="mt-0.5 truncate text-[11px] text-slate-500">{submission.subject}</div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                                <StatusBadge status={submission.status} />
                                <span className="text-[10px] text-slate-400">
                                    {submission.createdAt ? formatDate(new Date(submission.createdAt)) : '-'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
