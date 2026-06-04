
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, Clock, Eye, MapPin, User, Hash, Calendar, Building2, Truck, Printer, Download } from 'lucide-react';
import { m } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';
import BranchSelector from '../../components/BranchSelector';
import DeliveryOrders from './DeliveryOrders';
import { jsPDF } from "jspdf";

export default function RecentOrders() {
  const [dataState, setDataState] = useState({
    orders: [],
    branches: [],
    loading: true
  });

  const [filterState, setFilterState] = useState({
    searchQuery: '',
    statusFilter: 'All',
    selectedBranchFilter: 'all',
    orderTypeFilter: 'All',
    currentPage: 1
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    viewingOrder: null,
    formData: { status: 'Pending' }
  });

  const [branchInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_branch_info') || localStorage.getItem('branch_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);

  const handlePrint = (order) => {
    setSelectedPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const generatePDF = (order) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 120 + ((order.items || []).length * 5)]
    });

    const centerX = 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(branchInfo?.branchName || 'RESTAURANT', centerX, 10, { align: 'center' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(branchInfo?.address || 'Branch Address', centerX, 14, { align: 'center' });
    doc.text(`Phone: ${branchInfo?.phone || ''}`, centerX, 17, { align: 'center' });
    
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, 20, 75, 20);
    
    doc.setFontSize(8);
    doc.text(`Order No: ${order.orderNumber}`, 5, 24);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 5, 28);
    doc.text(`Table: ${order.tableName}`, 5, 32);
    doc.text(`Waiter: ${order.waiterName || ''}`, 45, 32);
    
    doc.line(5, 35, 75, 35);
    doc.setFont("helvetica", "bold");
    doc.text('Item', 5, 39);
    doc.text('Qty', 45, 39, { align: 'center' });
    doc.text('Amount', 75, 39, { align: 'right' });
    doc.line(5, 41, 75, 41);

    doc.setFont("helvetica", "normal");
    let y = 45;
    (order.items || []).forEach(item => {
      const name = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name;
      doc.text(name, 5, y);
      doc.text(item.quantity.toString(), 45, y, { align: 'center' });
      doc.text(((item.price || 0) * item.quantity).toFixed(2), 75, y, { align: 'right' });
      y += 5;
    });

    doc.line(5, y, 75, y);
    y += 5;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text('GRAND TOTAL:', 45, y, { align: 'right' });
    doc.text(`Rs. ${(order.grandTotal || 0).toFixed(2)}`, 75, y, { align: 'right' });
    
    y += 8;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text('Thank you!', centerX, y, { align: 'center' });

    doc.save(`Order_${order.orderNumber}.pdf`);
  };

  const location = useLocation();
  const navigate = useNavigate();
  const recordsPerPage = 5;

  const { orders, branches, loading } = dataState;
  const { searchQuery, statusFilter, selectedBranchFilter, orderTypeFilter, currentPage } = filterState;
  const { isOpen: isModalOpen, viewingOrder, formData } = modalState;

  const setOrders = (val) => setDataState(prev => ({ ...prev, orders: typeof val === 'function' ? val(prev.orders) : val }));
  const setBranches = (val) => setDataState(prev => ({ ...prev, branches: typeof val === 'function' ? val(prev.branches) : val }));
  const setLoading = (val) => setDataState(prev => ({ ...prev, loading: typeof val === 'function' ? val(prev.loading) : val }));

  const setSearchQuery = (val) => setFilterState(prev => ({ ...prev, searchQuery: typeof val === 'function' ? val(prev.searchQuery) : val }));
  const setStatusFilter = (val) => setFilterState(prev => ({ ...prev, statusFilter: typeof val === 'function' ? val(prev.statusFilter) : val }));
  const setSelectedBranchFilter = (val) => setFilterState(prev => ({ ...prev, selectedBranchFilter: typeof val === 'function' ? val(prev.selectedBranchFilter) : val }));
  const setOrderTypeFilter = (val) => setFilterState(prev => ({ ...prev, orderTypeFilter: typeof val === 'function' ? val(prev.orderTypeFilter) : val }));
  const setCurrentPage = (val) => setFilterState(prev => ({ ...prev, currentPage: typeof val === 'function' ? val(prev.currentPage) : val }));

  const setIsModalOpen = (val) => setModalState(prev => ({ ...prev, isOpen: typeof val === 'function' ? val(prev.isOpen) : val }));
  const setViewingOrder = (val) => setModalState(prev => ({ ...prev, viewingOrder: typeof val === 'function' ? val(prev.viewingOrder) : val }));
  const setFormData = (val) => setModalState(prev => ({ ...prev, formData: typeof val === 'function' ? val(prev.formData) : val }));

  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith('/dine-in')) {
      setOrderTypeFilter('Dine-In');
    } else if (path.endsWith('/takeaway')) {
      setOrderTypeFilter('Takeaway');
    } else if (path.endsWith('/delivery')) {
      setOrderTypeFilter('Delivery');
    } else {
      setOrderTypeFilter('All');
    }
    setCurrentPage(1);
  }, [location.pathname]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [orderRes, branchRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/orders`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` } }),
        fetch((() => { const _rid = localStorage.getItem('admin_restaurantId'); return _rid ? `${import.meta.env.VITE_API_URL}/branches?restaurantId=${_rid}` : `${import.meta.env.VITE_API_URL}/branches`; })())
      ]);
      
      const orderResult = await orderRes.json();
      const branchResult = await branchRes.json();

      if (orderRes.ok) {
        const allOrders = orderResult.data || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const recentOnes = allOrders.filter(order => new Date(order.createdAt) >= today);
        setOrders(recentOnes);
      }
      if (branchResult.success) setBranches(branchResult.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to sync recent orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid':
      case 'Completed': 
      case 'Served': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'Pending':
      case 'Confirmed':
      case 'KOT':
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
    const matchesOrderType = orderTypeFilter === 'All' || (o.orderType || '').toLowerCase() === orderTypeFilter.toLowerCase();
    const oBranchId = typeof o.branchId === 'object' && o.branchId !== null ? o.branchId._id : o.branchId;
    const branchMatch = selectedBranchFilter === 'all' || oBranchId === selectedBranchFilter;
    
    return matchesSearch && matchesStatus && branchMatch && matchesOrderType;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredOrders.slice(indexOfFirstRecord, indexOfLastRecord);

  const dineInCount = orders.filter(o => (o.orderType || '').toLowerCase() === 'dine-in').length;
  const takeawayCount = orders.filter(o => (o.orderType || '').toLowerCase() === 'takeaway').length;
  const deliveryCount = orders.filter(o => (o.orderType || '').toLowerCase() === 'delivery').length;

  if (orderTypeFilter === 'Delivery') {
    return <DeliveryOrders />;
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 min-h-screen bg-[#FDFCFB]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase font-display italic">Today's Traffic</h1>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em] mt-1 shadow-sm inline-block">Real-time Daily Performance Monitor</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-4">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Date</span>
             <span className="text-xs font-black text-slate-900 uppercase">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <SummaryCard 
              label="Dine-In" 
              count={dineInCount} 
              active={orderTypeFilter === 'Dine-In'} 
              onClick={() => navigate(orderTypeFilter === 'Dine-In' ? '/admin/orders/recent' : '/admin/orders/dine-in')}
              color="bg-blue-500"
            />
            <SummaryCard 
              label="Takeaway" 
              count={takeawayCount} 
              active={orderTypeFilter === 'Takeaway'} 
              onClick={() => navigate(orderTypeFilter === 'Takeaway' ? '/admin/orders/recent' : '/admin/orders/takeaway')}
              color="bg-amber-500"
            />
            <SummaryCard 
              label="Delivery" 
              count={deliveryCount} 
              active={orderTypeFilter === 'Delivery'} 
              onClick={() => navigate(orderTypeFilter === 'Delivery' ? '/admin/orders/recent' : '/admin/orders/delivery')}
              color="bg-rose-500"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="SEARCH TODAY'S RECORDS…"
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="h-10 w-px bg-slate-100 hidden md:block" />

        <BranchSelector 
          branches={branches}
          selectedBranch={selectedBranchFilter}
          onSelect={setSelectedBranchFilter}
        />

        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm min-w-[200px] h-[58px]">
           <Filter size={14} className="text-slate-400" />
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="w-full bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
           >
              <option value="All">All Statuses</option>
              {['Pending', 'Preparing', 'Completed', 'Paid', 'Cancelled'].map(s => (
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
              ) : currentRecords.length > 0 ? currentRecords.map((order) => (
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
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button" 
                        onClick={() => handleOpenView(order)}
                        className="p-2 text-slate-400 hover:text-[#ff7a00] bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                        title="View Details"
                      ><Eye size={14} /></button>
                      <button 
                        type="button" 
                        onClick={() => handlePrint(order)}
                        className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                        title="Print Receipt"
                      ><Printer size={14} /></button>
                      <button 
                        type="button" 
                        onClick={() => generatePDF(order)}
                        className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                        title="Download PDF"
                      ><Download size={14} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                           <ShoppingBag size={32} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No orders recorded for today yet</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{indexOfFirstRecord + 1}</span> to <span className="text-slate-900">{Math.min(indexOfLastRecord, filteredOrders.length)}</span> of <span className="text-slate-900">{filteredOrders.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${
                  currentPage === 1 
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 active:scale-95 shadow-sm'
                }`}
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button type="button"
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 text-[10px] font-black rounded-lg border transition-all ${
                      currentPage === i + 1
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${
                  currentPage === totalPages 
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 active:scale-95 shadow-sm'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingOrder ? `Audit Order ${viewingOrder.orderNumber}` : 'Order Context'}
        subtitle="Operational Manifest & Status Override"
        onSubmit={handleUpdateStatus}
        submitLabel="Synchronize Flow"
        isSubmitDisabled={viewingOrder?.status === 'cancelled'}
      >
        {viewingOrder && (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Source Entity</span>
                <div className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                   <User size={14} className="text-brand-500" />
                   {viewingOrder.waiterName}
                </div>
              </div>
              <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sector</span>
                <div className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                   <MapPin size={14} className="text-brand-500" />
                   {viewingOrder.tableName}
                </div>
              </div>
              <div className="bg-slate-50 p-6 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Branch</span>
                <div className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                   <Building2 size={14} className="text-brand-500" />
                   {branches.find(b => b._id === (typeof viewingOrder.branchId === 'object' ? viewingOrder.branchId?._id : viewingOrder.branchId))?.branchName || 'Global/Unknown'}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Status Lifecycle Management</span>
              <div className="grid grid-cols-3 gap-2">
                {(() => {
                  const type = viewingOrder.orderType?.toLowerCase();
                  const current = viewingOrder.status;
                  if (type === 'takeaway') return ['Paid', 'Completed'];
                  
                  let base = type === 'dine-in' 
                    ? ['Preparing', 'Completed', 'Paid'] 
                    : ['Pending', 'Preparing', 'Completed', 'Paid'];
                    
                  const st = current?.toLowerCase();
                  if (st !== 'paid' && st !== 'completed' && st !== 'cancelled') {
                    base.push('Cancelled');
                  }
                  return [...new Set(base)];
                })().map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={viewingOrder.status === 'cancelled'}
                    onClick={() => setFormData({ status })}
                    className={`py-3 text-[9px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                      formData.status === status 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                    } ${viewingOrder.status === 'cancelled' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  <span className="text-emerald-600">₹{viewingOrder.grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-4">
              <button type="button" 
                onClick={() => { handlePrint(viewingOrder); }}
                className="flex-1 py-3 bg-[#ff7a00] text-white text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-brand-500/15 hover:bg-[#ea6c00]"
              >
                <Printer size={14} />
                Print Receipt
              </button>
              <button type="button" 
                onClick={() => { generatePDF(viewingOrder); }}
                className="flex-1 py-3 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-900/15 hover:bg-blue-700"
              >
                <Download size={14} />
                Download PDF
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Hidden Print Layer */}
      <div className="hidden print:block absolute inset-0 bg-white text-slate-900" id="printable-admin-receipt">
         {selectedPrintOrder && (
            <div className="w-full max-w-[70mm] mx-auto font-mono text-[10px] px-2">
               <div className="text-center mb-4 border-b border-dashed pb-4 px-2">
                  <h1 className="text-base font-black uppercase break-words">{branchInfo?.branchName || 'RESTAURANT'}</h1>
                  <p className="text-[8px] mt-1 break-words leading-relaxed whitespace-normal text-center">{branchInfo?.address}</p>
                  <p className="text-[8px] mt-0.5">Ph: {branchInfo?.phone}</p>
               </div>
               <div className="flex justify-between mb-1">
                  <span>Order: {selectedPrintOrder.orderNumber}</span>
                  <span>{new Date(selectedPrintOrder.createdAt).toLocaleDateString()}</span>
               </div>
               <div className="flex justify-between mb-4">
                  <span>Table: {selectedPrintOrder.tableName}</span>
                  <span>{new Date(selectedPrintOrder.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
               </div>
               <div className="border-y border-dashed py-2 mb-4">
                  <div className="flex font-bold mb-1">
                     <span className="flex-1">Item</span>
                     <span className="w-8 text-center">Qty</span>
                     <span className="w-16 text-right">Amt</span>
                  </div>
                  {(selectedPrintOrder.items || []).map((item, i) => (
                     <div key={i} className="flex py-0.5">
                        <span className="flex-1 uppercase">{item.name}</span>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <span className="w-16 text-right">{((item.price || 0) * item.quantity).toFixed(2)}</span>
                     </div>
                  ))}
               </div>
               <div className="flex justify-between font-bold text-sm border-t border-slate-900 pt-1 mt-1 uppercase">
                  <span>Total:</span>
                  <span>₹{(selectedPrintOrder.grandTotal || 0).toFixed(2)}</span>
               </div>
               <p className="text-center italic opacity-60 text-[8px] tracking-widest mt-10 uppercase">Thank you!</p>
            </div>
         )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-admin-receipt, #printable-admin-receipt * {
            visibility: visible;
          }
          #printable-admin-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}} />
    </div>
  );
}

function SummaryCard({ label, count, active, onClick, color }) {
  return (
    <button type="button" 
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
        active 
          ? `${color} text-white shadow-lg shadow-black/10` 
          : 'bg-white border border-slate-100 text-slate-400 hover:border-slate-300'
      }`}
    >
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-[8px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}
