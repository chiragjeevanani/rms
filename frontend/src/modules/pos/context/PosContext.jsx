import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const PosContext = createContext();
const socket = io((import.meta.env.VITE_API_URL || '').replace('/api', ''));

export function PosProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState({ name: 'Biller' });
  const [reservations, setReservations] = useState([]);

  // ── Backend-synced orders (active table orders from API) ──
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);

  // ── Backend-synced tables ──
  const [tables, setTables] = useState([]);

  // ── Dynamic Sections (for TableView UI grouping) ──
  const [sections, setSections] = useState(() => {
    try {
      const saved = localStorage.getItem('rms_pos_sections');
      if (saved) return JSON.parse(saved);
      return [
        { id: 'ac', label: 'AC' },
        { id: 'garden', label: 'Garden' },
        { id: 'non-ac', label: 'Non-AC' },
        { id: 'rooftops', label: 'Rooftops' },
        { id: 'second-floor', label: 'Second Floor' },
        { id: 'car-service', label: 'Car Service' }
      ];
    } catch { return []; }
  });

  // ── Car Service Orders (fully local, no backend yet) ──
  const [carOrders, setCarOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('rms_pos_car_orders');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // ── Persist sections and car orders ──
  useEffect(() => {
    localStorage.setItem('rms_pos_sections', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('rms_pos_car_orders', JSON.stringify(carOrders));
  }, [carOrders]);

  // ── Backend Fetch Functions ──
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

  // ── Backend Actions ──
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

  const addTable = async (tableData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tableData)
      });
      if (response.ok) {
        toast.success('Table added to floor plan');
        fetchTables();
        return true;
      }
      const err = await response.json();
      toast.error(err.message || 'Failed to add table');
      return false;
    } catch (err) {
      toast.error('Network error while adding table');
      return false;
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reservations`);
      const result = await response.json();
      if (result.success) setReservations(result.data);
    } catch (err) {
      console.error('Failed to fetch reservations', err);
    }
  };

  const createReservation = async (reservationData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      });
      if (response.ok) {
        toast.success('Reservation Created');
        fetchReservations();
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Failed to create reservation');
      return false;
    }
  };

  const updateReservationStatus = async (id, status) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reservations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        toast.success(`Reservation ${status}`);
        fetchReservations();
        fetchTables(); // Status might affect tables
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Failed to update reservation');
      return false;
    }
  };

  const updateTableStatus = async (tableId, status) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/table/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchTables();
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Failed to update table status');
      return false;
    }
  };

  // ── Car Service Helpers (local) ──
  const addCarOrder = (carNumber, initialCart = [], total = 0, staff = null) => {
    const key = carNumber.trim().toUpperCase();
    setCarOrders(prev => ({
      ...prev,
      [key]: {
        carNumber: key,
        type: 'CAR',
        status: 'running-kot',
        sessionStartTime: new Date().toISOString(),
        waiter: staff,
        kots: [
          {
            id: 1,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            items: initialCart,
            total,
            staff
          }
        ]
      }
    }));
  };

  const updateCarOrderStatus = (carNumber, status) => {
    const key = carNumber.trim().toUpperCase();
    setCarOrders(prev => ({
      ...prev,
      [key]: { ...prev[key], status }
    }));
  };

  const clearCarOrder = (carNumber) => {
    const key = carNumber.trim().toUpperCase();
    setCarOrders(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ── UI Toggles ──
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <PosContext.Provider value={{
      // UI state
      isSidebarOpen, toggleSidebar, closeSidebar,
      user, setUser,

      // Backend-synced data
      orders, tables, reservations, loading,
      fetchActiveTableOrders: syncAll,
      fetchReservations, createReservation, updateReservationStatus,
      placeKOT, settleOrder, voidItem, updateTableStatus, addTable,

      // Local state
      sections, setSections,
      carOrders, addCarOrder, updateCarOrderStatus, clearCarOrder,
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



