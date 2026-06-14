export function formatDate(value) {
    if (!value) return '-';
    const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value);
    return Number.isNaN(date.getTime())
        ? '-'
        : date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function reference(item, kind) {
    const year = item.createdAt ? new Date(item.createdAt).getFullYear() : new Date().getFullYear();
    return `${kind === 'complaint' ? 'CMP' : 'REQ'}-${year}-${String(item.id || 0).padStart(4, '0')}`;
}

export function statusClass(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'resolved' || normalized === 'accepted') return 'bg-emerald-100 text-emerald-700';
    if (normalized === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-amber-100 text-amber-700';
}
