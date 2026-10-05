import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import MemberDetailsDrawer from './components/Members/MemberDetailsDrawer';
import MembersTable from './components/Members/MembersTable';
import MembersToolbar from './components/Members/MembersToolbar';
import MemberInvitationPanel from './components/Members/MemberInvitationPanel';
import useMembersPage from './components/Members/useMembersPage';
import pvhaiImg from '../images/pvhai.png';
import { clearAdminIdentity, getAdminDisplayName, getAdminRoleLabel } from '../utils/adminIdentity';

export default function MembersPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const navigate = useNavigate();
    const members = useMembersPage();
    const adminName = getAdminDisplayName();
    const adminLabel = getAdminRoleLabel();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        clearAdminIdentity();
        navigate('/login');
    };

    const openDeleteModal = (accountId) => {
        const account = members.paginatedAccounts.find((item) => item.accountId === accountId)
            || { accountId };
        setDeleteTarget(account);
    };

    const closeDeleteModal = () => {
        if (deleteLoading) {
            return;
        }
        setDeleteTarget(null);
    };

    const confirmDeleteAccount = async () => {
        if (!deleteTarget?.accountId) {
            return;
        }

        setDeleteLoading(true);
        await members.deleteAccount(deleteTarget.accountId);
        setDeleteLoading(false);
        setDeleteTarget(null);
    };

    return (
        <>
            <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#FFFAFA' }}>
                <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                <DashboardNav
                    onLogout={handleLogout}
                    accountId={adminName}
                    classification={adminLabel}
                    onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                    avatarImage={pvhaiImg}
                />

                <div className="flex flex-1 md:ml-64">
                    <main className="flex-1 overflow-auto">
                        <div className="px-8 py-8">
                            <h1 className="mb-8 text-4xl font-bold text-gray-800">Members List</h1>
                            <MembersToolbar
                                onOwnershipChange={members.setOwnershipType}
                                onSearchChange={members.setSearchQuery}
                                onStatusChange={members.setStatusType}
                                onInvitationChange={members.setInvitationType}
                                onSync={members.syncMembers}
                                ownershipType={members.ownershipType}
                                searchQuery={members.searchQuery}
                                statusType={members.statusType}
                                invitationType={members.invitationType}
                                syncError={members.syncError}
                                syncLoading={members.syncLoading}
                                syncStatus={members.syncStatus}
                            />
                            <MemberInvitationPanel
                                summary={members.invitationSummary}
                                loading={members.invitationLoading}
                                error={members.invitationError}
                                isSuperAdmin={members.isSuperAdmin}
                                onSendNext={members.sendNextInvitations}
                                onRetryFailed={members.retryFailedInvitations}
                            />
                            <MembersTable
                                accounts={members.paginatedAccounts}
                                balances={members.balances}
                                currentPage={members.currentPage}
                                error={members.error}
                                filteredCount={members.filteredCount}
                                isSuperAdmin={members.isSuperAdmin}
                                itemsPerPage={members.itemsPerPage}
                                loading={members.loading}
                                onDelete={openDeleteModal}
                                onPageChange={members.setCurrentPage}
                                onPreviewSoa={members.previewSoa}
                                onPreviewWater={members.previewWater}
                                previewingWaterAccountId={members.previewingWaterAccountId}
                                onView={members.viewDetails}
                                sortedCount={members.sortedCount}
                                startIndex={members.startIndex}
                                totalPages={members.totalPages}
                            />
                        </div>
                    </main>
                </div>

                {deleteTarget && (
                    <div className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
                        <div className="absolute inset-0" onClick={closeDeleteModal} />
                        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                                    <span className="text-lg font-bold">!</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">Delete Member Account</h3>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Are you sure you want to delete {deleteTarget.accountId}
                                        {deleteTarget.memberName ? ` - ${deleteTarget.memberName}` : ''}? This will remove related billing and payment records.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                    onClick={closeDeleteModal}
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                                    onClick={confirmDeleteAccount}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? 'Deleting...' : 'Delete Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <MemberDetailsDrawer
                account={members.viewAccount}
                isSuperAdmin={members.isSuperAdmin}
                onClose={members.closeViewAccount}
                onResetPassword={members.resetPassword}
                resetError={members.resetError}
                resetLoading={members.resetLoading}
                resetStatus={members.resetStatus}
            />
        </>
    );
}
