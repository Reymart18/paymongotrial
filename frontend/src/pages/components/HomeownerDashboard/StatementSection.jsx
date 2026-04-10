import HomeownerStatusMessage from './HomeownerStatusMessage';

export default function StatementSection({
    accountId,
    statementLoading,
    statementError,
    statementRows,
    onPreview,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-slate-800">Statement of Account</h3>
                <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
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
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                            {statementRows.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="px-4 py-6 text-center text-slate-400">
                                        No statement entries found.
                                    </td>
                                </tr>
                            )}
                            {statementRows.map((row) => {
                                const total = Number(row.totalBalance || 0);
                                const rowClass =
                                    total > 0
                                        ? 'bg-amber-50'
                                        : total < 0
                                            ? 'bg-emerald-50'
                                            : '';

                                return (
                                    <tr key={`${row.date}-${row.type}`} className={rowClass}>
                                        <td className="px-3 py-3 font-semibold text-slate-700">
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
            )}
        </div>
    );
}
