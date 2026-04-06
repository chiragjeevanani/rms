
import React, { useState, useEffect } from 'react';
import { Search, Bell, UserCircle, RefreshCw, X, ShoppingBag, User, Settings, LogOut, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClickSound } from '../../../pos/utils/sounds';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setAdminData(data);
        }
      } catch (error) {
        console.error('Failed to fetch admin data');
      }
    };
    fetchAdmin();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_access');
    navigate('/admin/login');
  };

  return (
    <header className="h-14 bg-[#2C2C2C] border-b border-white/8 flex items-center justify-between px-6 shrink-0 relative z-40 shadow-md">
      <div className="flex-1 flex items-center">
        {/* Intelligence Search */}
        <div className="max-w-xs w-full relative">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-white/8 border border-white/15 rounded focus-within:bg-white/12 focus-within:border-white/30 transition-all">
            <Search size={14} className="text-white/60" />
            <input 
              type="text" 
              placeholder="System search... (⌘K)" 
              className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-wider text-white placeholder:text-white/40 w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => { playClickSound(); setShowNotifications(!showNotifications); setShowUserMenu(false); }}
             className={`p-2 transition-colors relative rounded ${showNotifications ? 'text-white bg-white/12' : 'text-white/70 hover:text-white hover:bg-white/8'}`}
           >
              <Bell size={18} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-[#FFC107] rounded-full border border-[#2C2C2C]" />
           </button>
           
           <AnimatePresence>
             {showNotifications && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="absolute top-full right-0 mt-2 w-72 bg-[#2C2C2C] border border-white/12 shadow-2xl rounded overflow-hidden"
               >
                   <div className="p-3 bg-[#222222] border-b border-white/8 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Notifications</span>
                      <button onClick={() => setShowNotifications(false)} className="text-white/40 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                   </div>
                   <div className="p-5 text-center">
                      <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">No unread alerts</p>
                   </div>
                </motion.div>
             )}
           </AnimatePresence>
        </div>
 
        <div className="h-6 w-px bg-white/15" />

        <div className="flex items-center gap-3 relative">
           <div className="text-right hidden sm:block">
              <p className="text-[11px] font-black uppercase tracking-tight leading-none text-white">
                {adminData?.name || 'Administrator'}
              </p>
              <p className="text-[9px] text-[#FFC107] font-bold uppercase tracking-widest mt-1">
                {adminData?.role || 'Admin'}
              </p>
           </div>
           <div 
             className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center cursor-pointer overflow-hidden ${showUserMenu ? 'bg-[#5D4037] border-[#FFC107] text-white shadow-[0_0_15px_rgba(255,193,7,0.3)]' : 'bg-[#5D4037]/40 border-white/10 text-white/80 hover:bg-[#5D4037]/60'}`}
             onClick={() => { playClickSound(); setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
           >
              {adminData?.profileImg ? (
                <img src={adminData.profileImg} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={20} />
              )}
           </div>

           <AnimatePresence>
             {showUserMenu && (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="absolute top-full right-0 mt-2 w-48 bg-[#2C2C2C] border border-white/12 shadow-2xl rounded overflow-hidden"
               >
                 <div className="p-2 border-b border-white/8 bg-[#222222]">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] px-2 py-1">Admin Account</p>
                 </div>
                 <div className="p-1">
                   <button 
                     onClick={() => { navigate('/admin/settings/profile'); setShowUserMenu(false); }}
                     className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/8 rounded transition-all group"
                   >
                     <User size={14} className="text-white/40 group-hover:text-[#FFC107]" />
                     <span className="uppercase tracking-widest">Profile</span>
                   </button>
                  
                   <div className="h-px bg-white/8 my-1 mx-2" />
                   <button 
                     onClick={handleLogout}
                     className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-all group"
                   >
                     <LogOut size={14} className="text-rose-400/60 group-hover:text-rose-400" />
                     <span className="uppercase tracking-widest">Logout</span>
                   </button>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
