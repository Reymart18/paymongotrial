import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ComplaintForm from './components/RequestComplaint/ComplaintForm';
import RequestForm from './components/RequestComplaint/RequestForm';
import ServicesLanding from './components/RequestComplaint/ServicesLanding';
import SubmissionDetailsModal from './components/RequestComplaint/SubmissionDetailsModal';
import useResidentSubmissions from './components/RequestComplaint/useResidentSubmissions';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';

export default function RequestComplaint() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const accountId = localStorage.getItem('accountId') || '';
    const propertyDetails = JSON.parse(localStorage.getItem('propertyDetails') || '{}');
    const submissions = useResidentSubmissions();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accountId');
        localStorage.removeItem('mustChangePassword');
        localStorage.removeItem('propertyDetails');
        navigate('/login');
    };

    const renderActiveView = () => {
        if (submissions.activeView === 'request-form') {
            return (
                <RequestForm
                    form={submissions.requestForm}
                    formError={submissions.formError}
                    onBack={submissions.showServices}
                    onChange={submissions.handleRequestChange}
                    onSubmit={submissions.handleRequestSubmit}
                    submitting={submissions.submitting}
                    today={submissions.today}
                />
            );
        }

        if (submissions.activeView === 'complaint-form') {
            return (
                <ComplaintForm
                    form={submissions.complaintForm}
                    formError={submissions.formError}
                    onBack={submissions.showServices}
                    onChange={submissions.handleComplaintChange}
                    onSubmit={submissions.handleComplaintSubmit}
                    submitting={submissions.submitting}
                    today={submissions.today}
                />
            );
        }

        return (
            <ServicesLanding
                onOpenComplaint={submissions.openComplaintForm}
                onOpenDetails={submissions.openDetails}
                onOpenRequest={submissions.openRequestForm}
                recentSubmissions={submissions.recentSubmissions}
                submissionsLoading={submissions.submissionsLoading}
                successMessage={submissions.successMessage}
            />
        );
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <DashboardNav
                onLogout={handleLogout}
                onProfile={() => navigate('/homeowner/profile')}
                accountId={accountId}
                classification={propertyDetails.classification || 'Homeowner'}
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            <div className="flex flex-1 md:ml-64">
                <main className="flex-1 overflow-auto">
                    {renderActiveView()}
                </main>
            </div>

            <SubmissionDetailsModal
                apiUrl={submissions.apiUrl}
                onClose={submissions.closeDetails}
                submission={submissions.selectedSubmission}
            />
        </div>
    );
}
