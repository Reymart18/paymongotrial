import BillingTable from './BillingTable';
import PaymentsTable from './PaymentsTable';

export default function SummaryCard({
    previousUnpaidBalance,
    selectedBillingYear,
    billingRowsForYear,
    formatDate,
    getMonthSpan,
    formatMoney,
    billingYearTotal,
    paymentRows,
    totalPayments,
    currentBillingLabel,
    netBalance,
    formatSignedMoney,
}) {
    const getAlertClass = (value) => (
        Number(value || 0) < 0 ? 'text-alert' : 'text-slate-900'
    );

    return (
        <div className="mx-auto mt-5 max-w-[1060px] rounded-lg border border-slate-200 bg-slate-50/40 p-5 text-sm shadow-sm">
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
                <span className="uppercase tracking-[0.18em] text-xs text-slate-500">
                    Previous Unpaid Balance / Excess Balance:
                </span>
                <span className={`text-base font-semibold ${getAlertClass(previousUnpaidBalance)}`}>
                    {formatMoney(previousUnpaidBalance)}
                </span>
            </div>

            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                Billing ({selectedBillingYear})
            </div>
            <BillingTable
                billingRowsForYear={billingRowsForYear}
                selectedBillingYear={selectedBillingYear}
                formatDate={formatDate}
                getMonthSpan={getMonthSpan}
                formatMoney={formatMoney}
            />
            <div className="mt-3 flex items-baseline gap-2 text-sm">
                <span className="uppercase tracking-[0.18em] text-xs text-slate-500">
                    Total Balance:
                </span>
                <span className={`text-base font-semibold ${getAlertClass(billingYearTotal)}`}>
                    {formatMoney(billingYearTotal)}
                </span>
            </div>

            <div className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-500">
                Payments
            </div>
            <PaymentsTable
                paymentRows={paymentRows}
                formatDate={formatDate}
                formatMoney={formatMoney}
            />
            <div className="mt-3 flex items-baseline gap-2 text-sm">
                <span className="uppercase tracking-[0.18em] text-xs text-slate-500">
                    Total Payments ({selectedBillingYear}):
                </span>
                <span className="text-base font-semibold text-slate-900">
                    {formatMoney(totalPayments)}
                </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2 text-sm">
                <span className="uppercase tracking-[0.18em] text-xs text-slate-500">
                    Amount Due / Excess as of {currentBillingLabel}:
                </span>
                <span className={`text-base font-semibold ${getAlertClass(netBalance)}`}>
                    {formatSignedMoney(netBalance)}
                </span>
            </div>
        </div>
    );
}
