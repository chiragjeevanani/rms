import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Search, AlertTriangle, TrendingDown, Edit2, Package, IndianRupee, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';

export default function Wastage() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    reason: 'Expired',
    value: ''
  });

  useEffect(() => {
    fetchWastage();
  }, []);

  const fetchWastage = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/wastage`);
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      toast.error('Failed to fetch wastage logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingRecord(record);
      setFormData({ 
        item: record.item, 
        quantity: record.quantity, 
        reason: record.reason, 
        value: record.value 
      });
    } else {
      setEditingRecord(null);
      setFormData({ item: '', quantity: '', reason: 'Expired', value: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.item || !formData.value) return toast.error('Required fields missing');

    const url = editingRecord 
      ? `${import.meta.env.VITE_API_URL}/wastage/${editingRecord._id}` 
      : `${import.meta.env.VITE_API_URL}/wastage`;
    const method = editingRecord ? 'PUT' : 'POST';

    const wastageData = {
      ...formData,
      date: editingRecord ? editingRecord.date : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify(wastageData)
      });

      if (res.ok) {
        toast.success(editingRecord ? 'Record updated' : 'Waste reported successfully');
        fetchWastage();
        setIsModalOpen(false);
      } else {
        const error = await res.json();
        toast.error(error.message);
      }
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/wastage/${recordToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      if (res.ok) {
        toast.success('Record removed');
        fetchWastage();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const filteredRecords = records.filter(r => 
    r.item.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

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
                 <Trash2 size={22} strokeWidth={2.5} className="text-rose-400" />
              </div>
              <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase tracking-tighter">Food Wastage Log</h1>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Track and reduce food waste and kitchen losses</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="h-14 px-8 bg-[#2C2C2C] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white group-hover:text-slate-900 transition-colors">
            <Plus size={16} strokeWidth={3} />
          </div>
          Add Waste Record
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] shadow-sm flex items-center gap-6 group hover:bg-rose-100 transition-all">
            <div className="w-16 h-16 bg-white text-rose-500 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-rose-900/5 group-hover:scale-110 transition-transform">
               <TrendingDown size={32} />
            </div>
            <div>
               <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Loss (Reported)</p>
               <p className="text-3xl font-black text-rose-900 tracking-tighter tabular-nums">
                 ₹{records.reduce((acc, r) => acc + Number(r.value), 0).toLocaleString()}
               </p>
            </div>
         </div>
         
         <div className="bg-amber-50 border border-amber-100 p-8 rounded-[3rem] shadow-sm flex items-center gap-6 group hover:bg-amber-100 transition-all">
            <div className="w-16 h-16 bg-white text-amber-500 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-amber-900/5 group-hover:scale-110 transition-transform">
               <AlertTriangle size={32} />
            </div>
            <div>
               <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Most Recent Issue</p>
               <p className="text-3xl font-black text-amber-900 tracking-tighter">
                 {records.length > 0 ? records[0].item : 'NONE'}
               </p>
            </div>
         </div>
      </div>

      {/* Search */}
      <div className="bg-white/40 backdrop-blur-md sticky top-0 z-10 py-4 -mx-4 px-4 border-b border-transparent">
        <div className="relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search waste logs by item or reason..."
            className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Wastage Table */}
      {isLoading ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-8 space-y-4">
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className="w-full h-16 bg-slate-50 rounded-2xl animate-pulse" />
           ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <Trash2 size={64} className="mx-auto text-slate-200 mb-6" strokeWidth={1} />
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No wastage reported yet</p>
           <button onClick={() => handleOpenModal()} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Add Your First Record</button>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Item Details</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Reason for Waste</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Loss Amount</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Date & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.map((record) => (
                <tr key={record._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{record.item}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Qty: {record.quantity}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-rose-50 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-full">{record.reason}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-1 font-black text-rose-600 text-sm">
                      <IndianRupee size={12} />
                      {record.value.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                     <div className="flex items-center justify-end gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.date}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleOpenModal(record)}
                            className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          >
                             <Edit2 size={14} strokeWidth={2.5} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(record)}
                             className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Container */}
      {!isLoading && filteredRecords.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-100 shadow-sm mt-8">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             Showing <span className="text-slate-900">{indexOfFirstItem + 1}</span> to <span className="text-slate-900">{Math.min(indexOfLastItem, filteredRecords.length)}</span> of <span className="text-slate-900">{filteredRecords.length}</span> Records
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
        title={editingRecord ? 'Edit Waste Record' : 'Add Waste Record'}
        subtitle="Log food waste or spoilage for tracking"
        onSubmit={handleSave}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 rounded-2xl transition-all"
              value={formData.item}
              onChange={(e) => setFormData({...formData, item: e.target.value.toUpperCase()})}
              placeholder="e.g. HEAVY CREAM"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity Wasted</label>
               <input 
                 type="text" 
                 required
                 className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:border-slate-900 rounded-2xl"
                 value={formData.quantity}
                 onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                 placeholder="e.g. 2 Ltrs"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loss Amount (₹)</label>
               <input 
                 type="number" 
                 required
                 className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:border-slate-900 rounded-2xl"
                 value={formData.value}
                 onChange={(e) => setFormData({...formData, value: e.target.value})}
                 placeholder="0.00"
               />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Why was it wasted?</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold uppercase outline-none focus:border-slate-900 rounded-2xl appearance-none"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            >
              <option value="Expired">Expired</option>
              <option value="Spoiled">Spoiled</option>
              <option value="Damaged">Damaged / Broken</option>
              <option value="Kitchen Error">Kitchen Error / Other</option>
            </select>
          </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Record"
        subtitle="This action cannot be undone"
        variant="danger"
      >
        <div className="space-y-6">
           <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wide leading-relaxed">
                  Warning: Record delete kar dein? <span className="font-black">"{recordToDelete?.item}"</span> ka data system se remove ho jayega.
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



