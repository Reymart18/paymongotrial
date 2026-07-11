import jsPDF from 'jspdf';
import { formatDate, requestReference } from './requestComplaintUtils.js';
import { StatusBadge } from './SubmissionElements';

function DateValue({ value }) {
    return value ? formatDate(new Date(value)) : '-';
}

export default function SubmissionDetailsModal({ apiUrl, onClose, submission }) {
    if (!submission) return null;
    const isComplaint = submission.submissionKind === 'complaint';
    const referenceNumber = requestReference(submission);

    const addWrappedText = (doc, label, value, x, y, width) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, x, y);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value || '-', width);
        doc.text(lines, x, y + 14);
        return y + 18 + lines.length * 12;
    };

    const handleExportPdf = () => {
        const doc = new jsPDF('p', 'pt', 'a4');
        const margin = 48;
        const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
        let y = 54;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('HOA Submission Receipt', margin, y);
        y += 28;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reference: ${referenceNumber}`, margin, y);
        y += 16;
        doc.text(`Status: ${submission.status || '-'}`, margin, y);
        y += 16;
        doc.text(`Submitted: ${submission.createdAt ? formatDate(new Date(submission.createdAt)) : '-'}`, margin, y);
        y += 26;

        y = addWrappedText(doc, 'Type', submission.complaintType || submission.requestType, margin, y, contentWidth);
        y = addWrappedText(doc, 'Subject', submission.subject, margin, y, contentWidth);
        y = addWrappedText(doc, 'Description', submission.description, margin, y, contentWidth);

        if (isComplaint) {
            y = addWrappedText(doc, 'Location of Incident', submission.location, margin, y, contentWidth);
            y = addWrappedText(
                doc,
                'Incident Date and Time',
                `${submission.incidentDate ? formatDate(new Date(`${submission.incidentDate}T00:00:00`)) : '-'} ${submission.incidentTime || ''}`.trim(),
                margin,
                y,
                contentWidth,
            );
        } else {
            y = addWrappedText(
                doc,
                'Preferred Date',
                submission.preferredDate ? formatDate(new Date(`${submission.preferredDate}T00:00:00`)) : '-',
                margin,
                y,
                contentWidth,
            );
        }

        y = addWrappedText(
            doc,
            'HOA Reply',
            submission.adminReply || 'No reply message yet.',
            margin,
            y + 6,
            contentWidth,
        );

        if (submission.adminReplyAt) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`Reply date: ${formatDate(new Date(submission.adminReplyAt))}`, margin, y + 4);
        }

        doc.save(`${referenceNumber.toLowerCase()}-receipt.pdf`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
            <button type="button" aria-label="Close request details" onClick={onClose} className="absolute inset-0 bg-black/50" />
            <section className="relative z-10 w-full max-w-lg rounded-lg bg-white p-5 shadow-xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className={`text-xs font-bold ${isComplaint ? 'text-rose-600' : 'text-emerald-700'}`}>{referenceNumber}</p>
                        <h2 className="mt-1 text-xl font-bold text-slate-900">{submission.complaintType || submission.requestType}</h2>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={handleExportPdf} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                            Export PDF
                        </button>
                        <button type="button" aria-label="Close request details" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="mt-5 space-y-4">
                    <div><p className="text-xs font-semibold uppercase text-slate-500">Subject</p><p className="mt-1 text-sm font-medium text-slate-900">{submission.subject}</p></div>
                    <div><p className="text-xs font-semibold uppercase text-slate-500">Description</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.description}</p></div>

                    {isComplaint ? (
                        <>
                            <div><p className="text-xs font-semibold uppercase text-slate-500">Location of Incident</p><p className="mt-1 text-sm text-slate-700">{submission.location}</p></div>
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                <div><p className="text-xs font-semibold uppercase text-slate-500">Incident Date</p><p className="mt-1 text-sm text-slate-700"><DateValue value={submission.incidentDate ? `${submission.incidentDate}T00:00:00` : ''} /></p></div>
                                <div><p className="text-xs font-semibold uppercase text-slate-500">Incident Time</p><p className="mt-1 text-sm text-slate-700">{submission.incidentTime || '-'}</p></div>
                            </div>
                            {submission.evidenceAttachment && <a href={`${apiUrl}/uploads/complaints/${submission.evidenceAttachment}`} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-rose-600 hover:text-rose-700">View Evidence Attachment</a>}
                            <div className="border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase text-slate-500">Submitted</p><p className="mt-1 text-sm text-slate-700"><DateValue value={submission.createdAt} /></p></div>
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                            <div><p className="text-xs font-semibold uppercase text-slate-500">Preferred Date</p><p className="mt-1 text-sm text-slate-700"><DateValue value={submission.preferredDate ? `${submission.preferredDate}T00:00:00` : ''} /></p></div>
                            <div><p className="text-xs font-semibold uppercase text-slate-500">Submitted</p><p className="mt-1 text-sm text-slate-700"><DateValue value={submission.createdAt} /></p></div>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                        <StatusBadge status={submission.status} />
                    </div>
                    <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">HOA Reply</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {submission.adminReply || 'No reply message yet.'}
                        </p>
                        {submission.adminReplyAt && (
                            <p className="mt-2 text-xs text-slate-400">
                                Reply date: <DateValue value={submission.adminReplyAt} />
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
