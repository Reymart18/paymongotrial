export default function AccountInfo({
    account,
    accountId,
    lotSizeLabel,
    soaPrefix,
    soaValueLabel,
    billingDate,
    dueDate,
    duesRate,
    formatDate,
}) {
    return (
        <div className="mx-auto mt-3 md:mt-6 max-w-[1060px] px-3 md:px-0 text-[9px] md:text-[10px] text-slate-900">
            <div className="flex items-baseline justify-between gap-4 mb-3">
                <div className="flex-1" />
                <div className="flex items-baseline gap-1">
                    <span className="text-xs md:text-sm font-medium text-slate-500">
                        {soaPrefix}
                    </span>
                    <span className="text-sm md:text-base font-extrabold text-slate-900">
                        {soaValueLabel}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Name:
                    </span>
                    <span className="flex-1 border-b border-slate-900 pb-0.5 text-[11px] md:text-[12px] font-semibold">
                        {account?.memberName || ''}
                    </span>
                </div>
                <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Lot No/HOA ID:
                    </span>
                    <span className="flex-1 border-b border-slate-900 pb-0.5 text-[11px] md:text-[12px] font-semibold">
                        {accountId || ''}
                    </span>
                </div>

                <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Lot Size:
                    </span>
                    <span className="flex-1 border-b border-slate-900 pb-0.5 text-[11px] md:text-[12px] font-semibold">
                        {lotSizeLabel}
                    </span>
                </div>
                <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Billing Date:
                    </span>
                    <span className="flex-1 border-b border-slate-900 pb-0.5 text-[11px] md:text-[12px] font-semibold">
                        {formatDate(billingDate)}
                    </span>
                </div>

                <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Due Date:
                    </span>
                    <span className="flex-1 border-b border-slate-900 pb-0.5 text-[11px] md:text-[12px] font-semibold">
                        {formatDate(dueDate)}
                    </span>
                </div>
                <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Dues Rate:
                    </span>
                    <span className="flex-1 border-b border-slate-900 pb-0.5 text-[11px] md:text-[12px] font-semibold">
                        {Number.isFinite(duesRate) ? duesRate.toFixed(2) : '-'}
                    </span>
                </div>
            </div>
        </div>
    );
}
