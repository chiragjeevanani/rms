import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, AlertTriangle, Settings, Bell, RefreshCw, ChefHat, Filter, Moon, Sun } from 'lucide-react';
import { KDS_STATIONS, INITIAL_KDS_ORDERS } from '../data/kdsMockData';
import { KdsOrderCard } from '../components/KdsOrderCard';
import { useOrders } from '../../../context/OrderContext';
import { useTheme } from '../../user/context/ThemeContext';

export default function KdsDashboard() {
  const [activeStation, setActiveStation] = useState('all');
  const { orders, updateOrderStatus } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { isDarkMode, toggleTheme } = useTheme();

  // Consider orders not marked as 'ready' for the active queue
  const activeOrders = orders.filter(o => o.status !== 'ready');

  const filteredOrders = activeStation === 'all' 
    ? activeOrders 
    : activeOrders.filter(o => o.station === activeStation || !o.station); // Default to all if no station

  const summary = {
    total: activeOrders.length,
    new: activeOrders.filter(o => o.status === 'new').length,
    delayed: activeOrders.filter(o => {
      const elapsed = (Date.now() - new Date(o.startTime).getTime()) / 1000;
      return elapsed > 600;
    }).length
  };

  const handleComplete = (orderId) => {
    updateOrderStatus(orderId, 'ready');
    setSelectedOrder(null);
  };

  return (
    <div className={`h-full transition-colors duration-500 flex flex-col font-sans overflow-hidden ${
      isDarkMode ? 'bg-[#1a1c1e] text-stone-100' : 'bg-stone-50 text-stone-900'
    }`}>
      {/* Control Bar - Using as main page subheader */}
      <div className={`border-b transition-colors duration-500 px-4 md:px-10 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 font-display ${
        isDarkMode ? 'bg-black/20 border-white/5' : 'bg-white border-stone-100 shadow-sm'
      }`}>
         <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
            <Filter size={16} className="text-[#D4AF37] shrink-0 hidden sm:block" />
            <div className={`flex p-1 rounded-2xl border transition-all overflow-x-auto no-scrollbar w-full md:w-auto ${
              isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-stone-200'
            }`}>
                {KDS_STATIONS.map((station) => (
                   <button
                     key={station.id}
                     onClick={() => setActiveStation(station.id)}
                     className={`px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                       activeStation === station.id 
                       ? (isDarkMode ? 'bg-white text-stone-950 shadow-xl' : 'bg-[#5D4037] text-white shadow-lg') 
                       : (isDarkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600')
                     }`}
                   >
                     {station.name}
                   </button>
                ))}
            </div>
         </div>
         
         <div className={`hidden md:flex items-center gap-8`}>
            {/* Queue Summary moved from deleted header */}
            <div className="flex items-center gap-6">
               <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-stone-500 tracking-widest">New</span>
                  <span className="text-sm font-black text-blue-500">{summary.new}</span>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-stone-500 tracking-widest">Late</span>
                  <span className="text-sm font-black text-rose-500">{summary.delayed}</span>
               </div>
            </div>
            
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>
               <RefreshCw size={12} className="animate-spin mr-1 text-[#D4AF37]" />
               Sync Live
            </div>
         </div>
      </div>

      {/* Order Grid */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar">
         {filteredOrders.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <ChefHat size={80} strokeWidth={1} className="mb-4 md:mb-6 md:w-[120px] text-[#5D4037]" />
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-[#5D4037]">Kitchen Clear</h2>
              <p className="text-xs md:text-sm font-bold mt-2">All orders have been fulfilled.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8">
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

      {/* Order Details Drawer */}
      <AnimatePresence>
         {selectedOrder && (
            <>
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setSelectedOrder(null)}
                 className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
               />
               <motion.div 
                 initial={{ x: '100%' }}
                 animate={{ x: 0 }}
                 exit={{ x: '100%' }}
                 transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                 className={`fixed top-0 right-0 h-full w-full sm:max-w-xl md:max-w-2xl lg:max-w-xl transition-colors duration-500 border-l z-[101] flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.6)] ${
                   isDarkMode ? 'bg-[#1a1c1e] border-white/10' : 'bg-white border-stone-200'
                 }`}
               >
                  <div className={`p-6 md:p-8 border-b transition-colors ${
                    isDarkMode ? 'border-white/5' : 'border-stone-100'
                  }`}>
                     <div className="flex items-center justify-between mb-6 md:mb-8">
                        <button 
                          onClick={() => setSelectedOrder(null)}
                          className={`p-2.5 md:p-3 rounded-xl transition-all border ${
                            isDarkMode ? 'bg-white/5 border-white/5 text-stone-400 hover:bg-white/10' : 'bg-stone-100 border-stone-200 text-stone-500 hover:bg-stone-200'
                          }`}
                        >
                           <RefreshCw size={18} md:size={20} className="rotate-45" />
                        </button>
                        <div className="text-right">
                           <span className="text-[9px] md:text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-1 block">Detail Analysis</span>
                           <h2 className={`text-2xl md:text-3xl font-black tracking-tighter uppercase transition-colors ${
                             isDarkMode ? 'text-white' : 'text-[#5D4037]'
                           }`}>Order #{selectedOrder.orderNum}</h2>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <div className={`p-3 md:p-4 rounded-2xl border transition-colors ${
                          isDarkMode ? 'bg-black/20 border-white/5' : 'bg-stone-50 border-stone-100'
                        }`}>
                           <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-500 mb-0.5 block tracking-widest">Table</span>
                           <span className={`text-lg md:text-xl font-black transition-colors ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>#{selectedOrder.table}</span>
                        </div>
                        <div className={`p-3 md:p-4 rounded-2xl border transition-colors ${
                          isDarkMode ? 'bg-black/20 border-white/5' : 'bg-stone-50 border-stone-100'
                        }`}>
                           <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-500 mb-0.5 block tracking-widest">Channel</span>
                           <span className={`text-sm md:text-xl font-black capitalize truncate transition-colors ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>{selectedOrder.source}</span>
                        </div>
                        <div className={`p-3 md:p-4 rounded-2xl border transition-colors ${
                          isDarkMode ? 'bg-black/20 border-white/5' : 'bg-stone-50 border-stone-100'
                        }`}>
                           <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-500 mb-0.5 block tracking-widest">Station</span>
                           <span className={`text-lg md:text-xl font-black uppercase tracking-tight truncate transition-colors ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>{selectedOrder.station || 'Mains'}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
                      <div>
                         <h3 className="text-[9px] md:text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4 px-1">Active Item List</h3>
                         <div className="space-y-3">
                            {selectedOrder.items.map((item) => (
                               <div key={item.id} className={`border p-4 md:p-5 rounded-[1.5rem] flex items-center justify-between group transition-all ${
                                 isDarkMode ? 'bg-[#2a2c2e] border-white/5 hover:bg-[#3a3c3e]' : 'bg-stone-50 border-stone-100 hover:bg-stone-100'
                               }`}>
                                  <div className="flex items-center gap-4 md:gap-5">
                                     <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl font-black border group-hover:scale-105 transition-all ${
                                       isDarkMode ? 'bg-stone-900 text-[#D4AF37] border-white/5' : 'bg-white text-[#5D4037] border-stone-200 shadow-sm'
                                     }`}>
                                        {item.quantity}
                                     </div>
                                     <div className="min-w-0">
                                        <h4 className={`text-sm md:text-lg font-bold uppercase tracking-tight leading-none mb-1 md:mb-1.5 truncate transition-colors ${
                                          isDarkMode ? 'text-white' : 'text-stone-800'
                                        }`}>{item.name}</h4>
                                        {item.note && (
                                          <div className="flex items-center gap-1.5 text-red-400">
                                             <AlertTriangle size={12} className="shrink-0" />
                                             <span className="text-[10px] md:text-[11px] font-bold uppercase italic tracking-wide truncate">{item.note}</span>
                                          </div>
                                        )}
                                     </div>
                                  </div>
                                  <button className={`p-2.5 md:p-3 rounded-lg md:rounded-xl transition-all border shrink-0 ${
                                    isDarkMode ? 'bg-stone-900 text-stone-500 hover:text-[#D4AF37] border-white/5' : 'bg-white text-stone-400 hover:text-[#5D4037] border-stone-200'
                                  }`}>
                                     <RefreshCw size={16} md:size={18} />
                                  </button>
                               </div>
                            ))}
                         </div>
                      </div>
                  </div>

                  <div className={`p-6 md:p-8 border-t transition-colors ${
                    isDarkMode ? 'border-white/5 bg-black/40 backdrop-blur-xl' : 'border-stone-100 bg-stone-50/80'
                  }`}>
                     <button 
                       onClick={() => handleComplete(selectedOrder.id)}
                       className="w-full bg-[#5D4037] text-white py-5 md:py-6 rounded-2xl font-black text-base md:text-lg uppercase tracking-widest shadow-2xl shadow-[#5D4037]/20 hover:bg-[#4E342E] transition-all active:scale-[0.98]"
                     >
                        Finalize Order
                     </button>
                  </div>
                </motion.div>
            </>
         )}
      </AnimatePresence>
    </div>
  );
}
