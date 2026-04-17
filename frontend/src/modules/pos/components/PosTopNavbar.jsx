import React, { useState } from 'react';
import {
  Menu, Search, BookOpen, Store, CreditCard, LayoutGrid, Monitor,
  Clock, X, RefreshCw, ArrowLeft, TrendingUp, SlidersHorizontal,
  ChevronRight, Settings, Power, Phone, ShoppingCart, Users, Table2,
  Wallet, ChevronDown,
  FileText, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../context/PosContext';
import { playClickSound } from '../utils/sounds';

export default function PosTopNavbar() {
  const navigate = useNavigate();
  const { user, toggleCustomerSection } = usePos();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 h-14 flex items-center px-3 gap-2 shadow-lg"
         style={{ background: '#ff7a00' }}>

      {/* Left: Hamburger + Logo + New Order + Search */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { playClickSound(); setIsDrawerOpen(true); }}
          className="p-2 hover:bg-black/10 rounded-md transition-colors"
        >
          <Menu size={22} className="text-white" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white text-sm"
               style={{ backgroundColor: '#c2540a' }}>
            R
          </div>
          <div className="bg-[#ea6c00] text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center">
            RMS
          </div>
        </div>

        <button
          onClick={() => { playClickSound(); navigate('/pos/tables'); }}
          className="font-black text-white text-sm uppercase tracking-widest hover:opacity-90 transition-opacity px-1"
        >
          NEW ORDER
        </button>

        {/* Search */}
        <div className="relative ml-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60" size={14} />
          <input
            type="text"
            placeholder="Bill No"
            className="pl-8 pr-3 py-1.5 bg-white/20 border border-white/30 rounded-md text-sm text-white placeholder-white/60 focus:outline-none focus:bg-white/30 w-36 transition-all"
          />
        </div>
      </div>

      {/* Right: Icon Toolbar + Support */}
      <div className="ml-auto flex items-center gap-1">
        <NavIcon onClick={() => { playClickSound(); navigate('/pos/menu'); }}   icon={<BookOpen size={18} />} />
        <NavIcon onClick={() => { playClickSound(); navigate('/pos/tables'); }} icon={<Store size={18} />} />
        <NavIcon onClick={() => { playClickSound(); }}                           icon={<CreditCard size={18} />} />
        <NavIcon onClick={() => { playClickSound(); navigate('/pos/dashboard');}}icon={<LayoutGrid size={18} />} />
        <NavIcon onClick={() => { playClickSound(); }}                           icon={<Monitor size={18} />} />
        <NavIcon onClick={() => { playClickSound(); setIsRecentOpen(true); }}   icon={<Clock size={18} />} />

        <div className="w-px h-6 bg-white/30 mx-1" />

        {/* Phone support */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md">
            <Phone size={14} className="text-white" />
          </div>
          <div className="hidden xl:flex flex-col leading-none">
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Call For Support</span>
            <span className="text-sm font-black text-white">0769 223344</span>
          </div>
        </div>
      </div>

      {/* Settings Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 z-[100]"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#ea6c00] z-[101] flex flex-col border-r border-white/5"
            >
              <div className="px-4 py-4 flex items-center justify-between border-b border-white/5">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Settings</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-gray-400 hover:text-white">
                  <ArrowLeft size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                {/* ─ Navigate Section ─ */}
                <p className="px-4 pt-3 pb-1 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Navigate</p>

                <DrawerItem
                  onClick={() => { setIsDrawerOpen(false); navigate('/pos/tables'); }}
                  icon={<LayoutGrid size={18} />} label="Tables"
                  active={window.location.pathname.includes('/pos/tables')}
                />
                <DrawerSubItem label="Table View"  onClick={() => { setIsDrawerOpen(false); navigate('/pos/tables'); }} />
                <DrawerSubItem label="Table List"  onClick={() => { setIsDrawerOpen(false); navigate('/pos/tables/list'); }} />
                <DrawerSubItem label="Reservations" onClick={() => { setIsDrawerOpen(false); navigate('/pos/tables/reservations'); }} />

                <DrawerItem
                  onClick={() => { setIsDrawerOpen(false); navigate('/pos/orders/active'); }}
                  icon={<ShoppingCart size={18} />} label="Orders"
                />
                <DrawerSubItem label="Active Orders"    onClick={() => { setIsDrawerOpen(false); navigate('/pos/orders/active'); }} />
                <DrawerSubItem label="Completed Orders" onClick={() => { setIsDrawerOpen(false); navigate('/pos/orders/completed'); }} />
                <DrawerSubItem label="Cancelled Orders" onClick={() => { setIsDrawerOpen(false); navigate('/pos/orders/cancelled'); }} />

                <DrawerItem
                  onClick={() => { setIsDrawerOpen(false); navigate('/pos/customers/list'); }}
                  icon={<Users size={18} />} label="Customers"
                />

                <DrawerItem
                  onClick={() => { setIsDrawerOpen(false); navigate('/pos/billing'); }}
                  icon={<Wallet size={18} />} label="Billing & Payments"
                />
                <DrawerSubItem label="Generate Invoice"  onClick={() => { setIsDrawerOpen(false); navigate('/pos/billing/generate'); }} />
                <DrawerSubItem label="Payment History"   onClick={() => { setIsDrawerOpen(false); navigate('/pos/billing/history'); }} />
                <DrawerSubItem label="Cash Register"     onClick={() => { setIsDrawerOpen(false); navigate('/pos/billing/register'); }} />

                {/* ─ System Section ─ */}
                <p className="px-4 pt-4 pb-1 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-t border-white/5 mt-2">System</p>

                <DrawerItem onClick={() => { setIsDrawerOpen(false); navigate('/pos/operations'); }} icon={<SlidersHorizontal size={18} />} label="Operations" />
                <DrawerItem onClick={() => setIsDrawerOpen(false)}                                  icon={<TrendingUp size={18} />}      label="Reports" hasArrow />
                <DrawerItem onClick={() => { setIsDrawerOpen(false); navigate('/pos/dashboard'); }} icon={<Monitor size={18} />}         label="Live View" />
                <DrawerItem onClick={() => setIsDrawerOpen(false)}                                  icon={<Clock size={18} />}           label="Day End" />
                <DrawerItem onClick={() => { setIsDrawerOpen(false); navigate('/pos/menu'); }}      icon={<Settings size={18} />}        label="Settings" />
                <DrawerItem onClick={() => setIsDrawerOpen(false)}                                  icon={<RefreshCw size={18} />}       label="Check Updates" />
                <DrawerItem
                  onClick={() => { setIsDrawerOpen(false); localStorage.removeItem('pos_access'); navigate('/pos/login'); }}
                  icon={<Power size={18} />} label="Logout" color="text-red-400"
                />
              </div>
              <div className="p-4 border-t border-white/5 bg-[#141518] space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  <span>Ref ID: A112011R</span><span>Version: 107.0.1</span>
                </div>
                <p className="text-[10px] text-gray-400 font-black text-center border-t border-white/5 pt-2 uppercase">
                  Biller: {user?.name || 'Staff'}
                </p>
              </div>
            </motion.div>
          </>
        )}

        {isRecentOpen && (
          <RecentOrdersPanel onClose={() => setIsRecentOpen(false)} />
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavIcon({ icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-white/80 hover:text-white hover:bg-black/10 rounded-md transition-all active:scale-90"
    >
      {icon}
    </button>
  );
}

function DrawerItem({ icon, label, hasArrow, active, color, onClick }) {
  return (
    <div
      onClick={() => { playClickSound(); onClick(); }}
      className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all hover:bg-white/5 ${active ? 'bg-[#ff7a00]' : ''}`}
    >
      <div className={`flex items-center gap-3 ${color || (active ? 'text-white' : 'text-gray-400')}`}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      {hasArrow && <ChevronRight size={14} className="text-gray-600" />}
    </div>
  );
}

function DrawerSubItem({ label, onClick }) {
  return (
    <div
      onClick={() => { playClickSound(); onClick(); }}
      className="pl-12 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 hover:bg-white/5 cursor-pointer transition-all"
    >
      — {label}
    </div>
  );
}

function RecentOrdersPanel({ onClose }) {
  const [tab, setTab] = useState('Dine In');
  const tabs = ['Dine In', 'Delivery', 'Pick Up', 'KOT'];
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/20 z-[100]" />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="fixed bottom-6 right-6 w-80 bg-white rounded-xl shadow-2xl overflow-hidden z-[101] font-sans border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Recent Orders</span>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-tight relative ${tab === t ? 'text-orange-600' : 'text-gray-400'}`}>
              {t}
              {tab === t && <motion.div layoutId="recTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
            </button>
          ))}
        </div>
        <div className="p-8 text-center text-sm text-gray-400 font-bold">No orders available</div>
      </motion.div>
    </>
  );
}



