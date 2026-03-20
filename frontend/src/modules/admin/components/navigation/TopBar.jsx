
import React, { useState } from 'react';
import { Search, Bell, UserCircle, RefreshCw, X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClickSound } from '../../../pos/utils/sounds';

export default function TopBar() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-14 bg-[#333333] border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative z-40 shadow-md">
      <div className="flex-1 flex items-center">
        {/* Intelligence Search */}
        <div className="max-w-xs w-full relative">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm focus-within:bg-white/10 focus-within:border-white/20 transition-all">
            <Search size={14} className="text-white/40" />
            <input 
              type="text" 
              placeholder="System search... (⌘K)" 
              className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-wider text-white placeholder:text-white/20 w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => { playClickSound(); setShowNotifications(!showNotifications); }}
             className={`p-2 transition-colors relative ${showNotifications ? 'text-white bg-white/10 rounded' : 'text-white/60 hover:text-white'}`}
           >
              <Bell size={18} />
              <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#5D4037] rounded-full border border-[#333333]" />
           </button>
           
           <AnimatePresence>
             {showNotifications && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 shadow-2xl rounded-sm overflow-hidden"
               >
                   <div className="p-3 bg-[#333333] border-b border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Notifications</span>
                   </div>
                   <div className="p-4 text-center bg-[#424242]">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">No unread alerts</p>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
         </div>
 
         <div className="h-6 w-px bg-white/10" />

         <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
               <p className="text-[11px] font-black uppercase tracking-tight leading-none text-white">Chiraag J.</p>
               <p className="text-[9px] text-[#FFC107] font-bold uppercase tracking-widest mt-1">Super Admin</p>
            </div>
            <div 
              className="w-8 h-8 rounded-sm bg-[#424242] border border-white/5 flex items-center justify-center text-white/40 shadow-inner cursor-pointer"
              onClick={playClickSound}
            >
               <UserCircle size={20} />
            </div>
         </div>
      </div>
    </header>
  );
}
