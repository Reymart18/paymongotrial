import { requestTypes } from './requestComplaintUtils.js';

export default function RequestForm({
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
            <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-800">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to HOA Services
            </button>

            <div className="mb-6 md:mb-8 md:border-b md:border-slate-200 md:pb-6">
                <h2 className="text-2xl font-bold text-slate-900 md:text-4xl">Submit Request</h2>
                <p className="mt-2 text-sm text-slate-500">Provide the request details and your preferred service date.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid md:grid-cols-2 md:gap-x-7 md:gap-y-6 md:space-y-0 md:border-slate-100 md:p-9 md:shadow-lg md:shadow-slate-200/60">
                <div className="md:col-span-2">
                    <label htmlFor="requestType" className="mb-2 block text-sm font-semibold text-slate-700">Request Type</label>
                    <select id="requestType" name="requestType" value={form.requestType} onChange={onChange} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100">
                        <option value="">Select request type</option>
                        {requestTypes.map((requestType) => <option key={requestType} value={requestType}>{requestType}</option>)}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
                    <input id="subject" name="subject" type="text" value={form.subject} onChange={onChange} placeholder="Briefly describe your request" required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
                </div>

                <div>
                    <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                    <textarea id="description" name="description" value={form.description} onChange={onChange} placeholder="Add the details the HOA office should know" rows={5} required className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
                </div>

                <div>
                    <label htmlFor="preferredDate" className="mb-2 block text-sm font-semibold text-slate-700">Preferred Date</label>
                    <input id="preferredDate" name="preferredDate" type="date" min={today} value={form.preferredDate} onChange={onChange} required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
                </div>

                {formError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 md:col-span-2">{formError}</p>}
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2 md:justify-self-end md:px-10 lg:w-auto">
                    {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
            </form>
        </div>
    );
}
