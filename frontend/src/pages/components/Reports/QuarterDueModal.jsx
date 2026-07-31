export default function QuarterDueModal({
    items,
    year,
    quarter,
    filter,
    onFilterChange,
    amountFilter,
    onAmountFilterChange,
    onPrint,
    onClose,
    formatDate,
    formatMoney,
}) {
    const totalCollectibles = items.reduce((sum, item) => {
        const currentCharges = Number(item.currentChargesTotal || 0);
        const amountDue = Number(item.amountDue || 0);
        const collectibles = Math.max(0, Math.min(amountDue, currentCharges));
        return sum + collectibles;
    }, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 no-print" onClick={onClose} />
            <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Net Collection (This Quarter)</h2>
                        <p className="text-xs text-slate-500">Quarter: Q{quarter} {year}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Classification
                            <select
                                id="quarter-due-classification-filter"
                                name="quarterDueClassificationFilter"
                                value={filter}
                                onChange={(event) => onFilterChange(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                            >
                                <option value="ALL">All</option>
                                <option value="HOMEOWNER">Homeowner</option>
                                <option value="LOT OWNER">Lot Owner</option>
                            </select>
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Amount Due
                            <select
                                id="quarter-due-amount-filter"
                                name="quarterDueAmountFilter"
                                value={amountFilter}
                                onChange={(event) => onAmountFilterChange(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                            >
                                <option value="ALL">All</option>
                                <option value="AMOUNT_DUE_10000_PLUS">PHP 10,000 and above</option>
                            </select>
                        </label>
                    </div>
                    <div className="flex flex-wrap gap-2 no-print">
                        <button
                            onClick={onPrint}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100">
                    <table className="min-w-full divide-y divide-slate-100 text-xs md:text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Account ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Address</th>
                                <th className="px-4 py-3">Previous Balance</th>
                                <th className="px-4 py-3">Total Current Charges</th>
                                <th className="px-4 py-3">Amount Due</th>
                                <th className="px-4 py-3">Last Payment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-4 py-6 text-center text-slate-400">
                                        No matching accounts found.
                                    </td>
                                </tr>
                            )}
                            {items.map((item, index) => {
                                const address = [item.neighborhood, item.block, item.lot]
                                    .filter(Boolean)
                                    .join(' ');
                                return (
                                    <tr key={`${item.accountId}-${index}`}>
                                        <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-700">{item.accountId || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.memberName || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{address || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">PHP {formatMoney(item.balanceTotal || 0)}</td>
                                        <td className="px-4 py-3 text-slate-600">PHP {formatMoney(item.currentChargesTotal || 0)}</td>
                                        <td className="px-4 py-3 font-semibold text-rose-600">PHP {formatMoney(item.amountDue || 0)}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatDate(item.lastPaymentDate)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex flex-col items-end gap-1 text-sm font-semibold text-slate-700">
                    <div>
                        Total Collectibles (This Quarter): PHP {formatMoney(totalCollectibles)}
                    </div>
                </div>
            </div>
        </div>
    );
}
