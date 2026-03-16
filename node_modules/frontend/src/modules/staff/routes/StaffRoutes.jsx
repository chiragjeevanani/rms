import { Routes, Route, Navigate } from 'react-router-dom';
import StaffLogin from '../pages/StaffLogin';
import TableDashboard from '../pages/TableDashboard';
import ActiveOrders from '../pages/ActiveOrders';
import TableOrderScreen from '../pages/TableOrderScreen';
import AlertsPage from '../pages/AlertsPage';

export default function StaffRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/staff/login" replace />} />
      <Route path="/login" element={<StaffLogin />} />
      <Route path="/dashboard" element={<TableDashboard />} />
      <Route path="/active-orders" element={<ActiveOrders />} />
      <Route path="/table/:id" element={<TableOrderScreen />} />
      <Route path="/alerts" element={<AlertsPage />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/staff/login" replace />} />
    </Routes>
  );
}
