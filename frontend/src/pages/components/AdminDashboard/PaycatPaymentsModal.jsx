export default function PaycatPaymentsModal({
    show,
    onClose,
    onPrint,
    items,
    selectedPaycat,
    billingLabel,
    formatDate,
    formatMoney,
}) {
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 no-print" onClick={onClose} />
            <div className="relative z-10 w-full max-w-6xl rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Payments - {selectedPaycat || '-'}</h2>
                        <p className="text-xs text-slate-500">Current billing period: {billingLabel || '-'}</p>
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
                                <th className="px-4 py-3">Member Name</th>
                                <th className="px-4 py-3">Payment Date</th>
                                <th className="px-4 py-3">Amount Paid</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">OR#</th>
                                <th className="px-4 py-3">Pay Category</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-4 py-6 text-center text-slate-400">
                                        No payments found.
                                    </td>
                                </tr>
                            )}
                            {items.map((item, index) => (
                                <tr key={`${item.accountId}-${item.referenceNumber || index}`}>
                                    <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-700">
                                        {item.accountId || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.memberName || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {formatDate(item.paymentDate)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        PHP {formatMoney(item.amountPaid || 0)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.description || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.referenceNumber || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.paycat || selectedPaycat || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
