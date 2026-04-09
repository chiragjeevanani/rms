import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const PosContext = createContext();
const apiUrl = import.meta.env.VITE_API_URL || '';
const socketUrl = apiUrl.replace('/api', '') || window.location.origin;
const socket = io(socketUrl);

export function PosProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState({}); // Local cache of active table orders
  const [tables, setTables] = useState([]); // Real-time tables from backend
  const [loading, setLoading] = useState(true);

  const fetchActiveTableOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/active`);
      const result = await response.json();
      if (result.success) {
        const orderMap = {};
        result.data.forEach(order => {
          orderMap[order.tableName] = order;
        });
        setOrders(orderMap);
      }
    } catch (err) {
      console.error('Failed to sync POS orders:', err);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/table`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncAll = async () => {
    setLoading(true);
    await Promise.all([fetchActiveTableOrders(), fetchTables()]);
    setLoading(false);
  };

  useEffect(() => {
    syncAll();

    // Listen for real-time updates
    socket.on('orderCreated', syncAll);
    socket.on('kotAdded', syncAll);
    socket.on('statusUpdated', syncAll);
    socket.on('orderPaid', syncAll);
    socket.on('tableStatusChanged', fetchTables);

    return () => {
      socket.off('orderCreated');
      socket.off('kotAdded');
      socket.off('statusUpdated');
      socket.off('orderPaid');
      socket.off('tableStatusChanged');
    };
  }, []);

  const placeKOT = async (tableName, cart, financials, waiter) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          items: cart,
          ...financials,
          waiterName: waiter?.name || 'Staff'
        })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message || 'KOT Placed Successfully');
        syncAll();
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Network error during KOT placement');
      return false;
    }
  };

  const settleOrder = async (orderId, paymentDetails) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}/settle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments: paymentDetails, status: 'Paid' })
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Bill Settled Successfully');
        syncAll();
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Network error during settlement');
      return false;
    }
  };

  const voidItem = async (orderId, itemId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}/item/${itemId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Item Voided');
        syncAll();
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Network error during item voiding');
      return false;
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <PosContext.Provider value={{ 
      isSidebarOpen, orders, tables, toggleSidebar, closeSidebar, 
      loading, fetchActiveTableOrders: syncAll, placeKOT, settleOrder, voidItem
    }}>
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
}
