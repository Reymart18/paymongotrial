import pbIcon from '../../../images/pb.png';
import cbIcon from '../../../images/cb.png';
import rpIcon from '../../../images/rp.png';
import toIcon from '../../../images/to.png';
import upIcon from '../../../images/up.png';

export default function AdminDashboardCards({
    currentBillingLabel,
    unpaidAccountsCount,
    overpaidAccountsCount,
    settledAccountsCount,
    totalCollectedPayments,
    loading,
    onGenerateSettledReport,
    settledReportLoading,
    onGenerateOverpaidReport,
    overpaidReportLoading,
    onGeneratePaymentsReport,
    paymentsReportLoading,
}) {
    const formatMoney = (value) => new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

    const cards = [
        {
            title: 'Current Billing Date',
            value: currentBillingLabel || '-',
            icon: cbIcon,
        },
        {
            title: 'Settled Accounts',
            value: Number.isFinite(settledAccountsCount)
                ? String(settledAccountsCount)
                : '0',
            icon: rpIcon,
        },
        {
            title: 'Unpaid Accounts',
            value: Number.isFinite(unpaidAccountsCount)
                ? String(unpaidAccountsCount)
                : '0',
            icon: upIcon,
        },
        {
            title: 'Overpaid Accounts',
            value: Number.isFinite(overpaidAccountsCount)
                ? String(overpaidAccountsCount)
                : '0',
            icon: pbIcon,
        },
        {
            title: 'Total Payments Collected (Current Billing)',
            value: `₱ ${formatMoney(totalCollectedPayments)}`,
            icon: toIcon,
            isPaymentsReport: true,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-6">
            {cards.map((card, index) => {
                const isCenteredBottomRow = cards.length === 5 && index >= 3;
                const isSettledCard = card.title === 'Settled Accounts';
                const isOverpaidCard = card.title === 'Overpaid Accounts';
                const isPaymentsReport = card.isPaymentsReport;
                const cardClassName = `relative rounded-2xl p-6 pt-10 shadow-sm transition hover:shadow-md ${isCenteredBottomRow ? 'lg:col-span-3' : 'lg:col-span-2'
                    }`;

                return (
                    <div
                        key={index}
                        className={cardClassName}
                        style={{ backgroundColor: 'rgba(232, 155, 88, 0.32)' }}
                    >
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white shadow-md border-2 border-[#E89B58]/33">
                                <img src={card.icon} alt="" className="h-7 w-7" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600">{card.title}</p>
                            <p className="mt-3 text-xl md:text-2xl font-bold text-slate-900">
                                {loading ? 'Loading...' : card.value}
                            </p>
                            {isSettledCard && onGenerateSettledReport && (
                                <button
                                    type="button"
                                    onClick={onGenerateSettledReport}
                                    disabled={settledReportLoading}
                                    className="mt-0 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition bg-amber-50 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {settledReportLoading ? 'Generating...' : 'Generate Report'}
                                </button>
                            )}
                            {isOverpaidCard && onGenerateOverpaidReport && (
                                <button
                                    type="button"
                                    onClick={onGenerateOverpaidReport}
                                    disabled={overpaidReportLoading}
                                    className="mt-0 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition bg-amber-50 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {overpaidReportLoading ? 'Generating...' : 'Generate Report'}
                                </button>
                            )}
                            {isPaymentsReport && onGeneratePaymentsReport && (
                                <button
                                    type="button"
                                    onClick={onGeneratePaymentsReport}
                                    disabled={paymentsReportLoading}
                                    className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition bg-amber-50 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {paymentsReportLoading ? 'Generating...' : 'Generate Report'}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
