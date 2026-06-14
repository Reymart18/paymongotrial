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
        <div className="mx-auto mt-5 max-w-[1060px] px-4 text-[9px] text-slate-900 md:mt-6 md:px-0 md:text-[10px]">
            <div className="mb-4 flex flex-wrap items-baseline justify-end gap-x-1 gap-y-0.5 md:mb-3 md:flex-nowrap md:justify-between md:gap-4">
                <div className="flex-1" />
                <div className="flex flex-wrap items-baseline justify-end gap-1 text-right">
                    <span className="text-xs md:text-sm font-medium text-slate-500">
                        {soaPrefix}
                    </span>
                    <span className="text-sm md:text-base font-extrabold text-slate-900">
                        {soaValueLabel}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3 md:gap-x-6 md:gap-y-2">
                <div className="flex min-w-0 items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Name:
                    </span>
                    <span className="min-w-0 flex-1 break-words border-b border-slate-900 pb-0.5 text-[11px] font-semibold md:text-[12px]">
                        {account?.memberName || ''}
                    </span>
                </div>
                <div className="flex min-w-0 items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Lot No/HOA ID:
                    </span>
                    <span className="min-w-0 flex-1 break-words border-b border-slate-900 pb-0.5 text-[11px] font-semibold md:text-[12px]">
                        {accountId || ''}
                    </span>
                </div>

                <div className="flex min-w-0 items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Lot Size:
                    </span>
                    <span className="min-w-0 flex-1 break-words border-b border-slate-900 pb-0.5 text-[11px] font-semibold md:text-[12px]">
                        {lotSizeLabel}
                    </span>
                </div>
                <div className="flex min-w-0 items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Billing Date:
                    </span>
                    <span className="min-w-0 flex-1 break-words border-b border-slate-900 pb-0.5 text-[11px] font-semibold md:text-[12px]">
                        {formatDate(billingDate)}
                    </span>
                </div>

                <div className="flex min-w-0 items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Due Date:
                    </span>
                    <span className="min-w-0 flex-1 break-words border-b border-slate-900 pb-0.5 text-[11px] font-semibold md:text-[12px]">
                        {formatDate(dueDate)}
                    </span>
                </div>
                <div className="flex min-w-0 items-baseline gap-1 md:gap-2">
                    <span className="uppercase tracking-[0.15em] text-[8px] md:text-[9px] text-slate-500 min-w-fit">
                        Dues Rate:
                    </span>
                    <span className="min-w-0 flex-1 break-words border-b border-slate-900 pb-0.5 text-[11px] font-semibold md:text-[12px]">
                        {Number.isFinite(duesRate) ? duesRate.toFixed(2) : '-'}
                    </span>
                </div>
            </div>
        </div>
    );
}
