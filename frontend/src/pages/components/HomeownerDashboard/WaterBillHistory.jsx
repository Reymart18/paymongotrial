import { useState } from 'react';

export default function WaterBillHistory({ accountId, waterBillings, onPreview }) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const rows = Array.isArray(waterBillings) ? waterBillings : [];
    const sortedRows = [...rows].sort((a, b) => {
        const dateA = new Date(a?.dueDate || 0).getTime();
        const dateB = new Date(b?.dueDate || 0).getTime();
        return dateB - dateA;
    });
    const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRows = sortedRows.slice(startIndex, startIndex + itemsPerPage);

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const formatDate = (value) => {
        if (!value) {
            return '-';
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-PH');
    };

    return (
        <section className="rounded-2xl border border-slate-200 bg-[#E89B58]/30 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-slate-800">Water Bill History</h3>
                <button
                    type="button"
                    className="rounded-lg bg-[#E89B58] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#d68841] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={onPreview}
                    disabled={!accountId || rows.length === 0}
                >
                    Preview Water
                </button>
            </div>

            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-[#000000]/30 text-left text-xs font-semibold uppercase tracking-wider text-white">
                        <tr>
                            <th className="px-3 py-3">Previous Balance</th>
                            <th className="px-3 py-3">Current Charges</th>
                            <th className="px-3 py-3">Billing Period</th>
                            <th className="px-3 py-3">Due Date</th>
                            <th className="px-3 py-3">Total Due</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedRows.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-6 text-center text-slate-500">
                                    No water billing entries found.
                                </td>
                            </tr>
                        )}
                        {paginatedRows.map((row) => (
                            <tr key={row.id || `${row.accountId}-${row.billingPeriod}`} className="bg-[#A45612]/40">
                                <td className="px-3 py-3">{formatMoney(row.previousBalance)}</td>
                                <td className="px-3 py-3">{formatMoney(row.currentCharges)}</td>
                                <td className="px-3 py-3 text-slate-700">{row.billingPeriod || '-'}</td>
                                <td className="px-3 py-3">{formatDate(row.dueDate)}</td>
                                <td className="px-3 py-3 font-semibold text-slate-800">
                                    {formatMoney(row.totalDue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-end">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
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
                        <button
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
