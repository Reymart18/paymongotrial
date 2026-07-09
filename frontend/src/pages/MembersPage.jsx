import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import MemberDetailsDrawer from './components/Members/MemberDetailsDrawer';
import MembersTable from './components/Members/MembersTable';
import MembersToolbar from './components/Members/MembersToolbar';
import useMembersPage from './components/Members/useMembersPage';
import pvhaiImg from '../images/pvhai.png';

export default function MembersPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const members = useMembersPage();
    const adminLabel = localStorage.getItem('userRole') === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
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
                    accountId={adminLabel}
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
                                onSync={members.syncMembers}
                                ownershipType={members.ownershipType}
                                searchQuery={members.searchQuery}
                                statusType={members.statusType}
                                syncError={members.syncError}
                                syncLoading={members.syncLoading}
                                syncStatus={members.syncStatus}
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
                                onDelete={members.deleteAccount}
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
