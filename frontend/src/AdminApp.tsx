import React from 'react';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from './components/ToastContainer';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { LogoutModal } from './components/LogoutModal';
import { Footer } from './components/Footer';

export const AdminApp: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  // Security Gate: Only authenticated administrators can access admin console
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="admin-portal-shell unauthenticated-gate">
        <ToastContainer />
        <AdminLogin />
      </div>
    );
  }

  return (
    <div className="app-shell admin-portal-shell">
      {/* Global Notifications */}
      <ToastContainer />

      {/* Admin Navigation Bar */}
      <Navbar portalMode="admin" />

      {/* Main Admin Console Content */}
      <main className="main-content-area admin-content-area">
        <div className="admin-view-wrapper">
          <AdminDashboard />
        </div>
      </main>

      {/* Logout Modal */}
      <LogoutModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdminApp;
