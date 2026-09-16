import PaymentsTable from './PaymentsTable';

export default function SummaryCard({
    selectedBillingYear,
    formatDate,
    formatMoney,
    balanceAsOfLabel,
    currentChargesLabel,
    balanceBreakdown,
    currentChargesBreakdown,
    paymentRows,
    totalPayments,
    amountDue,
    amountDueAsOfLabel,
    formatSignedMoney,
}) {
    const getAlertClass = (value) => (
        Number(value || 0) < 0 ? 'text-alert' : 'text-slate-900'
    );

    return (
        <div className="mx-3 mt-6 max-w-[1060px] rounded-lg border border-slate-200 bg-slate-50/40 px-4 py-5 text-sm shadow-sm md:mx-auto md:mt-5 md:p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Balance (as of {balanceAsOfLabel})
            </div>
            <div className="mt-2 overflow-x-auto rounded-md border border-slate-200 bg-white">
                <table className="w-full border-collapse text-xs md:text-sm">
                    <tbody className="text-slate-900">
                        <tr className="border-b border-slate-100">
                            <td className="px-3 py-2 text-left">Principal</td>
                            <td className="px-3 py-2 text-right font-semibold">
                                {formatMoney(balanceBreakdown.principal)}
                            </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="px-3 py-2 text-left">Interest</td>
                            <td className="px-3 py-2 text-right font-semibold">
                                {formatMoney(balanceBreakdown.interest)}
                            </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="px-3 py-2 text-left">Penalties</td>
                            <td className="px-3 py-2 text-right font-semibold">
                                {formatMoney(balanceBreakdown.penalties)}
                            </td>
                        </tr>
                        <tr className="bg-slate-50">
                            <td className="px-3 py-2 text-left uppercase tracking-[0.18em] text-xs text-slate-500">
                                Total Balance
                            </td>
                            <td className={`px-3 py-2 text-right text-sm font-semibold ${getAlertClass(balanceBreakdown.total)}`}>
                                {formatMoney(balanceBreakdown.total)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                Current Charges ({currentChargesLabel})
            </div>
            <div className="mt-2 overflow-x-auto rounded-md border border-slate-200 bg-white">
                <table className="w-full border-collapse text-xs md:text-sm">
                    <tbody className="text-slate-900">
                        <tr className="border-b border-slate-100">
                            <td className="px-3 py-2 text-left">Principal</td>
                            <td className="px-3 py-2 text-right font-semibold">
                                {formatMoney(currentChargesBreakdown.principal)}
                            </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="px-3 py-2 text-left">Interest</td>
                            <td className="px-3 py-2 text-right font-semibold">
                                {formatMoney(currentChargesBreakdown.interest)}
                            </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="px-3 py-2 text-left">Penalties</td>
                            <td className="px-3 py-2 text-right font-semibold">
                                {formatMoney(currentChargesBreakdown.penalties)}
                            </td>
                        </tr>
                        <tr className="bg-slate-50">
                            <td className="px-3 py-2 text-left uppercase tracking-[0.18em] text-xs text-slate-500">
                                Total Current Charges
                            </td>
                            <td className={`px-3 py-2 text-right text-sm font-semibold ${getAlertClass(currentChargesBreakdown.total)}`}>
                                {formatMoney(currentChargesBreakdown.total)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-500">
                Payments
            </div>
            <PaymentsTable
                paymentRows={paymentRows}
                formatDate={formatDate}
                formatMoney={formatMoney}
            />
            <div className="mt-3 flex flex-col md:flex-row md:items-baseline gap-2 text-sm">
                <span className="uppercase tracking-[0.18em] text-xs text-slate-500">
                    Total Payments ({selectedBillingYear}):
                </span>
                <span className="text-base font-semibold text-slate-900">
                    {formatMoney(totalPayments)}
                </span>
            </div>
            <div className="mt-2 flex flex-col md:flex-row md:items-baseline gap-2 text-sm">
                <span className="uppercase tracking-[0.18em] text-xs text-slate-500">
                    Amount Due / Excess as of {amountDueAsOfLabel}:
                </span>
                <span className={`text-base font-semibold ${getAlertClass(amountDue)}`}>
                    {formatSignedMoney(amountDue)}
                </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
                <strong className="font-bold text-slate-700">Disclaimer:</strong> If you notice any discrepancies, please be assured that balance adjustments are currently ongoing. Any necessary corrections will be reflected accordingly.
            </p>
        </div>
    );
}
