export default function BillingTable({ billingRowsForYear, selectedBillingYear, formatDate, getMonthSpan, formatMoney }) {
    return (
        <div className="mt-2 overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full border-collapse text-xs md:text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                        <th className="px-2 md:px-3 py-2 text-left">From</th>
                        <th className="px-2 md:px-3 py-2 text-left">To</th>
                        <th className="px-2 md:px-3 py-2 text-center">Mos</th>
                        <th className="px-2 md:px-3 py-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="text-slate-900">
                    {billingRowsForYear.length === 0 && (
                        <tr>
                            <td className="px-3 py-3 text-center text-sm text-slate-500" colSpan={4}>
                                No billings for {selectedBillingYear}.
                            </td>
                        </tr>
                    )}
                    {billingRowsForYear.map((row) => {
                        const total =
                            Number(row.amountDue || 0) +
                            Number(row.interest || 0) +
                            Number(row.penalty || 0);
                        return (
                            <tr key={`${row.date}-${row.description}`} className="border-t border-slate-100">
                                <td className="px-2 md:px-3 py-2 text-xs md:text-sm">{formatDate(row.dateFrom)}</td>
                                <td className="px-2 md:px-3 py-2 text-xs md:text-sm">{formatDate(row.dateTo)}</td>
                                <td className="px-2 md:px-3 py-2 text-center text-xs md:text-sm">
                                    {getMonthSpan(row.dateFrom, row.dateTo)}
                                </td>
                                <td className="px-2 md:px-3 py-2 text-right font-semibold text-xs md:text-sm">
                                    {formatMoney(total)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
