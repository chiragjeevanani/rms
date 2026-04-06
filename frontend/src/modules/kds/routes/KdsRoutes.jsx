import { Routes, Route, Navigate } from 'react-router-dom';
import KdsLayout from '../components/KdsLayout';
import KdsDashboard from '../pages/KdsDashboard';
import IncomingOrders from '../pages/IncomingOrders';
import PreparingOrders from '../pages/PreparingOrders';
import CompletedOrders from '../pages/CompletedOrders';
import KdsAccountSettings from '../pages/KdsAccountSettings';
import PreparationTime from '../pages/PreparationTime';
import PriorityRules from '../pages/PriorityRules';
import KdsLoginPage from '../pages/KdsLoginPage';
import KdsOrderDetailsPage from '../pages/KdsOrderDetailsPage';

export default function KdsRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<KdsLoginPage />} />
      
      {/* Protected KDS Routes - Check on every render */}
      <Route 
        element={<KdsProtectedWrapper />}
      >
        <Route path="/" element={<Navigate to="/kds/dashboard" replace />} />
        <Route path="/dashboard" element={<KdsDashboard />} />
        <Route path="/incoming" element={<IncomingOrders />} />
        <Route path="/preparing" element={<PreparingOrders />} />
        <Route path="/completed" element={<CompletedOrders />} />
        <Route path="/orders/:id" element={<KdsOrderDetailsPage />} />
        
        {/* Settings Sub-routes */}
        <Route path="/settings/stations" element={<KdsAccountSettings />} />
        <Route path="/settings/prep-time" element={<PreparationTime />} />
        <Route path="/settings/priority" element={<PriorityRules />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/kds" replace />} />
    </Routes>
  );
}

function KdsProtectedWrapper() {
  const isKdsAuthenticated = !!localStorage.getItem('kds_access');
  return isKdsAuthenticated ? <KdsLayout /> : <Navigate to="/kds/login" replace />;
}

