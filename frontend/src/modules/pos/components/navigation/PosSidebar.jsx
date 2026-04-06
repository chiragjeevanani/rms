
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Table, Users, 
  CreditCard, ChevronRight, ChevronLeft, LogOut,
  Clock, CheckCircle2, XCircle, Map, List, 
  Calendar, UserPlus, Star, Receipt, History, 
  Banknote, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PosSidebar({ isOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navGroups = [
    {
      label: 'Dashboard',
      items: [
        { 
          label: 'Dashboard', 
          path: '/pos/dashboard', 
          icon: LayoutDashboard,
        },
      ]
    },
    {
      label: 'Operations',
      items: [
        { 
          label: 'Orders', 
          path: '/pos/orders', 
          icon: ShoppingCart,
          subItems: [
            { label: 'Active Orders', path: '/pos/orders/active', icon: Clock },
            { label: 'Completed Orders', path: '/pos/orders/completed', icon: CheckCircle2 },
            { label: 'Cancelled Orders', path: '/pos/orders/cancelled', icon: XCircle },
          ]
        },
      ]
    },
    {
      label: 'Floor Management',
      items: [
        { 
          label: 'Tables', 
          path: '/pos/tables', 
          icon: Table,
          subItems: [
            { label: 'Table List', path: '/pos/tables/list', icon: List },
            { label: 'Reservations', path: '/pos/tables/reservations', icon: Calendar },
          ]
        },
      ]
    },
    {
      label: 'Finance',
      items: [
        { 
          label: 'Billing & Payments', 
          path: '/pos/billing', 
          icon: CreditCard,
          subItems: [
            { label: 'Generate Bill', path: '/pos/billing/generate', icon: Receipt },
            { label: 'Payment History', path: '/pos/billing/history', icon: History },
          ]
        },
      ]
    }
  ];

  const [expandedMenus, setExpandedMenus] = useState([]);

  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label) 
        : [...prev, label]
    );
  };

  return (
    <aside className={`h-full bg-[#161820] text-slate-300 z-[100] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl flex flex-col border-r border-white/5 overflow-hidden ${isOpen ? 'w-64' : 'w-[72px]'}`}>
      {/* POS Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-white/5 shrink-0 bg-[#0F1012] overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0">
            <Monitor size={20} />
          </div>
          <motion.div 
            animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -10 }}
            className="flex flex-col"
          >
            <span className="font-black text-sm tracking-tight text-white uppercase italic">RMS POS</span>
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest leading-none">V 1.0.4 - LIVE</span>
          </motion.div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 no-scrollbar space-y-8 overflow-x-hidden">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="px-3"
                >
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{group.label}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.subItems && location.pathname.startsWith(item.path));
                const isExpanded = expandedMenus.includes(item.label);
                
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => {
                        if (item.subItems) {
                          toggleSubmenu(item.label);
                        } else {
                          navigate(item.path);
                        }
                      }}
                      className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all relative group h-12 overflow-hidden ${
                        isActive 
                        ? 'bg-blue-600 text-white shadow-[0_8px_16px_rgba(37,99,235,0.25)]' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="shrink-0">
                        <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                      </div>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center flex-1 whitespace-nowrap"
                          >
                            <span className="text-[11px] font-black uppercase tracking-widest flex-1 text-left">
                              {item.label}
                            </span>
                            {item.subItems && (
                              <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                className="ml-2 opacity-50"
                              >
                                <ChevronRight size={14} />
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Tooltip for Collapsed Mode */}
                      {!isOpen && (
                        <div className="absolute left-[80px] bg-[#1F2229] px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest invisible group-hover:visible shadow-xl border border-white/5 whitespace-nowrap z-[110]">
                          {item.label}
                        </div>
                      )}
                    </button>

                    <AnimatePresence>
                      {item.subItems && isExpanded && isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-4 space-y-1 pt-1"
                        >
                          {item.subItems.map((subItem) => {
                            const isSubActive = location.pathname === subItem.path;
                            return (
                              <button
                                key={subItem.label}
                                onClick={() => navigate(subItem.path)}
                                className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all group ${
                                  isSubActive 
                                  ? 'text-blue-400 bg-blue-500/10' 
                                  : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {subItem.icon && <subItem.icon size={14} className={isSubActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />}
                                <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isSubActive ? 'text-blue-400' : ''}`}>
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
          </div>
        ))}
      </nav>

      {/* Logout Footer Section */}
      <div className="p-3 border-t border-white/5 bg-[#0F1012] overflow-hidden whitespace-nowrap">
        <button 
          onClick={() => {
            localStorage.removeItem('pos_access');
            navigate('/pos/login');
          }}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all group"
        >
          <div className="shrink-0">
             <LogOut size={18} />
          </div>
          {isOpen && <span className="font-black text-[10px] uppercase tracking-[0.2em]">Log Out</span>}
          
          {/* Tooltip for Logout */}
          {!isOpen && (
            <div className="absolute left-[80px] bg-[#1F2229] px-2 py-1 rounded text-[10px] font-bold text-rose-400 uppercase tracking-widest invisible group-hover:visible shadow-xl border border-rose-500/10 whitespace-nowrap">
              Log Out
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
