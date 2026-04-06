import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, ChefHat, Search, Filter, Hash, User, Calendar, X, MoreHorizontal } from 'lucide-react';
import { useOrders } from '../../../context/OrderContext';
import { StaffNavbar } from '../components/StaffNavbar';

/**
 * Staff-facing Active Orders module.
 * Provides real-time tracking of table orders with comprehensive filtering and status transitions.
 */
export default function ActiveOrders() {
  const { orders, updateItemStatus, updateOrderStatus } = useOrders();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status mapping for visual identity
  const statusConfig = {
    pending: { color: 'orange', label: 'In Queue', icon: Clock },
    preparing: { color: 'blue', label: 'Preparing', icon: ChefHat },
    ready: { color: 'emerald', label: 'Ready!', icon: CheckCircle },
    served: { color: 'slate', label: 'Completed', icon: CheckCircle },
    paid: { color: 'slate', label: 'Completed', icon: CheckCircle },
    cancelled: { color: 'red', label: 'Cancelled', icon: X }
  };

  // Advanced filtering logic
  const filteredOrders = (orders || []).filter(order => {
    // Search by table, order number, items, or waiter name
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      order.table?.toLowerCase().includes(searchLower) || 
      order.orderNum?.toString().includes(searchLower) ||
      order.waiterName?.toLowerCase().includes(searchLower) ||
      order.items?.some(i => i.name.toLowerCase().includes(searchLower));

    // Status filter
    let matchesFilter = filter === 'all' || order.status === filter;
    
    // Handle "completed" special case (Both served and paid)
    if (filter === 'completed') {
      matchesFilter = order.status === 'served' || order.status === 'paid';
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="flex-1 max-w-lg mx-auto w-full bg-white shadow-2xl flex flex-col min-h-screen pb-32">
        
        {/* Dynamic Header Node */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-6 pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
             <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Service Node</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Active Room Service</h1>
             </div>
             <div className="flex flex-col items-end">
                <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest shadow-lg shadow-slate-900/10">
                   {filteredOrders.length} Tracks
                </span>
             </div>
          </div>

          <div className="space-y-4">
             {/* Integrated Search Controller */}
             <div className="relative group">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search tables, items, or waiters..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 transition-all placeholder:text-slate-300"
               />
             </div>

             {/* Dynamic Status Filters */}
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['all', 'pending', 'preparing', 'ready', 'completed'].map((s) => (
                   <button
                     key={s}
                     onClick={() => setFilter(s)}
                     className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                       filter === s 
                       ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20' 
                       : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                     }`}
                   >
                     {s}
                   </button>
                ))}
             </div>
          </div>
        </header>

        <main className="p-6">
           <div className="flex flex-col gap-8">
              <AnimatePresence mode="popLayout">
                {filteredOrders.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-slate-100">
                       <Filter size={24} className="text-slate-200" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">No Orders Match Criteria</p>
                    <button onClick={() => {setFilter('all'); setSearch('')}} className="mt-4 text-[10px] font-black uppercase tracking-widest text-teal-500 underline underline-offset-4">Reset Node</button>
                  </motion.div>
                ) : (
                  filteredOrders.map((order) => {
                    const config = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    
                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                      >
                        {/* Order Identity Cell */}
                        <div className="bg-slate-50/50 px-8 py-6 flex items-center justify-between border-b border-slate-100">
                           <div className="flex items-center gap-5">
                              <div className="relative group/table">
                                 <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex flex-col items-center justify-center text-white shadow-xl shadow-slate-900/20 group-hover/table:scale-105 transition-transform">
                                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-40 leading-none mb-0.5">Table</span>
                                    <span className="text-2xl font-black leading-none">{order.table?.split(' ').pop()}</span>
                                 </div>
                              </div>
                              <div className="flex flex-col">
                                 <div className="flex items-center gap-1.5 mb-1.5">
                                    <Hash size={10} className="text-teal-500" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.orderNum}</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <User size={12} className="text-slate-300" />
                                    <p className="text-xs font-black text-slate-900">{order.waiterName || 'Staff Order'}</p>
                                 </div>
                              </div>
                           </div>
                           <div className={`p-4 rounded-[1.2rem] border-2 bg-white flex items-center justify-center shadow-lg border-${config.color}-50 text-${config.color}-500 w-12 h-12`}>
                              <StatusIcon size={20} />
                           </div>
                        </div>

                        {/* Order Cartography */}
                        <div className="p-8 space-y-8">
                           {order.items?.map((item, idx) => (
                              <div key={`${order.id}-${idx}`} className="flex flex-col gap-4">
                                 <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs border border-slate-200 shrink-0">
                                       {item.quantity}
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-xl shadow-slate-200/50 shrink-0">
                                       <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                    </div>
                                    <div className="flex-1 pt-1">
                                       <h4 className="text-sm font-black text-slate-900 tracking-tight leading-tight mb-2 line-clamp-2">{item.name}</h4>
                                       <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-2">
                                             <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'ready' ? 'bg-emerald-500' : 'bg-orange-400 animate-pulse'}`} />
                                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.status}</span>
                                          </div>
                                          {item.prepTimeEst && (
                                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                               <Clock size={10} className="text-slate-400" />
                                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">{item.prepTimeEst} min</span>
                                            </div>
                                          )}
                                       </div>
                                    </div>
                                    {item.status === 'ready' && (
                                       <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
                                          <CheckCircle size={18} />
                                       </div>
                                    )}
                                 </div>
                                 
                                 {idx < order.items.length - 1 && <div className="h-px bg-slate-50 w-full" />}
                              </div>
                           ))}
                        </div>

                        {/* Order Control Node */}
                        <div className="px-8 py-5 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                           <div className="flex items-center gap-3">
                              <Calendar size={12} className="text-slate-300" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(order.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                           
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-teal-500" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Kitchen Processing</span>
                           </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
           </div>
        </main>

        <StaffNavbar activeTab="orders" />
      </div>
    </div>
  );
}
