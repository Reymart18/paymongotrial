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
