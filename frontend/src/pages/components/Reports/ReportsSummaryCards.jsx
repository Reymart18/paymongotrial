const ComparisonText = ({ value, formatPercent }) => {
    const hasComparison = typeof value === 'number';
    const isPositive = hasComparison && value > 0;
    const isNegative = hasComparison && value < 0;

    return (
        <p className={`mt-2 text-xs text-center ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-slate-500'}`}>
            vs previous quarter: <span className="font-semibold">{formatPercent(value)}</span>
        </p>
    );
};

export default function ReportsSummaryCards({
    comparison,
    totals,
    loading,
    outstandingLoading,
    outstandingTotal,
    outstandingReportLoading,
    quarterDueLoading,
    quarterDueError,
    outstandingError,
    onGenerateQuarterDue,
    onGenerateOutstanding,
    formatMoney,
    formatPercent,
    icons,
}) {
    const cards = [
        {
            title: 'Total Billed (This Quarter)',
            value: totals.billed,
            comparison: comparison.billedPercent,
            icon: icons.cbIcon,
        },
        {
            title: 'Total Collected (This Quarter)',
            value: totals.collected,
            comparison: comparison.collectedPercent,
            icon: icons.toIcon,
        },
        {
            title: 'Net Collection (This Quarter)',
            value: totals.outstanding,
            comparison: comparison.outstandingPercent,
            compareMode: 'inverse',
            icon: icons.rpIcon,
            action: {
                onClick: onGenerateQuarterDue,
                loading: quarterDueLoading,
                loadingLabel: 'Generating...',
                label: 'Generate Report',
            },
            error: quarterDueError,
        },
        {
            title: 'Total Outstanding (As of Today)',
            value: outstandingTotal,
            hideComparison: true,
            icon: icons.rpIcon,
            action: {
                onClick: onGenerateOutstanding,
                loading: outstandingReportLoading,
                loadingLabel: 'Generating...',
                label: 'Generate Report',
            },
            error: outstandingError,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cards.map((card) => {
                const adjustedComparison = card.compareMode === 'inverse' && typeof card.comparison === 'number'
                    ? -card.comparison
                    : card.comparison;

                return (
                    <div
                        key={card.title}
                        className="relative rounded-2xl border border-slate-200 bg-white p-6 pt-10 shadow-sm transition hover:shadow-md"
                    >
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white shadow-md border-2 border-[#E89B58]/33">
                                <img src={card.icon} alt="" className="h-7 w-7" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600 whitespace-nowrap">{card.title}</p>
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-slate-900 text-center">
                            {loading || outstandingLoading ? 'Loading...' : (
                                <div className="flex flex-col">
                                    <span className="text-2xl text-gray-700">PHP</span>
                                    <span className="text-2xl font-bold">
                                        {formatMoney(card.value)}
                                    </span>
                                    {card.action && (
                                        <button
                                            type="button"
                                            onClick={card.action.onClick}
                                            disabled={card.action.loading}
                                            className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition bg-amber-50 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {card.action.loading ? card.action.loadingLabel : card.action.label}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        {!card.hideComparison && (
                            <ComparisonText value={adjustedComparison} formatPercent={formatPercent} />
                        )}
                        {card.error && (
                            <p className="mt-2 text-xs text-center text-rose-600">{card.error}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
