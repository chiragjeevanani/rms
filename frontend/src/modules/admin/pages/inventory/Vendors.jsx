import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Phone, Mail, Edit2, Trash2, Shield, Package, AlertCircle, CheckCircle2, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [viewType, setViewType] = useState('list'); // 'list' or 'grid'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    category: 'Dry Grocery',
    status: 'Active'
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/vendor`);
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      toast.error('Failed to fetch vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        contact: vendor.contact,
        phone: vendor.phone,
        email: vendor.email,
        category: vendor.category,
        status: vendor.status
      });
    } else {
      setEditingVendor(null);
      setFormData({ name: '', contact: '', phone: '', email: '', category: 'Dry Grocery', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingVendor 
      ? `${import.meta.env.VITE_API_URL}/vendor/${editingVendor._id}` 
      : `${import.meta.env.VITE_API_URL}/vendor`;
    const method = editingVendor ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingVendor ? 'Vendor details updated' : 'New vendor onboarded');
        fetchVendors();
        setIsModalOpen(false);
      } else {
        const error = await res.json();
        toast.error(error.message);
      }
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDeleteClick = (vendor) => {
    setVendorToDelete(vendor);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/vendor/${vendorToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      if (res.ok) {
        toast.success('Vendor removed from system');
        fetchVendors();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVendors.slice(indexOfFirstItem, indexOfLastItem);

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
                 <Truck size={22} strokeWidth={2.5} className="text-blue-400" />
              </div>
              <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase tracking-tighter">Vendor Management</h1>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Manage and track your restaurant's suppliers</p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* View Toggle */}
           <div className="bg-white border border-slate-100 rounded-[1.5rem] p-1.5 shadow-sm flex items-center gap-1">
              <button 
                onClick={() => setViewType('list')}
                className={`p-2.5 rounded-xl transition-all ${viewType === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setViewType('grid')}
                className={`p-2.5 rounded-xl transition-all ${viewType === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <LayoutGrid size={18} />
              </button>
           </div>

           <button 
             onClick={() => handleOpenModal()}
             className="h-14 px-8 bg-[#2C2C2C] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all group"
           >
             <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white group-hover:text-slate-900 transition-colors">
               <Plus size={16} strokeWidth={3} />
             </div>
             Onboard Vendor
           </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/40 backdrop-blur-md sticky top-0 z-10 py-4 -mx-4 px-4 border-b border-transparent">
        <div className="relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search vendors by name or category..."
            className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-8 space-y-4">
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className="w-full h-16 bg-slate-50 rounded-2xl animate-pulse" />
           ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <Truck size={64} className="mx-auto text-slate-200 mb-6" strokeWidth={1} />
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No vendors found</p>
           <button onClick={() => handleOpenModal()} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Add Your First Vendor</button>
        </div>
      ) : viewType === 'list' ? (
        /* List View */
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor Detail</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Person</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.map((vendor) => (
                <tr key={vendor._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{vendor.name}</p>
                        <div className="flex gap-2 mt-1">
                          <button className="text-[9px] font-bold text-blue-500 hover:underline uppercase tracking-widest flex items-center gap-1">
                            <Phone size={10} /> {vendor.phone}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {vendor.contact.split(' ').map(n => n[0]).join('')}
                       </div>
                       <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{vendor.contact}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full">{vendor.category}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                      ${vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {vendor.status === 'Active' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      {vendor.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                     <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => window.location.href = `tel:${vendor.phone}`}
                          className="p-2.5 bg-slate-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                        >
                          <Phone size={14} />
                        </button>
                        <button 
                          onClick={() => window.location.href = `mailto:${vendor.email}`}
                          className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                          <Mail size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(vendor)}
                          className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                           <Edit2 size={14} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(vendor)}
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
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {currentItems.map((vendor) => (
             <motion.div 
               layout
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               key={vendor._id} 
               className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all relative overflow-hidden group"
             >
                {/* Status Badge */}
                <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2
                    ${vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {vendor.status === 'Active' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {vendor.status}
                </div>

                <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Truck size={28} />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight line-clamp-1">{vendor.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{vendor.category}</p>
                   </div>
                </div>

                <div className="space-y-4 mb-8 border-t border-slate-50 pt-6">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Person</span>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{vendor.contact}</span>
                   </div>
                   <div className="flex gap-2">
                       <button 
                         onClick={() => window.location.href = `tel:${vendor.phone}`}
                         className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
                       >
                         <Phone size={14} /> Call
                       </button>
                       <button 
                         onClick={() => window.location.href = `mailto:${vendor.email}`}
                         className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
                       >
                         <Mail size={14} /> Mail
                       </button>
                   </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-50 pt-6">
                   <button className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">View Contracts</button>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenModal(vendor)}
                        className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"
                      >
                         <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(vendor)}
                        className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                      >
                         <Trash2 size={14} />
                      </button>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      )}

      {/* Pagination Container */}
      {!isLoading && filteredVendors.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-100 shadow-sm mt-8">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             Showing <span className="text-slate-900">{indexOfFirstItem + 1}</span> to <span className="text-slate-900">{Math.min(indexOfLastItem, filteredVendors.length)}</span> of <span className="text-slate-900">{filteredVendors.length}</span> Vendors
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
        title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
        subtitle="Onboard a new supplier to your system"
        onSubmit={handleSave}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 rounded-2xl transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
              placeholder="e.g. PREMIUM GRAINS CO."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Person</label>
               <input 
                 type="text" 
                 required
                 className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:border-slate-900 rounded-2xl"
                 value={formData.contact}
                 onChange={(e) => setFormData({...formData, contact: e.target.value})}
                 placeholder="Full Name"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
               <input 
                 type="text" 
                 required
                 className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:border-slate-900 rounded-2xl"
                 value={formData.phone}
                 onChange={(e) => setFormData({...formData, phone: e.target.value})}
                 placeholder="+91 00000 00000"
               />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
               <input 
                 type="email" 
                 required
                 className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:border-slate-900 rounded-2xl"
                 value={formData.email}
                 onChange={(e) => setFormData({...formData, email: e.target.value})}
                 placeholder="vendor@email.com"
               />
             </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Items Supplied</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold uppercase outline-none focus:border-slate-900 rounded-2xl appearance-none"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="Dry Grocery">Dry Grocery</option>
                <option value="Meat & Seafood">Meat & Seafood</option>
                <option value="Dairy Products">Dairy Products</option>
                <option value="Produce">Fresh Produce</option>
                <option value="Beverages">Beverages</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor Status</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold uppercase outline-none focus:border-slate-900 rounded-2xl appearance-none"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="Active">Active</option>
              <option value="Review Needed">Review Needed</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remove Vendor"
        subtitle="This action cannot be undone"
        variant="danger"
      >
        <div className="space-y-6">
           <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wide leading-relaxed">
                  Warning: You are about to remove <span className="font-black">"{vendorToDelete?.name}"</span> from the supplier registry.
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



