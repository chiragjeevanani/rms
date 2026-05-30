import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Search, Filter, Clock, Eye, MapPin, User, Hash, Calendar, 
  Building2, Truck, RefreshCcw, CheckCircle2, AlertCircle, Phone, Shield, 
  Lock, Train, AlertTriangle, Check, X, PhoneCall, Gift, ChevronDown, CheckSquare,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// Setup Socket connection (reusing the VITE_API_URL pattern)
const socket = io((import.meta.env.VITE_API_URL || '').replace('/api', ''));

export default function DeliveryOrders() {
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, preparing, ready, picked_up, delivered, cancelled
  const [sourceFilter, setSourceFilter] = useState('all'); // all, SWIGGY, ZOMATO, POS
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Wera integration action states
  const [actionLoading, setActionLoading] = useState(false);
  const [decryptingCustomer, setDecryptingCustomer] = useState(false);
  const [pollingRider, setPollingRider] = useState(false);
  const [decryptedContacts, setDecryptedContacts] = useState({}); // orderId -> { number, pin }

  // Action Modals & Dropdown toggles
  const [showPrepTimeSelect, setShowPrepTimeSelect] = useState(false);
  const [selectedPrepTime, setSelectedPrepTime] = useState(30);

  const [showRejectSelect, setShowRejectSelect] = useState(false);
  const [selectedRejectionId, setSelectedRejectionId] = useState(1);

  const [showSupportSelect, setShowSupportSelect] = useState(false);
  const [selectedSupportRemark, setSelectedSupportRemark] = useState('Where is Delivery Executive');

  const [showComplaintAccept, setShowComplaintAccept] = useState(false);
  const [complaintRefundAmount, setComplaintRefundAmount] = useState(0);
  
  const [showComplaintReject, setShowComplaintReject] = useState(false);
  const [complaintRejectionId, setComplaintRejectionId] = useState(9);
  const [complaintOtherReason, setComplaintOtherReason] = useState('');
  const [activeComplaint, setActiveComplaint] = useState(null);

  // Poll current time for accurate elapsed countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch branches and initial orders
  const fetchData = async () => {
    try {
      const [ordersRes, branchesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/orders`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` } }),
        fetch((() => { const _rid = localStorage.getItem('admin_restaurantId'); return _rid ? `${import.meta.env.VITE_API_URL}/branches?restaurantId=${_rid}` : `${import.meta.env.VITE_API_URL}/branches`; })())
      ]);
      const ordersData = await ordersRes.json();
      const branchesData = await branchesRes.json();

      if (ordersData.success) {
        // Filter for delivery orders only
        const deliveryOnly = (ordersData.data || []).filter(o => 
          (o.orderType || '').toLowerCase() === 'delivery' || 
          o.source === 'SWIGGY' || 
          o.source === 'ZOMATO'
        );
        setOrders(deliveryOnly);
      }
      if (branchesData.success) {
        setBranches(branchesData.data || []);
      }
    } catch (err) {
      console.error('Failed to sync delivery dispatch:', err);
      toast.error('Connection to server failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for real-time order events
    socket.on('orderCreated', () => fetchData());
    socket.on('statusUpdated', () => fetchData());

    return () => {
      socket.off('orderCreated');
      socket.off('statusUpdated');
    };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  // Find currently selected order object
  const selectedOrder = orders.find(o => o._id === selectedOrderId);

  // Elapsed calculations
  const getElapsedTime = (createdAt) => {
    const diff = Math.floor((currentTime - new Date(createdAt)) / 1000); // seconds
    if (diff < 0) return '0m';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  // API Call Helpers
  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${selectedOrder._id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparationTime: Number(selectedPrepTime) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order accepted with ${selectedPrepTime} mins prep time`);
        setShowPrepTimeSelect(false);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to accept order');
      }
    } catch (err) {
      toast.error('Failed to execute accept command');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${selectedOrder._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionId: Number(selectedRejectionId) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order rejected and cancelled at channel');
        setShowRejectSelect(false);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to reject order');
      }
    } catch (err) {
      toast.error('Failed to execute reject command');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFoodReady = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${selectedOrder._id}/food-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Food marked ready, notification sent to rider');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to mark food ready');
      }
    } catch (err) {
      toast.error('Failed to execute food ready status update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrderPickedUp = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${selectedOrder._id}/picked-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order marked as picked up / dispatched');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to dispatch order');
      }
    } catch (err) {
      toast.error('Failed to execute dispatch command');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallSupport = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${selectedOrder._id}/call-support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark: selectedSupportRemark })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Support call requested successfully');
        setShowSupportSelect(false);
      } else {
        toast.error(data.message || 'Support request failed');
      }
    } catch (err) {
      toast.error('Failed to trigger support call');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecryptCustomer = async () => {
    if (!selectedOrder) return;
    setDecryptingCustomer(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${selectedOrder._id}/customer-number`);
      const data = await res.json();
      if (data.success && data.details) {
        setDecryptedContacts(prev => ({
          ...prev,
          [selectedOrder._id]: data.details
        }));
        toast.success('Contact info decrypted');
      } else {
        toast.error(data.message || 'Decryption denied by channel');
      }
    } catch (err) {
      toast.error('Failed to request phone decryption');
    } finally {
      setDecryptingCustomer(false);
    }
  };

  const handlePollRider = async () => {
    if (!selectedOrder) return;
    setPollingRider(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/order/${selectedOrder._id}/delivery-agent`);
      const data = await res.json();
      if (data.success && data.details) {
        toast.success('Rider details refreshed from gateway');
        fetchData();
      } else {
        toast.error(data.message || 'Rider not assigned yet');
      }
    } catch (err) {
      toast.error('Failed to poll rider status');
    } finally {
      setPollingRider(false);
    }
  };

  const handleAcceptComplaint = async () => {
    if (!selectedOrder || !activeComplaint) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/complaint/${selectedOrder._id}/${activeComplaint.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundAmount: Number(complaintRefundAmount) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Zomato complaint refund approved');
        setShowComplaintAccept(false);
        setActiveComplaint(null);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to resolve complaint');
      }
    } catch (err) {
      toast.error('Connection failure resolving complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectComplaint = async () => {
    if (!selectedOrder || !activeComplaint) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/complaint/${selectedOrder._id}/${activeComplaint.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rejectionId: Number(complaintRejectionId), 
          otherReason: complaintOtherReason 
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Zomato complaint rejected');
        setShowComplaintReject(false);
        setActiveComplaint(null);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to reject complaint');
      }
    } catch (err) {
      toast.error('Connection failure rejecting complaint');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(o => {
    // 1. Search Query
    const query = searchQuery.toLowerCase();
    const orderNum = o.orderNumber.toLowerCase();
    const extOrderNum = (o.externalOrderId || '').toLowerCase();
    const custName = (o.customer?.name || '').toLowerCase();
    const custPhone = (o.customer?.mobile || '').toLowerCase();
    const matchesSearch = !searchQuery || 
                          orderNum.includes(query) || 
                          extOrderNum.includes(query) || 
                          custName.includes(query) || 
                          custPhone.includes(query);

    // 2. Status
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'ready' && o.status?.toLowerCase() === 'ready') ||
                          o.status?.toLowerCase() === statusFilter.toLowerCase();

    // 3. Source Platform
    let matchesSource = true;
    if (sourceFilter === 'SWIGGY') matchesSource = o.source === 'SWIGGY';
    else if (sourceFilter === 'ZOMATO') matchesSource = o.source === 'ZOMATO';
    else if (sourceFilter === 'POS') matchesSource = o.source !== 'SWIGGY' && o.source !== 'ZOMATO';

    // 4. Branch
    const oBranchId = typeof o.branchId === 'object' && o.branchId !== null ? o.branchId._id : o.branchId;
    const matchesBranch = selectedBranchFilter === 'all' || oBranchId === selectedBranchFilter;

    return matchesSearch && matchesStatus && matchesSource && matchesBranch;
  });

  // Rejection reasons map (From documentation)
  const rejectionReasons = [
    { id: 1, text: 'Items out of stock' },
    { id: 2, text: 'No delivery boys available' },
    { id: 3, text: 'Nearing closing time' },
    { id: 4, text: 'Out of Subzone/Area' },
    { id: 5, text: 'Kitchen is Full' }
  ];

  // Swiggy Support call remark values
  const supportRemarks = [
    'Item is out of stock',
    'Where is Delivery Executive',
    'Price(s) is incorrect',
    'Special instructions confirmation',
    'Delay in order preparation',
    'Add-on(s)/Variant(s) is not specified',
    'Report Delivery Executive behaviour',
    'Some other reason'
  ];

  // Colors & badges helper
  const getSourceBadge = (source) => {
    switch (source?.toUpperCase()) {
      case 'SWIGGY':
        return 'bg-orange-500 text-white shadow-orange-500/20';
      case 'ZOMATO':
        return 'bg-rose-600 text-white shadow-rose-600/20';
      default:
        return 'bg-slate-700 text-white shadow-slate-700/20';
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'preparing': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'ready': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'picked_up': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'delivered': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-[#FDFCFB] animate-in fade-in duration-300 font-sans select-none text-slate-800">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 px-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase font-display italic">Delivery Dispatch Center</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Live Zomato / Swiggy / POS Gateway Integrations</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none pr-10 appearance-none shadow-sm cursor-pointer"
            >
              <option value="all">ALL BRANCHES</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.branchName.toUpperCase()}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button 
            onClick={handleRefresh}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-4 py-5 px-2">
        {/* Status filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'All Orders', count: orders.length },
            { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
            { id: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
            { id: 'ready', label: 'Food Ready / Billed', count: orders.filter(o => o.status === 'ready').length },
            { id: 'picked_up', label: 'Dispatched', count: orders.filter(o => o.status === 'picked_up').length },
            { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
            { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setSelectedOrderId(null); }}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[8px] ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Source filters & Search */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full lg:w-fit">
            {[
              { id: 'all', label: 'All channels' },
              { id: 'SWIGGY', label: 'Swiggy' },
              { id: 'ZOMATO', label: 'Zomato' },
              { id: 'POS', label: 'Self-Delivery' }
            ].map(src => (
              <button
                key={src.id}
                onClick={() => { setSourceFilter(src.id); setSelectedOrderId(null); }}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all w-full lg:w-fit cursor-pointer ${
                  sourceFilter === src.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="SEARCH ORDERS BY ID, CUSTOMER, MOBILE..."
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/10 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 py-2">
        {/* Left Column: Orders list */}
        <div className="lg:col-span-5 flex flex-col min-h-0 bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200/50 flex justify-between items-center shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Queued Dispatches</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredOrders.length} Matches</span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <Truck size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching dispatches found</p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const hasPendingComplaint = order.complaints?.some(c => c.status === 'pending');
                return (
                  <motion.div
                    key={order._id}
                    onClick={() => setSelectedOrderId(order._id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      selectedOrderId === order._id
                        ? 'bg-slate-50 border-slate-900 shadow-md ring-1 ring-slate-950/5'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                    }`}
                  >
                    {/* Platform stripe indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      order.source === 'SWIGGY' ? 'bg-orange-500' :
                      order.source === 'ZOMATO' ? 'bg-rose-600' :
                      'bg-slate-700'
                    }`} />

                    <div className="flex justify-between items-start mb-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-black text-slate-900 tracking-tighter">
                          #{order.orderNumber.split('-').pop()}
                        </span>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-tighter ${getSourceBadge(order.source)}`}>
                          {order.source}
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                        <Clock size={11} /> {getElapsedTime(order.createdAt)}
                      </span>
                    </div>

                    <div className="pl-2 space-y-1">
                      <p className="text-xs font-black text-slate-800 uppercase italic truncate">
                        {order.customer?.name || 'Online Customer'}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">
                        {order.customer?.locality || 'Self Pick / Unknown Locality'}
                      </p>
                    </div>

                    <div className="pl-2 pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-950">₹{order.grandTotal}</span>
                      <div className="flex items-center gap-2">
                        {order.isTrainOrder && (
                          <span className="bg-amber-100 text-amber-700 p-1 rounded hover:scale-105 transition-transform" title="Train Order">
                            <Train size={12} />
                          </span>
                        )}
                        {hasPendingComplaint && (
                          <span className="bg-rose-100 text-rose-700 p-1 rounded animate-pulse" title="Complaint Pending">
                            <AlertTriangle size={12} />
                          </span>
                        )}
                        <span className={`px-2.5 py-1 text-[8px] font-black rounded-lg uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Extra details (OTP, Password, Ext ID, Rider, Instructions) on the card */}
                    {(order.otp || order.password || order.instructions || order.riderDetails?.name || order.externalOrderId) && (
                      <div className="mt-3 pt-3 border-t border-dashed border-slate-150 flex flex-wrap gap-2 text-[9px] font-bold text-slate-500 pl-2">
                        {/* Ext ID */}
                        {order.externalOrderId && (
                          <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-150 text-[8px] font-semibold">
                            Ext ID: {order.externalOrderId}
                          </span>
                        )}
                        {/* OTP */}
                        {order.otp && (
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-150 text-[8px] flex items-center gap-0.5 font-bold">
                            <Shield size={8} className="text-blue-500" /> OTP: {order.otp}
                          </span>
                        )}
                        {/* Password */}
                        {order.password && (
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-150 text-[8px] flex items-center gap-0.5 font-bold">
                            <Lock size={8} className="text-indigo-500" /> PASS: {order.password}
                          </span>
                        )}
                        {/* Rider name / ETA */}
                        {order.riderDetails?.name && (
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-150 text-[8px] flex items-center gap-0.5 font-bold">
                            <Truck size={8} className="text-emerald-500" /> Rider: {order.riderDetails.name} {order.riderDetails.timeToArrive ? `(${order.riderDetails.timeToArrive}m)` : ''}
                          </span>
                        )}
                        {/* Customer Mobile */}
                        {order.customer?.mobile && order.customer.mobile !== 'Swiggy' && order.customer.mobile !== 'Zomato' && (
                          <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-150 text-[8px] font-semibold">
                            Phone: {order.customer.mobile}
                          </span>
                        )}
                        {/* Instructions snippet */}
                        {order.instructions && (
                          <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-150 text-[8px] truncate max-w-full flex items-center gap-0.5 font-semibold" title={order.instructions}>
                            <AlertCircle size={8} className="text-amber-600 shrink-0" /> Ins: {order.instructions}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Order details */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm relative">
          <AnimatePresence mode="wait">
            {!selectedOrder ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 shadow-inner mb-6">
                  <Truck size={44} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">Dispatch Monitor Offline</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-sm mt-2 mx-auto">
                    Select a dispatch record from the queue to view its metrics, handle channel handshake protocols, and track delivery agents.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedOrder._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* Detail Header */}
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl text-white flex items-center justify-center shadow-lg ${getSourceBadge(selectedOrder.source)}`}>
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight italic">
                          Order #{selectedOrder.orderNumber.split('-').pop()}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Wera ID: {selectedOrder.weraOrderId} {selectedOrder.externalOrderId && `· Channel ID: ${selectedOrder.externalOrderId}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gross total</p>
                    <p className="text-xl font-black text-slate-950 mt-0.5">₹{selectedOrder.grandTotal}</p>
                  </div>
                </div>

                {/* Operations & actions */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/50 flex flex-wrap gap-3 items-center shrink-0">
                  {/* Accept Order Action */}
                  {selectedOrder.status === 'pending' && (
                    <div className="relative">
                      <button
                        onClick={() => setShowPrepTimeSelect(!showPrepTimeSelect)}
                        disabled={actionLoading}
                        className="px-5 py-2.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer"
                      >
                        Accept Dispatch <ChevronDown size={12} />
                      </button>
                      
                      {showPrepTimeSelect && (
                        <div className="absolute left-0 mt-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-20 w-64 space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider pl-1">Choose Prep Time (Mins)</p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[15, 30, 45, 60].map(mins => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => setSelectedPrepTime(mins)}
                                className={`py-2 text-[9px] font-black rounded-lg border transition-all cursor-pointer ${
                                  selectedPrepTime === mins 
                                    ? 'bg-slate-900 text-white border-slate-900' 
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={handleAcceptOrder}
                            disabled={actionLoading}
                            className="w-full py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            {actionLoading ? 'Accepting...' : 'Accept Command'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reject Order Action */}
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'preparing') && (
                    <div className="relative">
                      <button
                        onClick={() => setShowRejectSelect(!showRejectSelect)}
                        disabled={actionLoading}
                        className="px-5 py-2.5 border-2 border-rose-200 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:border-rose-300 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                      >
                        Reject Dispatch <ChevronDown size={12} />
                      </button>
                      
                      {showRejectSelect && (
                        <div className="absolute left-0 mt-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-20 w-72 space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider pl-1">Select Rejection Reason</p>
                          <div className="space-y-1">
                            {rejectionReasons.map(reason => (
                              <button
                                key={reason.id}
                                type="button"
                                onClick={() => setSelectedRejectionId(reason.id)}
                                className={`w-full text-left px-3 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex justify-between items-center ${
                                  selectedRejectionId === reason.id 
                                    ? 'bg-rose-50 text-rose-700 font-extrabold' 
                                    : 'hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                <span>{reason.id}. {reason.text}</span>
                                {selectedRejectionId === reason.id && <Check size={12} />}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={handleRejectOrder}
                            disabled={actionLoading}
                            className="w-full py-2.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all cursor-pointer"
                          >
                            {actionLoading ? 'Rejecting...' : 'Reject Command'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Food Ready Action */}
                  {selectedOrder.status === 'preparing' && (
                    <button
                      onClick={handleFoodReady}
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      {actionLoading ? 'Processing...' : 'Mark Food Ready'}
                    </button>
                  )}

                  {/* Food Picked Up Action */}
                  {selectedOrder.status === 'ready' && (
                    <button
                      onClick={handleOrderPickedUp}
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      {actionLoading ? 'Dispatched...' : 'Mark Picked Up (Dispatched)'}
                    </button>
                  )}

                  {/* Swiggy Support Call Action */}
                  {selectedOrder.source === 'SWIGGY' && (
                    <div className="relative">
                      <button
                        onClick={() => setShowSupportSelect(!showSupportSelect)}
                        disabled={actionLoading}
                        className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-900 bg-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:border-slate-300 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <PhoneCall size={12} /> Contact Swiggy Partner <ChevronDown size={12} />
                      </button>

                      {showSupportSelect && (
                        <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-20 w-72 space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider pl-1">Support Remark / Reason</p>
                          <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
                            {supportRemarks.map(remark => (
                              <button
                                key={remark}
                                type="button"
                                onClick={() => setSelectedSupportRemark(remark)}
                                className={`w-full text-left px-3 py-2 text-[9px] font-bold rounded-lg transition-all cursor-pointer flex justify-between items-center ${
                                  selectedSupportRemark === remark 
                                    ? 'bg-slate-50 text-slate-900 font-black' 
                                    : 'hover:bg-slate-50 text-slate-500'
                                }`}
                              >
                                <span>{remark}</span>
                                {selectedSupportRemark === remark && <Check size={12} />}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={handleCallSupport}
                            disabled={actionLoading}
                            className="w-full py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            {actionLoading ? 'Connecting...' : 'Call Swiggy Support'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Details view scrolling workspace */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  {/* Decrypted OTP/Password Card */}
                  {(selectedOrder.otp || selectedOrder.password || selectedOrder.isTrainOrder) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOrder.otp && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
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
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Lock size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Delivery Password (Swiggy)</p>
                            <p className="text-sm font-black text-slate-950 tracking-wider mt-0.5">{selectedOrder.password}</p>
                          </div>
                        </div>
                      )}

                      {selectedOrder.isTrainOrder && (
                        <div className="md:col-span-2 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/50 flex items-start gap-3">
                          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                            <Train size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Rail Delivery Protocol (Train Order)</p>
                            <p className="text-xs font-bold text-amber-800 mt-1 italic leading-relaxed">
                              {selectedOrder.instructions || "Train instructions: Add plates, spoons, and tissues with order."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer details card */}
                  <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3 flex items-center gap-2 shrink-0">
                      <User size={14} className="text-slate-900" /> Customer Dispatch Manifest
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <div>
                          <p className="text-xs font-black text-slate-900">{selectedOrder.customer?.name || 'Online Customer'}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{selectedOrder.customer?.locality || 'No local area code'}</p>
                          {selectedOrder.customer?.mobile && (
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Phone: {selectedOrder.customer.mobile}</p>
                          )}
                          {selectedOrder.customer?.email && (
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{selectedOrder.customer.email}</p>
                          )}
                        </div>
                        {selectedOrder.customer?.address && (
                          <div className="max-w-xs">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Delivery Address</p>
                            <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
                              {selectedOrder.customer.address}
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedOrder.instructions && !selectedOrder.isTrainOrder && (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kitchen / Delivery Instructions</p>
                          <p className="text-[10px] text-slate-600 font-bold mt-1 italic">"{selectedOrder.instructions}"</p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Encrypted contact key</p>
                          {decryptedContacts[selectedOrder._id] ? (
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs font-black text-slate-900">{decryptedContacts[selectedOrder._id].number}</span>
                              {decryptedContacts[selectedOrder._id].pin && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black">
                                  PIN: {decryptedContacts[selectedOrder._id].pin}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-500 tracking-wider">XXXXXXXXXX</span>
                          )}
                        </div>

                        {!decryptedContacts[selectedOrder._id] && (
                          <button
                            onClick={handleDecryptCustomer}
                            disabled={decryptingCustomer}
                            className="px-4 py-2 border border-slate-200 hover:border-slate-800 text-slate-600 hover:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm bg-white cursor-pointer"
                          >
                            {decryptingCustomer ? <RefreshCcw size={10} className="animate-spin" /> : <Phone size={10} />}
                            Decrypt Contact Key
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rider agent tracking card */}
                  <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Truck size={14} className="text-slate-900" /> Delivery Agent / Courier
                      </h4>

                      <button
                        onClick={handlePollRider}
                        disabled={pollingRider}
                        className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest cursor-pointer"
                      >
                        <RefreshCcw size={11} className={pollingRider ? 'animate-spin' : ''} />
                        Poll Status
                      </button>
                    </div>

                    {selectedOrder.riderDetails?.status ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rider Name</p>
                          <p className="text-xs font-black text-slate-900 truncate">{selectedOrder.riderDetails.name || 'Not Assigned'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rider Contact</p>
                          <p className="text-xs font-black text-slate-900 truncate">{selectedOrder.riderDetails.phone || 'Not Available'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Courier status</p>
                          <div>
                            <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase tracking-wider">
                              {selectedOrder.riderDetails.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Arriving in</p>
                          <p className="text-xs font-black text-slate-950 flex items-center gap-1">
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            {selectedOrder.riderDetails.timeToArrive || 0} mins
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-3 text-center text-[10px] text-slate-400 font-bold italic">
                        No courier details reported by {selectedOrder.source} yet.
                      </div>
                    )}
                  </div>

                  {/* Zomato order complaints resolver panel */}
                  {selectedOrder.source === 'ZOMATO' && selectedOrder.complaints && selectedOrder.complaints.length > 0 && (
                    <div className="p-6 bg-rose-50/40 border border-rose-200/50 rounded-3xl space-y-4">
                      <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-600 animate-bounce" /> Channel Dispute Resolver
                      </h4>

                      <div className="space-y-3">
                        {selectedOrder.complaints.map((comp) => (
                          <div 
                            key={comp.id} 
                            className="p-4 bg-white border border-rose-100/70 rounded-2xl space-y-3 shadow-sm"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                                  comp.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                  comp.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {comp.status}
                                </span>
                                <p className="text-xs font-black text-slate-800 mt-2">
                                  Dispute category: {comp.data?.reason || comp.data?.issue_category || 'Customer Complaint'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Refund claimed</p>
                                <p className="text-xs font-black text-rose-600">₹{comp.data?.refund_amount || 0}</p>
                              </div>
                            </div>

                            {comp.data?.details && (
                              <p className="text-[10px] text-slate-500 font-medium italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                "{comp.data.details}"
                              </p>
                            )}

                            {comp.status === 'pending' && (
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    setActiveComplaint(comp);
                                    setComplaintRefundAmount(comp.data?.refund_amount || 0);
                                    setShowComplaintAccept(true);
                                  }}
                                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                  Accept Refund
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveComplaint(comp);
                                    setComplaintRejectionId(9);
                                    setComplaintOtherReason('');
                                    setShowComplaintReject(true);
                                  }}
                                  className="flex-1 py-2 border border-slate-200 hover:border-rose-600 text-slate-500 hover:text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                  Reject Dispute
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items Manifest list */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Ordered Entities</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                         <Hash size={10} /> {selectedOrder.items?.length || 0} items
                       </span>
                    </div>

                    <div className="p-6 space-y-4">
                       {selectedOrder.items?.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                            <div>
                               <p className="text-xs font-black text-slate-900 uppercase italic">{item.name}</p>
                               {item.modifiers?.length > 0 && (
                                 <div className="flex flex-wrap gap-1 mt-1.5">
                                    {item.modifiers.map((m, mIdx) => (
                                      <span key={mIdx} className="text-[8px] font-bold text-slate-400 uppercase py-0.5 px-1.5 bg-slate-100 rounded">
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

                    {/* Bill breakdown */}
                    <div className="p-6 bg-slate-50/50 space-y-2 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <div className="flex justify-between">
                        <span>Cart Subtotal</span>
                        <span className="text-slate-800">₹{selectedOrder.subTotal || 0}</span>
                      </div>
                      
                      {selectedOrder.tax > 0 && (
                        <div className="flex justify-between">
                          <span>CGST / SGST Tax</span>
                          <span className="text-slate-800">₹{selectedOrder.tax}</span>
                        </div>
                      )}

                      {selectedOrder.platformFee > 0 && (
                        <div className="flex justify-between">
                          <span>Platform Fee</span>
                          <span className="text-slate-800">₹{selectedOrder.platformFee}</span>
                        </div>
                      )}

                      {selectedOrder.welfareFee > 0 && (
                        <div className="flex justify-between">
                          <span>Gig Worker's Welfare Fee</span>
                          <span className="text-slate-800">₹{selectedOrder.welfareFee}</span>
                        </div>
                      )}

                      {selectedOrder.deliveryCharge > 0 && (
                        <div className="flex justify-between">
                          <span>Delivery Logistics Fee</span>
                          <span className="text-slate-800">₹{selectedOrder.deliveryCharge}</span>
                        </div>
                      )}

                      {selectedOrder.containerCharge > 0 && (
                        <div className="flex justify-between">
                          <span>Packaging charge</span>
                          <span className="text-slate-800">₹{selectedOrder.containerCharge}</span>
                        </div>
                      )}

                      {selectedOrder.discount?.amount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Campaign discount ({selectedOrder.discount.reason || 'Offer'})</span>
                          <span>-₹{selectedOrder.discount.amount}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-xs font-black uppercase tracking-widest pt-3 border-t border-slate-200 text-slate-900">
                        <span>Grand Total</span>
                        <span className="text-slate-900">₹{selectedOrder.grandTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Complaint Accept Modal */}
      {showComplaintAccept && activeComplaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Accept Complaint & Approve Refund</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Dispute ID: {activeComplaint.id} (Claimed: ₹{activeComplaint.data?.refund_amount || 0})
            </p>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Refund Amount (₹)</label>
              <input
                type="number"
                value={complaintRefundAmount}
                onChange={(e) => setComplaintRefundAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                placeholder="Enter refund amount"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowComplaintAccept(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptComplaint}
                disabled={actionLoading}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                {actionLoading ? 'Approving...' : 'Approve Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Reject Modal */}
      {showComplaintReject && activeComplaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Reject Complaint Dispute</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Dispute ID: {activeComplaint.id}
            </p>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Rejection Reason Code</label>
              <select
                value={complaintRejectionId}
                onChange={(e) => setComplaintRejectionId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
              >
                <option value={9}>9 - Complaint is invalid</option>
                <option value={2}>2 - Need clearer photos to understand issue</option>
                <option value={4}>4 - Other reason</option>
              </select>
            </div>

            {complaintRejectionId === 4 && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Reason Text</label>
                <input
                  type="text"
                  value={complaintOtherReason}
                  onChange={(e) => setComplaintOtherReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                  placeholder="Specify other reason"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowComplaintReject(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectComplaint}
                disabled={actionLoading}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
