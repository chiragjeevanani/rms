
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import AdminDashboard from '../pages/AdminDashboard';
import OutletManagement from '../pages/OutletManagement';
import MenuManagement from '../pages/MenuManagement';
import InventoryManagement from '../pages/InventoryManagement';
import StaffManagement from '../pages/StaffManagement';
import FinancialManagement from '../pages/FinancialManagement';
import OrderManagement from '../pages/OrderManagement';
import SystemSettings from '../pages/SystemSettings';
import AuditLogs from '../pages/AuditLogs';
import AnalyticsDashboard from '../pages/AnalyticsDashboard';
import CustomerManagement from '../pages/CustomerManagement';

// Placeholder components for other modules
const Placeholder = ({ title }) => (
  <div className="p-8 flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-xl font-black uppercase tracking-widest text-slate-300">{title}</h2>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Module is under development</p>
    </div>
  </div>
);

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="outlets" element={<OutletManagement />} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="finance" element={<FinancialManagement />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="settings/:section" element={<SystemSettings />} />
        
        {/* Handle missing sub-routes by redirecting to Admin Dashboard */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
