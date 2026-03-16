import { Routes, Route, Navigate } from 'react-router-dom';
import PosLayout from '../components/layout/PosLayout';
import PosDashboard from '../pages/PosDashboard';
import PosLoginPage from '../pages/PosLoginPage';

// Orders sub-pages
import ActiveOrders from '../pages/orders/ActiveOrders';
import CompletedOrders from '../pages/orders/CompletedOrders';
import CancelledOrders from '../pages/orders/CancelledOrders';

// Tables sub-pages
import TableLayout from '../pages/tables/TableLayout';
import TableList from '../pages/tables/TableList';
import Reservations from '../pages/tables/Reservations';

// Customers sub-pages
import CustomerList from '../pages/customers/CustomerList';
import AddCustomer from '../pages/customers/AddCustomer';
import LoyaltyPoints from '../pages/customers/LoyaltyPoints';

// Billing sub-pages
import GenerateBill from '../pages/billing/GenerateBill';
import PaymentHistory from '../pages/billing/PaymentHistory';
import CashRegister from '../pages/billing/CashRegister';

export default function PosRoutes() {
  const isPosAuthenticated = localStorage.getItem('pos_access'); // Mock auth check

  return (
    <Routes>
      <Route path="/login" element={<PosLoginPage />} />
      <Route element={<PosLayout />}>
        <Route path="/" element={<Navigate to={isPosAuthenticated ? "/pos/dashboard" : "/pos/login"} replace />} />
        <Route path="/dashboard" element={<PosDashboard />} />
        
        {/* Orders Routes */}
        <Route path="/orders/active" element={<ActiveOrders />} />
        <Route path="/orders/completed" element={<CompletedOrders />} />
        <Route path="/orders/cancelled" element={<CancelledOrders />} />
        
        {/* Tables Routes */}
        <Route path="/tables/layout" element={<TableLayout />} />
        <Route path="/tables/list" element={<TableList />} />
        <Route path="/tables/reservations" element={<Reservations />} />
        
        {/* Customers Routes */}
        <Route path="/customers/list" element={<CustomerList />} />
        <Route path="/customers/add" element={<AddCustomer />} />
        <Route path="/customers/loyalty" element={<LoyaltyPoints />} />
        
        {/* Billing Routes */}
        <Route path="/billing/generate" element={<GenerateBill />} />
        <Route path="/billing/history" element={<PaymentHistory />} />
        <Route path="/billing/register" element={<CashRegister />} />
      </Route>
    </Routes>
  );
}
