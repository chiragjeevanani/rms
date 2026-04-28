import React, { useState, useEffect } from 'react';
import { 
  Store, MapPin, TrendingUp, Users, 
  ChevronRight, Plus, Search, Filter,
  Building2, Globe, Clock, Star, X, Save,
  AlertCircle, ShieldAlert, Edit3, Trash2, Mail, Phone, Hash, LayoutGrid, List, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [editingBranch, setEditingBranch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    branchEmail: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    managerName: '',
    openingTime: '09:00',
    closingTime: '23:00',
    status: 'active'
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/branches`);
      const result = await response.json();
      if (result.success) {
        setBranches(result.data);
      }
    } catch (error) {
      toast.error('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        ...branch
      });
    } else {
      setEditingBranch(null);
      setFormData({
        branchName: '',
        branchCode: '',
        branchEmail: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstNumber: '',
        managerName: '',
        openingTime: '09:00',
        closingTime: '23:00',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingBranch 
      ? `${import.meta.env.VITE_API_URL}/branches/${editingBranch._id}`
      : `${import.meta.env.VITE_API_URL}/branches`;
    
    const method = editingBranch ? 'PUT' : 'POST';

    // Temporary hardcoded restaurantId - in real app, get from auth context
    const payload = { 
      ...formData, 
      restaurantId: '662b9f3e1c9d440000000001' // Placeholder
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        toast.success(editingBranch ? 'Branch updated' : 'Branch created');
        fetchBranches();
        setIsModalOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/branches/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Branch deleted');
        fetchBranches();
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar max-h-full bg-[#F8FAFC]">
       <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Branch Network</h1>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage restaurant locations, contact info and status</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleOpenModal()}
            className="h-10 px-6 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
          >
             <Plus size={16} />
             Add New Branch
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white border-2 border-dashed border-slate-100 rounded-2xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Store size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Branches Found</h3>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1 mb-6">Your restaurant network is currently empty</p>
          <button 
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
          >
            Create Your First Branch
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(branch => (
                <tr key={branch._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-slate-900 uppercase">{branch.branchName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{branch.branchCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-2"><Mail size={10} /> {branch.branchEmail}</p>
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-2"><Phone size={10} /> {branch.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[11px] font-bold text-slate-600 line-clamp-1 w-48">{branch.address}, {branch.city}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      branch.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {branch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/branches/${branch._id}`)}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleOpenModal(branch)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(branch._id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-[14px] font-black uppercase tracking-tight text-slate-900">
                    {editingBranch ? 'Update Branch Details' : 'Add New Branch'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
               </div>

               <form onSubmit={handleSave} className="p-8 overflow-y-auto no-scrollbar space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Name</label>
                    <input type="text" required className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" value={formData.branchName} onChange={e => setFormData({...formData, branchName: e.target.value})} placeholder="e.g. Downtown Outlet" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                      <input type="email" required className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" value={formData.branchEmail} onChange={e => setFormData({...formData, branchEmail: e.target.value})} placeholder="branch@restaurant.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                      <input type="text" required className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 98765 43210" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Address</label>
                    <textarea required rows="2" className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 transition-all resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Store number, Building name, Street..." />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">City</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">State</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pincode</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Number</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value.toUpperCase()})} placeholder="Optional" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Manager</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" value={formData.managerName} onChange={e => setFormData({...formData, managerName: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Time</label>
                      <input type="time" className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg" value={formData.openingTime} onChange={e => setFormData({...formData, openingTime: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Close Time</label>
                      <input type="time" className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg" value={formData.closingTime} onChange={e => setFormData({...formData, closingTime: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                      <select className="w-full bg-slate-50 border border-slate-100 p-2.5 text-[12px] font-bold rounded-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="active">ACTIVE</option>
                        <option value="inactive">INACTIVE</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-400 text-[11px] font-black uppercase tracking-[0.1em]">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.1em] rounded-xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                      {editingBranch ? 'Update Branch' : 'Create Branch'}
                    </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
