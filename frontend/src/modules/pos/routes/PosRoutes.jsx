import { Routes, Route, Navigate } from 'react-router-dom';
import PosLayout from '../components/layout/PosLayout';
import PosLoginPage from '../pages/PosLoginPage';

// Orders sub-pages
import ActiveOrders from '../pages/orders/ActiveOrders';
import CompletedOrders from '../pages/orders/CompletedOrders';
import CancelledOrders from '../pages/orders/CancelledOrders';

// Dashboard sub-page
import PosDashboard from '../pages/dashboard/PosDashboard';

// Tables sub-pages
import TableList from '../pages/tables/TableList';
import Reservations from '../pages/tables/Reservations';
import PosOrderPage from '../pages/tables/PosOrderPage';
import GenerateInvoice from '../pages/billing/GenerateInvoice';
import PaymentHistory from '../pages/billing/PaymentHistory';
import { PosProvider } from '../context/PosContext';

export default function PosRoutes() {
  const isPosAuthenticated = !!localStorage.getItem('pos_access');

  // If already authenticated and trying to access login, redirect to dashboard
  if (isPosAuthenticated && window.location.pathname === '/pos/login') {
    return <Navigate to="/pos/dashboard" replace />;
  }

  if (!isPosAuthenticated && window.location.pathname !== '/pos/login') {
    return (
      <Routes>
        <Route path="/login" element={<PosLoginPage />} />
        <Route path="*" element={<Navigate to="/pos/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<PosLoginPage />} />
      <Route element={<PosLayout />}>
        <Route index element={<Navigate to="/pos/dashboard" replace />} />
        <Route path="dashboard" element={<PosDashboard />} />
        <Route path="tables" element={<Navigate to="/pos/tables/list" replace />} />
        <Route path="tables/list" element={<TableList />} />
        <Route path="tables/reservations" element={<Reservations />} />
        <Route path="order/:tableId" element={<PosOrderPage />} />

        {/* Orders Routes */}
        <Route path="orders/active" element={<ActiveOrders />} />
        <Route path="orders/completed" element={<CompletedOrders />} />
        <Route path="orders/cancelled" element={<CancelledOrders />} />

        {/* Billing Routes */}
        <Route path="billing/generate" element={<GenerateInvoice />} />
        <Route path="billing/history" element={<PaymentHistory />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/pos/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
