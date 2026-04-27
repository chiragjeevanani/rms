
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FileText, History, Globe, ClipboardList, 
  Users, Wallet, TrendingDown, Landmark, Banknote, 
  Package, Bell, LayoutGrid, CreditCard, RefreshCw, 
  HelpCircle, Monitor, DollarSign, Languages, UserCircle, 
  BadgeDollarSign, Clock, ListChecks, Smartphone, MessageSquare, 
  Truck, Tv, Phone, Mail, Menu, XCircle
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { playClickSound } from '../../utils/sounds';
import PosTopNavbar from '../../components/PosTopNavbar';

export default function PosDashboard() {
  const navigate = useNavigate();
  const { toggleSidebar } = usePos();

  const operationTiles = [
    { label: 'Active Orders', icon: <Clock size={28} />, path: '/pos/orders/active' },
    { label: 'Completed Orders', icon: <History size={28} />, path: '/pos/orders/completed' },
    { label: 'Cancelled Orders', icon: <History size={28} />, path: '/pos/orders/cancelled' },
    { label: 'Table Layout', icon: <LayoutGrid size={28} />, path: '/pos/tables/list' },
    { label: 'Reservations', icon: <Clock size={28} />, path: '/pos/tables/reservations' },
    { label: 'Customer List', icon: <Users size={28} />, path: '/pos/customers/list' },
    { label: 'Cash Register', icon: <Banknote size={28} />, path: '/pos/billing/register' },
    { label: 'Billing History', icon: <FileText size={28} />, path: '/pos/billing/history' },
    { label: 'Inventory', icon: <Package size={28} />, path: '#' },
    { label: 'Online Orders', icon: <Globe size={28} />, path: '#' },
    { label: 'Waiters', icon: <Smartphone size={28} />, path: '#' },
    { label: 'LED Display', icon: <Tv size={28} />, path: '#' },
    { label: 'Manual Sync', icon: <RefreshCw size={28} />, path: '#' },
    { label: 'Help', icon: <HelpCircle size={28} />, path: '#' },
    { label: 'Live Insights', icon: <Monitor size={28} />, path: '#' },
    { label: 'Day End', icon: <Clock size={28} />, path: '#' },
  ];

  const handleTileClick = (path) => {
    playClickSound();
    if (path !== '#') {
      navigate(path);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FB] font-sans overflow-hidden select-none">
      <PosTopNavbar />
      {/* Top Header */}
      <div className="bg-white px-8 py-5 border-b border-gray-200 flex items-center justify-between shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-5">
            <button 
              onClick={toggleSidebar}
              className="p-3 bg-[var(--primary-color)] border border-[var(--primary-color)] rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-[var(--primary-color)]/10"
            >
              <Menu size={20} className="text-white" />
           </button>
           <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-900 tracking-tighter italic leading-none uppercase">Terminal Operations</h1>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] animate-pulse" />
                 POS Master Cockpit v107.0.1
              </span>
           </div>
        </div>
        
        <div className="hidden md:flex flex-col items-center">
           <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Billing Station #01</span>
           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status: Primary Node Connected</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-8 w-px bg-slate-100 mx-2" />
          <button className="flex items-center gap-2 bg-[var(--primary-color)] text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-color)]/20 active:scale-95 transition-all">
            <RefreshCw size={12} /> Sync
          </button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-white/50 px-8 py-3 border-b border-gray-100 flex items-center justify-end gap-10 shrink-0">
         <div className="flex items-center gap-2 text-slate-500 hover:text-[#ff7a00] cursor-pointer transition-colors group">
            <Phone size={14} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Support: +91 91234 56789</span>
         </div>
         <div className="flex items-center gap-2 text-slate-500 hover:text-[#ff7a00] cursor-pointer transition-colors group">
            <Mail size={14} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold lowercase tracking-widest">support@rms.terminal</span>
         </div>
      </div>

      {/* Tiles Grid */}
      <div className="flex-1 overflow-y-auto p-10 no-scrollbar bg-[#F8F9FB]">
         <div className="max-w-[1400px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {operationTiles.map((tile, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTileClick(tile.path)}
                className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all hover:bg-white hover:shadow-2xl hover:shadow-[var(--primary-color)]/10 group min-h-[160px]"
              >
                 <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-[var(--primary-color)] group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                    {tile.icon}
                 </div>
                 <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight leading-tight px-2 group-hover:text-slate-900 transition-colors">
                    {tile.label}
                 </span>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Footer Info */}
      <footer className="px-10 py-4 bg-white border-t border-slate-100 flex items-center justify-between text-slate-400 shrink-0">
         <span className="text-[9px] font-bold uppercase tracking-widest">System Integrity Verified: RSA-4096 Security</span>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 leading-none">Cloud Link Active</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
         </div>
      </footer>
    </div>
  );
}



