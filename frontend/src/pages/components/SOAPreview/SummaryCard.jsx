import { useState } from 'react';
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
    onPayOnline,
    isPaying,
    paymentError,
}) {
    const [showPaymentInfo, setShowPaymentInfo] = useState(false);
    const getAlertClass = (value) => (
        Number(value || 0) < 0 ? 'text-alert' : 'text-slate-900'
    );

    return (
        <div className="mx-3 mt-6 max-w-265 rounded-lg border border-slate-200 bg-slate-50/40 px-4 py-5 text-sm shadow-sm md:mx-auto md:mt-5 md:p-5">
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
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:gap-3">
                    <span className="uppercase tracking-[0.18em] text-xs text-slate-500">
                        Amount Due / Excess as of {amountDueAsOfLabel}:
                    </span>
                    <span className={`text-base font-semibold ${getAlertClass(amountDue)}`}>
                        {formatSignedMoney(amountDue)}
                    </span>
                </div>
                <div className="no-print print:hidden">
                    <button
                        type="button"
                        onClick={() => setShowPaymentInfo(true)}
                        disabled={isPaying || amountDue <= 0}
                        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPaying ? 'Opening PayMongo...' : 'Pay Online with PayMongo'}
                    </button>
                </div>
            </div>
            {showPaymentInfo && (
                <div
                    className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 print:hidden"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !isPaying) {
                            setShowPaymentInfo(false);
                        }
                    }}
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="paymongo-fee-title"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 id="paymongo-fee-title" className="text-lg font-bold text-slate-900">
                                    PayMongo transaction fees
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Fees vary by payment method and are shown before confirmation.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPaymentInfo(false)}
                                disabled={isPaying}
                                aria-label="Close payment information"
                                className="text-xl leading-none text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                            >
                                ×
                            </button>
                        </div>
                        <div className="mt-5 space-y-2 text-sm text-slate-600">
                            <div className="flex justify-between gap-3"><span>GCash</span><span className="font-medium text-slate-900">2.23%</span></div>
                            <div className="flex justify-between gap-3"><span>Maya</span><span className="font-medium text-slate-900">1.79%</span></div>
                            <div className="flex justify-between gap-3"><span>Debit/Credit Cards (Local)</span><span className="text-right font-medium text-slate-900">3.125% + PHP 13.39</span></div>
                            <div className="flex justify-between gap-3"><span>Direct Online Banking</span><span className="text-right font-medium text-slate-900">0.71% or PHP 13.39</span></div>
                            <div className="flex justify-between gap-3"><span>QR Ph</span><span className="font-medium text-slate-900">1.34%</span></div>
                        </div>
                        <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                            Applicable tax will be added to the transaction fee.
                        </p>
                        {paymentError && (
                            <p className="mt-3 text-sm text-red-600" role="alert">
                                {paymentError}
                            </p>
                        )}
                        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowPaymentInfo(false)}
                                disabled={isPaying}
                                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onPayOnline}
                                disabled={isPaying}
                                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isPaying ? 'Opening PayMongo...' : 'Continue to PayMongo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <p className="mt-3 text-sm text-slate-500">
                <strong className="font-bold text-slate-700">Disclaimer:</strong> If you notice any discrepancies, please be assured that balance adjustments are currently ongoing. Any necessary corrections will be reflected accordingly.
            </p>
        </div>
    );
}
