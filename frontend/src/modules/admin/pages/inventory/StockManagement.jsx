import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, AlertCircle, Edit2, Trash2, Save, Package, Truck, Database, ChevronRight, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';

export default function StockManagement() {
  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'Kgs',
    minLevel: '',
    category: 'Dry Grocery',
    price: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/stock`);
      const data = await res.json();
      setStock(data);
    } catch (err) {
      toast.error('Inventory fetch failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || 'Kgs',
        minLevel: item.minLevel,
        category: item.category || 'Dry Grocery',
        price: item.price || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        quantity: '',
        unit: 'Kgs',
        minLevel: '',
        category: 'Dry Grocery',
        price: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.quantity === '') return toast.error('Required fields missing');

    const url = editingItem 
      ? `${import.meta.env.VITE_API_URL}/stock/${editingItem._id}`
      : `${import.meta.env.VITE_API_URL}/stock`;
    
    const method = editingItem ? 'PUT' : 'POST';

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
        toast.success(editingItem ? 'Item updated' : 'Item added');
        fetchData();
        setIsModalOpen(false);
      } else {
        const error = await res.json();
        toast.error(error.message);
      }
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/stock/${itemToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      if (res.ok) {
        toast.success('Item deleted successfully');
        fetchData();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const filteredStock = stock.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStock.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto min-h-screen pb-40">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
                 <Package size={22} strokeWidth={2.5} className="text-emerald-400" />
              </div>
              <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase tracking-tighter">Stock Inventory</h1>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Manage and track your restaurant's stock levels</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={() => handleOpenModal()}
             className="h-14 px-8 bg-[#2C2C2C] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all group"
           >
             <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white group-hover:text-slate-900 transition-colors">
               <Plus size={16} strokeWidth={3} />
             </div>
             Add New Item
           </button>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="bg-white/40 backdrop-blur-md sticky top-0 z-10 py-4 -mx-4 px-4 border-b border-transparent">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search items by name or category..."
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
        </div>
      </div>

      {/* Stats Section with Aesthetics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[3rem] shadow-sm flex flex-col justify-between min-h-[160px] group hover:bg-emerald-100 hover:border-emerald-200 transition-all cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
               <Package size={80} strokeWidth={1} />
            </div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest relative z-10 underline decoration-transparent decoration-transparent">Total Items</p>
            <p className="text-4xl font-black text-emerald-900 tracking-tighter relative z-10 tabular-nums tabular-nums tabular-nums">
              {filteredStock.reduce((acc, curr) => acc + curr.quantity, 0).toString().padStart(2, '0')}
            </p>
         </div>
         
         <div className="bg-amber-50 border border-amber-100 p-8 rounded-[3rem] shadow-sm flex flex-col justify-between min-h-[160px] group hover:bg-amber-100 hover:border-amber-200 transition-all cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
               <AlertCircle size={80} strokeWidth={1} />
            </div>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest relative z-10 underline decoration-transparent decoration-transparent">Low Stock Items</p>
            <p className="text-4xl font-black text-amber-900 tracking-tighter relative z-10 tabular-nums">
              {filteredStock.filter(s => s.quantity <= s.minLevel && s.quantity > 0).length.toString().padStart(2, '0')}
            </p>
         </div>

         <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] shadow-sm flex flex-col justify-between min-h-[160px] group hover:bg-rose-100 hover:border-rose-200 transition-all cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
               <Database size={80} strokeWidth={1} />
            </div>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest relative z-10 underline decoration-transparent decoration-transparent">Out Of Stock</p>
            <p className="text-4xl font-black text-rose-900 tracking-tighter relative z-10 tabular-nums tabular-nums tabular-nums">
              {filteredStock.filter(s => s.quantity <= 0).length.toString().padStart(2, '0')}
            </p>
         </div>

         <div className="bg-blue-50 border border-blue-100 p-8 rounded-[3rem] shadow-sm flex flex-col justify-between min-h-[160px] group hover:bg-blue-100 hover:border-blue-200 transition-all cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
               <Truck size={80} strokeWidth={1} />
            </div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest relative z-10 underline decoration-transparent decoration-transparent">Total Categories</p>
            <p className="text-4xl font-black text-blue-900 tracking-tighter relative z-10 tabular-nums tabular-nums tabular-nums">
              {new Set(filteredStock.map(s => s.category)).size.toString().padStart(2, '0')}
            </p>
         </div>
      </div>

      {/* Items List View */}
      {isLoading ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-8 space-y-4">
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className="w-full h-16 bg-slate-50 rounded-2xl animate-pulse" />
           ))}
        </div>
      ) : filteredStock.length === 0 ? (
        <div className="text-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <Package size={64} className="mx-auto text-slate-200 mb-6" strokeWidth={1} />
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No items found in stock</p>
           <button onClick={() => handleOpenModal()} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Add Your First Item</button>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Item Details</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Current Stock</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Min Level</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.map((item) => (
                <tr key={item._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl transition-all ${item.quantity <= item.minLevel ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white'}`}>
                        <Package size={16} />
                      </div>
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full">{item.category}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black tabular-nums ${item.quantity <= item.minLevel ? 'text-amber-500' : 'text-slate-900'}`}>{item.quantity}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</span>
                      {item.quantity <= item.minLevel && <AlertCircle size={14} className="text-amber-500 animate-pulse" />}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-400 tabular-nums">{item.minLevel} {item.unit}</span>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                           <Edit2 size={14} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item)}
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
      {filteredStock.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             Showing <span className="text-slate-900">{indexOfFirstItem + 1}</span> to <span className="text-slate-900">{Math.min(indexOfLastItem, filteredStock.length)}</span> of <span className="text-slate-900">{filteredStock.length}</span> items
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

      {/* Modals */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Stock Item' : 'Add New Item'}
        subtitle="Manage item details and stock levels"
        onSubmit={handleSave}
      >
        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 rounded-2xl transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                placeholder="e.g. TRUFFLE OIL (5L)"
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Quantity</label>
                <input 
                  type="number" 
                  required
                  className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:border-slate-900 rounded-2xl"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Measurement Unit</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold uppercase outline-none focus:border-slate-900 rounded-2xl appearance-none"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                >
                  <option value="Kgs">Kilograms (Kgs)</option>
                  <option value="Ltrs">Liters (Ltrs)</option>
                  <option value="Units">Units (Pcs)</option>
                  <option value="Boxes">Bulk Boxes</option>
                </select>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Stock Level</label>
                <input 
                  type="number" 
                  required
                  className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:border-slate-900 rounded-2xl"
                  value={formData.minLevel}
                  onChange={(e) => setFormData({...formData, minLevel: e.target.value})}
                  placeholder="Low stock alert at..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Category</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold uppercase outline-none focus:border-slate-900 rounded-2xl appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Dry Grocery">Dry Grocery</option>
                  <option value="Oils & Fats">Oils & Fats</option>
                  <option value="Meat & Poultry">Meat & Poultry</option>
                  <option value="Dairy">Dairy & Produce</option>
                  <option value="Beverages">Beverages & Spirits</option>
                </select>
              </div>
           </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Item"
        subtitle="This action cannot be undone"
        variant="danger"
      >
        <div className="space-y-6">
           <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wide leading-relaxed">
                  Warning: You are about to delete <span className="font-black">"{itemToDelete?.name}"</span>. This will remove the item and its history from the system.
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
