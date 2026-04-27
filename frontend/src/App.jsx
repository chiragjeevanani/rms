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
import ErrorBoundary from './components/error/ErrorBoundary';
import { SystemThemeProvider } from './context/SystemThemeContext';

function RootRedirect() {
  const isAdmin = localStorage.getItem('admin_access');
  const isStaff = localStorage.getItem('staff_access') && localStorage.getItem('staff_info');
  const isPos = localStorage.getItem('pos_access');
  const isKds = localStorage.getItem('kds_access');
  const isUser = localStorage.getItem('user_token');

  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (isStaff) return <Navigate to="/staff/profile" replace />;
  if (isPos) return <Navigate to="/pos/dashboard" replace />;
  if (isKds) return <Navigate to="/kds/dashboard" replace />;
  if (isUser) return <Navigate to="/menu" replace />;

  return <Navigate to="/welcome" replace />;
}

function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    // 1. Initial booting timer
    const timer = setTimeout(() => {
      setIsBooting(false);
    }, 1500);

    // 2. APK Black Screen Fix: Force reload when app resumes from background
    // This ensures the WebView re-initializes JS state correctly
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Only reload if we are not in the middle of a booting phase
        // and if we are on a mobile/APK environment (detected by user agent or just global)
        const isStaffPath = window.location.pathname.startsWith('/staff');
        if (isStaffPath) {
           // For staff app, we force reload to ensure session sync
           // window.location.reload(); 
           // NOTE: We'll keep it commented or use a soft refresh if needed, 
           // but for APKs, a hard reload is often the only way.
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (isBooting) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <SystemThemeProvider>
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
        </SystemThemeProvider>
      </ErrorBoundary>
      <Toaster position="top-center" reverseOrder={false} />
    </BrowserRouter>
  );
}

export default App;



