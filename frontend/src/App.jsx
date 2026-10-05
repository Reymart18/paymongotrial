import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import ReportsPage from './pages/ReportsPage';
import MembersPage from './pages/MembersPage';
import EmployeesPage from './pages/EmployeesPage';
import HomeownerDashboard from './pages/HomeownerDashboard';
import MemberWater from './pages/MemberWater';
import RequestComplaint from './pages/RequestComplaint';
import AdminRequestsComplaints from './pages/AdminRequestsComplaints';
import ChangePassword from './pages/ChangePassword';
import SOAPreview from './pages/SOAPreview';
import WaterPreview from './pages/WaterPreview';
import ProfilePage from './pages/ProfilePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import PortalAccessGuide from './pages/PortalAccessGuide';
import MemberAgreement from './pages/MemberAgreement';

/**
 * Protected Route Component
 * Redirects to login if no token is found
 */
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const mustChangePassword = localStorage.getItem('mustChangePassword') === 'true';
  const mustAcceptMemberAgreement = localStorage.getItem('mustAcceptMemberAgreement') === 'true';
  const currentPath = window.location.pathname;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole)
      ? [...requiredRole]
      : [requiredRole];

    if (allowedRoles.includes('admin') && !allowedRoles.includes('super_admin')) {
      allowedRoles.push('super_admin');
    }

    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
  }

  if (mustChangePassword) {
    if (userRole === 'homeowner' && currentPath !== '/homeowner/change-password') {
      return <Navigate to="/homeowner/change-password" replace />;
    }

    if ((userRole === 'admin' || userRole === 'super_admin') && currentPath !== '/admin/change-password') {
      return <Navigate to="/admin/change-password" replace />;
    }
  }

  if (userRole === 'homeowner' && !mustChangePassword && mustAcceptMemberAgreement && currentPath !== '/homeowner/member-agreement') {
    return <Navigate to="/homeowner/member-agreement" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/portal-access-guide" element={<PortalAccessGuide />} />

        {/* Protected routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute requiredRole="admin">
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/members"
          element={
            <ProtectedRoute requiredRole="admin">
              <MembersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute requiredRole="super_admin">
              <EmployeesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/change-password"
          element={
            <ProtectedRoute requiredRole="admin">
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/bod-announcements"
          element={
            <ProtectedRoute requiredRole="admin">
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/homeowner/dashboard"
          element={
            <ProtectedRoute requiredRole="homeowner">
              <HomeownerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/homeowner/change-password"
          element={
            <ProtectedRoute requiredRole="homeowner">
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="/homeowner/member-agreement"
          element={
            <ProtectedRoute requiredRole="homeowner">
              <MemberAgreement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/homeowner/profile"
          element={
            <ProtectedRoute requiredRole="homeowner">
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/soa-preview/:accountId"
          element={
            <ProtectedRoute>
              <SOAPreview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/requests-complaints"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminRequestsComplaints />
            </ProtectedRoute>
          }
        />

        <Route
          path="/homeowner/water-dashboard"
          element={
            <ProtectedRoute requiredRole="homeowner">
              <MemberWater />
            </ProtectedRoute>
          }
        />

        <Route
          path="/homeowner/requests-complaints"
          element={
            <ProtectedRoute requiredRole="homeowner">
              <RequestComplaint />
            </ProtectedRoute>
          }
        />

        <Route
          path="/water-preview/:accountId"
          element={
            <ProtectedRoute requiredRole={['homeowner', 'admin']}>
              <WaterPreview />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
