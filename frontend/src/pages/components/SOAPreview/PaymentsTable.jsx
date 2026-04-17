export default function PaymentsTable({ paymentRows, formatDate, formatMoney }) {
    return (
        <div className="mt-2 overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full border-collapse text-xs md:text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                        <th className="px-2 md:px-3 py-2 text-left">OR#</th>
                        <th className="px-2 md:px-3 py-2 text-left">OR Date</th>
                        <th className="px-2 md:px-3 py-2 text-left">From-To</th>
                        <th className="px-2 md:px-3 py-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="text-slate-900">
                    {paymentRows.length === 0 && (
                        <tr>
                            <td className="px-3 py-3 text-center text-sm text-slate-500" colSpan={4}>
                                No payments recorded.
                            </td>
                        </tr>
                    )}
                    {paymentRows.map((row) => (
                        <tr key={`${row.date}-${row.description}`} className="border-t border-slate-100">
                            <td className="px-2 md:px-3 py-2 text-xs md:text-sm">{row.referenceNumber || '-'}</td>
                            <td className="px-2 md:px-3 py-2 text-xs md:text-sm">{formatDate(row.date)}</td>
                            <td className="px-2 md:px-3 py-2 text-xs md:text-sm">{row.description || '-'}</td>
                            <td className="px-2 md:px-3 py-2 text-right font-semibold text-xs md:text-sm">
                                {formatMoney(row.amountPaid || 0)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
