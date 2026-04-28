import React, { useState, useEffect } from 'react';
import { 
  Sliders, Plus, Search, Filter, Edit2, Trash2, 
  Save, Check, X, ChevronRight, Hash, DollarSign,
  ToggleLeft, ToggleRight, List, Loader2, Building2
} from 'lucide-react';
import BranchSelector from '../../components/BranchSelector';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function Modifiers() {
  const [modifiers, setModifiers] = useState([]);
// ...
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingModifier, setEditingModifier] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [branches, setBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    selectionType: 'Single',
    isRequired: false,
    minSelection: 1,
    maxSelection: 1,
    options: [{ name: '', price: 0, isDefault: false }],
    status: 'Published',
    branchId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [modRes, brsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/modifier`),
        fetch(`${import.meta.env.VITE_API_URL}/branches`)
      ]);
      const mods = await modRes.json();
      const brs = await brsRes.json();
      if (modRes.ok) setModifiers(mods);
      if (brs.success) setBranches(brs.data);
    } catch (err) {
      toast.error('Failed to fetch modifiers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (mod = null) => {
    if (mod) {
      setEditingModifier(mod);
      setFormData({
        name: mod.name,
        selectionType: mod.selectionType,
        isRequired: mod.isRequired,
        minSelection: mod.minSelection,
        maxSelection: mod.maxSelection || 1,
        options: mod.options.length > 0 ? mod.options : [{ name: '', price: 0, isDefault: false }],
        status: mod.status || 'Published',
        branchId: mod.branchId || ''
      });
    } else {
      setEditingModifier(null);
      setFormData({
        name: '',
        selectionType: 'Single',
        isRequired: false,
        minSelection: 1,
        maxSelection: 1,
        options: [{ name: '', price: 0, isDefault: false }],
        status: 'Published',
        branchId: ''
      });
    }
    setIsModalOpen(true);
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { name: '', price: 0, isDefault: false }]
    });
  };

  const removeOption = (index) => {
    if (formData.options.length === 1) return;
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...formData.options];
    if (field === 'isDefault' && formData.selectionType === 'Single' && value === true) {
      // Uncheck others if single select
      newOptions.forEach((opt, i) => opt.isDefault = i === index);
    } else {
      newOptions[index][field] = value;
    }
    setFormData({ ...formData, options: newOptions });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Group name is required');
    if (!formData.branchId) return toast.error('Please select a branch');
    if (formData.options.some(opt => !opt.name.trim())) return toast.error('All options must have a name');

    setIsSaving(true);
    const method = editingModifier ? 'PUT' : 'POST';
    const url = editingModifier 
      ? `${import.meta.env.VITE_API_URL}/modifier/${editingModifier._id}` 
      : `${import.meta.env.VITE_API_URL}/modifier`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success(editingModifier ? 'Modifier updated' : 'Modifier created');
        fetchData();
        setIsModalOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (err) {
      toast.error('Failed to save modifier');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (mod) => {
    setItemToDelete(mod);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!itemToDelete) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/modifier/${itemToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
      });
      if (response.ok) {
        toast.success('Modifier deleted');
        fetchData();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const toggleStatus = async (mod) => {
    const newStatus = mod.status === 'Published' ? 'Draft' : 'Published';
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/modifier/${mod._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ ...mod, status: newStatus })
      });
      if (response.ok) {
        toast.success(`Modifier set to ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Status sync failed');
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Modifier Groups</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Configure sizes, add-ons, and special instructions</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="h-12 px-8 bg-[#2C2C2C] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-black active:scale-95 transition-all outline-none"
        >
          <Plus size={16} />
          Create New Group
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-3 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2C2C2C] transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search groups..."
            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-2xl w-full md:w-auto">
          {['All', 'Published', 'Draft'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-[#2C2C2C] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="h-8 w-px bg-slate-100 hidden md:block" />

        {/* Branch Filter */}
        <BranchSelector 
          branches={branches}
          selectedBranch={selectedBranchFilter}
          onSelect={setSelectedBranchFilter}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
             <div key={i} className="bg-white border border-slate-50 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex justify-between">
                   <Skeleton className="w-16 h-4" />
                   <Skeleton className="w-16 h-4" />
                </div>
                <Skeleton className="w-1/2 h-5" />
                <div className="space-y-2">
                   <Skeleton className="w-full h-8" />
                   <Skeleton className="w-full h-8" />
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-50">
                   <div className="flex gap-2"><Skeleton className="w-10 h-10 rounded-xl" /> <Skeleton className="w-10 h-10 rounded-xl" /></div>
                   <Skeleton className="w-12 h-4" />
                </div>
             </div>
          ))}
        </div>
      ) : modifiers
          .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .filter(m => filterStatus === 'All' || m.status === filterStatus)
          .filter(m => {
            if (selectedBranchFilter === 'all') return true;
            const branchId = typeof m.branchId === 'object' ? m.branchId?._id : m.branchId;
            return branchId === selectedBranchFilter;
          }).length === 0 ? (
        <EmptyState 
           title="No Customizations Defined" 
           subtitle="Customize your menu items with modifier groups"
           onAction={() => handleOpenModal()}
           actionLabel="Add Modifier Group"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {modifiers
            .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(m => filterStatus === 'All' || m.status === filterStatus)
            .filter(m => {
              if (selectedBranchFilter === 'all') return true;
              const branchId = typeof m.branchId === 'object' ? m.branchId?._id : m.branchId;
              return branchId === selectedBranchFilter;
            })
            .map((mod) => (
            <motion.div 
              key={mod._id}
              whileHover={{ y: -6 }}
              className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all group relative border-amber-50 flex flex-col min-h-[290px]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${mod.selectionType === 'Single' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {mod.selectionType} Choice
                </div>
                {mod.isRequired && (
                  <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                    Compulsory
                  </div>
                )}
              </div>

              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">{mod.name}</h3>
              
              <div className="space-y-2 mb-6">
                {mod.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-600 uppercase">
                    <div className="flex items-center gap-2">
                      {opt.isDefault && <Check size={12} className="text-green-500" />}
                      <span>{opt.name}</span>
                    </div>
                    <span>{opt.price > 0 ? `+₹${opt.price}` : 'Free'}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center gap-2 mt-auto">
                <button 
                  onClick={() => handleOpenModal(mod)}
                  className="flex-1 h-10 bg-slate-50 text-slate-600 text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                   <Edit2 size={12} />
                   Edit
                </button>
                <button 
                  onClick={() => handleDeleteClick(mod)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex-shrink-0"
                ><Trash2 size={14} /></button>

                <button 
                  onClick={() => toggleStatus(mod)}
                  className={`w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-100 shadow-sm flex-shrink-0 ${mod.status === 'Published' ? 'text-emerald-500' : 'text-slate-300'}`}
                  title={`Status: ${mod.status}`}
                >
                   <div className={`w-2.5 h-2.5 rounded-full ${mod.status === 'Published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModifier ? 'Edit Modifier Group' : 'New Modifier Group'}
        subtitle="Configure selection rules and options"
        onSubmit={handleSave}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 pr-2 thin-scrollbar">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Group Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/50 rounded-2xl"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Extra Toppings"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selection Type</label>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, selectionType: 'Single'})}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${formData.selectionType === 'Single' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                  >Single</button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, selectionType: 'Multiple'})}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${formData.selectionType === 'Multiple' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                  >Multiple</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 p-4 text-[10px] font-black uppercase outline-none focus:border-amber-500/50 rounded-2xl"
                  value={formData.branchId}
                  required
                  onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.branchName}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Compulsory?</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl h-[52px]">
                   <button 
                     type="button"
                     onClick={() => setFormData({...formData, isRequired: !formData.isRequired})}
                     className={`relative w-10 h-6 rounded-full transition-colors ${formData.isRequired ? 'bg-emerald-500' : 'bg-slate-200'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isRequired ? 'left-5' : 'left-1'}`} />
                   </button>
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{formData.isRequired ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, status: 'Published'})}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.status === 'Published' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >Published</button>
                  <button 
                     type="button"
                     onClick={() => setFormData({...formData, status: 'Draft'})}
                     className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.status === 'Draft' ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >Draft</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Options List</label>
                <button 
                  type="button" 
                  onClick={addOption}
                  className="flex items-center gap-1.5 text-amber-600 text-[10px] font-black uppercase hover:text-amber-700"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-50 rounded-2xl group animate-in slide-in-from-right-2 duration-300">
                    <div className="flex-1">
                      <input 
                        type="text"
                        className="w-full bg-transparent border-none p-0 text-[11px] font-black text-slate-700 placeholder:text-slate-300 outline-none"
                        placeholder="Option Name (e.g. Cheese)"
                        value={opt.name}
                        onChange={(e) => updateOption(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">₹</span>
                        <input 
                          type="number"
                          className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-5 pr-2 text-[11px] font-black text-slate-700 outline-none focus:border-amber-500/50"
                          value={opt.price}
                          onChange={(e) => updateOption(idx, 'price', e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => updateOption(idx, 'isDefault', !opt.isDefault)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${opt.isDefault ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'}`}
                      title={opt.isDefault ? "Default Option" : "Set as Default"}
                    >
                      <Check size={12} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => removeOption(idx)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-300 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
            >Cancel</button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-2 py-4 bg-[#2C2C2C] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editingModifier ? 'Update Group' : 'Create Group'}
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        subtitle="Remove this modifier group?"
        onSubmit={confirmDelete}
      >
        <div className="space-y-6">
          <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Trash2 size={24} />
             </div>
             <div>
                <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Warning</p>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">This will un-link from all items.</p>
             </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Group to Delete</p>
             <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{itemToDelete?.name}</p>
          </div>

          <div className="flex gap-3 pt-2">
             <button 
               type="button" 
               onClick={() => setIsDeleteModalOpen(false)}
               className="flex-1 py-5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all outline-none"
             >No, Keep it</button>
             <button 
               type="submit"
               className="flex-1 py-5 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all outline-none"
             >Yes, Delete</button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}



