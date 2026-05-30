import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import SuperAdminLogin from './modules/superadmin/pages/SuperAdminLogin';
import SuperAdminDashboard from './modules/superadmin/pages/SuperAdminDashboard';
import { SuperAdminThemeProvider } from './modules/superadmin/context/SuperAdminThemeContext';
import DashboardOverview from './modules/superadmin/components/DashboardOverview';
import AdminManagement from './modules/superadmin/components/AdminManagement';
import SecuritySettings from './modules/superadmin/components/SecuritySettings';
import SuperAdminReports from './modules/superadmin/pages/SuperAdminReports';
//
function RootRedirect() {
  const token = localStorage.getItem('superadmin_token');
  if (token) {
    return <Navigate to="/dashboard/overview" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <SuperAdminThemeProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<SuperAdminLogin />} />
          <Route path="/dashboard" element={<SuperAdminDashboard />}>
            <Route index element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="/dashboard/overview" element={<DashboardOverview />} />
            <Route path="/dashboard/admins" element={<AdminManagement />} />
            <Route path="/dashboard/security" element={<SecuritySettings />} />
            <Route path="/dashboard/reports" element={<SuperAdminReports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SuperAdminThemeProvider>
      <Toaster position="top-center" reverseOrder={false} />
    </BrowserRouter>
  );
}
