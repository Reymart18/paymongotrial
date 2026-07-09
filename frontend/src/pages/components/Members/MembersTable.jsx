import { formatBalance } from './memberBalanceUtils.js';

function ViewIcon() {
    return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function PreviewButtons({ accountId, isWaterPreviewing, onPreviewSoa, onPreviewWater }) {
    return (
        <div className="flex flex-col gap-0.5">
            <button type="button" onClick={() => onPreviewSoa(accountId)} className="text-xs font-medium text-[#E89B58] hover:underline">Preview SOA</button>
            <button
                type="button"
                onClick={() => onPreviewWater(accountId)}
                disabled={isWaterPreviewing}
                className="text-xs font-medium text-[#E89B58] hover:underline disabled:cursor-wait disabled:text-slate-400 disabled:no-underline"
            >
                {isWaterPreviewing ? 'Opening...' : 'Preview Water'}
            </button>
        </div>
    );
}

export default function MembersTable({
    accounts,
    balances,
    currentPage,
    error,
    filteredCount,
    isSuperAdmin,
    itemsPerPage,
    loading,
    onDelete,
    onPageChange,
    onPreviewSoa,
    onPreviewWater,
    previewingWaterAccountId,
    onView,
    sortedCount,
    startIndex,
    totalPages,
}) {
    return (
        <div className="rounded-lg p-3 md:p-6">
            <div className="overflow-x-auto rounded-lg bg-white md:overflow-hidden" style={{ boxShadow: '-8px 0 16px rgba(0, 0, 0, 0.1), 8px 0 16px rgba(0, 0, 0, 0.1)' }}>
                <table className="w-full text-xs md:text-sm">
                    <thead>
                        <tr style={{ backgroundColor: 'rgba(112, 75, 75, 0.51)' }}>
                            {['Account ID', 'Neighborhood', 'Block', 'Lot', 'Name', 'Size (SQM)', 'Classification', 'Balance', 'Billing Preview', 'Action'].map((heading, index) => (
                                <th key={heading} className={`${[1, 6, 8].includes(index) ? 'hidden sm:table-cell ' : ''}${[2, 3].includes(index) ? 'hidden md:table-cell ' : ''}${index === 5 ? 'hidden lg:table-cell ' : ''}px-2 py-2 text-left text-xs font-semibold text-white md:px-4 md:py-4 md:text-sm ${index === 9 ? 'text-center' : ''}`}>{heading}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="10" className="px-4 py-6 text-center text-gray-500">Loading accounts...</td></tr>}
                        {error && <tr><td colSpan="10" className="px-4 py-6 text-center text-red-500">{error}</td></tr>}
                        {!loading && !error && filteredCount === 0 && <tr><td colSpan="10" className="px-4 py-6 text-center text-gray-500">No members found.</td></tr>}
                        {!loading && !error && accounts.map((account, index) => (
                            <tr key={account.id || account.accountId} style={{ backgroundColor: index % 2 === 0 ? 'rgba(232, 155, 88, 0.32)' : 'rgba(254, 251, 249, 0.60)' }}>
                                <td className="px-2 py-2 text-xs font-semibold text-gray-800 md:px-4 md:py-4 md:text-sm">{account.accountId}</td>
                                <td className="hidden px-2 py-2 text-xs text-gray-800 sm:table-cell md:px-4 md:py-4 md:text-sm">{account.neighborhood}</td>
                                <td className="hidden whitespace-nowrap px-1 py-2 text-xs text-gray-800 md:table-cell md:px-3 md:py-4 md:text-sm">{account.block}</td>
                                <td className="hidden whitespace-nowrap px-1 py-2 text-xs text-gray-800 md:table-cell md:px-3 md:py-4 md:text-sm">{account.lot}</td>
                                <td className="px-2 py-2 text-xs text-gray-800 md:px-4 md:py-4 md:text-sm">{account.memberName}</td>
                                <td className="hidden whitespace-nowrap px-1 py-2 text-xs text-gray-800 lg:table-cell md:px-3 md:py-4 md:text-sm">{account.propertySizeSqm}</td>
                                <td className="hidden px-2 py-2 text-xs text-gray-800 sm:table-cell md:px-4 md:py-4 md:text-sm">{account.classification}</td>
                                <td className="px-2 py-2 text-xs text-gray-800 md:px-4 md:py-4 md:text-sm">{balances[account.accountId] === undefined ? 'Calculating...' : `\u20B1${formatBalance(balances[account.accountId])}`}</td>
                                <td className="hidden px-2 py-2 text-xs sm:table-cell md:px-4 md:py-4 md:text-sm"><PreviewButtons accountId={account.accountId} isWaterPreviewing={previewingWaterAccountId === account.accountId} onPreviewSoa={onPreviewSoa} onPreviewWater={onPreviewWater} /></td>
                                <td className="px-2 py-2 text-center text-xs md:px-4 md:py-4 md:text-sm">
                                    <div className="mb-1 flex flex-col items-center sm:hidden"><PreviewButtons accountId={account.accountId} isWaterPreviewing={previewingWaterAccountId === account.accountId} onPreviewSoa={onPreviewSoa} onPreviewWater={onPreviewWater} /></div>
                                    {isSuperAdmin ? (
                                        <div className="flex items-center justify-center gap-0.5">
                                            <button type="button" onClick={() => onView(account)} className="p-2 text-[#E89B58] transition hover:text-[#d88a47]" title="View"><ViewIcon /></button>
                                            <button type="button" onClick={() => onDelete(account.accountId)} className="p-2 text-red-500 transition hover:text-red-700" title="Delete"><DeleteIcon /></button>
                                        </div>
                                    ) : <span className="text-xs text-slate-400">View only</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!loading && !error && sortedCount > 0 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div className="text-xs text-gray-600 md:text-sm">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedCount)} of {sortedCount} members</div>
                    <div className="flex gap-2">
                        <PageButton title="Previous" disabled={currentPage === 1} onClick={() => onPageChange(Math.max(currentPage - 1, 1))} path="M15 19l-7-7 7-7" />
                        <PageButton title="Next" disabled={currentPage === totalPages} onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} path="M9 5l7 7-7 7" />
                        <PageButton title="Last" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)} path="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </div>
                </div>
            )}
        </div>
    );
}

function PageButton({ disabled, onClick, path, title }) {
    return (
        <button type="button" onClick={onClick} disabled={disabled} className="rounded-lg border border-slate-300 bg-white p-2 text-gray-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" title={title}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
        </button>
    );
}
