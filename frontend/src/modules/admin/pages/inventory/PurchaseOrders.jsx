import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Download, Clock, CheckCircle, Trash2, Edit2, Package, IndianRupee, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import BranchSelector from '../../components/BranchSelector';

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    vendor: '',
    amount: '',
    status: 'Confirmed',
    branchId: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, []);

  const fetchOrders = async () => {
    try {
      const [orderRes, branchRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/order`),
        fetch(`${import.meta.env.VITE_API_URL}/branches`)
      ]);
      const orderData = await orderRes.json();
      const branchData = await branchRes.json();
      
      setOrders(orderData);
      if (branchData.success) setBranches(branchData.data);
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/vendor`);
      const data = await res.json();
      setVendors(data);
      if (data.length > 0 && !formData.vendor) {
        setFormData(prev => ({ ...prev, vendor: data[0].name }));
      }
    } catch (err) {}
  };

  const handleOpenModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({ 
        vendor: order.vendor, 
        amount: order.amount, 
        status: order.status,
        branchId: order.branchId || ''
      });
    } else {
      setEditingOrder(null);
      setFormData({ 
        vendor: '', 
        amount: '', 
        status: 'Confirmed',
        branchId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.branchId) return toast.error('Branch selection required');
    if (!formData.vendor) return toast.error('Please select a vendor');

    const url = editingOrder 
      ? `${import.meta.env.VITE_API_URL}/order/${editingOrder._id}` 
      : `${import.meta.env.VITE_API_URL}/order`;
    const method = editingOrder ? 'PUT' : 'POST';

    const orderData = {
      ...formData,
      poNumber: editingOrder ? editingOrder.poNumber : `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: editingOrder ? editingOrder.date : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        toast.success(editingOrder ? 'Order updated' : 'Purchase order created');
        fetchOrders();
        setIsModalOpen(false);
      } else {
        const error = await res.json();
        toast.error(error.message);
      }
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/order/${orderToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      if (res.ok) {
        toast.success('Order deleted');
        fetchOrders();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const handleDownloadPDF = (order) => {
    const doc = new jsPDF();
    
    // Find vendor details
    const vendorDetails = vendors.find(v => v.name === order.vendor) || {};
    
    // Header - Modern Design Simulation
    doc.setFillColor(44, 44, 44);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('PURCHASE ORDER', 105, 25, { align: 'center' });
    
    // Details Section
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`DATE: ${order.date}`, 15, 50);
    doc.text(`ORDER ID: ${order.poNumber}`, 150, 50);
    
    // Vendor Info Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 60, 180, 50, 5, 5, 'F');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text('SUPPLIER DETAILS:', 25, 75);
    doc.setFontSize(10);
    doc.text(`Name: ${order.vendor}`, 25, 85);
    doc.text(`Phone: ${vendorDetails.phone || 'N/A'}`, 25, 92);
    doc.text(`Email: ${vendorDetails.email || 'N/A'}`, 25, 99);
    doc.text(`Contact Person: ${vendorDetails.contact || 'N/A'}`, 110, 85);
    
    // Amount & Status
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 120, 180, 25, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text('Total Amount Payable:', 25, 137);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Rs. ${order.amount.toLocaleString()}`, 75, 137);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Order Status:', 140, 137);
    doc.setTextColor(order.status === 'Delivered' ? '#10b981' : '#f59e0b');
    doc.text(`${order.status.toUpperCase()}`, 165, 137);
    
    // Table Header
    doc.setFillColor(44, 44, 44);
    doc.rect(15, 155, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Item Description', 25, 162);
    doc.text('Total Value', 160, 162);
    
    // Items
    doc.setTextColor(0, 0, 0);
    doc.text(`Procurement Ref: ${order.poNumber}`, 25, 175);
    doc.text(`${order.amount.toLocaleString()}`, 165, 175);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('System generated document. Securely processed by Antigravity RMS.', 105, 280, { align: 'center' });
    doc.text('Contact support at operations@rms.system', 105, 285, { align: 'center' });

    doc.save(`${order.poNumber}_Report.pdf`);
    toast.success('PDF PO Downloaded');
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-emerald-50 text-emerald-600';
      case 'Pending': return 'bg-amber-50 text-amber-600';
      case 'Confirmed': return 'bg-blue-50 text-blue-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.vendor.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.poNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const branchMatch = selectedBranchFilter === 'all' || o.branchId === selectedBranchFilter;
    return matchesSearch && branchMatch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto min-h-screen pb-40">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
                 <ShoppingCart size={22} strokeWidth={2.5} className="text-amber-400" />
              </div>
              <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase tracking-tighter">Purchase Orders</h1>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Track and manage your orders from vendors</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="h-14 px-8 bg-[#2C2C2C] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white group-hover:text-slate-900 transition-colors">
            <Plus size={16} strokeWidth={3} />
          </div>
          Create New Order
        </button>
      </div>

      {/* Search */}
      <div className="bg-white/40 backdrop-blur-md sticky top-0 z-10 py-4 -mx-4 px-4 border-b border-transparent">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative group w-full flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search orders by ID or vendor name..."
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="h-8 w-px bg-slate-100 hidden md:block mx-2" />

          <BranchSelector 
            branches={branches}
            selectedBranch={selectedBranchFilter}
            onSelect={setSelectedBranchFilter}
          />
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-8 space-y-4">
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className="w-full h-16 bg-slate-50 rounded-2xl animate-pulse" />
           ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <ShoppingCart size={64} className="mx-auto text-slate-200 mb-6" strokeWidth={1} />
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No purchase orders found</p>
           <button onClick={() => handleOpenModal()} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Create Your First PO</button>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Order Information</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier Name</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Order Amount</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Order Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.map((order) => (
                <tr key={order._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.poNumber}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{order.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{order.vendor}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-1 font-black text-slate-900 text-sm">
                      <IndianRupee size={12} className="text-slate-400" />
                      {order.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                      ${getStatusStyle(order.status)}`}>
                      {order.status === 'Delivered' ? <CheckCircle size={10} /> : <Clock size={10} />}
                      {order.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                   <div className="flex items-center justify-end gap-2 text-slate-400 group-hover:text-slate-900 transition-colors">
                      <button 
                        onClick={() => handleDownloadPDF(order)}
                        className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                        <Download size={14} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(order)}
                        className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                         <Edit2 size={14} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(order)}
                         className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination Container */}
      {!isLoading && filteredOrders.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-100 shadow-sm mt-8">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             Showing <span className="text-slate-900">{indexOfFirstItem + 1}</span> to <span className="text-slate-900">{Math.min(indexOfLastItem, filteredOrders.length)}</span> of <span className="text-slate-900">{filteredOrders.length}</span> Orders
           </p>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-3 bg-white text-slate-900 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 hover:text-white transition-all border border-slate-100 shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase transition-all
                      ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-3 bg-white text-slate-900 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 hover:text-white transition-all border border-slate-100 shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
           </div>
        </div>
      )}

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
        subtitle="Fill in the order details for the supplier"
         onSubmit={handleSave}
      >
        <div className="space-y-6">
           <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch Allocation</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold uppercase outline-none focus:border-slate-900 rounded-2xl appearance-none"
              value={formData.branchId}
              required
              onChange={(e) => setFormData({...formData, branchId: e.target.value})}
            >
              <option value="">Select Target Branch</option>
              {branches.map(b => <option key={b._id} value={b._id}>{b.branchName}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier Name</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold uppercase outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 rounded-2xl transition-all appearance-none"
              value={formData.vendor}
              onChange={(e) => setFormData({...formData, vendor: e.target.value})}
              required
              disabled={!formData.branchId}
            >
              <option value="">{formData.branchId ? 'Select a supplier' : 'Select Branch First'}</option>
              {vendors
                .filter(v => v.branchId === formData.branchId)
                .map(v => (
                <option key={v._id} value={v.name}>{v.name}</option>
              ))}
            </select>
            {formData.branchId && vendors.filter(v => v.branchId === formData.branchId).length === 0 && (
              <p className="text-[9px] font-bold text-amber-600 uppercase mt-1 ml-1 tracking-widest">
                * Note: Add vendors for this branch first
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Order Amount (₹)</label>
               <input 
                 type="number" 
                 required
                 className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:border-slate-900 rounded-2xl"
                 value={formData.amount}
                 onChange={(e) => setFormData({...formData, amount: e.target.value})}
                 placeholder="0.00"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Order Status</label>
               <select 
                className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold uppercase outline-none focus:border-slate-900 rounded-2xl appearance-none"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
              </select>
             </div>
          </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Order"
        subtitle="This action cannot be undone"
        variant="danger"
      >
        <div className="space-y-6">
           <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wide leading-relaxed">
                  Warning: You are about to permanently delete order <span className="font-black">"{orderToDelete?.poNumber}"</span>.
              </p>
           </div>
           <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all shadow-sm"
              >Cancel</button>
              <button 
                onClick={confirmDelete}
                className="flex-[2] py-4 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-200"
              >Confirm Delete</button>
           </div>
        </div>
      </AdminModal>
    </div>
  );
}



