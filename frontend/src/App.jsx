import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './modules/user/context/CartContext';
import { ThemeProvider } from './modules/user/context/ThemeContext';
import UserRoutes from './modules/user/routes/UserRoutes';
import StaffRoutes from './modules/staff/routes/StaffRoutes';
import KdsRoutes from './modules/kds/routes/KdsRoutes';
import PosRoutes from './modules/pos/routes/PosRoutes';
import AdminRoutes from './modules/admin/routes/AdminRoutes';
import { OrderProvider } from './context/OrderContext';
import { PosProvider } from './modules/pos/context/PosContext';
import { Toaster } from 'react-hot-toast';
import PageLoader from './components/ui/PageLoader';
import DebugOverlay from './components/ui/DebugOverlay';

function RootRedirect() {
  const staff = localStorage.getItem('staff_access');
  const admin = localStorage.getItem('admin_access');
  const pos = localStorage.getItem('pos_access');
  const kds = localStorage.getItem('kds_access');

  if (admin) return <Navigate to="/admin/dashboard" replace />;
  if (staff) return <Navigate to="/staff/dashboard" replace />;
  if (pos) return <Navigate to="/pos/dashboard" replace />;
  if (kds) return <Navigate to="/kds/dashboard" replace />;

  return <Navigate to="/welcome" replace />;
}

function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isBooting) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <CartProvider>
          <PosProvider>
            <OrderProvider>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/staff/*" element={<StaffRoutes />} />
                <Route path="/kds/*" element={<KdsRoutes />} />
                <Route path="/pos/*" element={<PosRoutes />} />
                <Route path="/admin/*" element={<AdminRoutes />} />
                <Route path="/*" element={<UserRoutes />} />
              </Routes>
            </OrderProvider>
          </PosProvider>
        </CartProvider>
      </ThemeProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <DebugOverlay />
    </BrowserRouter>
  );
}

export default App;
