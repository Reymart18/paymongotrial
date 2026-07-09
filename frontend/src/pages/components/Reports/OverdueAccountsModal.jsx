export default function OverdueAccountsModal({
    items,
    total,
    filter,
    onFilterChange,
    onPrint,
    onClose,
    formatDate,
    formatMoney,
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 no-print" onClick={onClose} />
            <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl print-overdue">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Overdue Accounts</h2>
                        <p className="text-xs text-slate-500">Amount due/excess as of latest billing. Equivalent to 12 months' amount due.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Classification
                            <select
                                id="overdue-accounts-classification-filter"
                                name="overdueAccountsClassificationFilter"
                                value={filter}
                                onChange={(event) => onFilterChange(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                            >
                                <option value="ALL">All</option>
                                <option value="HOMEOWNER">Homeowner</option>
                                <option value="LOT OWNER">Lot Owner</option>
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

                <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100 print-overdue-table">
                    <table className="min-w-full divide-y divide-slate-100 text-xs md:text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Account ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Address</th>
                                <th className="px-4 py-3">Last Payment</th>
                                <th className="px-4 py-3">Amount Due / Excess</th>
                                <th className="px-4 py-3">Current Billing</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-4 py-6 text-center text-slate-400">
                                        No overdue accounts found.
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
                                        <td className="px-4 py-3 text-slate-600">{formatDate(item.lastPaymentDate)}</td>
                                        <td className="px-4 py-3 text-slate-600">PHP {formatMoney(item.amountDue || 0)}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatDate(item.latestBillingDate)}</td>
                                    </tr>
                                );
                            })}
                            {items.length > 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-3 text-right font-semibold text-slate-700">
                                        Grand Total
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-900">
                                        {formatMoney(total)}
                                    </td>
                                    <td className="px-4 py-3"></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
