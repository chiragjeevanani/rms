import React, { useState, useEffect } from 'react';
import {
  Menu, Search, BookOpen, Store, CreditCard, LayoutGrid, Monitor,
  Clock, X, Phone, ShoppingCart, Wallet, ChevronDown,
  FileText, History, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../context/PosContext';
import { playClickSound } from '../utils/sounds';
import toast from 'react-hot-toast';
import SyncStatusIndicator from './SyncStatusIndicator';

export default function PosTopNavbar() {
  const navigate = useNavigate();
  const { user, toggleSidebar, setIsQuickOrderModalOpen, updateBranchColors } = usePos();
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
  const branchId = staffInfo.branchId?._id || staffInfo.branchId || 'default';

  const [navbarColor, setNavbarColor] = useState('var(--primary-color)');
  const [menuBarColor, setMenuBarColor] = useState('var(--primary-color)');

  useEffect(() => {
    const savedNavbarColor = localStorage.getItem(`pos_navbar_color_${branchId}`) || 'var(--primary-color)';
    const savedMenuBarColor = localStorage.getItem(`pos_sidebar_color_${branchId}`) || 'var(--primary-color)';
    setNavbarColor(savedNavbarColor);
    setMenuBarColor(savedMenuBarColor);
  }, [branchId]);

  const handleNavbarChange = (colorVal) => {
    setNavbarColor(colorVal);
    updateBranchColors(colorVal, menuBarColor);
  };

  const handleMenuBarChange = (colorVal) => {
    setMenuBarColor(colorVal);
    updateBranchColors(navbarColor, colorVal);
  };

  const handleResetDefaults = () => {
    setNavbarColor('var(--primary-color)');
    setMenuBarColor('var(--primary-color)');
    updateBranchColors('var(--primary-color)', 'var(--primary-color)');
    localStorage.removeItem(`pos_navbar_color_${branchId}`);
    localStorage.removeItem(`pos_sidebar_color_${branchId}`);
    toast.success('Restored System Defaults!');
  };

  return (
    <nav className="sticky top-0 z-50 h-14 flex items-center px-3 gap-2 shadow-lg transition-all"
         style={{ background: 'var(--pos-navbar-color, var(--primary-color))' }}>

      {/* Left: Hamburger + Logo + New Order + Search */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { playClickSound(); toggleSidebar(); }}
          className="p-2 hover:bg-black/10 rounded-md transition-colors"
        >
          <Menu size={22} className="text-white" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white text-sm"
               style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            R
          </div>
          <div className="bg-black/10 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center">
            RMS
          </div>
        </div>

        <button
          onClick={() => { playClickSound(); setIsQuickOrderModalOpen(true); }}
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
        <SyncStatusIndicator />
        <NavIcon onClick={() => { playClickSound(); navigate('/pos/menu'); }}   icon={<BookOpen size={18} />} />
        <NavIcon onClick={() => { playClickSound(); navigate('/pos/tables'); }} icon={<Store size={18} />} />
        <NavIcon onClick={() => { playClickSound(); }}                           icon={<CreditCard size={18} />} />
        <NavIcon onClick={() => { playClickSound(); navigate('/pos/dashboard');}}icon={<LayoutGrid size={18} />} />
        <NavIcon onClick={() => { playClickSound(); }}                           icon={<Monitor size={18} />} />
        <NavIcon onClick={() => { playClickSound(); setIsRecentOpen(true); }}   icon={<Clock size={18} />} />
        <NavIcon onClick={() => { playClickSound(); setIsThemeCustomizerOpen(true); }} icon={<Palette size={18} />} />

        <div className="w-px h-6 bg-white/30 mx-1" />

        {/* Phone support */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md">
            <Phone size={14} className="text-white" />
          </div>
          <div className="hidden xl:flex flex-col leading-none">
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Call For Support</span>
            <span className="text-sm font-black text-white">9311472355</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isRecentOpen && (
          <RecentOrdersPanel onClose={() => setIsRecentOpen(false)} />
        )}
      </AnimatePresence>

      {isThemeCustomizerOpen && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsThemeCustomizerOpen(false)} 
          />
          <div 
            className="absolute right-6 top-16 w-80 bg-white rounded-2xl shadow-2xl p-5 border border-slate-100 z-[101] flex flex-col gap-4 text-left font-sans text-slate-800"
          >
            <div>
              <h4 className="text-xs font-black uppercase tracking-tight">POS Style Studio</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Customize terminal colors</p>
            </div>

            {/* Navbar Color Selector */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Navbar Color</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'System', value: 'var(--primary-color)' },
                  { name: 'Teal', value: '#00ACC1' },
                  { name: 'Emerald', value: '#10B981' },
                  { name: 'Rose', value: '#F43F5E' },
                  { name: 'Slate', value: '#475569' },
                  { name: 'Indigo', value: '#6366F1' },
                  { name: 'Dark', value: '#1E293B' },
                ].map(color => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleNavbarChange(color.value)}
                    className="px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
                    style={{
                      backgroundColor: navbarColor === color.value ? 'rgba(0, 0, 0, 0.05)' : 'white',
                      borderColor: navbarColor === color.value ? 'var(--primary-color)' : '#E2E8F0',
                      color: '#475569'
                    }}
                  >
                    {color.name}
                  </button>
                ))}
                <input 
                  type="color"
                  value={navbarColor.startsWith('#') ? navbarColor : '#ff7a00'}
                  onChange={(e) => handleNavbarChange(e.target.value)}
                  className="w-8 h-6 border border-slate-200 rounded cursor-pointer p-0"
                />
              </div>
            </div>

            {/* Sidebar Menu Color Selector */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Left Menu Color</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'System', value: 'var(--primary-color)' },
                  { name: 'Teal', value: '#00ACC1' },
                  { name: 'Emerald', value: '#10B981' },
                  { name: 'Rose', value: '#F43F5E' },
                  { name: 'Slate', value: '#475569' },
                  { name: 'Indigo', value: '#6366F1' },
                  { name: 'Dark', value: '#1E293B' },
                ].map(color => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleMenuBarChange(color.value)}
                    className="px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
                    style={{
                      backgroundColor: menuBarColor === color.value ? 'rgba(0, 0, 0, 0.05)' : 'white',
                      borderColor: menuBarColor === color.value ? 'var(--primary-color)' : '#E2E8F0',
                      color: '#475569'
                    }}
                  >
                    {color.name}
                  </button>
                ))}
                <input 
                  type="color"
                  value={menuBarColor.startsWith('#') ? menuBarColor : '#ff7a00'}
                  onChange={(e) => handleMenuBarChange(e.target.value)}
                  className="w-8 h-6 border border-slate-200 rounded cursor-pointer p-0"
                />
              </div>
            </div>

            {/* Reset to system defaults */}
            <button
              type="button"
              onClick={handleResetDefaults}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 transition-all text-center"
            >
              Reset to System Defaults
            </button>
          </div>
        </>
      )}
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
