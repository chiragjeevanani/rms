import React, { useState, useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../navigation/Sidebar';
import TopBar from '../navigation/TopBar';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync Admin Info on Mount
  useEffect(() => {
    const syncProfile = async () => {
      try {
        const token = localStorage.getItem('admin_access');
        if (!token) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 403) {
          const errData = await res.json();
          if (errData.code === 'ACCOUNT_INACTIVE') {
            localStorage.removeItem('admin_access');
            localStorage.removeItem('admin_info');
            localStorage.removeItem('admin_restaurantId');
            toast.error(errData.message || 'Account deactivated. Logging out...');
            setTimeout(() => {
              window.location.href = '/admin/login';
            }, 1000);
            return;
          }
        }

        const data = await res.json();
        if (data && data._id) {
          // Flatten/format data to match login response if needed
          const updatedInfo = {
            id: data._id,
            name: data.name,
            email: data.email,
            thirdPartyApi: data.thirdPartyApi
          };
          localStorage.setItem('admin_info', JSON.stringify(updatedInfo));
          if (data.restaurantId) {
            localStorage.setItem('admin_restaurantId', data.restaurantId);
          }
        }
      } catch (err) {
        console.error('Profile sync failed');
      }
    };
    syncProfile();
  }, []);

  useEffect(() => {
    let email = '';
    try {
      const info = JSON.parse(localStorage.getItem('admin_info') || '{}');
      email = info.email;
    } catch (e) {}

    if (!email) return;

    const socketUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');
    const socket = io(socketUrl);

    socket.on(`admin_status_${email}`, (update) => {
      console.log('⚡ Real-time admin status update via socket:', update);
      
      const currentInfo = JSON.parse(localStorage.getItem('admin_info') || '{}');

      if (update.deleted || update.isActive === false || update.status === 'inactive') {
        toast.error('Your account has been deactivated or deleted by the superadmin. Logging out...', { duration: 4000 });
        localStorage.removeItem('admin_access');
        localStorage.removeItem('admin_info');
        localStorage.removeItem('admin_restaurantId');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
        return;
      }

      const updatedInfo = {
        ...currentInfo,
        ...(update.thirdPartyApi !== undefined ? { thirdPartyApi: update.thirdPartyApi } : {})
      };
      
      localStorage.setItem('admin_info', JSON.stringify(updatedInfo));
      
      // Dispatch custom event to let other components know the state has updated
      window.dispatchEvent(new Event('admin_info_updated'));
      toast.success('System configurations updated by Administrator.');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0EBE3] text-stone-800 selection:bg-amber-50 admin-layout transition-colors duration-500">
      {/* Structural Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className={`flex-1 flex flex-col h-screen min-w-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <TopBar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar">
          <Suspense fallback={
            <div className="h-full w-full flex items-center justify-center">
              <div className="w-8 h-8 border-[3px] border-[#ff7a00] border-t-transparent rounded-full animate-spin shadow-sm" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}



