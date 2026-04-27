import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Plus, Search, Filter, Edit2, Trash2, 
  Layers, Save, Loader2, X, Camera, DollarSign,
  Check, ChevronDown, LayoutGrid, List, Image as ImageIcon, Eye, Clock
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function ComboMeals() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [comboToDelete, setComboToDelete] = useState(null);
  const [editingCombo, setEditingCombo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');

  const [combos, setCombos] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    items: [],
    status: 'Published',
    isAvailable: true,
    sku: '',
    preparationTime: 20,
    trackStock: false,
    stockCount: 0,
    minStockLevel: 5
  });

  const location = useLocation();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId && combos.length > 0) {
      const comboToEdit = combos.find(c => c._id === editId);
      if (comboToEdit) {
        handleOpenModal(comboToEdit);
      }
    }
  }, [location.search, combos]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [comboRes, itemRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/combo`),
        fetch(`${import.meta.env.VITE_API_URL}/item`)
      ]);
      
      const combosData = await comboRes.json();
      const itemsData = await itemRes.json();

      if (combosData.success) {
        setCombos(combosData.data);
      } else {
        setCombos([]);
      }
      
      setAvailableItems(itemsData);
    } catch (err) {
      toast.error('Failed to sync combo data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (combo) => {
    const newStatus = combo.status === 'Published' ? 'Draft' : 'Published';
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/combo/${combo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ ...combo, status: newStatus })
      });
      if (response.ok) {
        toast.success(`Combo set to ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const handleOpenModal = (combo = null) => {
    if (combo) {
      setEditingCombo(combo);
      setFormData({
        name: combo.name,
        description: combo.description || '',
        price: combo.price,
        originalPrice: combo.originalPrice || '',
        image: combo.image || '',
        items: combo.items?.map(i => ({
          item: i.item?._id || i.item,
          variant: i.variant || '',
          quantity: i.quantity || 1
        })) || [],
        status: combo.status || 'Published',
        isAvailable: combo.isAvailable ?? true,
        sku: combo.sku || `CMB-${Date.now().toString().slice(-6)}`,
        preparationTime: combo.preparationTime || 20,
        trackStock: combo.trackStock || false,
        stockCount: combo.stockCount || 0,
        minStockLevel: combo.minStockLevel || 5
      });
    } else {
      setEditingCombo(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        image: '',
        items: [],
        status: 'Published',
        isAvailable: true,
        sku: `CMB-${Date.now().toString().slice(-6)}`,
        preparationTime: 20,
        trackStock: false,
        stockCount: 0,
        minStockLevel: 5
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Synchronizing visual...');
    const uploadData = new FormData();
    uploadData.append('profileImg', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: uploadData
      });
      const data = await response.json();
      if (response.ok) {
        setFormData({ ...formData, image: data.imageUrl });
        toast.success('Visual synchronized!', { id: toastId });
      } else {
        toast.error(data.message || 'Upload failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Sync error', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const addItemToCombo = () => {
    if (availableItems.length === 0) return toast.error('No items available');
    setFormData({
      ...formData,
      items: [...formData.items, { item: availableItems[0]._id, variant: '', quantity: 1 }]
    });
  };

  const removeItemFromCombo = (idx) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });
  };

  const updateComboItem = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Designation required');
    if (!formData.price) return toast.error('Fiscal value required');
    if (formData.items.length === 0) return toast.error('Add at least one element');

    setIsSaving(true);
    const method = editingCombo ? 'PUT' : 'POST';
    const url = editingCombo 
      ? `${import.meta.env.VITE_API_URL}/combo/${editingCombo._id}` 
      : `${import.meta.env.VITE_API_URL}/combo`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success(editingCombo ? 'Combo updated' : 'Combo initialized');
        fetchData();
        setIsModalOpen(false);
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (err) {
      toast.error('Failed to commit combo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (combo) => {
    setComboToDelete(combo);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/combo/${comboToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Combo terminated');
        fetchData();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Exclusion failed');
    }
  };

  const filteredCombos = combos
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(c => filterStatus === 'All' || c.status === filterStatus);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Combo Matrix</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Multi-Asset Assemblies & Value Bundles</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="h-12 px-8 bg-[#2C2C2C] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-black active:scale-95 transition-all outline-none"
        >
          <Plus size={16} />
          Forge New Combo
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-3 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2C2C2C] transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="FILTER CATALOGED COMBOS..."
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
        <div className="flex items-center border border-slate-100 rounded-2xl p-1 bg-slate-50">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          ><LayoutGrid size={16} /></button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          ><List size={16} /></button>
        </div>
      </div>

      {isLoading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="bg-white border border-slate-50 p-6 rounded-[2.5rem] space-y-4">
                <Skeleton className="aspect-square w-full rounded-[2rem]" />
                <Skeleton className="w-1/2 h-5" />
                <Skeleton className="w-full h-10" />
             </div>
           ))}
        </div>
      ) : filteredCombos.length === 0 ? (
        <EmptyState 
           title="No Combos Detected" 
           subtitle="Your bundle catalog is currently empty or filtered out"
           onAction={() => handleOpenModal()}
           actionLabel="Initialize First Combo"
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {filteredCombos.map((combo) => (
            viewMode === 'grid' ? (
              <motion.div 
                key={combo._id}
                whileHover={{ y: -6 }}
                className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all group relative flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-50 border-b border-slate-100">
                  <img src={combo.image || 'https://via.placeholder.com/400x400?text=Combo'} alt={combo.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md ${combo.isAvailable ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                      {combo.isAvailable ? 'Available' : 'Unavailable'}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-xl shadow-lg backdrop-blur-sm">
                    <Package size={14} />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-blue-500" />
                    <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{combo.name}</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-blue-600 leading-none">₹{combo.price}</span>
                      <span className="text-[11px] font-bold text-slate-300 line-through tracking-tighter">₹{combo.originalPrice || combo.price}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100/50">
                       <Clock size={10} className="text-slate-400" />
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{combo.preparationTime || 20}M</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{combo.sku}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{combo.items?.length || 0} Elements</span>
                  </div>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-2 leading-relaxed">
                    {combo.description}
                  </p>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-50 mt-2">
                     <Link 
                        to={`/admin/menu/combos/${combo._id}`}
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm flex-shrink-0"
                        title="Analyze Matrix"
                     >
                        <Eye size={14} />
                     </Link>
                    <button 
                      onClick={() => handleOpenModal(combo)}
                      className="flex-1 h-10 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(combo)}
                      className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex-shrink-0"
                    ><Trash2 size={14} /></button>
                    <button 
                      onClick={() => toggleStatus(combo)}
                      className={`h-10 px-3 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-100 flex-shrink-0 ${combo.status === 'Published' ? 'text-emerald-500' : 'text-slate-300'}`}
                      title={`Status: ${combo.status}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${combo.status === 'Published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : ( 
              <motion.div 
                key={combo._id}
                className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-6 group"
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img src={combo.image || 'https://via.placeholder.com/100x100?text=Combo'} alt={combo.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight whitespace-normal mb-1">{combo.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">#{combo.sku}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{combo.items?.length || 0} Elements Integrated</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right min-w-[80px]">
                    <p className="text-lg font-black text-blue-600 leading-none">₹{combo.price}</p>
                    {combo.originalPrice > combo.price && (
                       <p className="text-[9px] font-bold text-slate-400 line-through mt-0.5 tracking-tighter">₹{combo.originalPrice}</p>
                    )}
                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1 opacity-60 leading-none">#{combo.sku}</p>
                    {combo.trackStock && (
                      <p className={`text-[8px] font-black uppercase mt-1 ${combo.stockCount <= (combo.minStockLevel || 5) ? 'text-rose-500' : 'text-emerald-500'}`}>{combo.stockCount} Units</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleStatus(combo)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl hover:bg-white transition-all border border-slate-100 hover:border-slate-300 active:scale-95"
                      title={`Toggle Live Status`}
                    >
                      <div className={`w-2 h-2 rounded-full ${combo.status === 'Published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                      <span className={`text-[8px] font-black uppercase tracking-widest ${combo.status === 'Published' ? 'text-emerald-600' : 'text-slate-400'}`}>{combo.status}</span>
                    </button>
                    <Link 
                      to={`/admin/menu/combos/${combo._id}`}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                    >
                      <Eye size={16} />
                    </Link>
                    <button 
                      onClick={() => handleOpenModal(combo)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-amber-500 hover:text-white transition-all outline-none"
                    ><Edit2 size={16} /></button>
                    <button 
                      onClick={() => handleDeleteClick(combo)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all outline-none"
                    ><Trash2 size={16} /></button>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </div>
      )}

      {/* Combo Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCombo ? 'Update Combo Matrix' : 'Forge New Combo'}
        subtitle="Multi-Asset Assembly & Value Logic"
        onSubmit={handleSave}
        maxWidth="max-w-4xl"
      >
        <div className="max-h-[75vh] overflow-y-auto px-1 pr-3 thin-scrollbar space-y-8 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Visual Upload */}
            <div className="space-y-4">
               <div className="relative group mx-auto w-full aspect-square max-w-[240px]">
                  <div className="w-full h-full rounded-[3rem] border-4 border-dashed border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden relative shadow-inner">
                    {formData.image ? (
                      <>
                        <img src={formData.image} alt="Combo" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest"
                        >Modify Visual</button>
                      </>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="flex flex-col items-center gap-3 cursor-pointer text-slate-300 hover:text-blue-500 transition-all"
                      >
                         <Camera size={48} strokeWidth={1} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Link Visual Representative</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                         <Loader2 className="animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Combo Designation</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 rounded-2xl"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. MEGA FAMILY BUNDLE"
                  />
               </div>
               <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Actual Bundle Price (₹)</label>
                   <input 
                     type="number" 
                     className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-black text-slate-400 line-through outline-none rounded-2xl"
                     value={formData.originalPrice}
                     onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                     placeholder="0.00"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selling Price (₹)</label>
                   <input 
                     type="number" 
                     required
                     className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-black text-blue-600 outline-none rounded-2xl ring-2 ring-blue-500/20"
                     value={formData.price}
                     onChange={(e) => setFormData({...formData, price: e.target.value})}
                     placeholder="0.00"
                   />
                </div>
             </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Description</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 p-4 text-[10px] font-bold outline-none focus:border-blue-500/50 rounded-2xl h-24 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the assembly contents..."
                  />
               </div>
            </div>
          </div>

          {/* Elements Section */}
          <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500">
                      <Layers size={20} />
                   </div>
                   <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Integrated Elements</h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Define the assets within this bundle</p>
                   </div>
                </div>
                <button 
                  type="button"
                  onClick={addItemToCombo}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all"
                >
                  <Plus size={14} /> Add Asset
                </button>
             </div>

             <div className="space-y-4">
                {formData.items.map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-wrap md:flex-nowrap items-end gap-4 shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex-1 space-y-2 min-w-[200px]">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Item</label>
                      <select 
                        className="w-full bg-slate-50 border-none p-3 text-[10px] font-black uppercase rounded-xl"
                        value={item.item}
                        onChange={(e) => updateComboItem(idx, 'item', e.target.value)}
                      >
                        {availableItems.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div className="w-32 space-y-2">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border-none p-3 text-xs font-black rounded-xl text-center"
                        value={item.quantity}
                        onChange={(e) => updateComboItem(idx, 'quantity', e.target.value)}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeItemFromCombo(idx)}
                      className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all mb-0.5"
                    ><X size={16} /></button>
                  </div>
                ))}
                {formData.items.length === 0 && (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    No items integrated. Initialize first asset to continue.
                  </div>
                )}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preparation (Mins)</label>
                <div className="relative">
                   <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                   <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 text-sm font-black text-slate-900 outline-none rounded-2xl"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
                   />
                </div>
              </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bundle SKU</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-100 p-4 text-[10px] font-black text-slate-900 outline-none rounded-2xl uppercase"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            <div className="flex flex-col justify-end">
               <button 
                type="button"
                onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.isAvailable ? 'bg-emerald-50 border-emerald-600 text-emerald-600 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
               >
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full transition-colors ${formData.isAvailable ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{formData.isAvailable ? 'In Service' : 'Deactivated'}</span>
                  </div>
                  {formData.isAvailable && <Check size={14} />}
               </button>
            </div>
          </div>

          {/* Stock Management Component */}
          <div className="bg-[#0F172A] text-white p-8 rounded-[3rem] border border-white/5 space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                      <Package size={24} />
                   </div>
                   <div>
                      <h4 className="text-sm font-black uppercase tracking-tight">Bundle Level Inventory</h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Global assembly stock tracking</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, trackStock: false })}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${!formData.trackStock ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
                  >Manual Control</button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, trackStock: true })}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${formData.trackStock ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
                  >Auto Tracked</button>
                </div>
             </div>

             {formData.trackStock && (
               <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-top-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Assembled Units Available</label>
                     <div className="relative">
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 p-5 text-xl font-black text-white outline-none rounded-3xl focus:border-blue-500/50 transition-all"
                          value={formData.stockCount}
                          onChange={(e) => setFormData({...formData, stockCount: e.target.value})}
                          placeholder="0"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">Units</div>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Low Assembly Notification</label>
                     <div className="relative">
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 p-5 text-xl font-black text-rose-400 outline-none rounded-3xl focus:border-blue-500/50 transition-all"
                          value={formData.minStockLevel}
                          onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                          placeholder="5"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">Min</div>
                     </div>
                  </div>
               </div>
             )}
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-50">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
              <div className="flex gap-4">
                 <button 
                   type="button"
                   onClick={() => setFormData({...formData, status: 'Published'})}
                   className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border ${formData.status === 'Published' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}
                 >Published</button>
                 <button 
                    type="button"
                    onClick={() => setFormData({...formData, status: 'Draft'})}
                    className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border ${formData.status === 'Draft' ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}
                 >Draft</button>
              </div>
          </div>

          <div className="flex gap-4 pt-8 sticky bottom-0 bg-white pb-2">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
            >Discard Data</button>
            <button 
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-2 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingCombo ? 'Update Master Matrix' : 'Commit To Catalog'}
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Termination"
        subtitle="Exclude this combo from operational catalog?"
        icon={Trash2}
      >
        <form onSubmit={confirmDelete} className="space-y-6">
          <div className="p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Trash2 size={24} />
             </div>
             <div>
                <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Security Alert</p>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">This bundle will be permanently de-cataloged.</p>
             </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white shadow-sm">
                <img src={comboToDelete?.image || 'https://via.placeholder.com/100x100'} alt="" className="w-full h-full object-cover" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Target Assembly</p>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{comboToDelete?.name}</p>
             </div>
          </div>

          <div className="flex gap-3 pt-2">
             <button 
               type="button" 
               onClick={() => setIsDeleteModalOpen(false)}
               className="flex-1 py-5 bg-white border border-slate-200 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all outline-none"
             >Abort</button>
             <button 
               type="submit"
               className="flex-1 py-5 bg-rose-500 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all outline-none"
             >Terminate</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}



