import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle2, Search, Filter, 
  MoreVertical, Receipt, ChevronRight,
  Timer, AlertCircle, Utensils, RefreshCcw,
  Zap, ArrowRight, User, Menu, X, Trash2, Printer, Globe,
  Plus, ShoppingBag, ShoppingCart, CreditCard, ChevronDown, Check,
  Minus, Layout, Sparkles, Wand2, Phone, Shield, Train, Lock, Hash, MapPin, AlertTriangle, CheckSquare, Truck
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

  // Wera integration states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [fetchingCustomer, setFetchingCustomer] = useState(false);
  const [refreshingRider, setRefreshingRider] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Sub-modals states
  const [showPrepTimeModal, setShowPrepTimeModal] = useState(false);
  const [prepTime, setPrepTime] = useState(30);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionId, setRejectionId] = useState(1);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportRemark, setSupportRemark] = useState('rider_not_arrived');

  const [showComplaintAcceptModal, setShowComplaintAcceptModal] = useState(false);
  const [showComplaintRejectModal, setShowComplaintRejectModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintRefundAmount, setComplaintRefundAmount] = useState(0);
  const [complaintRejectionId, setComplaintRejectionId] = useState(2);
  const [complaintOtherReason, setComplaintOtherReason] = useState('');

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

  // Update selected order in real-time if webhook triggers updates
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o._id === selectedOrder._id);
      if (updated) {
        setSelectedOrder(updated);
      }
    }
  }, [orders]);

  // Outgoing Wera Actions API helpers
  const acceptWeraOrder = async (orderId, prepMinutes) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparationTime: Number(prepMinutes) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order accepted successfully');
        setShowPrepTimeModal(false);
        fetchAllOrders();
      } else {
        toast.error(data.message || 'Failed to accept order');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error accepting order');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectWeraOrder = async (orderId, reasonId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionId: Number(reasonId) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order rejected successfully');
        setShowRejectModal(false);
        setSelectedOrder(null); // Close main modal
        fetchAllOrders();
      } else {
        toast.error(data.message || 'Failed to reject order');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error rejecting order');
    } finally {
      setActionLoading(false);
    }
  };

  const foodReadyWera = async (orderId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${orderId}/food-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Food marked as ready');
        fetchAllOrders();
      } else {
        toast.error(data.message || 'Failed to mark food ready');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error marking food ready');
    } finally {
      setActionLoading(false);
    }
  };

  const callSupportWera = async (orderId, remarkText) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${orderId}/call-support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark: remarkText })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Support call triggered successfully');
        setShowSupportModal(false);
      } else {
        toast.error(data.message || 'Failed to trigger support call');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error triggering support call');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchCustomerNumber = async (orderId) => {
    setFetchingCustomer(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${orderId}/customer-number`);
      const data = await res.json();
      if (data.success && data.details) {
        setCustomerDetails(data.details);
        toast.success('Customer details fetched successfully');
      } else {
        toast.error(data.message || 'Failed to fetch customer details');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error fetching customer details');
    } finally {
      setFetchingCustomer(false);
    }
  };

  const refreshRiderStatus = async (orderId) => {
    setRefreshingRider(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${orderId}/delivery-agent`);
      const data = await res.json();
      if (data.success && data.details) {
        toast.success('Rider details refreshed');
        fetchAllOrders();
      } else {
        toast.error(data.message || 'Failed to update rider status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating rider status');
    } finally {
      setRefreshingRider(false);
    }
  };

  const acceptComplaintWera = async (orderId, complaintId, amount) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/complaint/${orderId}/${complaintId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundAmount: Number(amount) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Complaint accepted successfully');
        setShowComplaintAcceptModal(false);
        fetchAllOrders();
      } else {
        toast.error(data.message || 'Failed to accept complaint');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error accepting complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectComplaintWera = async (orderId, complaintId, rejId, otherRes) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/complaint/${orderId}/${complaintId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionId: Number(rejId), otherReason: otherRes })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Complaint rejected successfully');
        setShowComplaintRejectModal(false);
        fetchAllOrders();
      } else {
        toast.error(data.message || 'Failed to reject complaint');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error rejecting complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
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

  const rejectOrderWera = async (orderId, rejectionId, otherReason) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionId: Number(rejectionId), otherReason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order rejected successfully');
        setShowRejectModal(false);
        setSelectedOrder(null); // Close main modal
        fetchAllOrders();
      } else {
        toast.error(data.message || 'Failed to reject order');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error rejecting order');
    } finally {
      setActionLoading(false);
    }
  };




  const filteredOrders = typeFilteredOrders.filter(order => {
    if (activeTab === 'all') return true;
    return (order.status || '').toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] animate-in fade-in duration-500 font-sans select-none">
      <PosTopNavbar />
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ color: 'var(--pos-sidebar-color, var(--primary-color))' }} className="text-xl font-extrabold uppercase tracking-tight">
              {orderTypeFilter === 'Takeaway' ? 'Quick Service Dashboard' : 
               orderTypeFilter === 'Dine-In' ? 'Dine-In Command Center' : 
               'Unified Order Command Center'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {orderTypeFilter ? `Monitoring all ${orderTypeFilter} transactions` : 'Unified monitoring of all terminal transactions'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ color: 'var(--pos-sidebar-color, var(--primary-color))', borderColor: 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 20%, transparent)' }} className="h-10 px-4 bg-amber-50 rounded flex items-center gap-2 border shadow-sm">
              <span style={{ backgroundColor: 'var(--pos-sidebar-color, var(--primary-color))' }} className="w-2 h-2 rounded-full animate-pulse" />
              <span style={{ color: 'var(--pos-sidebar-color, var(--primary-color))' }} className="text-[10px] font-extrabold uppercase tracking-widest font-black">{orders.length} Total Orders</span>
            </div>
           
            <button 
              onClick={fetchAllOrders}
              className="p-2.5 bg-gray-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 transition-all"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-8 border-b border-slate-100 overflow-x-auto no-scrollbar">
           <TabBtn active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="All" count={typeFilteredOrders.length} />
           {orderTypeFilter !== 'Takeaway' && <TabBtn active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} label="Reserved" count={typeFilteredOrders.filter(o => o.status === 'pending').length} />}
           {orderTypeFilter !== 'Takeaway' && <TabBtn active={activeTab === 'preparing'} onClick={() => setActiveTab('preparing')} label="Preparing" count={typeFilteredOrders.filter(o => o.status === 'preparing').length} />}
           <TabBtn active={activeTab === 'ready'} onClick={() => setActiveTab('ready')} label="Billed" count={typeFilteredOrders.filter(o => o.status === 'ready').length} />
           <TabBtn active={activeTab === 'picked_up'} onClick={() => setActiveTab('picked_up')} label="Picked Up" count={typeFilteredOrders.filter(o => o.status === 'picked_up').length} />
           <TabBtn active={activeTab === 'delivered'} onClick={() => setActiveTab('delivered')} label="Delivered" count={typeFilteredOrders.filter(o => o.status === 'delivered').length} />
           <TabBtn active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} label="Settled" count={typeFilteredOrders.filter(o => o.status === 'completed').length} />
           {orderTypeFilter !== 'Takeaway' && <TabBtn active={activeTab === 'cancelled'} onClick={() => setActiveTab('cancelled')} label="Cancelled" count={typeFilteredOrders.filter(o => o.status === 'cancelled').length} />}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
         {filteredOrders.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
              <Utensils size={64} className="text-slate-200 mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Queue is Crystal Clear</p>
           </div>
         ) : (
          <div className="flex flex-col gap-3">
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
                 onClick={() => {
                    if (order.source === 'SWIGGY' || order.source === 'ZOMATO') {
                      setSelectedOrder(order);
                      setCustomerDetails(null);
                    } else {
                      navigate(`/pos/order/${order.tableName}`);
                    }
                  }}
                 className="grid grid-cols-12 gap-4 items-center px-8 py-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group cursor-pointer relative overflow-hidden"
               >
                  <div style={{ backgroundColor: 'var(--pos-sidebar-color, var(--primary-color))' }} className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                 <div className="col-span-2 flex items-center gap-4">
                    <div 
                      style={!(order.source === 'SWIGGY' || order.source === 'ZOMATO' || order.status?.toLowerCase() === 'ready') ? { backgroundColor: 'var(--pos-sidebar-color, var(--primary-color))' } : {}}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${
                        order.source === 'SWIGGY' ? 'bg-[#ff7a00] shadow-orange-500/20' :
                        order.source === 'ZOMATO' ? 'bg-[#cb202d] shadow-red-500/20' :
                        order.status?.toLowerCase() === 'ready' ? 'bg-emerald-500 shadow-emerald-500/20' : ''
                      }`}>
                       {order.source === 'SWIGGY' ? <ShoppingBag size={18} /> : 
                        order.source === 'ZOMATO' ? <ShoppingBag size={18} /> :
                        <Utensils size={18} />}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.tableName}</span>
                       <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider">#{order.orderNumber.split('-').pop()}</span>
                          {order.source !== 'POS Terminal' && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                              order.source === 'SWIGGY' ? 'bg-orange-50 text-[#ff7a00]' : 'bg-red-50 text-[#cb202d]'
                            }`}>
                              {order.source}
                            </span>
                          )}
                       </div>
                    </div>
                 </div>

                  <div className="col-span-2">
                     <div className="flex flex-col items-start">
                        <span className="text-base font-black text-slate-950 tabular-nums">₹{order.grandTotal.toFixed(2)}</span>
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Gross Amount</span>
                     </div>
                  </div>

                  <div className="col-span-4 overflow-hidden">
                     <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 whitespace-nowrap hover:bg-white hover:border-slate-300 transition-colors">
                             {item.name} <span style={{ color: 'var(--pos-sidebar-color, var(--primary-color))' }} className="font-black ml-1">x{item.quantity}</span>
                          </span>
                        ))}
                     </div>
                  </div>

                  <div className="col-span-2">
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-950 uppercase tracking-tight">{getElapsedTime(order.createdAt)}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Processing Time</span>
                     </div>
                  </div>

                  <div className="col-span-2 flex flex-col items-end gap-2">
                     {order.status?.toLowerCase() !== 'ready' && (
                       <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border shadow-sm inline-flex items-center gap-1.5 ${
                         order.status?.toLowerCase() === 'preparing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                         order.status?.toLowerCase() === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                         'bg-amber-50 border-amber-100'
                       }`}
                       style={order.status?.toLowerCase() !== 'preparing' && order.status?.toLowerCase() !== 'cancelled' ? { color: 'var(--pos-sidebar-color, var(--primary-color))' } : {}}
                       >
                          <div 
                            style={order.status?.toLowerCase() !== 'cancelled' ? { backgroundColor: 'var(--pos-sidebar-color, var(--primary-color))' } : {}}
                            className={`w-1.5 h-1.5 rounded-full ${order.status?.toLowerCase() === 'cancelled' ? 'bg-rose-500' : 'animate-pulse'}`} 
                          />
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

                  {/* Extra Details Row for Delivery/Online Platform orders */}
                  {(order.otp || order.password || order.instructions || order.customer?.name || order.riderDetails?.name || order.externalOrderId) && (
                    <div className="col-span-12 mt-3 pt-3 border-t border-dashed border-slate-100 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
                      {/* External Order ID */}
                      {order.externalOrderId && (
                        <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-sm">
                          <Hash size={12} className="text-slate-400" />
                          <span className="text-slate-400 uppercase tracking-wider text-[8px] font-extrabold">Channel ID:</span>
                          <span className="font-extrabold text-slate-700">{order.externalOrderId}</span>
                        </div>
                      )}

                      {/* Delivery Password */}
                      {order.otp && (
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm">
                          <Shield size={12} className="text-blue-500" />
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-blue-600">OTP:</span>
                          <span className="font-black text-slate-900">{order.otp}</span>
                        </div>
                      )}

                      {/* Delivery Password */}
                      {order.password && (
                        <div 
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 8%, transparent)',
                            borderColor: 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 15%, transparent)',
                            color: 'var(--pos-sidebar-color, var(--primary-color))'
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border shadow-sm"
                        >
                          <Lock size={12} style={{ color: 'var(--pos-sidebar-color, var(--primary-color))' }} />
                          <span className="text-[8px] uppercase tracking-wider font-extrabold">PASS:</span>
                          <span className="font-black text-slate-900">{order.password}</span>
                        </div>
                      )}

                      {/* Customer Info */}
                      {order.customer?.name && (
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-sm">
                          <User size={12} className="text-slate-400" />
                          <span className="text-slate-400 uppercase tracking-wider text-[8px] font-extrabold">Cust:</span>
                          <span className="font-extrabold text-slate-800">{order.customer.name}</span>
                          {order.customer.mobile && order.customer.mobile !== 'Swiggy' && order.customer.mobile !== 'Zomato' && (
                            <span className="text-slate-500 font-semibold">({order.customer.mobile})</span>
                          )}
                        </div>
                      )}

                      {/* Rider Agent */}
                      {order.riderDetails?.name && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm">
                          <Truck size={12} className="text-emerald-500" />
                          <span className="text-emerald-700 uppercase tracking-wider text-[8px] font-extrabold">Rider:</span>
                          <span className="font-black text-slate-900">{order.riderDetails.name}</span>
                          {order.riderDetails.phone && <span className="text-slate-500 font-bold">({order.riderDetails.phone})</span>}
                          {order.riderDetails.status && (
                            <span className="ml-1 bg-emerald-100/80 text-emerald-800 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-black">
                              {order.riderDetails.status}
                            </span>
                          )}
                          {order.riderDetails.timeToArrive && (
                            <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              ETA: {order.riderDetails.timeToArrive}m
                            </span>
                          )}
                        </div>
                      )}

                      {/* Instructions */}
                      {order.instructions && (
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2.5 py-1.5 rounded-lg border border-amber-200/60 max-w-full flex-1 min-w-[200px] shadow-sm">
                          <AlertCircle size={12} className="text-amber-600 shrink-0" />
                          <span className="text-[8px] font-black uppercase tracking-wider text-amber-700">Instructions:</span>
                          <span className="font-bold italic text-slate-700 truncate">{order.instructions}</span>
                        </div>
                      )}
                    </div>
                  )}
               </motion.div>
             ))}
          </div>
         )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans select-none"
            onClick={() => {
              if (!showPrepTimeModal && !showRejectModal && !showSupportModal && !showComplaintAcceptModal && !showComplaintRejectModal) {
                setSelectedOrder(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] relative"
            >
              <div 
                className="h-2 w-full" 
                style={{ backgroundColor: selectedOrder.source === 'SWIGGY' ? '#ff7a00' : '#cb202d' }}
              />

              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div 
                    className="px-4 py-2 rounded-xl text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-md"
                    style={{ backgroundColor: selectedOrder.source === 'SWIGGY' ? '#ff7a00' : '#cb202d' }}
                  >
                    <ShoppingBag size={14} />
                    {selectedOrder.source}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight italic">
                      {selectedOrder.tableName}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                      <span>Wera ID: #{selectedOrder.weraOrderId}</span>
                      {selectedOrder.externalOrderId && (
                        <>
                          <span className="text-slate-200">•</span>
                          <span>Ext ID: #{selectedOrder.externalOrderId}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border shadow-sm inline-flex items-center gap-1.5 ${
                      selectedOrder.status?.toLowerCase() === 'preparing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      selectedOrder.status?.toLowerCase() === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      selectedOrder.status?.toLowerCase() === 'ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-amber-50 text-[var(--primary-color)] border-amber-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedOrder.status?.toLowerCase() === 'cancelled' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                      }`} />
                      {selectedOrder.status}
                    </span>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-1">
                      Received {getElapsedTime(selectedOrder.createdAt)} ago
                    </span>
                  </div>

                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 no-scrollbar">
                <div className="lg:col-span-7 space-y-6">
                  {(selectedOrder.otp || selectedOrder.password || selectedOrder.isTrainOrder || selectedOrder.instructions) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedOrder.otp && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <Shield size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Order Handover OTP</p>
                            <p className="text-sm font-black text-slate-950 tracking-wider mt-0.5">{selectedOrder.otp}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedOrder.password && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                          <div 
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 8%, transparent)',
                              color: 'var(--pos-sidebar-color, var(--primary-color))'
                            }}
                            className="p-2.5 rounded-xl"
                          >
                            <Lock size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Delivery Password</p>
                            <p className="text-sm font-black text-slate-950 tracking-wider mt-0.5">{selectedOrder.password}</p>
                          </div>
                        </div>
                      )}

                      {selectedOrder.isTrainOrder && (
                        <div className="col-span-2 p-4 bg-amber-50 rounded-2xl border border-amber-200/50 flex items-start gap-3">
                          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                            <Train size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Rail Delivery (Train Order)</p>
                            <p className="text-xs font-bold text-amber-800 mt-1 italic">
                              {selectedOrder.instructions || "Deliver to coach/seat as per guidelines."}
                            </p>
                          </div>
                        </div>
                      )}

                      {!selectedOrder.isTrainOrder && selectedOrder.instructions && (
                        <div className="col-span-2 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/40 flex items-start gap-3">
                          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                            <AlertCircle size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Kitchen / Delivery Instructions</p>
                            <p className="text-xs font-bold text-amber-800 mt-1 italic leading-relaxed">
                              "{selectedOrder.instructions}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6 bg-white border border-slate-200 rounded-[1.5rem] space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3 flex items-center gap-2">
                      <User size={14} style={{ color: 'var(--pos-sidebar-color, var(--primary-color))' }} /> Customer Information
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-slate-900">{selectedOrder.customer?.name || 'Online Customer'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{selectedOrder.customer?.locality || 'No locality specified'}</p>
                          {selectedOrder.customer?.mobile && (
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Phone: {selectedOrder.customer.mobile}</p>
                          )}
                        </div>
                        {selectedOrder.customer?.address && (
                          <div className="text-right max-w-[200px]">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Delivery Address</p>
                            <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5" title={selectedOrder.customer.address}>
                              {selectedOrder.customer.address}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contact details</p>
                          {customerDetails ? (
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs font-black text-slate-900">{customerDetails.phone}</span>
                              {customerDetails.pin && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black">
                                  PIN: {customerDetails.pin}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-500 tracking-wider">XXXXXXXXXX</span>
                          )}
                        </div>

                        {!customerDetails && (
                          <button
                            onClick={() => fetchCustomerNumber(selectedOrder._id)}
                            disabled={fetchingCustomer}
                            style={{
                              borderColor: 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 30%, transparent)',
                              color: 'var(--pos-sidebar-color, var(--primary-color))',
                              '--hover-bg': 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 8%, transparent)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--hover-bg)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                            className="px-4 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {fetchingCustomer ? <RefreshCcw size={10} className="animate-spin" /> : <Phone size={10} />}
                            Decrypt Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-slate-200 rounded-[1.5rem] space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-600" /> Delivery Agent Tracking
                      </h4>

                      <button
                        onClick={() => refreshRiderStatus(selectedOrder._id)}
                        disabled={refreshingRider}
                        className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest"
                      >
                        <RefreshCcw size={12} className={refreshingRider ? 'animate-spin' : ''} />
                        Poll Status
                      </button>
                    </div>

                    {selectedOrder.riderDetails?.status ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rider Name</p>
                          <p className="text-xs font-black text-slate-900">{selectedOrder.riderDetails.name || 'Not Available'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rider Phone</p>
                          <p className="text-xs font-black text-slate-900">{selectedOrder.riderDetails.phone || 'Not Available'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status / Movement</p>
                          <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg uppercase tracking-wider">
                            {selectedOrder.riderDetails.status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estimated Arrival</p>
                          <p className="text-xs font-black text-slate-950 flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {selectedOrder.riderDetails.timeToArrive} mins
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-slate-400 font-bold italic">
                        No rider assigned by {selectedOrder.source} yet.
                      </div>
                    )}
                  </div>

                  {selectedOrder.source === 'ZOMATO' && selectedOrder.complaints && selectedOrder.complaints.length > 0 && (
                    <div className="p-6 bg-red-50/50 border border-red-200/60 rounded-[1.5rem] space-y-4">
                      <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-600 animate-bounce" /> Zomato Complaints
                      </h4>

                      <div className="space-y-3">
                        {selectedOrder.complaints.map((c) => (
                          <div 
                            key={c.id} 
                            className="p-4 bg-white border border-red-100 rounded-xl space-y-3 shadow-sm"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                                  {c.status}
                                </span>
                                <p className="text-xs font-black text-slate-800 mt-1">
                                  {c.data?.reason || c.data?.issue_category || 'Customer Complaint'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Refund Request</p>
                                <p className="text-xs font-black text-rose-600">₹{c.data?.refund_amount || 0}</p>
                              </div>
                            </div>

                            {c.data?.details && (
                              <p className="text-[10px] text-slate-500 font-medium italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                "{c.data.details}"
                              </p>
                            )}

                            {c.status === 'pending' && (
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    setSelectedComplaint(c);
                                    setComplaintRefundAmount(c.data?.refund_amount || 0);
                                    setShowComplaintAcceptModal(true);
                                  }}
                                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-[0.98] transition-all"
                                >
                                  Accept Refund
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedComplaint(c);
                                    setComplaintRejectionId(2);
                                    setComplaintOtherReason('');
                                    setShowComplaintRejectModal(true);
                                  }}
                                  className="flex-1 py-2 border border-slate-200 hover:border-red-600 text-slate-500 hover:text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-50 active:scale-[0.98] transition-all"
                                >
                                  Reject Complaint
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 flex flex-col space-y-6">
                  <div className="flex-1 border border-slate-200 rounded-[1.5rem] bg-slate-50/50 p-6 flex flex-col min-h-[300px]">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2 shrink-0">
                      <ShoppingCart size={14} className="text-slate-600" /> Items Summary ({selectedOrder.items.length})
                    </h4>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 py-4 max-h-[320px] no-scrollbar">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start bg-white border border-slate-150 rounded-xl p-3 shadow-sm">
                          <div>
                            <p className="text-xs font-black text-slate-900">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">Quantity: x{item.quantity}</p>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {item.modifiers.map((mod, midx) => (
                                  <span 
                                    key={mod.name || midx} 
                                    style={{
                                      color: 'var(--pos-sidebar-color, var(--primary-color))',
                                      backgroundColor: 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 8%, transparent)',
                                      borderColor: 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 15%, transparent)'
                                    }}
                                    className="text-[8px] font-black border rounded px-1.5 py-0.5 uppercase tracking-wider"
                                  >
                                    {mod.group}: {mod.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-slate-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-200/80 pt-4 space-y-2 shrink-0 bg-transparent text-[10px] uppercase font-bold text-slate-500">
                      <div className="flex justify-between">
                        <span>Items Subtotal</span>
                        <span className="text-slate-800">₹{(selectedOrder.subTotal || 0).toFixed(2)}</span>
                      </div>
                      {selectedOrder.containerCharge > 0 && (
                        <div className="flex justify-between">
                          <span>Packaging Charges</span>
                          <span className="text-slate-800">₹{selectedOrder.containerCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.platformFee > 0 && (
                        <div className="flex justify-between">
                          <span>Platform Fee</span>
                          <span className="text-slate-800">₹{selectedOrder.platformFee.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.welfareFee > 0 && (
                        <div className="flex justify-between">
                          <span>Gig Worker's Welfare Fee</span>
                          <span className="text-slate-800">₹{selectedOrder.welfareFee.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.deliveryCharge > 0 && (
                        <div className="flex justify-between">
                          <span>Delivery Charges</span>
                          <span className="text-slate-800">₹{selectedOrder.deliveryCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.tax > 0 && (
                        <div className="flex justify-between">
                          <span>GST / Taxes</span>
                          <span className="text-slate-800">₹{selectedOrder.tax.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.discount?.amount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-extrabold">
                          <span>Discount ({selectedOrder.discount.reason || 'Offer'})</span>
                          <span>- ₹{selectedOrder.discount.amount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div 
                        className="flex justify-between items-center p-3 rounded-xl text-white font-black text-sm mt-3"
                        style={{ backgroundColor: selectedOrder.source === 'SWIGGY' ? '#ff7a00' : '#cb202d' }}
                      >
                        <span>Grand Total</span>
                        <span className="text-lg">₹{selectedOrder.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 shrink-0">
                    {selectedOrder.status?.toLowerCase() === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setPrepTime(30);
                            setShowPrepTimeModal(true);
                          }}
                          disabled={actionLoading}
                          className="flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                          style={{ 
                            backgroundColor: selectedOrder.source === 'SWIGGY' ? '#ff7a00' : '#cb202d',
                          }}
                        >
                          <Check size={14} strokeWidth={3} />
                          Accept Order
                        </button>
                        <button
                          onClick={() => {
                            setRejectionId(1);
                            setShowRejectModal(true);
                          }}
                          disabled={actionLoading}
                          className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
                        >
                          <Trash2 size={14} />
                          Reject Order
                        </button>
                      </div>
                    )}

                    {selectedOrder.status?.toLowerCase() === 'preparing' && (
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => foodReadyWera(selectedOrder._id)}
                          disabled={actionLoading}
                          className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <CheckSquare size={14} strokeWidth={3} />
                          Food Ready (Dispatch)
                        </button>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSupportRemark('rider_not_arrived');
                              setShowSupportModal(true);
                            }}
                            disabled={actionLoading}
                            style={{
                              borderColor: 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 30%, transparent)',
                              color: 'var(--pos-sidebar-color, var(--primary-color))',
                              '--hover-bg': 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 8%, transparent)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--hover-bg)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                            className="flex-1 py-3 border-2 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                          >
                            <Phone size={12} />
                            Call Support
                          </button>
                          
                          <button
                            onClick={() => handlePrint(selectedOrder)}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-slate-200/50"
                          >
                            <Printer size={12} />
                            Print Bill
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedOrder.status?.toLowerCase() === 'ready' && (
                      <div className="flex flex-col gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                          <CheckCircle2 size={14} /> Food is ready for pickup
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => updateStatus(selectedOrder._id, 'completed')}
                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
                          >
                            <CheckCircle2 size={14} />
                            Settle / Close Order
                          </button>
                          
                          <button
                            onClick={() => handlePrint(selectedOrder)}
                            className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-slate-200/50"
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {(selectedOrder.status?.toLowerCase() === 'cancelled' || selectedOrder.status?.toLowerCase() === 'completed') && (
                      <button
                        onClick={() => handlePrint(selectedOrder)}
                        className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-slate-200/50"
                      >
                        <Printer size={14} />
                        Print Bill Receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {showPrepTimeModal && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl border border-slate-200">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight italic">Select Preparation Time</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Specify minutes to prepare before rider picks up</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[15, 20, 25, 30, 40, 45].map((time) => (
                        <button
                          key={time}
                          onClick={() => setPrepTime(time)}
                          className={`py-3.5 rounded-xl font-black text-xs transition-all ${
                            prepTime === time 
                              ? 'text-white' 
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                          }`}
                          style={{ backgroundColor: prepTime === time ? (selectedOrder.source === 'SWIGGY' ? '#ff7a00' : '#cb202d') : '' }}
                        >
                          {time} Mins
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={() => acceptWeraOrder(selectedOrder._id, prepTime)}
                        disabled={actionLoading}
                        className="flex-grow py-3 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                        style={{ backgroundColor: selectedOrder.source === 'SWIGGY' ? '#ff7a00' : '#cb202d' }}
                      >
                        {actionLoading ? 'Sending...' : 'Confirm Accept'}
                      </button>
                      <button
                        onClick={() => setShowPrepTimeModal(false)}
                        className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showRejectModal && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl border border-slate-200">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight italic">Reject Order</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Please select an official rejection reason</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rejection Cause</label>
                      <select 
                        value={rejectionId} 
                        onChange={(e) => setRejectionId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-100"
                      >
                        <option value={1}>1 - Item Out of Stock / Unavailability</option>
                        <option value={2}>2 - Restaurant Closed / Operational issues</option>
                        <option value={3}>3 - Kitchen Overloaded / High Order Volume</option>
                        <option value={4}>4 - Operational Limits / Courier Issues</option>
                        <option value={5}>5 - Other Custom Internal Reason</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={() => rejectWeraOrder(selectedOrder._id, rejectionId)}
                        disabled={actionLoading}
                        className="flex-grow py-3 bg-[#cb202d] hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                      >
                        {actionLoading ? 'Sending...' : 'Confirm Reject'}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(false)}
                        className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showSupportModal && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl border border-slate-200">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight italic">Call Support Remark</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Specify partner support request details</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Remark Category</label>
                      <select 
                        value={supportRemark} 
                        onChange={(e) => setSupportRemark(e.target.value)}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--pos-sidebar-color, var(--primary-color))';
                          e.target.style.boxShadow = '0 0 0 4px color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 8%, transparent)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-all"
                      >
                        <option value="rider_not_arrived">Rider delayed / Not arrived</option>
                        <option value="food_spilled">Food spilled by courier</option>
                        <option value="customer_unreachable">Customer unreachable</option>
                        <option value="incorrect_address">Delivery address incorrect</option>
                        <option value="other">Other reason / Support query</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={() => callSupportWera(selectedOrder._id, supportRemark)}
                        disabled={actionLoading}
                        className="flex-grow py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                      >
                        {actionLoading ? 'Connecting...' : 'Request Support'}
                      </button>
                      <button
                        onClick={() => setShowSupportModal(false)}
                        className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showComplaintAcceptModal && selectedComplaint && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl border border-slate-200">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight italic">Accept Refund</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Accept complaint and confirm refund amount</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Refund Value (INR)</label>
                      <input
                        type="number"
                        value={complaintRefundAmount}
                        onChange={(e) => setComplaintRefundAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-100"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={() => acceptComplaintWera(selectedOrder._id, selectedComplaint.id, complaintRefundAmount)}
                        disabled={actionLoading}
                        className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                      >
                        {actionLoading ? 'Accepting...' : 'Approve Refund'}
                      </button>
                      <button
                        onClick={() => setShowComplaintAcceptModal(false)}
                        className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showComplaintRejectModal && selectedComplaint && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl border border-slate-200">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight italic font-black uppercase">Reject Complaint</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select valid rejection code to contest complaint</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rejection ID</label>
                        <select 
                          value={complaintRejectionId} 
                          onChange={(e) => setComplaintRejectionId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-100"
                        >
                          <option value={2}>2 - Standard Recipe / Quality matches specification</option>
                          <option value={9}>9 - Incorrect items reported but correct items packed</option>
                          <option value={4}>4 - Intact packaging / Portion sizes correct</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Other Reason (optional)</label>
                        <textarea
                          rows={2}
                          value={complaintOtherReason}
                          onChange={(e) => setComplaintOtherReason(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-slate-100"
                          placeholder="Provide details to help dispute team review the claim..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={() => rejectComplaintWera(selectedOrder._id, selectedComplaint.id, complaintRejectionId, complaintOtherReason)}
                        disabled={actionLoading}
                        className="flex-grow py-3 bg-[#cb202d] hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                      >
                        {actionLoading ? 'Rejecting...' : 'Dispute Claim'}
                      </button>
                      <button
                        onClick={() => setShowComplaintRejectModal(false)}
                        className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabBtn({ active, onClick, label, count }) {
  return (
    <button 
      onClick={onClick}
      style={active ? { color: 'var(--pos-sidebar-color, var(--primary-color))' } : {}}
      className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all flex items-center gap-2 ${active ? '' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {label}
      {count > 0 && (
        <span 
          style={active ? { backgroundColor: 'var(--pos-sidebar-color, var(--primary-color))' } : {}}
          className={`px-1.5 py-0.5 rounded text-[8px] ${active ? 'text-white' : 'bg-slate-100 text-slate-400'}`}
        >
          {count}
        </span>
      )}
      {active && (
        <motion.div 
          layoutId="activeTab" 
          style={{ backgroundColor: 'var(--pos-sidebar-color, var(--primary-color))' }}
          className="absolute bottom-0 left-0 right-0 h-0.5" 
        />
      )}
    </button>
  );
}
