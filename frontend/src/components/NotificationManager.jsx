import React, { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getMessaging, onMessage } from 'firebase/messaging';
import app, { requestForToken } from '../config/firebase';
import { useOrders } from '../context/OrderContext';

export default function NotificationManager({ role, branchId }) {
  const { fetchOrders } = useOrders();

  useEffect(() => {
    if (!branchId) return;

    const topic = role === 'kds' ? `kds_${branchId}` : `pos_${branchId}`;
    
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          requestForToken(topic);
        }
      });
    }

    // Listen for FCM Foreground messages continuously
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground Notification Received:", payload);
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-black text-[10px] uppercase tracking-widest text-[#ff7a00]">
            {payload.notification.title}
          </p>
          <p className="text-[9px] font-bold text-stone-600 leading-tight">
            {payload.notification.body}
          </p>
        </div>,
        { 
          duration: 6000, 
          position: 'top-right',
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#333',
            border: '1px solid #eee',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
          }
        }
      );
      fetchOrders();
    });

    return () => unsubscribe();
  }, [role, branchId, fetchOrders]);

  return <Toaster />;
}
