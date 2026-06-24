export default function WaterPreviewToolbar({
    isExporting,
    onBack,
    onExportPdf,
    onSelectBilling,
    selectedBilling,
    selectedBillingId,
    waterBillings,
}) {
    return (
        <div className="no-print flex items-center gap-2 px-4 py-3 md:px-4 md:pt-4">
            <button
                type="button"
                onClick={onBack}
                className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
                Back
            </button>
            {waterBillings.length > 1 && (
                <select
                    value={selectedBillingId}
                    onChange={(event) => onSelectBilling(event.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 outline-none transition focus:border-indigo-300"
                >
                    {waterBillings.map((billing) => (
                        <option key={billing.id} value={billing.id}>
                            {billing.billingPeriod || `Billing ${billing.id}`}
                        </option>
                    ))}
                </select>
            )}
            <button
                type="button"
                onClick={onExportPdf}
                disabled={!selectedBilling || isExporting}
                className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
        </div>
    );
}
