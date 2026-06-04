import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { useSync } from '../../../context/SyncContext';

export default function SyncStatusIndicator() {
  const { isOnline, pendingCount, forceSync, isElectron } = useSync();

  // Show indicator only inside Electron desktop POS
  if (!isElectron) return null;

  return (
    <div className="flex items-center">
      <AnimatePresence mode="wait">
        {!isOnline ? (
          // 1. Offline Mode State
          <m.button
            key="offline"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={forceSync}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-400 select-none outline-none cursor-pointer hover:bg-amber-500/20 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CloudOff size={14} className="animate-pulse text-amber-500" />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              Offline POS
            </span>
            {pendingCount > 0 && (
              <span className="bg-amber-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full ml-1">
                {pendingCount}
              </span>
            )}
          </m.button>
        ) : pendingCount > 0 ? (
          // 2. Syncing Queue State
          <m.button
            key="pending"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={forceSync}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-md text-blue-400 select-none outline-none cursor-pointer hover:bg-blue-500/20 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={14} className="animate-spin text-blue-500" />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              Syncing Queue
            </span>
            <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full ml-1 animate-bounce">
              {pendingCount}
            </span>
          </m.button>
        ) : (
          // 3. Fully Cloud-Synced State
          <m.div
            key="synced"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-emerald-400 select-none"
          >
            <Cloud size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              Cloud Synced
            </span>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
