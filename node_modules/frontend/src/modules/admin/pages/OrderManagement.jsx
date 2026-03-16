
import React, { useState } from 'react';
import { 
  ShoppingBag, Search, Filter, Calendar, 
  ChevronRight, Clock, MapPin, Eye,
  Printer, CheckCircle2, XCircle, AlertCircle,
  X, Receipt, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '../../../context/OrderContext';
import { useTheme } from '../../user/context/ThemeContext';

export default function OrderManagement() {
  const { orders, updateOrderStatus, cancelOrder } = useOrders();
  const { isDarkMode } = useTheme();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || 
                         order.source?.toLowerCase().includes(filterStatus.toLowerCase());
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (order.table && `Table ${order.table}`.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar max-h-full">
       <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Live Order Monitor</h1>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time oversight of all dining and delivery channels</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-white p-1 border border-slate-200 rounded-sm">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-sm transition-all ${filterStatus === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
              >All Channels</button>
              <button 
                onClick={() => setFilterStatus('Staff App')}
                className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-sm transition-all ${filterStatus === 'Staff App' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
              >Staff Orders</button>
              <button 
                onClick={() => setFilterStatus('QR Ordering')}
                className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-sm transition-all ${filterStatus === 'QR Ordering' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
              >QR Orders</button>
           </div>
        </div>
      </div>

      {/* Real-time Order Grid */}
      <div className="bg-white border border-slate-100 rounded-sm shadow-sm overflow-hidden min-h-[500px]">
         <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-20">
            <div className="flex items-center gap-4 flex-1">
               <div className="max-w-xs w-full relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Find order by ID or Customer..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 py-1.5 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-slate-900/10 transition-all placeholder:text-slate-300" 
                  />
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-sm cursor-pointer whitespace-nowrap">
                  <Calendar size={12} className="text-slate-400" />
                  <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Today: {new Date().toLocaleDateString()}</span>
               </div>
            </div>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Protocol ID</th>
                     <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Channel</th>
                     <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Customer Unit</th>
                     <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Status Protocol</th>
                     <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap text-right">Items / Total</th>
                     <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map(order => (
                     <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer relative" onClick={() => setSelectedOrder(order)}>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black uppercase text-slate-900 tracking-tight">#{order.orderNum}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(order.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${order.source === 'Staff App' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{order.source}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-[10px] font-black uppercase text-slate-900">{order.table ? `Table ${order.table}` : 'Guest Area'}</span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                              order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                              order.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                              order.status === 'preparing' ? 'bg-blue-50 text-blue-600' :
                              order.status === 'ready' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                           }`}>
                              {order.status === 'completed' && <CheckCircle2 size={10} />}
                              {order.status === 'cancelled' && <XCircle size={10} />}
                              {order.status === 'preparing' && <Clock size={10} className="animate-spin" />}
                              {order.status === 'new' && <AlertCircle size={10} />}
                              {order.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-900 tracking-tighter">₹{order.total.toLocaleString()}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{order.items.length} Items registered</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 text-slate-400 hover:text-slate-900 bg-white border border-slate-100 rounded-sm shadow-sm transition-all"><Eye size={12} /></button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.alert(`PROTOCOL: Initializing print for Order ${order.id}...`);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-500 bg-white border border-slate-100 rounded-sm shadow-sm transition-all"
                              ><Printer size={12} /></button>
                              <ChevronRight size={14} className="text-slate-200" />
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Showing {filteredOrders.length} active records in current frame</span>
            <div className="flex items-center gap-1">
               <button className="p-1 border border-slate-200 rounded-sm opacity-50 cursor-pointer hover:bg-white"><ChevronRight size={12} className="rotate-180" /></button>
               <button className="p-1 border border-slate-200 rounded-sm cursor-pointer hover:bg-white"><ChevronRight size={12} /></button>
            </div>
         </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm shadow-2xl relative overflow-hidden flex flex-col"
            >
               <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-slate-900 text-white rounded-sm flex items-center justify-center">
                        <ShoppingBag size={16} />
                     </div>
                     <div>
                        <h3 className="text-[13px] font-black uppercase tracking-tight text-slate-900">Order Analysis: {selectedOrder.id}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Terminal Registry v2.4.0</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={18} /></button>
               </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Service Channel</p>
                           <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{selectedOrder.source}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Table Protocol</p>
                           <p className="text-[11px] font-bold text-slate-500 uppercase">{selectedOrder.table ? `TABLE ${selectedOrder.table}` : 'GUEST AREA'}</p>
                        </div>
                     </div>
                     <div className="space-y-4 text-right">
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Order Status</p>
                           <select 
                              value={selectedOrder.status}
                              onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                              className="text-[11px] font-black bg-slate-100 border-none outline-none px-2 py-1 rounded-sm uppercase tracking-widest text-blue-600"
                           >
                              <option value="new">NEW</option>
                              <option value="preparing">PREPARING</option>
                              <option value="ready">READY</option>
                              <option value="completed">COMPLETED</option>
                              <option value="cancelled">CANCELLED</option>
                           </select>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
                           <p className="text-xl font-black text-slate-900">₹{selectedOrder.total.toLocaleString()}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-6 border border-slate-100 rounded-sm">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Protocol Inventory</h4>
                     <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
                        {selectedOrder.items.map((item, idx) => (
                           <div key={idx} className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-900">
                              <span>{item.name} x {item.quantity}</span>
                              <span className="text-slate-400">{item.status || 'new'}</span>
                           </div>
                        ))}
                        <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] font-black uppercase text-slate-900">
                           <span>Total Calculated</span>
                           <span>₹{selectedOrder.total}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <button 
                        onClick={() => cancelOrder(selectedOrder.id)}
                        className="flex-1 py-3 bg-white border border-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                     >
                        <Trash2 size={14} />
                        Cancel Order
                     </button>
                     <button 
                        onClick={() => window.alert('PROTOCOL: Initializing terminal print...')}
                        className="flex-1 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                     >
                        <Receipt size={14} />
                        Print Protocol
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
