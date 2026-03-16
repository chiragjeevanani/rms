import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { KdsOrderCard } from './KdsOrderCard';
import { useOrders } from '../../../context/OrderContext';
import { useTheme } from '../../user/context/ThemeContext';

export default function KdsOrderQueueTemplate({ 
  title, 
  statusFilter, 
  emptyMessage = "No orders in this queue", 
  accentColor = "teal" 
}) {
  const { orders } = useOrders();
  const { isDarkMode } = useTheme();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(o => {
    const matchesStatus = Array.isArray(statusFilter) 
      ? statusFilter.includes(o.status) 
      : o.status === statusFilter;
    
    if (!matchesStatus) return false;
    
    if (!searchTerm) return true;
    
    return o.orderNum.includes(searchTerm) || 
           o.table.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* View Header */}
      <header className={`px-8 py-6 border-b shrink-0 flex items-center justify-between ${
        isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h1 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full bg-${accentColor}-500 animate-pulse`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {filteredOrders.length} Orders in Queue
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`relative flex items-center p-1 rounded-xl border ${
            isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'
          }`}>
            <Search size={16} className="absolute left-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search ID/Table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 placeholder:text-slate-600 w-48 focus:w-64 transition-all"
            />
          </div>
          <button className={`p-2.5 rounded-xl border transition-all ${
            isDarkMode ? 'bg-slate-800 text-slate-400 border-white/5' : 'bg-white text-slate-500 border-slate-200'
          }`}>
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 overflow-y-auto p-8 no-scrollbar">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <ChefHat size={80} strokeWidth={1} className="mb-6" />
            <h2 className="text-4xl font-black uppercase tracking-tighter">{emptyMessage}</h2>
            <p className="text-sm font-bold mt-2 uppercase tracking-widest">Everything is up to date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order) => (
                <KdsOrderCard 
                  key={order.id} 
                  order={order} 
                  onClick={setSelectedOrder} 
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Details Drawer (reused from dashboard logic) */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed top-0 right-0 h-full w-[500px] border-l z-[101] flex flex-col shadow-2xl ${
                isDarkMode ? 'bg-[#0F172A] border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              {/* Similar content to KdsDashboard detail drawer */}
              <div className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-3xl font-black tracking-tighter uppercase">Order #{selectedOrder.orderNum}</h2>
                   <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                      <RefreshCw size={20} className="rotate-45" />
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Table</span>
                    <span className="text-xl font-black">#{selectedOrder.table}</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Source</span>
                    <span className="text-xl font-black truncate block">{selectedOrder.source}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/5 p-5 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black">
                         {item.quantity}
                       </div>
                       <div>
                         <h4 className="font-bold text-lg uppercase tracking-tight">{item.name}</h4>
                         {item.note && (
                           <p className="text-xs text-rose-400 italic">★ {item.note}</p>
                         )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 border-t border-white/5 bg-black/20">
                {selectedOrder.status === 'new' && (
                  <button className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">
                    Start Preparing
                  </button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button className="w-full bg-emerald-500 text-slate-950 py-6 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20">
                    Mark as Done
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
