import { Fragment } from 'react';
import AdminStatusMessage from './AdminStatusMessage';

export default function AccountsTable({
    accounts,
    loading,
    error,
    expandedStatementAccountId,
    statementsByAccount,
    statementsLoading,
    statementsError,
    editingAccountId,
    editForm,
    editLoading,
    editStatus,
    editError,
    onToggleStatements,
    onPreviewSoa,
    onStartEditing,
    onDeleteAccount,
    onEditChange,
    onSaveEdit,
    onCancelEditing,
}) {
    return (
        <>
            {loading && (
                <AdminStatusMessage
                    variant="loading"
                    message="Loading homeowner accounts..."
                />
            )}

            {error && (
                <AdminStatusMessage
                    variant="error"
                    message={error}
                />
            )}

            {!loading && !error && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-3 py-3">Account ID</th>
                                    <th className="px-3 py-3">Neighborhood</th>
                                    <th className="px-3 py-3">Block</th>
                                    <th className="px-3 py-3">Lot</th>
                                    <th className="px-3 py-3">Member Name</th>
                                    <th className="px-3 py-3">Property Size (sqm)</th>
                                    <th className="px-3 py-3">Classification</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3">Balance</th>
                                    <th className="px-3 py-3">Statement</th>
                                    <th className="px-3 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {accounts.length === 0 && (
                                    <tr>
                                        <td colSpan="12" className="px-4 py-6 text-center text-slate-400">
                                            No homeowner accounts found.
                                        </td>
                                    </tr>
                                )}
                                {accounts.map((account) => (
                                    <Fragment key={account.id || account.accountId}>
                                        <tr>
                                            <td className="px-3 py-3 font-semibold text-slate-700">
                                                {account.accountId}
                                            </td>
                                            <td className="px-3 py-3">{account.neighborhood}</td>
                                            <td className="px-3 py-3">{account.block}</td>
                                            <td className="px-3 py-3">{account.lot}</td>
                                            <td className="px-3 py-3">{account.memberName}</td>
                                            <td className="px-3 py-3">{account.propertySizeSqm}</td>
                                            <td className="px-3 py-3">{account.classification}</td>
                                            <td className="px-3 py-3">
                                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                    {account.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                {Number(account.balance || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        type="button"
                                                        className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500"
                                                        onClick={() => onToggleStatements(account.accountId)}
                                                    >
                                                        {expandedStatementAccountId === account.accountId
                                                            ? 'Hide'
                                                            : 'View'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                                                        onClick={() => onPreviewSoa(account.accountId)}
                                                    >
                                                        Preview SOA
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                        onClick={() => onStartEditing(account)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-500"
                                                        onClick={() => onDeleteAccount(account.accountId)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {editingAccountId === account.accountId && (
                                            <tr className="bg-slate-50">
                                                <td colSpan="12" className="px-4 py-4">
                                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                Member Name
                                                                <input
                                                                    type="text"
                                                                    value={editForm.memberName}
                                                                    onChange={(e) =>
                                                                        onEditChange(
                                                                            'memberName',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                                />
                                                            </label>
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                Property Size (sqm)
                                                                <input
                                                                    type="number"
                                                                    value={editForm.propertySizeSqm}
                                                                    onChange={(e) =>
                                                                        onEditChange(
                                                                            'propertySizeSqm',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                                />
                                                            </label>
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                Classification
                                                                <select
                                                                    value={editForm.classification}
                                                                    onChange={(e) =>
                                                                        onEditChange(
                                                                            'classification',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                                >
                                                                    <option value="">Select</option>
                                                                    <option value="HOMEOWNER">HOMEOWNER</option>
                                                                    <option value="LOT OWNER">LOT OWNER</option>
                                                                </select>
                                                            </label>
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                Status
                                                                <input
                                                                    type="text"
                                                                    value={editForm.status}
                                                                    onChange={(e) =>
                                                                        onEditChange(
                                                                            'status',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                                />
                                                            </label>
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                Balance
                                                                <input
                                                                    type="number"
                                                                    value={editForm.balance}
                                                                    onChange={(e) => onEditChange('balance', e.target.value)}
                                                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                                />
                                                            </label>
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                Username
                                                                <input
                                                                    type="text"
                                                                    value={editForm.username}
                                                                    onChange={(e) =>
                                                                        onEditChange(
                                                                            'username',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                                />
                                                            </label>
                                                        </div>
                                                        <div className="mt-4 flex flex-wrap gap-3">
                                                            <button
                                                                type="button"
                                                                className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                                onClick={() => onSaveEdit(account.accountId)}
                                                                disabled={editLoading}
                                                            >
                                                                {editLoading ? 'Saving...' : 'Save'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                                                                onClick={onCancelEditing}
                                                                disabled={editLoading}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                        {editStatus && (
                                                            <AdminStatusMessage
                                                                variant="success"
                                                                message={editStatus}
                                                                className="mt-4"
                                                            />
                                                        )}
                                                        {editError && (
                                                            <AdminStatusMessage
                                                                variant="error"
                                                                message={editError}
                                                                className="mt-4"
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {expandedStatementAccountId === account.accountId && (
                                            <tr className="bg-slate-50">
                                                <td colSpan="12" className="px-4 py-4">
                                                    {statementsLoading[account.accountId] && (
                                                        <AdminStatusMessage
                                                            variant="loading"
                                                            message="Loading statement..."
                                                        />
                                                    )}
                                                    {statementsError[account.accountId] && (
                                                        <AdminStatusMessage
                                                            variant="error"
                                                            message={statementsError[account.accountId]}
                                                        />
                                                    )}
                                                    {!statementsLoading[account.accountId] &&
                                                        !statementsError[account.accountId] && (
                                                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
                                                                        {(statementsByAccount[account.accountId] || [])
                                                                            .length === 0 && (
                                                                                <tr>
                                                                                    <td
                                                                                        colSpan="9"
                                                                                        className="px-4 py-6 text-center text-slate-400"
                                                                                    >
                                                                                        No statement entries found.
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        {(statementsByAccount[account.accountId] || []).map(
                                                                            (row) => (
                                                                                <tr key={`${row.date}-${row.type}`}>
                                                                                    <td className="px-3 py-3 font-semibold text-slate-700">
                                                                                        {row.type}
                                                                                    </td>
                                                                                    <td className="px-3 py-3">
                                                                                        {Number(
                                                                                            row.previousBalance ||
                                                                                            0,
                                                                                        ).toFixed(2)}
                                                                                    </td>
                                                                                    <td className="px-3 py-3">
                                                                                        {Number(row.amountDue || 0).toFixed(
                                                                                            2,
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-3 py-3">
                                                                                        {Number(row.interest || 0).toFixed(2)}
                                                                                    </td>
                                                                                    <td className="px-3 py-3">
                                                                                        {Number(row.penalty || 0).toFixed(2)}
                                                                                    </td>
                                                                                    <td className="px-3 py-3">
                                                                                        {Number(row.amountPaid || 0).toFixed(
                                                                                            2,
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-3 py-3 font-semibold text-slate-700">
                                                                                        {Number(
                                                                                            row.totalBalance || 0,
                                                                                        ).toFixed(2)}
                                                                                    </td>
                                                                                    <td className="px-3 py-3 text-slate-600">
                                                                                        {row.description || '-'}
                                                                                    </td>
                                                                                    <td className="px-3 py-3">
                                                                                        {new Date(
                                                                                            row.date,
                                                                                        ).toLocaleDateString()}
                                                                                    </td>
                                                                                </tr>
                                                                            ),
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
