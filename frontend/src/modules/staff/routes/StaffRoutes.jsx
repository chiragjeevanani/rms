import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import StaffLogin from '../pages/StaffLogin';
import StaffDashboard from '../pages/StaffDashboard';
import MyTables from '../pages/MyTables';
import ActiveOrders from '../pages/ActiveOrders';
import ReadyOrders from '../pages/ReadyOrders';
import CreateOrder from '../pages/CreateOrder';
import MyProfile from '../pages/MyProfile';
import Attendance from '../pages/Attendance';
import TableOrderScreen from '../pages/TableOrderScreen';
import AlertsPage from '../pages/AlertsPage';
import StaffItemDetail from '../pages/StaffItemDetail';

export default function StaffRoutes() {
  const isStaffAuthenticated = !!localStorage.getItem('staff_access');
  const location = useLocation();

  // If already authenticated and trying to access login, redirect to dashboard
  if (isStaffAuthenticated && location.pathname === '/staff/login') {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<StaffLogin />} />

      {/* Protected Staff Routes */}
      <Route element={<StaffProtectedWrapper />}>
        <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/dashboard" element={<StaffDashboard />} />
        <Route path="/tables" element={<MyTables />} />

        {/* Order Routes */}
        <Route path="/active-orders" element={<ActiveOrders />} />
        <Route path="/ready-orders" element={<ReadyOrders />} />
        <Route path="/create-order" element={<CreateOrder />} />
        <Route path="/table/:id" element={<TableOrderScreen />} />
        <Route path="/item/:id" element={<StaffItemDetail />} />

        {/* Profile Routes */}
        <Route path="/profile" element={<MyProfile />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/alerts" element={<AlertsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
    </Routes>
  );
}

function StaffProtectedWrapper() {
  const isStaffAuthenticated = !!localStorage.getItem('staff_access');
  
  if (!isStaffAuthenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  return (
    <>
      <Outlet />
    </>
  );
}




