import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import ServiceOverview from './components/AdminRequestsComplaints/ServiceOverview';
import SubmissionDetailsModal from './components/AdminRequestsComplaints/SubmissionDetailsModal';
import SubmissionQueue from './components/AdminRequestsComplaints/SubmissionQueue';
import SubmissionSummaryCards from './components/AdminRequestsComplaints/SubmissionSummaryCards';
import useAdminSubmissions from './components/AdminRequestsComplaints/useAdminSubmissions';
import pvhaiImg from '../images/pvhai.png';
import { clearAdminIdentity, getAdminDisplayName, getAdminRoleLabel } from '../utils/adminIdentity';

export default function AdminRequestsComplaints() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const role = localStorage.getItem('userRole');
    const adminName = getAdminDisplayName();
    const adminLabel = getAdminRoleLabel(role);
    const {
        apiUrl,
        requests,
        complaints,
        summary,
        loading,
        queueProps,
        modalProps,
        openCardFilter,
    } = useAdminSubmissions();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        clearAdminIdentity();
        navigate('/login');
    };

    const cards = [
        {
            label: 'Pending Requests',
            value: summary.pendingRequests,
            kind: 'request',
            iconClass: 'bg-emerald-100 text-emerald-700',
            cardClass: 'border-emerald-200/80',
            action: () => openCardFilter('requests', 'under review'),
        },
        {
            label: 'Pending Complaints',
            value: summary.pendingComplaints,
            kind: 'complaint',
            iconClass: 'bg-rose-100 text-rose-700',
            cardClass: 'border-rose-200/80',
            action: () => openCardFilter('complaints', 'under review'),
        },
        {
            label: 'Accepted Requests',
            value: summary.acceptedRequests,
            kind: 'accepted',
            iconClass: 'bg-emerald-100 text-emerald-700',
            cardClass: 'border-emerald-200/80',
            action: () => openCardFilter('requests', 'accepted'),
        },
        {
            label: 'Rejected Requests',
            value: summary.rejectedRequests,
            kind: 'rejected',
            iconClass: 'bg-rose-100 text-rose-700',
            cardClass: 'border-rose-200/80',
            action: () => openCardFilter('requests', 'rejected'),
        },
        {
            label: 'Resolved Complaints',
            value: summary.resolvedComplaints,
            kind: 'resolved',
            iconClass: 'bg-sky-100 text-sky-700',
            cardClass: 'border-sky-200/80',
            action: () => openCardFilter('complaints', 'resolved'),
        },
        {
            label: 'Under Review Complaints',
            value: summary.overdueComplaints,
            helper: '7 days being unresolved',
            kind: 'overdue',
            iconClass: 'bg-amber-100 text-amber-700',
            cardClass: 'border-amber-200/80',
            action: () => openCardFilter('complaints', 'under-review-7-days'),
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}
            <DashboardNav
                onLogout={handleLogout}
                accountId={adminName}
                classification={adminLabel}
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                avatarImage={pvhaiImg}
            />

            <div className="flex flex-1 md:ml-64">
                <main className="min-w-0 flex-1 overflow-auto">
                    <div className="mx-auto max-w-7xl space-y-10 px-4 py-7 md:space-y-12 md:px-10 md:py-10">
                        <ServiceOverview loading={loading} requestCount={requests.length} complaintCount={complaints.length} />
                        <SubmissionSummaryCards cards={cards} loading={loading} />
                        <SubmissionQueue
                            {...queueProps}
                            complaintCount={complaints.length}
                            requestCount={requests.length}
                        />
                    </div>
                </main>
            </div>

            <SubmissionDetailsModal
                {...modalProps}
                apiUrl={apiUrl}
            />
        </div>
    );
}
