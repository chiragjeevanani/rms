
import React, { useState } from 'react';
import { Search, Bell, UserCircle, RefreshCw, X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopBar() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-40">
      <div className="flex-1 flex items-center">
        {/* Intelligence Search */}
        <div className="max-w-xs w-full relative">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-sm focus-within:bg-white focus-within:border-slate-300 transition-all">
            <Search size={14} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="System search... (⌘K)" 
              className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-wider text-slate-900 placeholder:text-slate-300 w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowNotifications(!showNotifications)}
             className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative"
           >
              <Bell size={18} />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white" />
           </button>
           
           <AnimatePresence>
             {showNotifications && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 shadow-2xl rounded-sm overflow-hidden"
               >
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notifications</span>
                  </div>
                  <div className="p-4 text-center">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No unread alerts</p>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
           <div className="text-right hidden sm:block">
              <p className="text-[11px] font-black uppercase tracking-tight leading-none">Chiraag J.</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Super Admin</p>
           </div>
           <div className="w-8 h-8 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <UserCircle size={20} />
           </div>
        </div>
      </div>
    </header>
  );
}
