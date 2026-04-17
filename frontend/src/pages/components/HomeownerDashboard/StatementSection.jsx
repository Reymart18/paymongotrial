import { useState } from 'react';
import HomeownerStatusMessage from './HomeownerStatusMessage';

export default function StatementSection({
    accountId,
    statementLoading,
    statementError,
    statementRows,
    onPreview,
    className = '',
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(statementRows.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRows = statementRows.slice(startIndex, endIndex);
    return (
        <div className={`rounded-2xl border border-slate-200 bg-[#E89B58]/30 p-6 shadow-sm ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-slate-800">Statement of Account</h3>
                <button
                    type="button"
                    className="rounded-lg bg-[#E89B58] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#d68841]"
                    onClick={onPreview}
                    disabled={!accountId}
                >
                    Preview SOA
                </button>
            </div>

            {statementLoading && (
                <HomeownerStatusMessage
                    variant="loading"
                    message="Loading statement..."
                    className="mt-4"
                />
            )}

            {statementError && (
                <HomeownerStatusMessage
                    variant="error"
                    message={statementError}
                    className="mt-4"
                />
            )}

            {!statementLoading && !statementError && (
                <div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-[#000000]/30 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                <tr>
                                    <th className="px-3 py-3">Type</th>
                                    <th className="px-3 py-3">Previous Balance</th>
                                    <th className="px-3 py-3">Amount Due</th>
                                    <th className="px-3 py-3">Interest</th>
                                    <th className="px-3 py-3">Penalty</th>
                                    <th className="px-3 py-3">Amount Paid</th>
                                    <th className="px-3 py-3">Total Balance</th>
                                    <th className="px-3 py-3">Description</th>
                                    <th className="px-3 py-3">DueDate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedRows.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-6 text-center text-slate-400">
                                            No statement entries found.
                                        </td>
                                    </tr>
                                )}
                                {paginatedRows.map((row) => {
                                    let rowClass = '';
                                    if (row.type && row.type.toLowerCase().includes('payment')) {
                                        rowClass = 'bg-[#766D65]/27';
                                    } else if (row.type && row.type.toLowerCase().includes('billing')) {
                                        rowClass = 'bg-[#A45612]/60';
                                    }

                                    return (
                                        <tr key={`${row.date}-${row.type}`} className={rowClass}>
                                            <td className="px-3 py-3 font-semibold text-slate-900">
                                                {row.type}
                                            </td>
                                            <td className="px-3 py-3">
                                                {Number(row.previousBalance || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {Number(row.amountDue || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {Number(row.interest || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {Number(row.penalty || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {Number(row.amountPaid || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3 font-semibold text-slate-700">
                                                {Number(row.totalBalance || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">
                                                {row.description || '-'}
                                            </td>
                                            <td className="px-3 py-3">
                                                {new Date(row.date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {statementRows.length > 0 && (
                        <div className="mt-6 flex items-center justify-end">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Previous
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${currentPage === page
                                                ? 'bg-[#E89B58] text-white'
                                                : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
