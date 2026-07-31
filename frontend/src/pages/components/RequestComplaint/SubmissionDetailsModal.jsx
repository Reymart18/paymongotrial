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
    const memberName = submission.memberName || submission.account?.memberName || '-';

    const handleExportPdf = () => {
        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 48;
        const contentWidth = pageWidth - margin * 2;
        const colors = {
            ink: [15, 23, 42],
            muted: [100, 116, 139],
            border: [226, 232, 240],
            soft: [248, 250, 252],
            brand: isComplaint ? [159, 18, 57] : [6, 95, 70],
            brandDark: isComplaint ? [136, 19, 55] : [4, 78, 56],
            brandSoft: isComplaint ? [255, 241, 242] : [236, 253, 245],
        };
        const status = submission.status || '-';
        let y = 0;

        const setText = (color = colors.ink) => doc.setTextColor(...color);
        const formatOptionalDate = (value) => (value ? formatDate(new Date(value)) : '-');
        const footer = () => {
            doc.setDrawColor(...colors.border);
            doc.line(margin, pageHeight - 48, pageWidth - margin, pageHeight - 48);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            setText(colors.muted);
            doc.text('This PDF confirms that the submission was recorded in the HOA Portal.', margin, pageHeight - 31);
            doc.text(`Generated ${formatDate(new Date())}`, pageWidth - margin, pageHeight - 31, { align: 'right' });
        };
        const newPageIfNeeded = (neededHeight) => {
            if (y + neededHeight <= pageHeight - 70) return;
            footer();
            doc.addPage();
            y = margin;
        };
        const wrappedHeight = (value, width, lineHeight = 12) => (
            doc.splitTextToSize(value || '-', width).length * lineHeight
        );
        const drawHeader = () => {
            doc.setFillColor(...colors.brandDark);
            doc.rect(0, 0, pageWidth, 118, 'F');
            doc.setFillColor(...colors.brand);
            doc.rect(0, 0, pageWidth, 12, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(209, 250, 229);
            doc.text('Parkplace Village Homeowners Association Inc.', margin, 44);
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.text('Submission Receipt', margin, 72);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(isComplaint ? 'Complaint acknowledgement and HOA response' : 'Request acknowledgement and HOA response', margin, 94);

            doc.setFillColor(255, 255, 255);
            doc.roundedRect(pageWidth - margin - 154, 38, 154, 46, 7, 7, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...colors.muted);
            doc.text('CURRENT STATUS', pageWidth - margin - 138, 56);
            doc.setFontSize(12);
            doc.setTextColor(...colors.brand);
            doc.text(status.toUpperCase(), pageWidth - margin - 138, 74, { maxWidth: 122 });

            y = 148;
        };
        const drawMetaCard = () => {
            const cardHeight = 148;
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...colors.border);
            doc.roundedRect(margin, y, contentWidth, cardHeight, 8, 8, 'FD');
            doc.setFillColor(...colors.brandSoft);
            doc.roundedRect(margin + 14, y + 18, 128, 54, 6, 6, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...colors.muted);
            doc.text('REFERENCE NUMBER', margin + 28, y + 35);
            doc.setFontSize(14);
            doc.setTextColor(...colors.brand);
            doc.text(referenceNumber, margin + 28, y + 55);

            const metaStart = margin + 172;
            const metaWidth = (contentWidth - 194) / 2;
            const meta = [
                ['Submission Type', isComplaint ? 'Complaint' : 'Request'],
                ['Submitted', formatOptionalDate(submission.createdAt)],
                ['Account ID', submission.accountId || '-'],
                ['Member Name', memberName],
                ['Status', status],
                ['Receipt Generated', formatDate(new Date())],
            ];

            meta.forEach(([label, value], index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const x = metaStart + col * metaWidth;
                const rowY = y + 31 + row * 42;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(...colors.muted);
                doc.text(label.toUpperCase(), x, rowY);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(...colors.ink);
                doc.text(value || '-', x, rowY + 16, { maxWidth: metaWidth - 14 });
            });

            y += cardHeight + 18;
        };
        const drawSection = (title, fields) => {
            doc.setFontSize(10);
            const innerWidth = contentWidth - 36;
            const fieldHeights = fields.map((field) => 25 + wrappedHeight(field.value, innerWidth, 12));
            const sectionHeight = 46 + fieldHeights.reduce((sum, height) => sum + height, 0);
            newPageIfNeeded(sectionHeight);

            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...colors.border);
            doc.roundedRect(margin, y, contentWidth, sectionHeight, 8, 8, 'FD');
            doc.setFillColor(...colors.soft);
            doc.roundedRect(margin, y, contentWidth, 34, 8, 8, 'F');
            doc.setFillColor(...colors.soft);
            doc.rect(margin, y + 20, contentWidth, 14, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(...colors.ink);
            doc.text(title.toUpperCase(), margin + 18, y + 22);

            let rowY = y + 56;
            fields.forEach((field, index) => {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(...colors.muted);
                doc.text(field.label.toUpperCase(), margin + 18, rowY);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(field.large ? 11 : 10);
                doc.setTextColor(...colors.ink);
                const lines = doc.splitTextToSize(field.value || '-', innerWidth);
                doc.text(lines, margin + 18, rowY + 15);
                rowY += fieldHeights[index];
            });

            y += sectionHeight + 16;
        };

        drawHeader();
        drawMetaCard();
        drawSection('Submission Details', [
            { label: 'Type', value: submission.complaintType || submission.requestType },
            { label: 'Subject', value: submission.subject, large: true },
            { label: 'Description', value: submission.description, large: true },
        ]);
        drawSection(isComplaint ? 'Incident Information' : 'Request Schedule', isComplaint ? [
            { label: 'Location of Incident', value: submission.location },
            {
                label: 'Incident Date and Time',
                value: `${submission.incidentDate ? formatDate(new Date(`${submission.incidentDate}T00:00:00`)) : '-'} ${submission.incidentTime || ''}`.trim(),
            },
            {
                label: 'Evidence Attachment',
                value: submission.evidenceOriginalName || (submission.evidenceAttachment ? 'Attached' : 'No evidence attached'),
            },
        ] : [
            {
                label: 'Preferred Date',
                value: submission.preferredDate ? formatDate(new Date(`${submission.preferredDate}T00:00:00`)) : '-',
            },
        ]);
        drawSection('HOA Office Reply', [
            { label: 'Reply Message', value: submission.adminReply || 'No reply message yet.', large: true },
            { label: 'Reply Date', value: formatOptionalDate(submission.adminReplyAt) },
        ]);
        footer();

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
