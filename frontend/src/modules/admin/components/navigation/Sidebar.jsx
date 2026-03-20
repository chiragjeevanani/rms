
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Store, Utensils, Box, Users, 
  ShoppingCart, BarChart3, Settings, LogOut, 
  ChevronLeft, ChevronRight, Truck, CreditCard,
  ShieldCheck, Bell, History, Sliders, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClickSound } from '../../../pos/utils/sounds';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navGroups = [
    {
      label: 'Main',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      label: 'Catalog & Items',
      items: [
        { 
          label: 'Menu Management', 
          path: '/admin/menu', 
          icon: Utensils,
          subItems: [
            { label: 'Categories', path: '/admin/menu/categories' },
            { label: 'Items', path: '/admin/menu/items' },
            { label: 'Modifiers', path: '/admin/menu/modifiers' },
            { label: 'Combo Meals', path: '/admin/menu/combos' },
          ]
        },
      ]
    },
    {
      label: 'Supply Chain',
      items: [
        { 
          label: 'Inventory Management', 
          path: '/admin/inventory', 
          icon: Box,
          subItems: [
            { label: 'Stock Management', path: '/admin/inventory/stock' },
            { label: 'Vendors', path: '/admin/inventory/vendors' },
            { label: 'Purchase Orders', path: '/admin/inventory/orders' },
            { label: 'Wastage', path: '/admin/inventory/wastage' },
          ]
        },
      ]
    },
    {
      label: 'Operations',
      items: [
        { 
          label: 'Order Management', 
          path: '/admin/orders', 
          icon: ShoppingCart,
          subItems: [
            { label: 'All Orders', path: '/admin/orders/all' },
            { label: 'Online Orders', path: '/admin/orders/online' },
            { label: 'Cancelled Orders', path: '/admin/orders/cancelled' },
          ]
        },
      ]
    },
    {
      label: 'Personnel',
      items: [
        { 
          label: 'Staff & User Management', 
          path: '/admin/staff', 
          icon: Users,
          subItems: [
            { label: 'Staff List', path: '/admin/staff/list' },
            { label: 'Roles', path: '/admin/staff/roles' },
            { label: 'Attendance', path: '/admin/staff/attendance' },
          ]
        },
      ]
    },
    {
      label: 'Compliance & Config',
      items: [
        { 
          label: 'Reports & Settings', 
          path: '/admin/reports', 
          icon: BarChart3,
          subItems: [
            { label: 'Sales Reports', path: '/admin/reports/sales' },
            { label: 'Inventory Reports', path: '/admin/reports/inventory' },
            { label: 'Customer Reports', path: '/admin/reports/customers' },
            { label: 'System Settings', path: '/admin/settings' },
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
    <aside className={`fixed left-0 top-0 h-full bg-[#424242] border-r border-white/5 z-50 transition-all duration-300 shadow-xl hidden lg:flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#333333]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#5D4037] rounded-sm flex items-center justify-center text-white font-black text-sm shadow-lg shadow-stone-900/20">R</div>
            <div className="flex flex-col">
              <span className="font-black text-[13px] tracking-tight uppercase text-white">RMS System</span>
              <span className="text-[8px] font-black text-[#FFC107] uppercase tracking-widest mt-0.5">Administrator</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-7 h-7 bg-[#5D4037] rounded-sm flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-900/40">R</div>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 no-scrollbar space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 mb-2">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">{group.label}</span>
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all relative group h-11 ${
                      isActive 
                      ? 'bg-[#5D4037] text-white shadow-lg shadow-stone-900/20' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon size={16} className={isActive ? 'text-white' : 'group-hover:text-white transition-colors'} />
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
                              onClick={() => { playClickSound(); navigate(subItem.path); }}
                              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-sm transition-all group ${
                                isSubActive 
                                ? 'text-white bg-[#5D4037]/20' 
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <div className={`w-1 h-1 rounded-full ${isSubActive ? 'bg-[#5D4037]' : 'bg-white/20 group-hover:bg-white/40'}`} />
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
      <div className="p-3 border-t border-white/5 bg-black/10">
        <button 
          onClick={() => {
            playClickSound();
            localStorage.removeItem('admin_access');
            navigate('/admin/login');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/40 hover:text-white hover:bg-[#5D4037] transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} />
          {!isCollapsed && <span className="font-black text-[10px] uppercase tracking-widest">Sign Out</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => { playClickSound(); setIsCollapsed(!isCollapsed); }}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#5D4037] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#424242] z-50 hover:scale-110 active:scale-95 transition-all"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
