export default function StandingReportModal({
    show,
    onClose,
    onPrint,
    items,
    status,
    onStatusChange,
    filter,
    onFilterChange,
    billingLabel,
    billingAsOf,
    formatDate,
    formatMoney,
}) {
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 no-print" onClick={onClose} />
            <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            {status === 'good' ? 'In Good Standing' : 'Not In Good Standing'}
                        </h2>
                        <p className="text-xs text-slate-500">
                            Amount Due / Excess as of {billingAsOf}.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                            <select
                                value={status}
                                onChange={(event) => onStatusChange(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                            >
                                <option value="not">Not In Good Standing</option>
                                <option value="good">In Good Standing</option>
                            </select>
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Classification
                            <select
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

                <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100">
                    <table className="min-w-full divide-y divide-slate-100 text-xs md:text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Account ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Neighborhood</th>
                                <th className="px-4 py-3">Block</th>
                                <th className="px-4 py-3">Lot</th>
                                <th className="px-4 py-3">Amount Due</th>
                                <th className="px-4 py-3">Last Payment</th>
                                <th className="px-4 py-3">Current Billing</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="px-4 py-6 text-center text-slate-400">
                                        No not-in-good-standing accounts found.
                                    </td>
                                </tr>
                            )}
                            {items.map((item, index) => (
                                <tr key={`${item.accountId}-${index}`}>
                                    <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-700">
                                        {item.accountId || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.memberName || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.neighborhood || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.block || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.lot || '-'}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-rose-600">
                                        PHP {formatMoney(item.amountDue || 0)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {formatDate(item.lastPaymentDate)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {billingLabel || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end text-sm font-semibold text-slate-700">
                    Grand Total: PHP {formatMoney(
                        items.reduce(
                            (sum, item) => sum + Number(item.amountDue || 0),
                            0,
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}
