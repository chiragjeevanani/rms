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

function RootRedirect() {
  const isAdmin = localStorage.getItem('admin_access');
  const isStaff = localStorage.getItem('staff_access');
  const isPos = localStorage.getItem('pos_access');
  const isKds = localStorage.getItem('kds_access');
  const isUser = localStorage.getItem('user_token');

  console.log("RootRedirect triggered", { isStaff: !!isStaff });

  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (isStaff) return <Navigate to="/staff/dashboard" replace />;
  if (isPos) return <Navigate to="/pos/dashboard" replace />;
  if (isKds) return <Navigate to="/kds/dashboard" replace />;
  if (isUser) return <Navigate to="/menu" replace />;

  return <Navigate to="/welcome" replace />;
}

function App() {
  const [isBooting, setIsBooting] = useState(true);

  // Helper to safely check tokens
  const isValid = (key) => {
    const val = localStorage.getItem(key);
    return val && val !== 'undefined' && val !== 'null';
  };

  useEffect(() => {
    document.body.style.backgroundColor = '#FFFFFF';
    const timer = setTimeout(() => {
      setIsBooting(false);
    }, 1500); 
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
                <Route path="/" element={
                  isValid('admin_access') ? <Navigate to="/admin/dashboard" replace /> :
                  isValid('staff_access') ? <Navigate to="/staff/dashboard" replace /> :
                  isValid('pos_access') ? <Navigate to="/pos/dashboard" replace /> :
                  isValid('kds_access') ? <Navigate to="/kds/dashboard" replace /> :
                  isValid('user_token') ? <Navigate to="/menu" replace /> :
                  <Navigate to="/welcome" replace />
                } />
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
    </BrowserRouter>
  );
}

export default App;
