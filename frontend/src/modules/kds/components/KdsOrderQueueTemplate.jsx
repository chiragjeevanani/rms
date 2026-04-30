import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Search, RefreshCw } from 'lucide-react';
import { KdsOrderCard } from './KdsOrderCard';
import { useOrders } from '../../../context/OrderContext';
import { useTheme } from '../../user/context/ThemeContext';

export default function KdsOrderQueueTemplate({ 
  title, 
  statusFilter, 
  emptyMessage = "No orders in this queue", 
  accentColor = "teal",
  hideActions = false
}) {
  const { orders, fetchOrders, updateOrderStatus } = useOrders();
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredOrders = orders.filter(o => {
    const matchesStatus = Array.isArray(statusFilter) 
      ? statusFilter.includes(o.status) 
      : o.status === statusFilter;
    
    if (!matchesStatus) return false;
    
    if (!searchTerm) return true;
    
    return (o.orderNum || '').includes(searchTerm) || 
           (o.table || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Simplified View Header */}
      <header className={`px-8 py-4 border-b shrink-0 flex items-center justify-between transition-colors duration-500 ${
        isDarkMode ? 'bg-[#1a1c1e] border-white/5 shadow-inner' : 'bg-white border-stone-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className={`text-lg font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#ff7a00]'}`}>
              {title}
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                {filteredOrders.length} Elements
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`relative flex items-center p-1 rounded-xl border transition-all ${
            isDarkMode ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-100 shadow-inner'
          }`}>
            <Search size={14} className="absolute left-4 text-stone-500" />
            <input 
              type="text"
              placeholder="SEARCH QUEUE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none pl-10 pr-4 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400 placeholder:text-stone-600 w-32 focus:w-48 transition-all"
            />
          </div>
          <button 
            onClick={fetchOrders}
            className={`p-2.5 rounded-xl border transition-all ${
              isDarkMode ? 'bg-white/5 text-stone-400 border-white/5 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-[#ff7a00]'
            }`}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Grid */}
      <main className={`flex-1 overflow-y-auto p-8 no-scrollbar transition-colors ${
        isDarkMode ? 'bg-[#1a1c1e]' : 'bg-stone-50'
      }`}>
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <ChefHat size={80} strokeWidth={1} className="mb-6 text-[#ff7a00]" />
            <h2 className="text-4xl font-black uppercase tracking-tighter text-[#ff7a00]">{emptyMessage}</h2>
            <p className="text-sm font-bold mt-2 uppercase tracking-widest text-stone-500">Everything is up to date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order) => (
                <KdsOrderCard 
                  key={order.id} 
                  order={order} 
                  onClick={(o) => navigate(`/kds/orders/${o.id}`)} 
                  onStatusChange={updateOrderStatus}
                  hideActions={hideActions}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}



