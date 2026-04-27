
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, Clock, Eye, MapPin, User, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';

export default function AllOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const [formData, setFormData] = useState({
    status: 'Pending'
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`);
      if (res.ok) {
        const result = await res.json();
        setOrders(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to sync orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid':
      case 'Completed': 
      case 'Served': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'Pending':
      case 'Confirmed':
      case 'Preparing': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'Cancelled': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  const handleOpenView = (order) => {
    setViewingOrder(order);
    setFormData({ status: order.status });
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/${viewingOrder._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: formData.status })
      });
      if (res.ok) {
        toast.success('Order status updated');
        fetchOrders();
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         o.tableName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         o.waiterName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 min-h-screen bg-[#FDFCFB]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase font-display italic">Master Order Log</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 shadow-sm inline-block">Real-time Operational Pulse</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
             <Clock size={16} className={`${loading ? 'animate-spin' : ''} text-slate-400`} />
          </button>
          <div className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-900/20">
            <ShoppingBag size={14} className="text-brand-500" />
            {orders.length} SIGNALS RECORDED
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="FILTER BY ORDER #, TABLE, OR STAFF..."
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/5 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm min-w-[200px]">
           <Filter size={14} className="text-slate-400" />
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="w-full bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
           >
              <option value="All">All Statuses</option>
              {['Pending', 'Confirmed', 'Preparing', 'Ready', 'Served', 'Paid', 'Cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
           </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-900/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Zone Designation</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Flow</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-20 bg-slate-50/20" />
                  </tr>
                ))
              ) : filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/80 group transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tighter group-hover:text-brand-600 transition-colors underline decoration-transparent decoration-2 underline-offset-4 decoration-brand-500/0 group-hover:decoration-brand-500/30">#{order.orderNumber}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                        <Clock size={10} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {order.waiterName}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg w-fit">
                       <MapPin size={10} className="text-slate-400" />
                       {order.tableName}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-slate-900 tracking-tighter">₹{order.grandTotal}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(order.status).replace('text-', 'bg-').split(' ')[0]}`} />
                      {order.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleOpenView(order)}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white border border-slate-100 rounded-xl transition-all hover:shadow-lg outline-none"
                    ><Eye size={18} /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active signals found in the matrix</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingOrder ? `Audit Order ${viewingOrder.orderNumber}` : 'Order Context'}
        subtitle="Operational Manifest & Status Override"
        onSubmit={handleUpdateStatus}
        submitLabel="Synchronize Flow"
      >
        {viewingOrder && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Source Entity</label>
                <div className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                   <User size={14} className="text-brand-500" />
                   {viewingOrder.waiterName}
                </div>
              </div>
              <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sector Designation</label>
                <div className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                   <MapPin size={14} className="text-brand-500" />
                   {viewingOrder.tableName}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Status Lifecycle Management</label>
              <div className="grid grid-cols-3 gap-2">
                {['Pending', 'Confirmed', 'Preparing', 'Ready', 'Served', 'Paid', 'Cancelled'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ status })}
                    className={`py-3 text-[9px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                      formData.status === status 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                        : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Manifest Elements</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><Hash size={10} /> {viewingOrder.items?.length || 0} Entities</span>
              </div>
              <div className="p-6 space-y-4">
                 {viewingOrder.items?.map((item, id) => (
                   <div key={id} className="flex justify-between items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                      <div>
                         <p className="text-xs font-black text-slate-900 uppercase italic">{item.name}</p>
                         {item.modifiers?.length > 0 && (
                           <div className="flex flex-wrap gap-1 mt-1">
                              {item.modifiers.map((m, idx) => (
                                <span key={idx} className="text-[8px] font-bold text-slate-400 uppercase py-0.5 px-1.5 bg-slate-100 rounded">
                                   {m.value}
                                </span>
                              ))}
                           </div>
                         )}
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-slate-900">x{item.quantity}</p>
                         <p className="text-[10px] font-bold text-slate-400 tracking-tighter">₹{item.price}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="p-6 bg-slate-50/50 space-y-2 border-t border-slate-100">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Transaction Subtotal</span>
                  <span className="text-slate-900">₹{viewingOrder.grandTotal}</span>
                </div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Fiscal Sum</span>
                  <span className="text-brand-600">₹{viewingOrder.grandTotal}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
