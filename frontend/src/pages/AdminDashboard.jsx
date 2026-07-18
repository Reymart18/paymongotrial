import AccountsReportModal from './components/AdminDashboard/AccountsReportModal';
import AdminDashboardAlerts from './components/AdminDashboard/AdminDashboardAlerts';
import AdminDashboardCards from './components/AdminDashboard/AdminDashboardCards';
import AdminDashboardPrintStyles from './components/AdminDashboard/AdminDashboardPrintStyles';
import PaycatPaymentsModal from './components/AdminDashboard/PaycatPaymentsModal';
import PaymentsCollectionModal from './components/AdminDashboard/PaymentsCollectionModal';
import RecentAdminActivity from './components/AdminDashboard/RecentAdminActivity';
import StandingReportModal from './components/AdminDashboard/StandingReportModal';
import SyncStatusPanel from './components/AdminDashboard/SyncStatusPanel';
import useAdminDashboardController from './components/AdminDashboard/useAdminDashboardController';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import pvhaiImg from '../images/pvhai.png';
export default function AdminDashboard() {
    const dashboard = useAdminDashboardController();
    const toggleSidebar = () => dashboard.setSidebarOpen((isOpen) => !isOpen);
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <AdminDashboardPrintStyles />
            <Sidebar isOpen={dashboard.sidebarOpen} onToggle={toggleSidebar} />
            {dashboard.sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => dashboard.setSidebarOpen(false)}
                />
            )}
            <DashboardNav
                onLogout={dashboard.handleLogout}
                accountId={dashboard.adminName}
                classification={dashboard.adminLabel}
                onSidebarToggle={toggleSidebar}
                avatarImage={pvhaiImg}
            />
            <div className="flex flex-1 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className="space-y-6 px-4 md:px-6 py-6 md:py-8">
                        <AdminDashboardCards
                            currentBillingLabel={dashboard.summary.currentBillingLabel}
                            unpaidAccountsCount={dashboard.summary.unpaidAccountsCount}
                            overpaidAccountsCount={dashboard.summary.overpaidAccountsCount}
                            settledAccountsCount={dashboard.summary.settledAccountsCount}
                            notGoodStandingCount={dashboard.summary.notGoodStandingCount}
                            totalCollectedPayments={dashboard.summary.totalCollectedPayments}
                            loading={dashboard.summaryLoading}
                            onGenerateUnpaidReport={dashboard.handleGenerateUnpaidReport}
                            unpaidReportLoading={dashboard.unpaidLoading}
                            onGenerateSettledReport={dashboard.handleGenerateSettledReport}
                            settledReportLoading={dashboard.settledLoading}
                            onGenerateOverpaidReport={dashboard.handleGenerateOverpaidReport}
                            overpaidReportLoading={dashboard.overpaidLoading}
                            onGenerateNotGoodStandingReport={dashboard.handleGenerateNotGoodStandingReport}
                            notGoodStandingReportLoading={dashboard.notGoodStandingLoading}
                            onGeneratePaymentsReport={dashboard.handleGeneratePaymentsReport}
                            paymentsReportLoading={dashboard.paymentsReportLoading}
                        />
                        <SyncStatusPanel
                            syncInfo={dashboard.syncInfo}
                            loading={dashboard.syncStatusLoading}
                            requestLoading={dashboard.syncRequestLoading}
                            requestStatus={dashboard.syncRequestStatus}
                            onRequestSync={dashboard.requestSync}
                            formatTimestamp={dashboard.formatTimestamp}
                        />
                        <AdminDashboardAlerts messages={dashboard.alertMessages} />
                        <RecentAdminActivity
                            activityLoading={dashboard.activityLoading}
                            activityError={dashboard.activityError}
                            activityItems={dashboard.activityItems}
                            activityPage={dashboard.activityPage}
                            activityMeta={dashboard.activityMeta}
                            onActivityPageChange={dashboard.setActivityPage}
                            activityTitle={dashboard.activityTitle}
                            formatTimestamp={dashboard.formatTimestamp}
                        />
                    </div>
                </main>
            </div>
            <AccountsReportModal
                show={dashboard.showSettledModal}
                onClose={() => dashboard.setShowSettledModal(false)}
                onPrint={dashboard.handlePrintSettled}
                title="Settled Accounts"
                subtitle="Amount due/excess equals 0.00 for the current billing period."
                items={dashboard.filteredSettledItems}
                filter={dashboard.settledFilter}
                onFilterChange={dashboard.setSettledFilter}
                billingLabel={dashboard.settledBillingLabel}
                amountHeader="Amount Due / Excess"
                amountClassName="text-slate-600"
                emptyMessage="No settled accounts found."
                printClassName="print-settled"
                tablePrintClassName="print-settled-table"
                formatDate={dashboard.formatDate}
                formatMoney={dashboard.formatMoney}
            />
            <AccountsReportModal
                show={dashboard.showOverpaidModal}
                onClose={() => dashboard.setShowOverpaidModal(false)}
                onPrint={dashboard.handlePrintOverpaid}
                title="Overpaid Accounts"
                subtitle={`Amount Due / Excess as of ${dashboard.formatDateKey(dashboard.overpaidBillingEndDateKey)}.`}
                items={dashboard.filteredOverpaidItems}
                filter={dashboard.overpaidFilter}
                onFilterChange={dashboard.setOverpaidFilter}
                billingLabel={dashboard.overpaidBillingLabel}
                amountHeader="Amount Due / Excess"
                amountClassName="font-semibold text-rose-600"
                emptyMessage="No overpaid accounts found."
                printClassName="print-overpaid"
                tablePrintClassName="print-overpaid-table"
                formatDate={dashboard.formatDate}
                formatMoney={dashboard.formatMoney}
            />
            <AccountsReportModal
                show={dashboard.showUnpaidModal}
                onClose={() => dashboard.setShowUnpaidModal(false)}
                onPrint={dashboard.handlePrintUnpaid}
                title="Unpaid Accounts"
                subtitle={`Amount Due as of ${dashboard.formatDateKey(dashboard.unpaidBillingEndDateKey)}.`}
                items={dashboard.filteredUnpaidItems}
                filter={dashboard.unpaidFilter}
                onFilterChange={dashboard.setUnpaidFilter}
                billingLabel={dashboard.unpaidBillingLabel}
                amountHeader="Amount Due"
                amountClassName="font-semibold text-rose-600"
                emptyMessage="No unpaid accounts found."
                showGrandTotal
                formatDate={dashboard.formatDate}
                formatMoney={dashboard.formatMoney}
            />
            <StandingReportModal
                show={dashboard.showNotGoodStandingModal}
                onClose={() => dashboard.setShowNotGoodStandingModal(false)}
                onPrint={dashboard.handlePrintNotGoodStanding}
                items={dashboard.filteredNotGoodStandingItems}
                status={dashboard.notGoodStandingStatus}
                onStatusChange={dashboard.handleGenerateNotGoodStandingReport}
                filter={dashboard.notGoodStandingFilter}
                onFilterChange={dashboard.setNotGoodStandingFilter}
                billingLabel={dashboard.notGoodStandingBillingLabel}
                billingAsOf={dashboard.formatDateKey(dashboard.notGoodStandingBillingEndDateKey)}
                formatDate={dashboard.formatDate}
                formatMoney={dashboard.formatMoney}
            />
            <PaymentsCollectionModal
                show={dashboard.showPaymentsModal}
                onClose={() => dashboard.setShowPaymentsModal(false)}
                onPrint={dashboard.handlePrintPayments}
                items={dashboard.paymentsReportItems}
                billingLabel={dashboard.paymentsBillingLabel}
                onGeneratePaycatReport={dashboard.handleGeneratePaycatReport}
                paycatReportLoading={dashboard.paycatReportLoading}
                selectedPaycat={dashboard.selectedPaycat}
                formatMoney={dashboard.formatMoney}
            />
            <PaycatPaymentsModal
                show={dashboard.showPaycatModal}
                onClose={() => dashboard.setShowPaycatModal(false)}
                onPrint={dashboard.handlePrintPaycat}
                items={dashboard.paycatReportItems}
                selectedPaycat={dashboard.selectedPaycat}
                billingLabel={dashboard.paycatBillingLabel}
                formatDate={dashboard.formatDate}
                formatMoney={dashboard.formatMoney}
            />
        </div>
    );
}
