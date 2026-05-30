const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  isElectron: true,
  ping: () => ipcRenderer.invoke('app:ping'),
  
  // Database API
  db: {
    createOrder: (order) => ipcRenderer.invoke('db:create-order', order),
    getOrders: (filters) => ipcRenderer.invoke('db:get-orders', filters),
    updateOrder: (id, updates) => ipcRenderer.invoke('db:update-order', id, updates),
    syncOfflineQueue: () => ipcRenderer.invoke('db:sync-queue-now'),
    getSyncStatus: () => ipcRenderer.invoke('db:get-sync-status'),
    
    // Caching layer handlers
    saveMenuCache: (items, categories) => ipcRenderer.invoke('db:save-menu-cache', items, categories),
    getMenuCache: () => ipcRenderer.invoke('db:get-menu-cache'),
    saveTablesCache: (tables) => ipcRenderer.invoke('db:save-tables-cache', tables),
    getTablesCache: () => ipcRenderer.invoke('db:get-tables-cache'),
  }
});
