import DashboardCards from './components/HomeownerDashboard/DashboardCards';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import HomeownerDashboardNotices from './components/HomeownerDashboard/HomeownerDashboardNotices';
import HomeownerStatusMessage from './components/HomeownerDashboard/HomeownerStatusMessage';
import MustChangePasswordModal from './components/HomeownerDashboard/MustChangePasswordModal';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import StatementSection from './components/HomeownerDashboard/StatementSection';
import useHomeownerDashboardController from './components/HomeownerDashboard/useHomeownerDashboardController';

export default function HomeownerDashboard() {
    const dashboard = useHomeownerDashboardController();
    const toggleSidebar = () => dashboard.setSidebarOpen((isOpen) => !isOpen);
    const closeSidebar = () => dashboard.setSidebarOpen(false);
    const hasAccount = !dashboard.loading && !dashboard.error && dashboard.account;
    const shouldShowDashboard = Boolean(hasAccount);
    const shouldShowPasswordModal = Boolean(hasAccount && dashboard.mustChangePassword);
    const accountClassification = dashboard.account?.classification || 'Loading...';
    const pageClassName = 'min-h-screen bg-slate-50 text-slate-900 flex flex-col';
    const contentClassName = 'space-y-6 px-4 md:px-6 py-6 md:py-8';
    const previewSoa = () => dashboard.navigate(`/soa-preview/${dashboard.accountId}`);
    const changePassword = () => dashboard.navigate('/homeowner/change-password');

    return (
        <div className={pageClassName}>
            <Sidebar
                isOpen={dashboard.sidebarOpen}
                onToggle={toggleSidebar}
            />

            {dashboard.sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={closeSidebar}
                />
            )}

            <DashboardNav
                onLogout={dashboard.handleLogout}
                onProfile={dashboard.handleProfile}
                accountId={dashboard.accountId}
                classification={accountClassification}
                onSidebarToggle={toggleSidebar}
            />

            <div className="flex flex-1 transition-all duration-300 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className={contentClassName}>
                        <HomeownerDashboardNotices
                            account={dashboard.account}
                            error={dashboard.error}
                            loading={dashboard.loading}
                            overdueLoading={dashboard.overdueLoading}
                            overdueNotice={dashboard.overdueNotice}
                        />

                        {shouldShowDashboard && (
                            <DashboardCards
                                account={dashboard.account}
                                statementRows={dashboard.statementRows}
                            />
                        )}

                        {dashboard.loading && (
                            <HomeownerStatusMessage
                                variant="loading"
                                message="Loading account details..."
                            />
                        )}

                        {dashboard.error && (
                            <HomeownerStatusMessage
                                variant="error"
                                message={dashboard.error}
                            />
                        )}

                        {shouldShowDashboard && (
                            <>
                                {shouldShowPasswordModal && (
                                    <MustChangePasswordModal
                                        onChangePassword={changePassword}
                                    />
                                )}

                                <StatementSection
                                    accountId={dashboard.accountId}
                                    statementLoading={dashboard.statementLoading}
                                    statementError={dashboard.statementError}
                                    statementRows={dashboard.statementRows}
                                    onPreview={previewSoa}
                                    className="mt-8"
                                />
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
