export default function WaterBillContent({
    accountId,
    formatDate,
    formatMoney,
    formatWholeNumber,
    selectedBilling,
}) {
    if (!selectedBilling) return null;

    return (
        <div className="relative mt-8">
            <div className="text-center">
                <h1 className="text-xl font-bold tracking-wide text-slate-950">EDC WATER BILL</h1>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-y border-slate-300 py-4 text-sm md:grid-cols-2">
                <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Account ID</div>
                    <div className="mt-1 text-base font-bold text-slate-950">
                        {selectedBilling.accountId || accountId}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Member Name</div>
                    <div className="mt-1 text-base font-bold text-slate-950">
                        {selectedBilling.memberName || '-'}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Billing Period</div>
                    <div className="mt-1 font-semibold text-slate-800">
                        {selectedBilling.billingPeriod || '-'}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Due Date</div>
                    <div className="mt-1 font-semibold text-slate-800">
                        {formatDate(selectedBilling.dueDate)}
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <section className="water-panel border border-slate-300">
                    <h2 className="water-muted border-b border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold uppercase tracking-wide">
                        Current Charges
                    </h2>
                    <div className="divide-y divide-slate-200 text-sm">
                        <div className="flex justify-between px-4 py-3">
                            <span>Current Reading</span>
                            <span className="font-semibold">{formatWholeNumber(selectedBilling.currentReading)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3">
                            <span>Previous Reading</span>
                            <span className="font-semibold">{formatWholeNumber(selectedBilling.previousReading)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3">
                            <span>Consumption</span>
                            <span className="font-semibold">{formatWholeNumber(selectedBilling.consumption)}</span>
                        </div>
                        <div className="water-muted flex justify-between bg-slate-50 px-4 py-3 font-bold">
                            <span>Total Current Charges</span>
                            <span>{formatMoney(selectedBilling.currentCharges)}</span>
                        </div>
                    </div>
                </section>

                <section className="water-panel border border-slate-300">
                    <h2 className="water-muted border-b border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold uppercase tracking-wide">
                        Outstanding Charges
                    </h2>
                    <div className="divide-y divide-slate-200 text-sm">
                        <div className="flex justify-between px-4 py-3">
                            <span>Previous Balance</span>
                            <span className="font-semibold">{formatMoney(selectedBilling.previousBalance)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3">
                            <span>Add Current Charges</span>
                            <span className="font-semibold">{formatMoney(selectedBilling.currentCharges)}</span>
                        </div>
                        <div className="water-total flex justify-between bg-slate-900 px-4 py-4 text-base font-bold text-white">
                            <span>Total Due</span>
                            <span>{formatMoney(selectedBilling.totalDue)}</span>
                        </div>
                    </div>
                </section>
            </div>

            <div className="mt-8 border border-slate-300 px-5 py-4 text-sm leading-6 text-slate-700">
                <div className="text-center text-sm font-bold uppercase text-slate-950">Important</div>
                <p className="mt-3">
                    Please pay the total amount due at the PVHAI Admin office on or before the due date
                    to avoid disconnection of water services. If payment has been made, please disregard
                    this bill.
                </p>
                <p className="mt-2">
                    For any discrepancy or inquiries, please visit or call PVHAI office at 046-484-2107.
                </p>
            </div>
        </div>
    );
}
