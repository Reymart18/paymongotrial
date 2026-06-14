function getRowYear(row) {
    const dateValue = row?.dateTo || row?.dateFrom || row?.date;
    if (!dateValue) return null;
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

function isMembershipDues(row) {
    return String(row?.paycat || '').trim().toLowerCase() === 'membership dues';
}

export function calculateAccountSummary(statements) {
    if (!statements?.length) return { netBalance: 0 };

    const billingRows = statements.filter((row) => row.type === 'billing');
    const latestDate = statements.reduce((latest, row) => {
        const current = new Date(row.date);
        if (Number.isNaN(current.getTime())) return latest;
        return !latest || current > latest ? current : latest;
    }, null);
    const selectedBillingYear = billingRows.length
        ? billingRows.reduce((latestYear, row) => Math.max(latestYear || 0, getRowYear(row) || 0), null)
        : (latestDate ? latestDate.getFullYear() : new Date().getFullYear());
    const yearlyBillings = billingRows
        .filter((row) => getRowYear(row) === selectedBillingYear)
        .sort((a, b) => new Date(a.dateFrom || a.date) - new Date(b.dateFrom || b.date));

    if (!yearlyBillings.length) return { netBalance: 0 };

    const latestBilling = yearlyBillings.at(-1);
    const balanceParts = [latestBilling?.prinBal, latestBilling?.intBal, latestBilling?.penBal];
    const carryingBalance = balanceParts.some((value) => value !== undefined && value !== null)
        ? balanceParts.reduce((sum, value) => sum + Number(value || 0), 0)
        : Number(latestBilling?.previousBalance || 0);
    const currentCharges = Number(latestBilling?.prinCurr ?? latestBilling?.amountDue ?? 0)
        + Number(latestBilling?.intCurr ?? latestBilling?.interest ?? 0)
        + Number(latestBilling?.penCurr ?? latestBilling?.penalty ?? 0);
    const start = latestBilling?.dateFrom ? new Date(latestBilling.dateFrom) : null;
    const end = latestBilling?.dateTo ? new Date(latestBilling.dateTo) : null;
    const hasValidRange = start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());
    const payments = hasValidRange
        ? statements
            .filter((row) => row.type === 'payment' && isMembershipDues(row))
            .filter((row) => {
                const date = new Date(row.date);
                return !Number.isNaN(date.getTime()) && date >= start && date <= end;
            })
            .reduce((sum, row) => sum + Number(row.amountPaid || 0), 0)
        : 0;

    return { netBalance: carryingBalance + currentCharges - payments };
}

export function getBalanceStatus(balance) {
    if (Math.abs(balance) < 0.005) return 'settled';
    return balance > 0 ? 'underpaid' : 'overpaid';
}

export function formatBalance(value) {
    const amount = Number(value || 0);
    if (Math.abs(amount) < 0.005) return '0.00';
    const sign = amount < 0 ? '-' : '';
    return `${sign}${Math.abs(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
