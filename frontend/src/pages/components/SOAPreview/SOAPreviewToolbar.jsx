export default function SOAPreviewToolbar({
    isExporting,
    onBack,
    onExportPdf,
}) {
    return (
        <div className="no-print flex items-center gap-2 border-b border-slate-100 px-4 py-3 md:border-0 md:px-4 md:pt-4">
            <button
                type="button"
                onClick={onBack}
                className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
                Back
            </button>
            <button
                type="button"
                onClick={onExportPdf}
                disabled={isExporting}
                className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
        </div>
    );
}
