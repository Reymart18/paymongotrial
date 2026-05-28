import pbIcon from '../../../images/pb.png';
import cbIcon from '../../../images/cb.png';
import rpIcon from '../../../images/rp.png';
import toIcon from '../../../images/to.png';

export default function DashboardCards({ account, statementRows }) {
    const rows = Array.isArray(statementRows) ? statementRows : [];

    const getRowYear = (row) => {
        const dateValue = row?.dateTo || row?.dateFrom || row?.date;
        if (!dateValue) {
            return null;
        }

        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) {
            return null;
        }

        return parsed.getFullYear();
    };

    const getEffectiveRowDate = (row) => {
        const dateValue = row?.dateTo || row?.dateFrom || row?.date;
        const parsed = dateValue ? new Date(dateValue) : null;
        if (!parsed || Number.isNaN(parsed.getTime())) {
            return null;
        }

        return parsed;
    };

    const isMembershipDues = (row) => {
        if (!row?.paycat) {
            return false;
        }

        return String(row.paycat).trim().toLowerCase() === 'membership dues';
    };

    const formatDate = (value) => {
        if (!value) {
            return '';
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return '';
        }

        return parsed.toLocaleDateString('en-PH');
    };

    const formatDateRange = (from, to) => {
        const fromLabel = formatDate(from);
        const toLabel = formatDate(to);

        if (!fromLabel && !toLabel) {
            return '';
        }

        if (!toLabel || fromLabel === toLabel) {
            return fromLabel;
        }

        return `${fromLabel} - ${toLabel}`;
    };

    const latestDate = rows.reduce((latest, row) => {
        const current = new Date(row?.date || row?.dateTo || row?.dateFrom || 0);
        if (Number.isNaN(current.getTime())) {
            return latest;
        }

        if (!latest) {
            return current;
        }

        return current > latest ? current : latest;
    }, null);

    const billingRows = rows.filter((row) => row.type === 'billing');
    const latestBillingDateFrom = billingRows.reduce((latest, row) => {
        if (!row?.dateFrom) {
            return latest;
        }

        const current = new Date(row.dateFrom);
        if (Number.isNaN(current.getTime())) {
            return latest;
        }

        if (!latest) {
            return current;
        }

        return current > latest ? current : latest;
    }, null);
    const selectedBillingYear = (() => {
        if (billingRows.length === 0) {
            const fallback = latestDate || new Date();
            return fallback.getFullYear();
        }

        return billingRows.reduce((latestYear, row) => {
            const rowYear = getRowYear(row);
            if (!rowYear) {
                return latestYear;
            }

            if (!latestYear || rowYear > latestYear) {
                return rowYear;
            }

            return latestYear;
        }, null);
    })();

    const previousUnpaidBalance = (() => {
        if (!selectedBillingYear) {
            return 0;
        }

        const previousYear = selectedBillingYear - 1;
        const rowsInPreviousYear = rows.filter((row) => getRowYear(row) === previousYear);

        if (rowsInPreviousYear.length === 0) {
            return 0;
        }

        const sortedRows = [...rowsInPreviousYear].sort((a, b) => {
            const dateA = getEffectiveRowDate(a)?.getTime() ?? 0;
            const dateB = getEffectiveRowDate(b)?.getTime() ?? 0;

            if (dateA !== dateB) {
                return dateA - dateB;
            }

            if (a.type === b.type) {
                return 0;
            }

            return a.type === 'payment' ? 1 : -1;
        });

        const latestRow = sortedRows[sortedRows.length - 1] || null;
        return latestRow ? Number(latestRow.totalBalance || 0) : 0;
    })();

    // Get latest billing row for the selected year
    const billingRowsForYear = billingRows
        .filter((row) => getRowYear(row) === selectedBillingYear)
        .sort((a, b) => {
            const dateA = new Date(a.dateFrom || a.date);
            const dateB = new Date(b.dateFrom || b.date);
            return dateA.getTime() - dateB.getTime();
        });

    const latestBilling = billingRowsForYear.length > 0
        ? billingRowsForYear[billingRowsForYear.length - 1]
        : null;

    const currentBillingRange = formatDateRange(
        latestBilling?.dateFrom,
        latestBilling?.dateTo,
    );

    const totalOutstandingAsOf = latestBilling?.dateTo
        ? `AS OF ${formatDate(latestBilling.dateTo)}`
        : '';

    // Calculate carrying balance breakdown (Principal, Interest, Penalties from latest billing)
    const carryingBalanceBreakdown = {
        principal: latestBilling ? Number(latestBilling.prinBal || 0) : 0,
        interest: latestBilling ? Number(latestBilling.intBal || 0) : 0,
        penalties: latestBilling ? Number(latestBilling.penBal || 0) : 0,
    };

    const carryingBalanceTotal = carryingBalanceBreakdown.principal
        + carryingBalanceBreakdown.interest
        + carryingBalanceBreakdown.penalties;

    // Calculate summary values from account and statement data
    const previousBalance = previousUnpaidBalance;

    // Calculate current billing charges using the most recent billing dateFrom
    const currentBillingCharges = latestBillingDateFrom
        ? billingRows
            .filter((row) => {
                if (!row?.dateFrom) {
                    return false;
                }

                const current = new Date(row.dateFrom);
                return !Number.isNaN(current.getTime())
                    && current.getTime() === latestBillingDateFrom.getTime();
            })
            .reduce(
                (sum, row) => sum
                    + Number(row.amountDue || 0)
                    + Number(row.interest || 0)
                    + Number(row.penalty || 0),
                0,
            )
        : 0;

    // Calculate recent payment made using the most recent payment date
    const paymentRows = rows.filter((row) => row.type === 'payment');
    const membershipPayments = paymentRows.filter(isMembershipDues);
    const latestPaymentRow = membershipPayments.reduce((latest, row) => {
        const dateValue = row?.paymentDate || row?.date;
        if (!dateValue) {
            return latest;
        }

        const current = new Date(dateValue);
        if (Number.isNaN(current.getTime())) {
            return latest;
        }

        if (!latest) {
            return row;
        }

        const latestDate = new Date(latest.paymentDate || latest.date || 0);
        if (Number.isNaN(latestDate.getTime())) {
            return row;
        }

        return current > latestDate ? row : latest;
    }, null);
    const recentPaymentMade = latestPaymentRow
        ? Number(latestPaymentRow.amountPaid || 0)
        : 0;
    const recentPaymentDescription = latestPaymentRow?.description || '';

    const currentPeriodPayments = (() => {
        if (!latestBilling?.dateFrom || !latestBilling?.dateTo) {
            return 0;
        }

        const start = new Date(latestBilling.dateFrom);
        const end = new Date(latestBilling.dateTo);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return 0;
        }

        return membershipPayments
            .filter((row) => {
                const dateValue = row?.paymentDate || row?.date;
                if (!dateValue) {
                    return false;
                }

                const paidAt = new Date(dateValue);
                if (Number.isNaN(paidAt.getTime())) {
                    return false;
                }

                return paidAt >= start && paidAt <= end;
            })
            .reduce((sum, row) => sum + Number(row.amountPaid || 0), 0);
    })();

    const amountDue = currentBillingCharges + carryingBalanceTotal - currentPeriodPayments;

    const cards = [
        {
            title: 'Previous Balance',
            value: carryingBalanceTotal.toFixed(2),
            icon: pbIcon,
            color: 'from-amber-400 to-orange-400',
        },
        {
            title: 'Current Billing Charges',
            value: currentBillingCharges.toFixed(2),
            description: currentBillingRange,
            icon: cbIcon,
            color: 'from-amber-400 to-orange-400',
        },
        {
            title: 'Recent Payment Made',
            value: recentPaymentMade.toFixed(2),
            description: recentPaymentDescription,
            icon: rpIcon,
            color: 'from-amber-400 to-orange-400',
        },
        {
            title: 'Total Outstanding',
            value: amountDue.toFixed(2),
            description: totalOutstandingAsOf,
            icon: toIcon,
            color: 'from-amber-400 to-orange-400',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-18">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="relative rounded-2xl p-6 pt-10 shadow-sm transition hover:shadow-md"
                    style={{ backgroundColor: 'rgba(232, 155, 88, 0.32)' }}
                >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                        <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white shadow-md border-2 border-[#E89B58]/33">
                            <img src={card.icon} alt="" className="h-7 w-7" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-slate-600">{card.title}</p>
                        <p className="mt-3 text-2xl font-bold text-slate-900">
                            ₱ {Number(card.value).toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                        {card.description && (
                            <p className="mt-2 text-xs font-medium text-slate-600">
                                {card.description}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
