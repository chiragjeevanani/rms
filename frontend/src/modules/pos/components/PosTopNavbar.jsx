import { Menu, Search, BookOpen, Store, Wallet, LayoutGrid, Printer, ClipboardList, Clock, Bell, HelpCircle, Power, Phone, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../context/PosContext';
import { playClickSound } from '../utils/sounds';

export default function PosTopNavbar() {
  const navigate = useNavigate();
  const { toggleSidebar, toggleCustomerSection } = usePos();

  const handleAction = (label) => {
     playClickSound();
     console.log(`Action: ${label}`);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#1C1E22] border-b border-white/8 h-14 flex items-center px-4 justify-between shadow-lg">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => { playClickSound(); toggleSidebar(); }}
          className="p-2.5 hover:bg-white/8 rounded-lg transition-colors"
        >
          <Menu size={20} className="text-slate-300" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#5D4037] rounded flex items-center justify-center text-white font-black text-sm">R</div>
          <span className="text-white font-bold text-sm uppercase tracking-tight">RMS</span>
        </div>

        <button 
          onClick={() => { playClickSound(); navigate('/pos/tables'); }}
          className="bg-[#5D4037] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#4E342E] transition-colors shadow-md shadow-stone-900/30 uppercase tracking-tight ml-1"
        >
          + New Order
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input 
            type="text" 
            placeholder="Bill No" 
            className="pl-9 pr-3 py-2 bg-white/6 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#5D4037]/60 focus:border-[#5D4037]/50 w-28 transition-all"
          />
        </div>
      </div>

      {/* Center Section - Toolbar */}
      <div className="hidden lg:flex items-center gap-3 px-4 flex-1 justify-center">
        <ToolbarIcon onClick={() => { playClickSound(); navigate('/pos/orders/active'); }} label="Print" icon={<Printer size={18} />} />
        <ToolbarIcon onClick={() => { playClickSound(); navigate('/pos/orders/active'); }} label="Orders" icon={<ClipboardList size={18} />} />
        <ToolbarIcon onClick={() => { playClickSound(); navigate('/pos/orders/completed'); }} label="History" icon={<Clock size={18} />} />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <div 
          onClick={() => handleAction('Notifications')}
          className="relative p-2.5 hover:bg-white/8 rounded-lg transition-colors cursor-pointer group"
        >
          <Bell size={19} className="text-slate-300 group-hover:text-white transition-colors" />
          <span className="absolute top-1.5 right-1.5 bg-[#5D4037] text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center border border-[#1C1E22]">
            22
          </span>
        </div>
        
        <div 
          onClick={() => { playClickSound(); toggleCustomerSection(); }}
          className="p-2.5 hover:bg-white/8 rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-blue-500/20"
        >
          <User size={20} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
        </div>
        
        <ToolbarIcon onClick={() => handleAction('Help')} icon={<HelpCircle size={18} />} />
        <ToolbarIcon onClick={() => { playClickSound(); navigate('/login'); }} icon={<Power size={18} />} />

        <div className="hidden xl:flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg border border-white/8 hover:bg-white/8 transition-colors cursor-pointer ml-1">
          <div className="w-7 h-7 rounded-full bg-[#5D4037]/30 border border-[#5D4037]/50 flex items-center justify-center text-[#5D4037]">
            <Phone size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Call For Support</span>
            <span className="text-sm font-black text-white tabular-nums">07969 223344</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ToolbarIcon({ icon, onClick, label }) {
  return (
    <button 
      onClick={onClick}
      title={label}
      className="text-slate-400 hover:text-white transition-colors p-2.5 rounded-lg hover:bg-white/8 active:scale-90"
    >
      {icon}
    </button>
  );
}
