import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import ReportsDataTools from './components/Reports/ReportsDataTools';
import ReportsHeader from './components/Reports/ReportsHeader';
import ReportsModals from './components/Reports/ReportsModals';
import ReportsPrintStyles from './components/Reports/ReportsPrintStyles';
import ReportsSummaryCards from './components/Reports/ReportsSummaryCards';
import ReportsSoaUpload from './components/Reports/ReportsSoaUpload';
import ReportsWaterBillingUpload from './components/Reports/ReportsWaterBillingUpload';
import useReportsPageState from './components/Reports/useReportsPageState';
import pvhaiImg from '../images/pvhai.png';
import cbIcon from '../images/cb.png';
import rpIcon from '../images/rp.png';
import toIcon from '../images/to.png';

export default function ReportsPage() {
    const {
        adminName,
        adminLabel,
        error,
        year,
        quarter,
        setYear,
        setQuarter,
        sidebarOpen,
        setSidebarOpen,
        handleLogout,
        summaryProps,
        dataToolsProps,
        waterBillingProps,
        soaProps,
        modalsProps,
    } = useReportsPageState();

    const toggleSidebar = () => setSidebarOpen((isOpen) => !isOpen);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <ReportsPrintStyles />

            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={closeSidebar}
                />
            )}

            <DashboardNav
                onLogout={handleLogout}
                accountId={adminName}
                classification={adminLabel}
                onSidebarToggle={toggleSidebar}
                avatarImage={pvhaiImg}
            />

            <div className="flex flex-1 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className="space-y-6 px-4 md:px-6 py-6 md:py-8">
                        <ReportsHeader
                            year={year}
                            quarter={quarter}
                            onYearChange={setYear}
                            onQuarterChange={setQuarter}
                        />

                        <ReportsSummaryCards
                            {...summaryProps}
                            icons={{ cbIcon, rpIcon, toIcon }}
                        />

                        {error && (
                            <div className="rounded-lg border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        <ReportsDataTools {...dataToolsProps} />

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <ReportsWaterBillingUpload {...waterBillingProps} />
                            <ReportsSoaUpload {...soaProps} />
                        </div>
                    </div>
                </main>
            </div>

            <ReportsModals {...modalsProps} />
        </div>
    );
}
