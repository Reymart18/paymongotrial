import { complaintTypes } from './requestComplaintUtils.js';

export default function ComplaintForm({
    form,
    formError,
    onBack,
    onChange,
    onSubmit,
    submitting,
    today,
}) {
    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-10 md:py-12">
            <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-rose-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to HOA Services
            </button>

            <div className="mb-6 md:mb-8 md:border-b md:border-slate-200 md:pb-6">
                <h2 className="text-2xl font-bold text-slate-900 md:text-4xl">File Complaint</h2>
                <p className="mt-2 text-sm text-slate-500">Provide the incident details for HOA review.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid md:grid-cols-2 md:gap-x-7 md:gap-y-6 md:space-y-0 md:border-slate-100 md:p-9 md:shadow-lg md:shadow-slate-200/60">
                <div className="md:col-span-2">
                    <label htmlFor="complaintType" className="mb-2 block text-sm font-semibold text-slate-700">Complaint Type</label>
                    <select id="complaintType" name="complaintType" value={form.complaintType} onChange={onChange} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-100">
                        <option value="">Select complaint type</option>
                        {complaintTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="complaintSubject" className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
                    <input id="complaintSubject" name="subject" value={form.subject} onChange={onChange} placeholder="Briefly describe the complaint" required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-100" />
                </div>

                <div>
                    <label htmlFor="complaintDescription" className="mb-2 block text-sm font-semibold text-slate-700">Complaint Description</label>
                    <textarea id="complaintDescription" name="description" value={form.description} onChange={onChange} rows={5} placeholder="Describe what happened" required className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-100" />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:col-span-2">
                    <div>
                        <label htmlFor="incidentDate" className="mb-2 block text-sm font-semibold text-slate-700">Incident Date</label>
                        <input id="incidentDate" name="incidentDate" type="date" max={today} value={form.incidentDate} onChange={onChange} required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-100" />
                    </div>
                    <div>
                        <label htmlFor="incidentTime" className="mb-2 block text-sm font-semibold text-slate-700">Incident Time</label>
                        <input id="incidentTime" name="incidentTime" type="time" value={form.incidentTime} onChange={onChange} required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-100" />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="location" className="mb-2 block text-sm font-semibold text-slate-700">Location of Incident</label>
                    <input id="location" name="location" value={form.location} onChange={onChange} placeholder="Where did the incident happen?" required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-100" />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="evidence" className="mb-2 block text-sm font-semibold text-slate-700">Evidence Attachment</label>
                    <input id="evidence" name="evidence" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={onChange} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:font-semibold file:text-rose-700" />
                    <p className="mt-1 text-xs text-slate-500">Optional. JPG, PNG, WEBP, or PDF up to 10 MB.</p>
                </div>

                {formError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 md:col-span-2">{formError}</p>}
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2 md:justify-self-end md:px-10 lg:w-auto">
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
            </form>
        </div>
    );
}
