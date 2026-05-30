import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SyncContext = createContext();

export function SyncProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const isElectron = typeof window !== 'undefined' && !!window.api;

  // Real-time network listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isElectron) {
        // Trigger background sync loop in Electron main process
        window.api.db.syncOfflineQueue().catch(console.error);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isElectron]);

  // SQLite queue length tracking (only runs in Desktop mode)
  useEffect(() => {
    if (!isElectron) return;

    const fetchSyncStatus = async () => {
      try {
        const status = await window.api.db.getSyncStatus();
        setPendingCount(status.pendingCount || 0);
      } catch (err) {
        console.error('Failed to get sync queue lengths:', err);
      }
    };

    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isElectron]);

  // Forces a background sync sweep
  const forceSync = async () => {
    if (!isElectron) return;
    if (!isOnline) {
      toast.error('Network offline! Cannot initialize cloud sync.');
      return;
    }

    try {
      toast.loading('Pushing SQLite queue items...', { id: 'sync-progress' });
      await window.api.db.syncOfflineQueue();
      
      const status = await window.api.db.getSyncStatus();
      setPendingCount(status.pendingCount || 0);
      
      toast.success('Sync process triggered successfully.', { id: 'sync-progress' });
    } catch (err) {
      toast.error(`Sync execution error: ${err.message}`, { id: 'sync-progress' });
    }
  };

  return (
    <SyncContext.Provider value={{ isOnline, pendingCount, forceSync, isElectron }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
