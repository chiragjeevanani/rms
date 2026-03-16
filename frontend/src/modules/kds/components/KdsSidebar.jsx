import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChefHat, LayoutGrid, ListOrdered, 
  History, Settings, Timer, ShieldAlert,
  ChevronLeft, ChevronRight, LogOut,
  Bell, Monitor, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  {
    group: "Overview",
    items: [
      { path: "/kds/dashboard", icon: LayoutGrid, label: "KDS Dashboard" }
    ]
  },
  {
    group: "Order Queue",
    items: [
      { path: "/kds/incoming", icon: Bell, label: "Incoming Orders", badge: "New" },
      { path: "/kds/preparing", icon: Clock, label: "Preparing Orders" },
      { path: "/kds/completed", icon: History, label: "Completed Orders" }
    ]
  },
  {
    group: "Kitchen Settings",
    items: [
      { path: "/kds/settings/stations", icon: ListOrdered, label: "Kitchen Stations" },
      { path: "/kds/settings/prep-time", icon: Timer, label: "Preparation Time" },
      { path: "/kds/settings/priority", icon: ShieldAlert, label: "Priority Rules" }
    ]
  }
];

export default function KdsSidebar({ isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className={`fixed left-0 top-0 h-full bg-[#0F172A] text-slate-400 z-50 transition-all duration-300 shadow-2xl flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#020617]">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <ChefHat size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[14px] tracking-tight text-white uppercase">Kitchen OPS</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Node #KDS-01</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white">
              <ChefHat size={18} />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 no-scrollbar">
        {NAV_ITEMS.map((group, idx) => (
          <div key={idx} className="mb-8 last:mb-0">
            {!isCollapsed && (
              <h3 className="px-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">
                {group.group}
              </h3>
            )}
            <div className="px-3 space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                      isActive 
                        ? 'bg-teal-500/10 text-teal-400' 
                        : 'hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <item.icon size={20} className={isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'} />
                    {!isCollapsed && (
                      <span className="text-[13px] font-semibold tracking-tight">
                        {item.label}
                      </span>
                    )}
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute left-0 w-1 h-6 bg-teal-500 rounded-r-full"
                      />
                    )}

                    {/* Badge */}
                    {item.badge && !isCollapsed && (
                      <span className="ml-auto px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase rounded shadow-lg shadow-rose-500/20">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for collapsed mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap border border-white/10 shadow-2xl overflow-hidden z-[100]">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/5 bg-[#020617]/50 space-y-2">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full h-10 flex items-center justify-center gap-3 rounded-xl border border-white/5 text-slate-500 hover:text-white hover:bg-white/5 transition-all outline-none"
        >
          {isCollapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Collapse View</span>
            </>
          )}
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('kds_access');
            navigate('/kds/login');
          }}
          className="w-full h-10 flex items-center justify-center gap-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all outline-none"
        >
          <LogOut size={18} />
          {!isCollapsed && <span className="text-[11px] font-bold uppercase tracking-widest">Quit Station</span>}
        </button>
      </div>
    </aside>
  );
}
