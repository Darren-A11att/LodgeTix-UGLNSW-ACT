import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminEventDetailsPage from './pages/AdminEventDetailsPage';
import AdminRegistrationsPage from './pages/AdminRegistrationsPage';
import AdminRegistrationDetailsPage from './pages/AdminRegistrationDetailsPage';
import AdminCustomersPage from './pages/AdminCustomersPage';
import AdminCustomerDetailsPage from './pages/AdminCustomerDetailsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminNotFoundPage from './pages/AdminNotFoundPage';
// Import commented out for now - will be used later when implementing authentication
// import AdminLoginPage from './pages/AdminLoginPage';
// import AdminProtectedRoute from './components/layout/AdminProtectedRoute';

function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        {/* Temporarily skipping authentication */}
        {/* <Route path="/admin/login" element={<AdminLoginPage />} /> */}
        
        {/* Admin Routes (no protection for now) */}
        <Route
          path="/"
          element={<AdminLayout />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          
          {/* Events */}
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="events/:eventId" element={<AdminEventDetailsPage />} />
          
          {/* Registrations */}
          <Route path="registrations" element={<AdminRegistrationsPage />} />
          <Route path="registrations/:registrationId" element={<AdminRegistrationDetailsPage />} />
          
          {/* Customers */}
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="customers/:customerId" element={<AdminCustomerDetailsPage />} />
          
          {/* Users */}
          <Route path="users" element={<AdminUsersPage />} />
          
          {/* Settings */}
          <Route path="settings" element={<AdminSettingsPage />} />
          
          {/* Reports */}
          <Route path="reports" element={<AdminReportsPage />} />
        </Route>
        
        {/* Catch all route for admin paths */}
        <Route path="*" element={<AdminNotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default AdminApp;