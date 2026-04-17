import React, { useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import AdminLoginPage from '../pages/AdminLoginPage';
import TableManagement from '../pages/TableManagement';

import Categories from '../pages/menu/Categories';
import MenuItems from '../pages/menu/MenuItems';
import Modifiers from '../pages/menu/Modifiers';
import ComboMeals from '../pages/menu/ComboMeals';
import ItemDetails from '../pages/menu/ItemDetails';
import ComboDetails from '../pages/menu/ComboDetails';

import AccountSettings from '../pages/settings/AccountSettings';

import StockManagement from '../pages/inventory/StockManagement';
import Vendors from '../pages/inventory/Vendors';
import PurchaseOrders from '../pages/inventory/PurchaseOrders';
import Wastage from '../pages/inventory/Wastage';

import AllOrders from '../pages/orders/AllOrders';
import OnlineOrders from '../pages/orders/OnlineOrders';
import CancelledOrders from '../pages/orders/CancelledOrders';

import StaffList from '../pages/staff/StaffList';
import Roles from '../pages/staff/Roles';
import Attendance from '../pages/staff/Attendance';

import SalesReports from '../pages/reports/SalesReports';
import InventoryReports from '../pages/reports/InventoryReports';
import CustomerReports from '../pages/reports/CustomerReports';

export default function AdminRoutes() {
  const location = useLocation();
  const isAdminAuthenticated = localStorage.getItem('admin_access');

  // If not authenticated and not currently on the login page, redirect to login
  if (!isAdminAuthenticated && location.pathname !== '/admin/login') {
    return (
      <Routes>
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }
  // If already authenticated and trying to access login, go to dashboard
  if (isAdminAuthenticated && location.pathname === '/admin/login') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="outlets" element={<OutletManagement />} />
        <Route path="tables" element={<TableManagement />} />

        {/* Menu Management */}
        <Route path="menu" element={<MenuManagement />} />
        <Route path="menu/categories" element={<Categories />} />
        <Route path="menu/items" element={<MenuItems />} />
        <Route path="menu/modifiers" element={<Modifiers />} />
        <Route path="menu/combos" element={<ComboMeals />} />
        <Route path="menu/items/:id" element={<ItemDetails />} />
        <Route path="menu/combos/:id" element={<ComboDetails />} />

        {/* Inventory Management */}
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="inventory/stock" element={<StockManagement />} />
        <Route path="inventory/vendors" element={<Vendors />} />
        <Route path="inventory/orders" element={<PurchaseOrders />} />
        <Route path="inventory/wastage" element={<Wastage />} />

        {/* Order Management */}
        <Route path="orders" element={<OrderManagement />} />
        <Route path="orders/all" element={<AllOrders />} />
        <Route path="orders/online" element={<OnlineOrders />} />
        <Route path="orders/cancelled" element={<CancelledOrders />} />

        {/* Staff & User Management */}
        <Route path="staff" element={<StaffManagement />} />
        <Route path="staff/list" element={<StaffList />} />
        <Route path="staff/roles" element={<Roles />} />
        <Route path="staff/attendance" element={<Attendance />} />

        {/* Reports & Analytics */}
        <Route path="reports/sales" element={<SalesReports />} />
        <Route path="reports/inventory" element={<InventoryReports />} />
        <Route path="reports/customers" element={<CustomerReports />} />

        {/* Misc & Settings */}
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="finance" element={<FinancialManagement />} />
        
        {/* Settings Routes */}
        <Route path="settings" element={<SystemSettings />} />
        <Route path="settings/profile" element={<AccountSettings />} />
        <Route path="settings/security" element={<AccountSettings />} />
        <Route path="settings/:section" element={<SystemSettings />} />

        {/* Handle missing sub-routes by redirecting to Admin Dashboard */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
}



