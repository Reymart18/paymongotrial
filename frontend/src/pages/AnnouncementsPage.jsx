import AnnouncementForm from './components/Announcements/AnnouncementForm';
import AnnouncementsFeed from './components/Announcements/AnnouncementsFeed';
import AnnouncementsHeader from './components/Announcements/AnnouncementsHeader';
import AnnouncementsStatus from './components/Announcements/AnnouncementsStatus';
import ImageViewerModal from './components/Announcements/ImageViewerModal';
import useAnnouncementsController from './components/Announcements/useAnnouncementsController';
import DashboardNav from './components/HomeownerDashboard/DashboardNav';
import Sidebar from './components/HomeownerDashboard/Sidebar';
import pvhaiImg from '../images/pvhai.png';

export default function AnnouncementsPage() {
    const page = useAnnouncementsController();
    const toggleSidebar = () => page.setSidebarOpen((isOpen) => !isOpen);
    const closeSidebar = () => page.setSidebarOpen(false);
    const closeImageViewer = () => page.setViewingImage(null);
    const toggleCreateForm = () => page.setShowCreateForm(!page.showCreateForm);

    const canManageAnnouncements = page.isSuperAdmin;
    const dashboardAvatar = page.isStaff ? pvhaiImg : undefined;
    const dashboardClassification = page.isStaff
        ? page.adminLabel
        : (page.account?.classification || 'Loading...');
    const formIsVisible = canManageAnnouncements && (page.showCreateForm || page.editingId);
    const formSubmitHandler = page.editingId
        ? page.handleSaveEdit
        : page.handleAddAnnouncement;
    const visibleAnnouncementCount = page.visibleAnnouncements.length;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <Sidebar isOpen={page.sidebarOpen} onToggle={toggleSidebar} />
            {page.sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={closeSidebar}
                />
            )}
            <DashboardNav
                onLogout={page.handleLogout}
                onProfile={page.handleProfile}
                accountId={page.accountId}
                classification={dashboardClassification}
                onSidebarToggle={toggleSidebar}
                avatarImage={dashboardAvatar}
            />
            <div className="flex flex-1 md:ml-64">
                <main className="flex-1 overflow-auto">
                    <div className="space-y-6 px-3 py-4 md:px-6 md:py-8">
                        <AnnouncementsHeader
                            announcementsError={page.announcementsError}
                            announcementsLoading={page.announcementsLoading}
                            isBodOnlyView={page.isBodOnlyView}
                            isSuperAdmin={canManageAnnouncements}
                            onToggleCreate={toggleCreateForm}
                            visibleCount={visibleAnnouncementCount}
                        />
                        <AnnouncementForm
                            announcementImage={page.announcementImage}
                            editingId={page.editingId}
                            isCreating={page.isCreating}
                            isEditing={page.isEditing}
                            isVisible={formIsVisible}
                            newAnnouncement={page.newAnnouncement}
                            onCancel={page.handleCancelForm}
                            onSubmit={formSubmitHandler}
                            setAnnouncementImage={page.setAnnouncementImage}
                            setNewAnnouncement={page.setNewAnnouncement}
                        />
                        <AnnouncementsStatus
                            announcements={page.announcements}
                            announcementsError={page.announcementsError}
                            announcementsLoading={page.announcementsLoading}
                        />
                        <AnnouncementsFeed
                            announcements={page.announcements}
                            announcementsError={page.announcementsError}
                            announcementsLoading={page.announcementsLoading}
                            carouselIndex={page.carouselIndex}
                            carouselSlides={page.carouselSlides}
                            editingId={page.editingId}
                            expandedRecentIds={page.expandedRecentIds}
                            featuredAnnouncement={page.featuredAnnouncement}
                            formatDate={page.formatDate}
                            formatTarget={page.formatTarget}
                            getAnnouncementImageUrl={page.getAnnouncementImageUrl}
                            isSuperAdmin={canManageAnnouncements}
                            onDeleteAnnouncement={page.handleDeleteAnnouncement}
                            onEditAnnouncement={page.handleEditAnnouncement}
                            onViewImage={page.setViewingImage}
                            recentAnnouncements={page.recentAnnouncements}
                            toggleRecentAnnouncement={page.toggleRecentAnnouncement}
                        />
                    </div>
                </main>
            </div>
            <ImageViewerModal
                image={page.viewingImage}
                onClose={closeImageViewer}
            />
        </div>
    );
}
