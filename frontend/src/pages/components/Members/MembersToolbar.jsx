import AdminStatusMessage from '../AdminDashboard/AdminStatusMessage';

export default function MembersToolbar({
    onOwnershipChange,
    onSearchChange,
    onStatusChange,
    onSync,
    ownershipType,
    searchQuery,
    statusType,
    syncError,
    syncLoading,
    syncStatus,
}) {
    return (
        <>
            <div className="mb-8 flex flex-col items-stretch gap-3 rounded-lg p-4 md:flex-row md:items-center md:gap-4 md:p-6" style={{ backgroundColor: 'rgba(232, 155, 88, 0.32)' }}>
                <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="w-full rounded-lg bg-white px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-0 focus:ring-[#E89B58] md:w-sm"
                    style={{ border: '1px solid rgba(140, 65, 0, 0.58)' }}
                />
                <select value={ownershipType} onChange={(event) => onOwnershipChange(event.target.value)} className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-0 focus:ring-[#E89B58] md:ml-auto" style={{ border: '1px solid rgba(140, 65, 0, 0.58)' }}>
                    <option value="">Ownership Type</option>
                    <option value="homeowner">Homeowner</option>
                    <option value="lot owner">Lot Owner</option>
                </select>
                <select value={statusType} onChange={(event) => onStatusChange(event.target.value)} className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-0 focus:ring-[#E89B58]" style={{ border: '1px solid rgba(140, 65, 0, 0.58)' }}>
                    <option value="">Status</option>
                    <option value="underpaid">Unpaid</option>
                    <option value="overpaid">Overpaid</option>
                </select>
                <button type="button" onClick={onSync} disabled={syncLoading} className="rounded-lg bg-[#E89B58] px-6 py-2 text-sm font-medium text-white transition hover:bg-[#d88a47] disabled:cursor-not-allowed disabled:opacity-70" style={{ border: '1px solid rgba(140, 65, 0, 0.58)' }}>
                    {syncLoading ? 'Syncing...' : 'Sync Members'}
                </button>
            </div>
            {syncStatus && <AdminStatusMessage variant="success" message={syncStatus} className="mb-6" />}
            {syncError && <AdminStatusMessage variant="error" message={syncError} className="mb-6" />}
        </>
    );
}
