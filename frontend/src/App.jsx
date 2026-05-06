import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import ReportsPage from './pages/ReportsPage';
import MembersPage from './pages/MembersPage';
import EmployeesPage from './pages/EmployeesPage';
import HomeownerDashboard from './pages/HomeownerDashboard';
import ChangePassword from './pages/ChangePassword';
import SOAPreview from './pages/SOAPreview';
import ProfilePage from './pages/ProfilePage';
import AnnouncementsPage from './pages/AnnouncementsPage';

/**
 * Protected Route Component
 * Redirects to login if no token is found
 */
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

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

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

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
          path="/announcements"
          element={
            <ProtectedRoute>
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

        {/* Root redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
