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
    <div className={`min-h-screen transition-colors duration-500 flex flex-col font-sans overflow-hidden ${
      isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* KDS Header */}
      <header className={`border-b transition-colors duration-500 px-4 md:px-10 py-4 md:py-6 flex flex-wrap items-center justify-between gap-4 shrink-0 sticky top-0 z-50 ${
        isDarkMode ? 'bg-slate-950 border-white/5' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-4 md:gap-6">
           <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-teal-500/10">
              <ChefHat size={24} className="md:w-8 md:h-8 text-white" />
           </div>
           <div>
              <h1 className={`text-xl md:text-3xl font-black tracking-tighter uppercase leading-none mb-1 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Kitchen Display</h1>
              <div className="flex items-center gap-2 md:gap-3">
                 <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Active terminal Node</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 ml-auto">
           {/* Summary Stats */}
           <div className={`hidden sm:flex items-center gap-4 md:gap-8 mr-2 md:mr-12 px-4 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl border transition-all ${
             isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-slate-100 border-slate-200'
           }`}>
              <div className="flex flex-col items-center">
                 <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Queue</span>
                 <span className={`text-lg md:text-2xl font-black transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{summary.total}</span>
              </div>
              <div className={`w-px h-8 md:h-10 transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-slate-300'}`} />
              <div className="flex flex-col items-center">
                 <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>New</span>
                 <span className="text-lg md:text-2xl font-black text-blue-500">{summary.new}</span>
              </div>
              <div className={`w-px h-8 md:h-10 transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-slate-300'}`} />
              <div className="flex flex-col items-center">
                 <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Delayed</span>
                 <span className="text-lg md:text-2xl font-black text-rose-500 underline decoration-rose-500/30 underline-offset-4">{summary.delayed}</span>
              </div>
           </div>

           <button 
             onClick={toggleTheme}
             className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border transition-all ${
               isDarkMode ? 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
             }`}
           >
              {isDarkMode ? <Sun size={20} className="md:w-6 md:h-6" /> : <Moon size={20} className="md:w-6 md:h-6" />}
           </button>
           <button className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border transition-all ${
             isDarkMode ? 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
           }`}>
              <Bell size={20} className="md:w-6 md:h-6" />
           </button>
           <button className="w-10 h-10 md:w-14 md:h-14 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 border border-white/5 hover:bg-slate-800 transition-all">
              <Settings size={20} className="md:w-6 md:h-6" />
           </button>
        </div>
      </header>

      {/* Control Bar */}
      <div className={`border-b transition-colors duration-500 px-4 md:px-10 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 font-display ${
        isDarkMode ? 'bg-slate-900/30 border-white/5' : 'bg-slate-100 border-slate-200'
      }`}>
         <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
            <Filter size={16} className="text-teal-500 shrink-0 hidden sm:block" />
            <div className={`flex p-1 rounded-2xl border transition-all overflow-x-auto no-scrollbar w-full md:w-auto ${
              isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
            }`}>
                {KDS_STATIONS.map((station) => (
                   <button
                     key={station.id}
                     onClick={() => setActiveStation(station.id)}
                     className={`px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                       activeStation === station.id 
                       ? (isDarkMode ? 'bg-white text-slate-950 shadow-xl' : 'bg-slate-900 text-white shadow-lg') 
                       : (isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
                     }`}
                   >
                     {station.name}
                   </button>
                ))}
            </div>
         </div>
         
         <div className={`hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <RefreshCw size={12} className="animate-spin mr-1 text-teal-500" />
            Sync Interval: 2.5s
         </div>
      </div>

      {/* Order Grid */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar">
         {filteredOrders.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <ChefHat size={80} strokeWidth={1} className="mb-4 md:mb-6 md:w-[120px]" />
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">Kitchen Clear</h2>
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
                   isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
                 }`}
               >
                  <div className={`p-6 md:p-8 border-b transition-colors ${
                    isDarkMode ? 'border-white/5' : 'border-slate-100'
                  }`}>
                     <div className="flex items-center justify-between mb-6 md:mb-8">
                        <button 
                          onClick={() => setSelectedOrder(null)}
                          className={`p-2.5 md:p-3 rounded-xl transition-all border ${
                            isDarkMode ? 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                           <RefreshCw size={18} md:size={20} className="rotate-45" />
                        </button>
                        <div className="text-right">
                           <span className="text-[9px] md:text-[10px] font-black text-teal-400 uppercase tracking-[0.3em] mb-1 block">Detail Analysis</span>
                           <h2 className={`text-2xl md:text-3xl font-black tracking-tighter uppercase transition-colors ${
                             isDarkMode ? 'text-white' : 'text-slate-900'
                           }`}>Order #{selectedOrder.orderNum}</h2>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <div className={`p-3 md:p-4 rounded-2xl border transition-colors ${
                          isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'
                        }`}>
                           <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-500 mb-0.5 block tracking-widest">Table</span>
                           <span className={`text-lg md:text-xl font-black transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>#{selectedOrder.table}</span>
                        </div>
                        <div className={`p-3 md:p-4 rounded-2xl border transition-colors ${
                          isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'
                        }`}>
                           <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-500 mb-0.5 block tracking-widest">Channel</span>
                           <span className={`text-sm md:text-xl font-black capitalize truncate transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedOrder.source}</span>
                        </div>
                        <div className={`p-3 md:p-4 rounded-2xl border transition-colors ${
                          isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'
                        }`}>
                           <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-500 mb-0.5 block tracking-widest">Station</span>
                           <span className={`text-lg md:text-xl font-black uppercase tracking-tight truncate transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedOrder.station || 'Mains'}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
                      <div>
                         <h3 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Active Item List</h3>
                         <div className="space-y-3">
                            {selectedOrder.items.map((item) => (
                               <div key={item.id} className={`border p-4 md:p-5 rounded-[1.5rem] flex items-center justify-between group transition-all ${
                                 isDarkMode ? 'bg-slate-800/30 border-white/5 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                               }`}>
                                  <div className="flex items-center gap-4 md:gap-5">
                                     <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl font-black border group-hover:scale-105 transition-all ${
                                       isDarkMode ? 'bg-slate-900 text-teal-400 border-white/5' : 'bg-white text-teal-600 border-slate-200 shadow-sm'
                                     }`}>
                                        {item.quantity}
                                     </div>
                                     <div className="min-w-0">
                                        <h4 className={`text-sm md:text-lg font-bold uppercase tracking-tight leading-none mb-1 md:mb-1.5 truncate transition-colors ${
                                          isDarkMode ? 'text-white' : 'text-slate-800'
                                        }`}>{item.name}</h4>
                                        {item.note && (
                                          <div className="flex items-center gap-1.5 text-rose-400">
                                             <AlertTriangle size={12} className="shrink-0" />
                                             <span className="text-[10px] md:text-[11px] font-bold uppercase italic tracking-wide truncate">{item.note}</span>
                                          </div>
                                        )}
                                     </div>
                                  </div>
                                  <button className={`p-2.5 md:p-3 rounded-lg md:rounded-xl transition-all border shrink-0 ${
                                    isDarkMode ? 'bg-slate-900 text-slate-500 hover:text-teal-400 border-white/5' : 'bg-white text-slate-400 hover:text-teal-600 border-slate-200'
                                  }`}>
                                     <RefreshCw size={16} md:size={18} />
                                  </button>
                               </div>
                            ))}
                         </div>
                      </div>
                  </div>

                  <div className={`p-6 md:p-8 border-t transition-colors ${
                    isDarkMode ? 'border-white/5 bg-black/40 backdrop-blur-xl' : 'border-slate-100 bg-slate-50/80'
                  }`}>
                     <button 
                       onClick={() => handleComplete(selectedOrder.id)}
                       className="w-full bg-emerald-500 text-slate-950 py-5 md:py-6 rounded-2xl font-black text-base md:text-lg uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-[0.98]"
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
