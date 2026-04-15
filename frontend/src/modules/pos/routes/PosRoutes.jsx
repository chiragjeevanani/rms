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
import TableView from '../pages/tables/TableView';
import TableList from '../pages/tables/TableList';
import Reservations from '../pages/tables/Reservations';
import PosOrderPage from '../pages/tables/PosOrderPage';

// Billing pages
import GenerateInvoice from '../pages/billing/GenerateInvoice';
import PaymentHistory from '../pages/billing/PaymentHistory';
import CashRegister from '../pages/billing/CashRegister';

// CRM
import CustomerList from '../pages/customers/CustomerList';

// New pages (rms 2.0 additions)
import MenuManagement from '../pages/menu/MenuManagement';
import OperationsDashboard from '../pages/operations/OperationsDashboard';

import { PosProvider } from '../context/PosContext';

export default function PosRoutes() {
  const isPosAuthenticated = !!localStorage.getItem('pos_access');

  if (isPosAuthenticated && window.location.pathname === '/pos/login') {
    return <Navigate to="/pos/tables" replace />;
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
    <PosProvider>
      <Routes>
        <Route path="/login" element={<PosLoginPage />} />
        <Route element={<PosLayout />}>
          <Route index element={<Navigate to="/pos/tables" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<PosDashboard />} />

          {/* Tables / Floor */}
          <Route path="tables" element={<TableView />} />
          <Route path="tables/list" element={<TableList />} />
          <Route path="tables/reservations" element={<Reservations />} />
          <Route path="order/:tableId" element={<PosOrderPage />} />

          {/* Orders */}
          <Route path="orders" element={<Navigate to="/pos/orders/active" replace />} />
          <Route path="orders/active" element={<ActiveOrders />} />
          <Route path="orders/completed" element={<CompletedOrders />} />
          <Route path="orders/cancelled" element={<CancelledOrders />} />

          {/* Billing */}
          <Route path="billing" element={<Navigate to="/pos/billing/generate" replace />} />
          <Route path="billing/generate" element={<GenerateInvoice />} />
          <Route path="billing/history" element={<PaymentHistory />} />
          <Route path="billing/register" element={<CashRegister />} />

          {/* CRM */}
          <Route path="customers/list" element={<CustomerList />} />

          {/* New: Menu Management */}
          <Route path="menu" element={<MenuManagement />} />

          {/* New: Operations Dashboard */}
          <Route path="operations" element={<OperationsDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/pos/tables" replace />} />
        </Route>
      </Routes>
    </PosProvider>
  );
}
