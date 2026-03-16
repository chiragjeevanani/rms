
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Store, Utensils, Box, Users, 
  ShoppingCart, BarChart3, Settings, LogOut, 
  ChevronLeft, ChevronRight, Truck, CreditCard,
  ShieldCheck, Bell, History, Sliders, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navGroups = [
    {
      label: 'Operational',
      items: [
        { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
        { label: 'Outlets', path: '/admin/outlets', icon: Store },
      ]
    },
    {
      label: 'Management',
      items: [
        { label: 'Menu Catalog', path: '/admin/menu', icon: Utensils },
        { label: 'Inventory', path: '/admin/inventory', icon: Box },
      ]
    },
    {
      label: 'Resources',
      items: [
        { label: 'Customers', path: '/admin/customers', icon: Users },
        { label: 'Staff & Roles', path: '/admin/staff', icon: ShieldCheck },
        { label: 'Financials', path: '/admin/finance', icon: CreditCard },
      ]
    },
    {
      label: 'Insights',
      items: [
        { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { label: 'Audit Logs', path: '/admin/audit', icon: History },
        { 
          label: 'Settings', 
          path: '/admin/settings', 
          icon: Settings,
          subItems: [
            { label: 'Store Preferences', path: '/admin/settings/general', icon: Sliders },
            { label: 'Taxation & Billing', path: '/admin/settings/payment', icon: CreditCard },
            { label: 'Printers & KOT', path: '/admin/settings/printers', icon: Printer },
            { label: 'Staff Permissions', path: '/admin/settings/security', icon: ShieldCheck },
            { label: 'Alert Protocols', path: '/admin/settings/notifications', icon: Bell },
          ]
        },
      ]
    }
  ];

  const [expandedMenus, setExpandedMenus] = useState(['Settings']);

  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label) 
        : [...prev, label]
    );
  };

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-50 transition-all duration-300 shadow-sm hidden lg:flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-900 rounded-sm flex items-center justify-center text-white font-black text-sm">R</div>
            <div className="flex flex-col">
              <span className="font-black text-[13px] tracking-tight uppercase">RMS System</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Administrator</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-7 h-7 bg-slate-900 rounded-sm flex items-center justify-center text-white font-black text-sm">R</div>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 no-scrollbar space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{group.label}</span>
              </div>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname === item.path || (item.subItems && location.pathname.startsWith(item.path));
              const isExpanded = expandedMenus.includes(item.label);
              
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => {
                      if (item.subItems && !isCollapsed) {
                        toggleSubmenu(item.label);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm transition-all relative group ${
                      isActive 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon size={16} className={isActive ? 'text-white' : 'group-hover:text-slate-900'} />
                    {!isCollapsed && (
                      <>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                          {item.label}
                        </span>
                        {item.subItems && (
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            className="ml-auto"
                          >
                            <ChevronRight size={12} />
                          </motion.div>
                        )}
                      </>
                    )}
                    {isActive && isCollapsed && (
                      <div className="absolute left-0 w-1 h-6 bg-slate-900 rounded-r-full" />
                    )}
                  </button>

                  <AnimatePresence>
                    {item.subItems && isExpanded && !isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-4 space-y-1"
                      >
                        {item.subItems.map((subItem) => {
                          const isSubActive = location.pathname === subItem.path;
                          return (
                            <button
                              key={subItem.label}
                              onClick={() => navigate(subItem.path)}
                              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-sm transition-all group ${
                                isSubActive 
                                ? 'text-slate-900 bg-slate-50' 
                                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50/50'
                              }`}
                            >
                              <div className={`w-1 h-1 rounded-full ${isSubActive ? 'bg-slate-900' : 'bg-slate-200 group-hover:bg-slate-400'}`} />
                              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                {subItem.label}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOut size={16} />
          {!isCollapsed && <span className="font-black text-[10px] uppercase tracking-widest">Sign Out</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white z-50 hover:scale-110 active:scale-95 transition-all"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
