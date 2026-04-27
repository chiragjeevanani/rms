import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Clock, Printer, CheckCircle, 
  AlertCircle, ChefHat, User, Hash, Utensils,
  Maximize2, MoreVertical, CheckCircle2, History, Activity
} from 'lucide-react';
import { useOrders } from '../../../context/OrderContext';
import { useTheme } from '../../user/context/ThemeContext';
import { useKdsTimer } from '../hooks/useKdsTimer';

export default function KdsOrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById, updateOrderStatus, updateItemStatus } = useOrders();
  const { isDarkMode } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const maxPrepTimeEst = order?.items.reduce((max, item) => Math.max(max, item.prepTimeEst || 0), 0) || 0;
  const { formatTime, isDelayed } = useKdsTimer(order?.startTime, order?.status, order?.prepTime, order?.readyTime, maxPrepTimeEst);

  useEffect(() => {
    const fetchDetail = async () => {
      const data = await getOrderById(id);
      if (data) setOrder(data);
      setLoading(false);
    };
    fetchDetail();
    const interval = setInterval(fetchDetail, 10000); // Sync every 10s
    return () => clearInterval(interval);
  }, [id, getOrderById]);

  const handleStatusChange = async (newStatus) => {
    await updateOrderStatus(order.id, newStatus);
    const updated = await getOrderById(order.id);
    setOrder(updated);
  };

  const handleItemToggle = async (itemId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateItemStatus(order.id, itemId, newStatus);
    setOrder(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === itemId ? { ...item, status: newStatus } : item)
    }));
  };

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0A0A0B]' : 'bg-stone-50'}`}>
        <div className="flex flex-col items-center gap-4">
           <div className="w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] animate-pulse">Loading Order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center gap-8 ${isDarkMode ? 'bg-[#0A0A0B]' : 'bg-stone-50'}`}>
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <AlertCircle size={48} />
        </div>
        <div className="text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Registry Mismatch</h2>
          <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">The requested Order ID does not exist in the active buffer.</p>
        </div>
        <button onClick={() => navigate(-1)} className="px-10 py-4 bg-[#ff7a00] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#ff7a00]/40 hover:scale-105 transition-all">
          Return to Queue
        </button>
      </div>
    );
  }

  const allItemsCompleted = order.items.every(i => i.status === 'completed');

  return (
    <div className={`flex-1 flex flex-col overflow-hidden transition-colors duration-500 ${
      isDarkMode ? 'bg-[#0A0A0B] text-white' : 'bg-stone-50 text-stone-900'
    }`}>
      
      {/* Dynamic Status Header */}
      <div className={`shrink-0 px-6 py-4 flex items-center justify-between border-b transition-colors shadow-2xl z-20 ${
        isDarkMode ? 'bg-[#121416] border-white/5' : 'bg-white border-stone-200'
      }`}>
        <div className="flex items-center gap-4">
           <button 
             onClick={() => navigate(-1)}
             className={`w-10 h-10 rounded-xl flex items-center justify-center hover:bg-stone-500/10 transition-colors ${
               isDarkMode ? 'text-stone-400' : 'text-stone-600'
             }`}
           >
             <ArrowLeft size={20} />
           </button>
           <div className="h-6 w-px bg-stone-500/20 mx-2" />
           <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">ID:</span>
                <span className="text-xs font-black tabular-nums">#{order.orderNum}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">REF: {order.id.slice(-6).toUpperCase()}</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Time Left</span>
              <div className={`flex items-center gap-2 text-xl font-mono font-black tabular-nums ${isDelayed ? 'text-red-500 animate-pulse' : 'text-[#D4AF37]'}`}>
                <Clock size={16} />
                {formatTime}
              </div>
           </div>
           <div className="h-10 w-px bg-stone-500/20" />
           <button className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
             isDarkMode ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-stone-100 border-stone-200'
           }`}>
             <Printer size={20} />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side: Order Geometry & Geometry Details */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 no-scrollbar">
           <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Table Identity Billboard */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start justify-between"
              >
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-stone-500">Active Order</span>
                   </div>
                   <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none mb-4">
                      Table <span className="text-[#D4AF37]">#{order.table}</span>
                   </h1>
                   <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${
                        isDarkMode ? 'bg-white/5' : 'bg-stone-200/50'
                      }`}>
                         <Utensils size={14} className="text-[#D4AF37]" />
                         {order.source}
                      </div>
                      <div className={`px-4 py-2 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${
                        isDarkMode ? 'bg-white/5' : 'bg-stone-200/50'
                      }`}>
                         <User size={14} className="text-[#D4AF37]" />
                         {order.waiterName || 'Terminal'}
                      </div>
                   </div>
                </div>

                <div className={`p-6 rounded-[2rem] border flex flex-col items-center justify-center text-center ${
                  isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-stone-100 shadow-xl'
                }`}>
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-2">Items</span>
                   <div className="text-4xl font-black leading-none">{order.items.length}</div>
                   <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mt-1">Total Qty</span>
                </div>
              </motion.div>

              {/* Items Cluster */}
              <div className="grid gap-6">
                <AnimatePresence mode="popLayout">
                  {order.items.map((item, idx) => (
                    <motion.button 
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleItemToggle(item.id, item.status)}
                      className={`relative group flex items-stretch rounded-[2.5rem] border overflow-hidden transition-all text-left ${
                        item.status === 'completed' 
                          ? (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20 opacity-50 contrast-75' : 'bg-emerald-50 border-emerald-100 opacity-60')
                          : (isDarkMode ? 'bg-[#1a1c1e] border-white/5 hover:border-white/10 shadow-2xl' : 'bg-white border-stone-200 hover:shadow-xl hover:border-stone-300')
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <div className="w-32 lg:w-36 bg-stone-900 border-r border-white/5 relative overflow-hidden shrink-0">
                         {item.image ? (
                           <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-stone-700">
                             <ChefHat size={48} strokeWidth={1} />
                           </div>
                         )}
                         <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border border-white/10">
                            {item.quantity}x
                         </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center">
                         <div className="flex items-center justify-between mb-2">
                           <h4 className={`text-xl lg:text-2xl font-black uppercase tracking-tight transition-all ${
                             item.status === 'completed' ? 'line-through text-stone-500' : ''
                           }`}>
                             {item.name}
                           </h4>
                           {item.status === 'completed' && <CheckCircle2 className="text-emerald-500" size={24} />}
                         </div>
                         
                         {item.note && (
                           <div className="flex items-start gap-2 text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 w-fit">
                              <AlertCircle size={14} className="shrink-0 mt-0.5" />
                              <p className="text-[10px] font-black uppercase italic tracking-widest">{item.note}</p>
                           </div>
                         )}

                         <div className="mt-4 flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Details:</span>
                            <div className="flex gap-1">
                               {item.modifiers?.map((m, i) => (
                                 <span key={i} className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                                   isDarkMode ? 'bg-white/5 text-stone-300' : 'bg-stone-100 text-stone-600'
                                 }`}>
                                   {m}
                                 </span>
                               ))}
                            </div>
                         </div>
                      </div>

                      {/* Interaction Overlay (Darken) */}
                      {item.status === 'completed' && (
                         <div className="absolute inset-x-0 bottom-0 h-1.5 bg-emerald-500" />
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
           </div>
        </div>

        {/* Right Side: Operational Sidebar */}
        <aside className={`w-full lg:w-[320px] shrink-0 border-l p-6 transition-colors flex flex-col overflow-y-auto no-scrollbar ${
          isDarkMode ? 'bg-[#0F1113] border-white/5' : 'bg-white border-stone-200'
        }`}>
           <div className="flex-1 space-y-8">
              <section>
                 <div className="flex items-center gap-3 mb-6">
                    <Activity size={18} className="text-[#D4AF37]" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">Order Status</h3>
                 </div>
                 
                  <div className="space-y-4">
                    {['new', 'pending', 'confirmed'].includes(order.status) && (
                      <button 
                        onClick={() => handleStatusChange('Preparing')}
                        className="w-full h-20 bg-[#ff7a00] text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-[#ff7a00]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                      >
                        <ChefHat size={24} />
                        Start Preparing
                      </button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <button 
                        onClick={() => handleStatusChange('Ready')}
                        className="w-full h-20 bg-emerald-600 border-2 border-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                      >
                        <CheckCircle size={24} />
                        Mark Ready
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex flex-col items-center text-center">
                         <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4">
                            <CheckCircle size={32} />
                         </div>
                         <h4 className="text-xl font-black uppercase tracking-tighter text-emerald-500">Ticket Ready</h4>
                         <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-2 leading-relaxed">
                            This ticket has been sent to the service terminal for dispatch.
                         </p>
                      </div>
                    )}
                 </div>
              </section>

              <section className={`p-8 rounded-[3rem] border transition-all ${
                isDarkMode ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-100'
              }`}>
                 <div className="flex items-center gap-4 border-b border-white/5 pb-6 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-stone-500/20 flex items-center justify-center text-[#D4AF37]">
                       <History size={20} />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Order History</h4>
                 </div>
                 <div className="space-y-6 relative ml-2">
                    <div className="absolute left-0 top-2 bottom-2 w-px bg-stone-500/20" />
                    {[
                      { event: 'Ticket Created', time: order.startTime, active: true },
                      { event: 'Authentication', node: 'KDS_TERMINAL_01', active: true },
                      { event: 'Preparation Mode', time: order.updatedAt, active: order.status !== 'new' },
                    ].map((step, i) => (
                      <div key={i} className="relative pl-6">
                        <div className={`absolute left-[-4px] top-1.5 w-2 h-2 rounded-full border-2 ${
                          step.active ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-transparent border-stone-500/30'
                        }`} />
                        <div className="flex flex-col">
                           <span className={`text-[10px] font-black uppercase tracking-tight ${step.active ? 'text-white' : 'text-stone-600'}`}>{step.event}</span>
                           <span className="text-[9px] font-mono text-stone-500 mt-0.5">
                              {step.time ? new Date(step.time).toLocaleTimeString() : step.node || 'Pending...'}
                           </span>
                        </div>
                      </div>
                    ))}
                 </div>
              </section>
           </div>
           
           <div className="mt-8 pt-8 border-t border-white/5 opacity-30 text-center">
              <span className="text-[8px] font-black uppercase tracking-[0.5em]">Global RMS • KDS GATEWAY v4.2</span>
           </div>
        </aside>

      </div>
    </div>
  );
}



