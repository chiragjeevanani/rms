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
import { useNavigate, useSearchParams } from 'react-router-dom';
import PosTopNavbar from '../../components/PosTopNavbar';
import { printBillReceipt } from '../../utils/printBill';

const socket = io((import.meta.env.VITE_API_URL || '').replace('/api', ''));

export default function ActiveOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderTypeFilter = searchParams.get('type'); // 'Dine-In' or 'Takeaway'

  const { toggleSidebar, fetchActiveTableOrders } = usePos();

  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllOrders = async () => {
    try {
      const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
      const bId = typeof staffInfo.branchId === 'object' ? staffInfo.branchId?._id : staffInfo.branchId;
      const branchQuery = bId ? `?branchId=${bId}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders${branchQuery}`);
      const result = await response.json();
      if (result.success) {
        console.log(result);
        setOrders(result.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();

    socket.on('statusUpdated', () => fetchAllOrders());
    socket.on('orderCreated', () => fetchAllOrders());

    return () => {
      socket.off('statusUpdated');
      socket.off('orderCreated');
    };
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus.toLowerCase() })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Order marked as ${newStatus}`);
        fetchAllOrders();
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

  const handlePrint = (order) => {
    const billingDetails = {
      subTotal: order.subTotal || order.grandTotal,
      tax: order.tax || 0,
      discount: order.discount?.amount || 0,
      total: order.grandTotal,
      orderType: order.orderType,
      billerName: JSON.parse(localStorage.getItem('staff_info') || '{}').name
    };
    printBillReceipt({ items: order.items }, { name: order.tableName }, billingDetails);
  };

  const typeFilteredOrders = orders.filter(order => {
    if (!orderTypeFilter) return true;
    return (order.orderType || '').toLowerCase() === orderTypeFilter.toLowerCase();
  });

  const filteredOrders = typeFilteredOrders.filter(order => {
    if (activeTab === 'all') return true;
    return (order.status || '').toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] animate-in fade-in duration-500 font-sans select-none">
      <PosTopNavbar />
      {/* 1. Page Header */}
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-[var(--primary-color)]">
              {orderTypeFilter === 'Takeaway' ? 'Quick Service Dashboard' : 
               orderTypeFilter === 'Dine-In' ? 'Dine-In Command Center' : 
               'Unified Order Command Center'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {orderTypeFilter ? `Monitoring all ${orderTypeFilter} transactions` : 'Unified monitoring of all terminal transactions'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 px-4 bg-amber-50 text-[var(--primary-color)] rounded flex items-center gap-2 border border-amber-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest font-black text-[var(--primary-color)]">{orders.length} Total Orders</span>
            </div>
           
            <button 
              onClick={fetchAllOrders}
              className="p-2.5 bg-gray-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 transition-all"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 2. Status Sele  ction Tabs */}
        <div className="flex items-center gap-8 border-b border-slate-100 overflow-x-auto no-scrollbar">
           <TabBtn active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="All" count={typeFilteredOrders.length} />
           {orderTypeFilter !== 'Takeaway' && <TabBtn active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} label="Reserved" count={typeFilteredOrders.filter(o => o.status === 'pending').length} />}
           {orderTypeFilter !== 'Takeaway' && <TabBtn active={activeTab === 'preparing'} onClick={() => setActiveTab('preparing')} label="Preparing" count={typeFilteredOrders.filter(o => o.status === 'preparing').length} />}
           <TabBtn active={activeTab === 'ready'} onClick={() => setActiveTab('ready')} label="Billed" count={typeFilteredOrders.filter(o => o.status === 'ready').length} />
           <TabBtn active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} label="Settled" count={typeFilteredOrders.filter(o => o.status === 'completed').length} />
           {orderTypeFilter !== 'Takeaway' && <TabBtn active={activeTab === 'cancelled'} onClick={() => setActiveTab('cancelled')} label="Cancelled" count={typeFilteredOrders.filter(o => o.status === 'cancelled').length} />}
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
          <div className="flex flex-col gap-3">
             {/* Table Header */}
             <div className="grid grid-cols-12 gap-4 px-8 py-3 bg-slate-100/80 backdrop-blur-sm rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 sticky top-0 z-10 border border-slate-200/50">
               <div className="col-span-2 flex items-center gap-2"><Layout size={12} /> Table / Order</div>
               <div className="col-span-2 flex items-center gap-2"><CreditCard size={12} /> Total Amount</div>
               <div className="col-span-4 flex items-center gap-2"><ShoppingCart size={12} /> Order Items</div>
               <div className="col-span-2 flex items-center gap-2"><Timer size={12} /> Elapsed</div>
               <div className="col-span-2 text-right flex items-center justify-end gap-2"><Sparkles size={12} /> Status</div>
             </div>

             {filteredOrders.map(order => (
               <motion.div 
                 key={order._id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 onClick={() => navigate(`/pos/order/${order.tableName}`)}
                 className="grid grid-cols-12 gap-4 items-center px-8 py-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group cursor-pointer relative overflow-hidden"
               >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary-color)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Table / Order */}
                  <div className="col-span-2 flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${order.status?.toLowerCase() === 'ready' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-[var(--primary-color)] shadow-[var(--primary-color)]/20'}`}>
                        <Utensils size={18} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.tableName}</span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">#{order.orderNumber.split('-').pop()}</span>
                     </div>
                  </div>

                  {/* Total Amount (Swapped) */}
                  <div className="col-span-2">
                     <div className="flex flex-col items-start">
                        <span className="text-base font-black text-slate-950 tabular-nums">₹{order.grandTotal.toFixed(2)}</span>
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Gross Amount</span>
                     </div>
                  </div>

                  {/* Items */}
                  <div className="col-span-4 overflow-hidden">
                     <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 whitespace-nowrap hover:bg-white hover:border-slate-300 transition-colors">
                             {item.name} <span className="text-[var(--primary-color)] font-black ml-1">x{item.quantity}</span>
                          </span>
                        ))}
                     </div>
                  </div>

                  {/* Elapsed Time */}
                  <div className="col-span-2">
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-950 uppercase tracking-tight">{getElapsedTime(order.createdAt)}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Processing Time</span>
                     </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="col-span-2 flex flex-col items-end gap-2">
                     {order.status?.toLowerCase() !== 'ready' && (
                       <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border shadow-sm inline-flex items-center gap-1.5 ${
                         order.status?.toLowerCase() === 'preparing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                         order.status?.toLowerCase() === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                         'bg-amber-50 text-[var(--primary-color)] border-amber-100'
                       }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${order.status?.toLowerCase() === 'cancelled' ? 'bg-rose-500' : 'bg-[var(--primary-color)] animate-pulse'}`} />
                          {order.status}
                       </span>
                     )}
                     
                     {(order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'preparing') && (
                       <div className="flex gap-2">
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             handlePrint(order);
                           }}
                           className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                         >
                            <Printer size={10} /> Print Bill
                         </button>
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             if (window.confirm('Are you sure you want to cancel this order?')) {
                               updateStatus(order._id, 'cancelled');
                             }
                           }}
                           className="flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[8px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                         >
                            <Trash2 size={10} /> Cancel Order
                         </button>
                       </div>
                     )}
                     
                     {order.status?.toLowerCase() === 'ready' && (
                        <div className="flex gap-2">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handlePrint(order);
                             }}
                             className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                           >
                              <Printer size={10} /> Print Bill
                           </button>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               if (window.confirm('Mark this order as Settled?')) {
                                 updateStatus(order._id, 'completed');
                               }
                             }}
                             className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                           >
                              <CheckCircle2 size={10} /> Settle Order
                           </button>
                        </div>
                     )}
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



