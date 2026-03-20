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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4 justify-between shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => { playClickSound(); toggleSidebar(); }}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-[#5D4037] font-bold text-xl italic tracking-tighter">RMS</span>
        </div>

        <button 
          onClick={() => { playClickSound(); navigate('/pos/tables'); }}
          className="bg-[#5D4037] text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-[#4E342E] transition-colors shadow-sm uppercase tracking-tight ml-2"
        >
          New Order
        </button>

        <div className="relative ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Bill No" 
            className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#5D4037] w-32"
          />
        </div>
      </div>

      {/* Center Section - Toolbar */}
      <div className="hidden lg:flex items-center gap-6 px-4 flex-1 justify-center">
        <ToolbarIcon onClick={() => { playClickSound(); navigate('/pos/orders/active'); }} icon={<Printer size={20} />} />
        <ToolbarIcon onClick={() => { playClickSound(); navigate('/pos/orders/active'); }} icon={<ClipboardList size={20} />} />
        <ToolbarIcon onClick={() => { playClickSound(); navigate('/pos/orders/completed'); }} icon={<Clock size={20} />} />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div 
          onClick={() => handleAction('Notifications')}
          className="relative p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer group"
        >
          <Bell size={20} className="text-gray-600 group-hover:text-[#5D4037] transition-colors" />
          <span className="absolute top-1 right-1 bg-[#5D4037] text-white text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center border-2 border-white">
            22
          </span>
        </div>
        
        <div 
          onClick={() => { playClickSound(); toggleCustomerSection(); }}
          className="p-2 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-[#5D4037]/20"
        >
          <User size={22} className="text-[#5D4037] transition-colors" />
        </div>
        
        <ToolbarIcon onClick={() => handleAction('Help')} icon={<HelpCircle size={20} />} />
        <ToolbarIcon onClick={() => { playClickSound(); navigate('/login'); }} icon={<Power size={20} />} />

        <div className="hidden xl:flex items-center gap-3 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100 hover:bg-stone-100 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#5D4037] shadow-sm">
            <Phone size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-800 font-bold uppercase leading-none">Call For Support</span>
            <span className="text-sm font-black text-[#5D4037] tabular-nums">07969 223344</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ToolbarIcon({ icon, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="text-gray-500 hover:text-[#5D4037] transition-colors p-1 rounded-md active:scale-90"
    >
      {icon}
    </button>
  );
}
