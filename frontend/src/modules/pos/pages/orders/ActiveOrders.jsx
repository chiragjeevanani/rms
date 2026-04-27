import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle2, Search, Filter, 
  MoreVertical, Receipt, ChevronRight,
  Timer, AlertCircle, Utensils, RefreshCcw,
  Zap, ArrowRight, User, Menu, X, Trash2, Printer, Globe,
  Plus, ShoppingBag, ShoppingCart, CreditCard, ChevronDown, Check,
  Minus, Layout, Sparkles, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { usePos } from '../../context/PosContext';
import { useNavigate } from 'react-router-dom';
import PosTopNavbar from '../../components/PosTopNavbar';

const socket = io((import.meta.env.VITE_API_URL || '').replace('/api', ''));

export default function ActiveOrders() {
  const navigate = useNavigate();
  const { toggleSidebar, fetchActiveTableOrders } = usePos();

  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/active`);
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();

    socket.on('statusUpdated', () => fetchActiveOrders());
    socket.on('orderCreated', () => fetchActiveOrders());

    return () => {
      socket.off('statusUpdated');
      socket.off('orderCreated');
    };
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Order marked as ${newStatus}`);
        fetchActiveOrders();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getElapsedTime = (createdAt) => {
    const diff = Math.floor((currentTime - new Date(createdAt)) / 1000); // seconds
    const mins = Math.floor(diff / 60);
    return `${mins} MINS`;
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    return order.status.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] animate-in fade-in duration-500 font-sans select-none">
      <PosTopNavbar />
      {/* 1. Page Header */}
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-[var(--primary-color)]">Active Order Management</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live KOT Monitoring & Status Tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 px-4 bg-amber-50 text-[var(--primary-color)] rounded flex items-center gap-2 border border-amber-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest font-black text-[var(--primary-color)]">{orders.length} Orders Active</span>
            </div>
             <button 
              onClick={() => navigate('/pos/tables')}
              className="h-10 px-6 bg-[var(--primary-color)] text-white rounded text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center gap-2"
            >
              <Plus size={14} /> New Order Entry
            </button>
            <button 
              onClick={fetchActiveOrders}
              className="p-2.5 bg-gray-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 transition-all"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 2. Status Selection Tabs */}
        <div className="flex items-center gap-8 border-b border-slate-100">
           <TabBtn active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="All Orders" count={orders.length} />
           <TabBtn active={activeTab === 'Preparing'} onClick={() => setActiveTab('Preparing')} label="In Preparation" count={orders.filter(o => o.status === 'Preparing').length} />
           <TabBtn active={activeTab === 'Ready'} onClick={() => setActiveTab('Ready')} label="Ready for Service" count={orders.filter(o => o.status === 'Ready').length} />
        </div>
      </header>

      {/* 3. Grid Content */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
         {filteredOrders.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
              <Utensils size={64} className="text-slate-200 mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Queue is Crystal Clear</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredOrders.map(order => (
                <motion.div 
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group transition-all hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/5 h-fit"
                >
                   {/* Card Header */}
                   <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg ${order.status === 'Ready' ? 'bg-emerald-500 shadow-emerald-500/10' : 'bg-[var(--primary-color)] shadow-[var(--primary-color)]/10'}`}>
                            <Utensils size={14} />
                         </div>
                         <div>
                            <h3 className="text-xs font-black uppercase tracking-tight text-slate-900">{order.tableName}</h3>
                            <p className="text-[9px] font-bold text-slate-400">#{order.orderNumber.split('-').pop()}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${order.status === 'Ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-[var(--primary-color)] border-amber-100'}`}>
                            {order.status}
                         </span>
                         <button className="text-slate-300 hover:text-slate-900"><MoreVertical size={16} /></button>
                      </div>
                   </div>

                   {/* Card Items */}
                   <div className="p-5 flex-1 space-y-3">
                      <div className="space-y-1.5">
                         {order.items.slice(0, 3).map((item, idx) => (
                           <div key={idx} className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                              <div className="flex items-center gap-2 truncate pr-4">
                                 <div className="w-1 h-1 rounded-full bg-slate-300" />
                                 <span className="truncate">{item.name}</span>
                              </div>
                              <span className="text-slate-400 font-black">x{item.quantity}</span>
                           </div>
                         ))}
                         {order.items.length > 3 && (
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center pt-2 italic">
                              + {order.items.length - 3} more items
                           </p>
                         )}
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-1.5">
                            <Timer size={12} className={order.status === 'Ready' ? 'text-emerald-500' : 'text-[var(--primary-color)]'} />
                            <span className="text-[10px] font-black text-slate-950 uppercase">{getElapsedTime(order.createdAt)} ELAPSED</span>
                         </div>
                         <span className="text-xs font-black text-slate-950">₹{order.grandTotal.toFixed(2)}</span>
                      </div>
                   </div>

                   {/* Card Footer Actions */}
                   <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                      <button 
                        onClick={() => navigate(`/pos/order/${order.tableName}`)}
                        className="flex-1 py-2.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                      >
                         View Details
                      </button>
                      <button 
                        onClick={() => updateStatus(order._id, order.status === 'Ready' ? 'Completed' : 'Ready')}
                        className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white transition-all shadow-md active:scale-95 ${order.status === 'Ready' ? 'bg-[var(--primary-color)] hover:opacity-90 shadow-[var(--primary-color)]/10' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10'}`}
                      >
                         {order.status === 'Ready' ? 'Finalize Order' : 'Mark Ready'}
                      </button>
                   </div>
                </motion.div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label, count }) {
  return (
    <button 
      onClick={onClick}
      className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all flex items-center gap-2 ${active ? 'text-[var(--primary-color)]' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {label}
      {count > 0 && <span className={`px-1.5 py-0.5 rounded text-[8px] ${active ? 'bg-[var(--primary-color)] text-white' : 'bg-slate-100 text-slate-400'}`}>{count}</span>}
      {active && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-color)]" />}
    </button>
  );
}



