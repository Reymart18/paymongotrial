import jsPDF from 'jspdf';
import { formatDate, reference, statusClass } from './requestComplaintUtils';

export default function SubmissionDetailsModal({
    apiUrl,
    item,
    onClose,
    onReplyDraftChange,
    onSaveStatus,
    onStatusDraftChange,
    replyDraft,
    statusDraft,
    statusError,
    statusUpdating,
}) {
    if (!item) return null;
    const referenceNumber = reference(item, item.kind);
    const isComplaint = item.kind === 'complaint';
    const displayStatus = statusDraft || item.status || '-';
    const displayReply = replyDraft.trim() || item.adminReply || 'No reply message yet.';
    const address = `${item.account?.neighborhood || '-'} Block ${item.account?.block || '-'} Lot ${item.account?.lot || '-'}`;
    const isUnchanged =
        statusDraft === item.status &&
        replyDraft.trim() === String(item.adminReply || '').trim();

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
        let y = 0;

        const setText = (color = colors.ink) => doc.setTextColor(...color);
        const footer = () => {
            doc.setDrawColor(...colors.border);
            doc.line(margin, pageHeight - 48, pageWidth - margin, pageHeight - 48);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            setText(colors.muted);
            doc.text('Admin copy generated from the HOA Portal submissions module.', margin, pageHeight - 31);
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
            doc.text('Admin Submission Record', margin, 72);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(isComplaint ? 'Complaint review record and office reply' : 'Request review record and office reply', margin, 94);

            doc.setFillColor(255, 255, 255);
            doc.roundedRect(pageWidth - margin - 154, 38, 154, 46, 7, 7, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...colors.muted);
            doc.text('CURRENT STATUS', pageWidth - margin - 138, 56);
            doc.setFontSize(12);
            doc.setTextColor(...colors.brand);
            doc.text(displayStatus.toUpperCase(), pageWidth - margin - 138, 74, { maxWidth: 122 });

            y = 148;
        };
        const drawMetaCard = () => {
            const cardHeight = 126;
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...colors.border);
            doc.roundedRect(margin, y, contentWidth, cardHeight, 8, 8, 'FD');
            doc.setFillColor(...colors.brandSoft);
            doc.roundedRect(margin + 14, y + 18, 132, 48, 6, 6, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...colors.muted);
            doc.text('REFERENCE NUMBER', margin + 28, y + 36);
            doc.setFontSize(14);
            doc.setTextColor(...colors.brand);
            doc.text(referenceNumber, margin + 28, y + 58);

            const metaStart = margin + 172;
            const metaWidth = (contentWidth - 194) / 2;
            const meta = [
                ['Submission Type', isComplaint ? 'Complaint' : 'Request'],
                ['Submitted', formatDate(item.createdAt)],
                ['Homeowner', item.account?.memberName || '-'],
                ['Account ID', item.accountId || '-'],
                ['Address', address],
                ['Exported', formatDate(new Date())],
            ];

            meta.forEach(([label, value], index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const x = metaStart + col * metaWidth;
                const rowY = y + 29 + row * 34;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(...colors.muted);
                doc.text(label.toUpperCase(), x, rowY);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(...colors.ink);
                doc.text(value || '-', x, rowY + 14, { maxWidth: metaWidth - 14 });
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
            { label: 'Type', value: item.requestType || item.complaintType },
            { label: 'Subject', value: item.subject, large: true },
            { label: 'Description', value: item.description, large: true },
        ]);
        drawSection(isComplaint ? 'Incident Information' : 'Request Schedule', isComplaint ? [
            { label: 'Incident Date and Time', value: `${formatDate(item.incidentDate)} ${item.incidentTime || ''}`.trim() },
            { label: 'Location', value: item.location },
            { label: 'Evidence Attachment', value: item.evidenceOriginalName || (item.evidenceAttachment ? 'Attached' : 'No evidence attached') },
        ] : [
            { label: 'Preferred Date', value: formatDate(item.preferredDate) },
        ]);
        drawSection('HOA Office Update', [
            { label: 'Status', value: displayStatus },
            { label: 'Reply Message', value: displayReply, large: true },
            { label: 'Saved Reply Date', value: item.adminReplyAt ? formatDate(item.adminReplyAt) : 'Not saved yet' },
        ]);
        footer();

        doc.save(`${referenceNumber.toLowerCase()}-admin-record.pdf`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
            <button type="button" aria-label="Close details" className="absolute inset-0 bg-black/50" onClick={onClose} />
            <section className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl md:p-10">
                <div className="flex items-start justify-between gap-5 border-b border-slate-200 pb-7">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-bold uppercase text-[#8C4100]">{referenceNumber}</p>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(item.status)}`}>{item.status}</span>
                        </div>
                        <h2 className="mt-2 text-xl font-bold">{item.requestType || item.complaintType}</h2>
                        <p className="mt-1 text-sm text-slate-500">{item.subject}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={handleExportPdf} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                            Export PDF
                        </button>
                        <button type="button" aria-label="Close details" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
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
                        <div className="space-y-4">
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
                            <label className="block">
                                <span className="text-xs font-bold uppercase text-slate-500">Reply Message to Homeowner</span>
                                <textarea
                                    id="admin-submission-reply"
                                    name="adminSubmissionReply"
                                    value={replyDraft}
                                    onChange={(event) => onReplyDraftChange(event.target.value)}
                                    rows={5}
                                    maxLength={2000}
                                    placeholder="Add the office reply, instructions, or resolution notes shown to the homeowner."
                                    className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#E89B58] focus:ring-2 focus:ring-orange-100"
                                />
                                <span className="mt-1 block text-right text-xs text-slate-400">{replyDraft.length}/2000</span>
                            </label>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={onSaveStatus}
                                    disabled={statusUpdating || isUnchanged}
                                    className="rounded-lg bg-[#8C4100] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#6f3300] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {statusUpdating ? 'Saving...' : 'Save Update'}
                                </button>
                            </div>
                        </div>
                        {statusError && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{statusError}</p>}
                    </div>
                </div>
            </section>
        </div>
    );
}
