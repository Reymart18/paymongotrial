export default function AccountsReportModal({
    show,
    onClose,
    onPrint,
    title,
    subtitle,
    items,
    billingLabel,
    amountHeader,
    amountClassName,
    emptyMessage,
    printClassName = '',
    tablePrintClassName = '',
    showGrandTotal = false,
    formatDate,
    formatMoney,
}) {
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 no-print" onClick={onClose} />
            <div className={`relative z-10 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl${printClassName ? ` ${printClassName}` : ''}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        <p className="text-xs text-slate-500">{subtitle}</p>
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

                <div className={`mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100${tablePrintClassName ? ` ${tablePrintClassName}` : ''}`}>
                    <table className="min-w-full divide-y divide-slate-100 text-xs md:text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Account ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Neighborhood</th>
                                <th className="px-4 py-3">Block</th>
                                <th className="px-4 py-3">Lot</th>
                                <th className="px-4 py-3">{amountHeader}</th>
                                <th className="px-4 py-3">Last Payment</th>
                                <th className="px-4 py-3">Current Billing</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="px-4 py-6 text-center text-slate-400">
                                        {emptyMessage}
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
                                    <td className={`px-4 py-3 ${amountClassName}`}>
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
                {showGrandTotal && (
                    <div className="mt-4 flex justify-end text-sm font-semibold text-slate-700">
                        Grand Total: PHP {formatMoney(items.reduce((sum, item) => sum + Number(item.amountDue || 0), 0))}
                    </div>
                )}
            </div>
        </div>
    );
}
