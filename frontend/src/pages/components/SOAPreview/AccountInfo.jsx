export default function AccountInfo({
    account,
    accountId,
    lotSizeLabel,
    billingDate,
    formatDate,
    onExportPdf,
    isExporting,
}) {
    return (
        <div className="mx-auto mt-6 max-w-[1060px] space-y-1 text-[10px] text-slate-900">
            <div className="flex items-baseline gap-2">
                <span className="w-28 uppercase tracking-[0.18em] text-[9px] text-slate-500">
                    Name:
                </span>
                <span className="min-w-[240px] border-b border-slate-900 pb-0.5 text-[12px] font-semibold">
                    {account?.memberName || ''}
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="w-28 uppercase tracking-[0.18em] text-[9px] text-slate-500">
                    Lot No/HOA ID:
                </span>
                <span className="min-w-[240px] border-b border-slate-900 pb-0.5 text-[12px] font-semibold">
                    {accountId || ''}
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="w-28 uppercase tracking-[0.18em] text-[9px] text-slate-500">
                    Lot Size:
                </span>
                <span className="min-w-[240px] border-b border-slate-900 pb-0.5 text-[12px] font-semibold">
                    {lotSizeLabel}
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="w-28 uppercase tracking-[0.18em] text-[9px] text-slate-500">
                    Billing Date:
                </span>
                <div className="flex flex-1 items-center justify-between gap-4">
                    <span className="min-w-[240px] border-b border-slate-900 pb-0.5 text-[12px] font-semibold">
                        {formatDate(billingDate)}
                    </span>
                    {onExportPdf && (
                        <button
                            type="button"
                            onClick={onExportPdf}
                            disabled={isExporting}
                            className="no-print rounded-md border border-slate-200 px-3 py-1 text-[13px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
