import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChefHat, LayoutGrid, ListOrdered, 
  History, Settings, Timer, ShieldAlert,
  LogOut, Bell, Clock, Sun, Moon, Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../user/context/ThemeContext';

export default function KdsTopNavbar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const primaryNav = [
    { path: "/kds/dashboard", icon: LayoutGrid, label: "Dashboard" },
    { path: "/kds/incoming", icon: Bell, label: "Incoming" },
    { path: "/kds/preparing", icon: Clock, label: "Preparing" },
    { path: "/kds/completed", icon: History, label: "Completed" },
  ];

  const settingsNav = [
    { path: "/kds/settings/stations", icon: ListOrdered, label: "Stations" },
    { path: "/kds/settings/prep-time", icon: Timer, label: "SLOs" },
    { path: "/kds/settings/priority", icon: ShieldAlert, label: "Rules" },
  ];

  const handleLogout = () => {
    localStorage.removeItem('kds_access');
    navigate('/kds/login');
  };

  return (
    <nav className={`h-16 border-b shrink-0 flex items-center px-6 justify-between transition-colors duration-500 z-[100] ${
      isDarkMode ? 'bg-[#1a1c1e] border-white/5 shadow-2xl' : 'bg-white border-stone-200 shadow-sm'
    }`}>
      {/* Left: Brand */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#5D4037] rounded-xl flex items-center justify-center text-[#D4AF37] shadow-lg shadow-[#5D4037]/20">
          <ChefHat size={20} />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className={`font-black text-sm uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#5D4037]'}`}>Kitchen Display</span>
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-none">NODE_KDS_01</span>
        </div>
      </div>

      {/* Center: Main Navigation */}
      <div className="flex items-center gap-1 md:gap-2 bg-stone-500/5 p-1 rounded-2xl border border-white/5">
        {primaryNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                isActive 
                  ? 'bg-[#5D4037] text-white shadow-lg' 
                  : (isDarkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-[#5D4037] hover:bg-stone-100')
              }`}
            >
              <item.icon size={16} />
              <span className="hidden lg:inline">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Settings Dropdown Placeholder or Simple Icons */}
        <div className="hidden md:flex items-center gap-2 mr-2 border-r border-white/5 pr-4">
          {settingsNav.map((item) => {
             const isActive = location.pathname === item.path;
             return (
               <button
                 key={item.path}
                 onClick={() => navigate(item.path)}
                 className={`p-2 rounded-lg transition-all ${
                   isActive 
                    ? 'text-[#D4AF37] bg-white/5' 
                    : 'text-stone-500 hover:text-stone-300'
                 }`}
                 title={item.label}
               >
                 <item.icon size={18} />
               </button>
             );
          })}
        </div>

        <button 
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
            isDarkMode ? 'bg-white/5 text-stone-400 border-white/5 hover:bg-white/10' : 'bg-stone-50 text-stone-500 border-stone-100 hover:bg-stone-100'
          }`}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button 
          onClick={handleLogout}
          className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
