
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
      label: 'Main',
      items: [
        { label: 'POS Dashboard', path: '/pos', icon: LayoutDashboard },
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
            { label: 'Table Layout', path: '/pos/tables/layout', icon: Map },
            { label: 'Table List', path: '/pos/tables/list', icon: List },
            { label: 'Reservations', path: '/pos/tables/reservations', icon: Calendar },
          ]
        },
      ]
    },
    {
      label: 'CRM',
      items: [
        { 
          label: 'Customers', 
          path: '/pos/customers', 
          icon: Users,
          subItems: [
            { label: 'Customer List', path: '/pos/customers/list', icon: List },
            { label: 'Add Customer', path: '/pos/customers/add', icon: UserPlus },
            { label: 'Loyalty Points', path: '/pos/customers/loyalty', icon: Star },
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
            { label: 'Cash Register', path: '/pos/billing/register', icon: Banknote },
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
    <aside className={`fixed left-0 top-0 h-full bg-[#1A1C1E] text-slate-400 z-50 transition-all duration-300 shadow-2xl flex flex-col w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* POS Brand Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#141517]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white">
            <Monitor size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[13px] tracking-tight text-white uppercase">RMS POS</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Terminal 01</span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 no-scrollbar space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 mb-2">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{group.label}</span>
            </div>
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all relative group ${
                      isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-white' : 'group-hover:text-blue-400'} />
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
                  </button>

                  <AnimatePresence>
                    {item.subItems && isExpanded && (
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
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-all group ${
                                isSubActive 
                                ? 'text-blue-400 bg-blue-400/5' 
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {subItem.icon && <subItem.icon size={14} className={isSubActive ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'} />}
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
      <div className="p-4 border-t border-white/5 bg-[#141517]">
        <button 
          onClick={() => {
            localStorage.removeItem('pos_access');
            navigate('/pos/login');
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
        >
          <LogOut size={16} />
          <span className="font-black text-[10px] uppercase tracking-widest">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
