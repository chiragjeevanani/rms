import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';

// Check if running inside Electron shell
const isElectron = typeof window !== 'undefined' && !!window.api;

const dbClient = {
  isElectron,

  // 1. Create Order
  createOrder: async (orderData) => {
    if (isElectron) {
      console.log('[dbClient] Electron detected. Directing write to SQLite.');
      const result = await window.api.db.createOrder(orderData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save order in local SQLite.');
      }
      return result.order;
    } else {
      console.log('[dbClient] Web environment. Posting to REST API.');
      const res = await axios.post(`${API_BASE_URL}/orders`, orderData);
      return res.data.data;
    }
  },

  // 2. Fetch Orders
  getOrders: async (filters = {}) => {
    if (isElectron) {
      console.log('[dbClient] Electron detected. Loading from SQLite.');
      const result = await window.api.db.getOrders(filters);
      if (!result.success) {
        throw new Error(result.error || 'Failed to read local orders.');
      }
      return result.orders;
    } else {
      console.log('[dbClient] Web environment. Reading from REST API.');
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.isBilled !== undefined) queryParams.append('isBilled', filters.isBilled);
      if (filters.branchId) queryParams.append('branchId', filters.branchId);

      const res = await axios.get(`${API_BASE_URL}/orders?${queryParams.toString()}`);
      return res.data.data;
    }
  },

  // 3. Update Order Status / Settle payment
  updateOrder: async (id, updates) => {
    if (isElectron) {
      console.log('[dbClient] Electron detected. Updating SQLite record.');
      const result = await window.api.db.updateOrder(id, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update local order.');
      }
      return { success: true };
    } else {
      console.log('[dbClient] Web environment. Putting to REST API.');
      
      let url = `${API_BASE_URL}/orders/${id}/status`;
      if (updates.payments && updates.isBilled) {
        // Standard endpoint for payment settling in the backend
        url = `${API_BASE_URL}/orders/${id}/settle`;
      }
      
      const res = await axios.put(url, updates);
      return res.data.data;
    }
  },

  // 4. Offline References Caching Actions
  saveMenuCache: async (items, categories) => {
    if (isElectron) {
      return await window.api.db.saveMenuCache(items, categories);
    }
    return { success: false, message: 'SQLite caching only active on Desktop app.' };
  },

  getMenuCache: async () => {
    if (isElectron) {
      const result = await window.api.db.getMenuCache();
      return result.success ? { items: result.items, categories: result.categories } : null;
    }
    return null;
  },

  saveTablesCache: async (tables) => {
    if (isElectron) {
      return await window.api.db.saveTablesCache(tables);
    }
    return { success: false, message: 'SQLite caching only active on Desktop app.' };
  },

  getTablesCache: async () => {
    if (isElectron) {
      const result = await window.api.db.getTablesCache();
      return result.success ? result.tables : null;
    }
    return null;
  }
};

export default dbClient;
