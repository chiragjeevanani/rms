import { createContext, useContext, useState, useEffect } from 'react';

const PosContext = createContext();

export function PosProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('rms_pos_orders');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('rms_pos_orders', JSON.stringify(orders));
  }, [orders]);

  const [isCustomerSectionOpen, setIsCustomerSectionOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleCustomerSection = () => setIsCustomerSectionOpen(prev => !prev);

  const placeKOT = (tableId, cart, total, staff = null) => {
    setOrders(prev => {
      const existingOrder = prev[tableId] || { 
        kots: [], 
        status: 'blank', 
        sessionStartTime: new Date().toISOString(),
        waiter: staff
      };
      
      const newKOT = {
        id: (existingOrder.kots?.length || 0) + 1,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: cart,
        total,
        staff: staff // Track staff per KOT if needed
      };

      return {
        ...prev,
        [tableId]: {
          ...existingOrder,
          kots: [...(existingOrder.kots || []), newKOT],
          waiter: staff || existingOrder.waiter, // Primary waiter for the table
          status: 'running-kot'
        }
      };
    });
  };

  const saveOrder = (tableId) => {
     setOrders(prev => ({
       ...prev,
       [tableId]: {
         ...prev[tableId],
         status: 'printed'
       }
     }));
  };

  const holdOrder = (tableId) => {
    setOrders(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        status: 'on-hold'
      }
    }));
  };

  const settleOrder = (tableId, paymentMethod) => {
     setOrders(prev => ({
       ...prev,
       [tableId]: {
         ...prev[tableId],
         status: 'paid',
         paymentMethod
       }
     }));
  };

  const clearTable = (tableId) => {
    setOrders(prev => {
      const newOrders = { ...prev };
      delete newOrders[tableId];
      return newOrders;
    });
  };

  return (
    <PosContext.Provider value={{ 
      isSidebarOpen, orders, toggleSidebar, closeSidebar, 
      isCustomerSectionOpen, toggleCustomerSection,
      placeKOT, saveOrder, holdOrder, settleOrder, clearTable 
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
