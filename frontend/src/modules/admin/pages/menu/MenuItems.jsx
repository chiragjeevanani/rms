import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Filter, LayoutGrid, List, Leaf, 
  Flame, Edit2, Trash2, Tag, Save, Image as ImageIcon, 
  Loader2, X, Camera, Clock, DollarSign, Package,
  ChefHat, Star, Check, ChevronDown, ChevronUp, Sliders, Eye
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function MenuItems() {
  const [viewMode, setViewMode] = useState('grid');
// ...
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');

  const [categories, setCategories] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [items, setItems] = useState([]);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: '',
    description: '',
    image: '',
    foodType: 'Veg',
    cuisineType: '',
    hasVariants: false,
    basePrice: '',
    originalPrice: '',
    variants: [],
    tax: 5,
    modifiers: [],
    isAvailable: true,
    preparationTime: 20,
    sku: '',
    tags: [],
    isFeatured: false,
    status: 'Published',
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
    if (editId && items.length > 0) {
      const itemToEdit = items.find(i => i._id === editId);
      if (itemToEdit) {
        handleOpenModal(itemToEdit);
      }
    }
  }, [location.search, items]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catRes, modRes, itemRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/category`),
        fetch(`${import.meta.env.VITE_API_URL}/modifier`),
        fetch(`${import.meta.env.VITE_API_URL}/item`)
      ]);
      
      const [cats, mods, its] = await Promise.all([
        catRes.json(), modRes.json(), itemRes.json()
      ]);

      setCategories(cats);
      setModifierGroups(mods);
      setItems(its);
      
      // Select first category by default for new items
      if (cats.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: cats[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to sync master data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        category: item.category?._id || item.category,
        modifiers: item.modifiers?.map(m => m._id) || [],
        trackStock: item.trackStock || false,
        stockCount: item.stockCount || 0,
        minStockLevel: item.minStockLevel || 5
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: categories[0]?._id || '',
        subCategory: '',
        description: '',
        image: '',
        foodType: 'Veg',
        cuisineType: '',
        hasVariants: false,
        basePrice: '',
        variants: [],
        tax: 5,
        modifiers: [],
        isAvailable: true,
        preparationTime: 20,
        sku: `ITM-${Date.now().toString().slice(-6)}`,
        tags: [],
        isFeatured: false,
        status: 'Published',
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

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: '', price: '', sku: '', isDefault: false }]
    });
  };

  const removeVariant = (idx) => {
    setFormData({ ...formData, variants: formData.variants.filter((_, i) => i !== idx) });
  };

  const updateVariant = (idx, field, value) => {
    const newVariants = [...formData.variants];
    if (field === 'isDefault' && value === true) {
      newVariants.forEach((v, i) => v.isDefault = i === idx);
    } else {
      newVariants[idx][field] = value;
    }
    setFormData({ ...formData, variants: newVariants });
  };

  const toggleModifier = (modId) => {
    const current = formData.modifiers;
    if (current.includes(modId)) {
      setFormData({ ...formData, modifiers: current.filter(id => id !== modId) });
    } else {
      setFormData({ ...formData, modifiers: [...current, modId] });
    }
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === 'Published' ? 'Draft' : 'Published';
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/item/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ ...item, status: newStatus })
      });
      if (response.ok) {
        toast.success(`Item set to ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Item name required');
    if (!formData.image) return toast.error('Item image required');
    if (!formData.hasVariants && !formData.basePrice) return toast.error('Price required');
    if (formData.hasVariants && formData.variants.length === 0) return toast.error('Add at least one variant');

    setIsSaving(true);
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem 
      ? `${import.meta.env.VITE_API_URL}/item/${editingItem._id}` 
      : `${import.meta.env.VITE_API_URL}/item`;

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
        toast.success(editingItem ? 'Item updated' : 'Item created');
        fetchData();
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to commit item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/item/${itemToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
      });
      if (response.ok) {
        toast.success('Item terminated');
        fetchData();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filteredItems = items
    .filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(i => filterStatus === 'All' || i.status === filterStatus);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Menu Catalog</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Manage items, variants, and modifiers</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="h-12 px-8 bg-[#2C2C2C] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-black active:scale-95 transition-all outline-none"
        >
          <Plus size={16} />
          Create New Item
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-3 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2C2C2C] transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search catalog by name or SKU..."
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
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
            viewMode === 'grid' ? (
              <div key={i} className="bg-white border border-slate-50 p-6 rounded-[2.5rem] space-y-4">
                 <Skeleton className="aspect-square w-full rounded-[2rem]" />
                 <div className="flex justify-between items-start">
                    <Skeleton className="w-1/2 h-5" />
                    <Skeleton className="w-12 h-4" />
                 </div>
                 <Skeleton className="w-full h-8" />
                 <div className="flex gap-2 pt-4">
                    <Skeleton className="flex-1 h-10 rounded-xl" />
                    <Skeleton className="w-10 h-10 rounded-xl" />
                 </div>
              </div>
            ) : (
              <div key={i} className="bg-white border border-slate-50 p-4 rounded-3xl flex items-center justify-between gap-6">
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-1/3 h-4" />
                    <Skeleton className="w-1/4 h-3" />
                  </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="text-right space-y-2">
                      <Skeleton className="w-16 h-4 px-0 ml-auto" />
                      <Skeleton className="w-12 h-3 ml-auto" />
                   </div>
                   <div className="flex gap-2">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <Skeleton className="w-10 h-10 rounded-xl" />
                   </div>
                </div>
              </div>
            )
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState 
           title="No Items Discovered" 
           subtitle="Your menu catalog is currently empty or filtered out"
           onAction={() => handleOpenModal()}
           actionLabel="Add First Item"
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>

          {filteredItems.map((item) => (
            viewMode === 'grid' ? (
              <motion.div 
                key={item._id}
                whileHover={{ y: -6 }}
                className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all group relative flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-50 border-b border-slate-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md ${item.foodType === 'Veg' ? 'bg-emerald-500/90' : item.foodType === 'Non-Veg' ? 'bg-rose-500/90' : 'bg-amber-500/90'}`}>
                      <div className="w-3 h-3 rounded-full border-2 border-white" />
                    </div>
                  </div>
                  {item.isFeatured && (
                    <div className="absolute top-4 right-4 bg-amber-400 text-white p-2 rounded-xl shadow-lg ring-4 ring-amber-400/20">
                      <Star size={14} fill="white" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                     <p className="text-[10px] font-black text-white uppercase tracking-widest">{item.category?.name}</p>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.foodType === 'Veg' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`} />
                    <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{item.name}</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-[#2C2C2C] leading-none">
                        ₹{item.hasVariants ? item.variants.find(v => v.isDefault)?.price : item.basePrice}
                      </span>
                      <span className="text-[11px] font-bold text-slate-300 line-through tracking-tighter">
                        ₹{item.hasVariants ? item.variants.find(v => v.isDefault)?.originalPrice : item.originalPrice}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100/50">
                      <Clock size={10} className="text-slate-400" />
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.preparationTime || 20}M</span>
                    </div>
                  </div>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-50 mt-2">
                    <Link 
                      to={`/admin/menu/items/${item._id}`}
                      className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm flex-shrink-0"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </Link>
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="flex-1 h-10 bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(item)}
                      className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex-shrink-0"
                    ><Trash2 size={14} /></button>
                    <button 
                      onClick={() => toggleStatus(item)}
                      className={`h-10 px-3 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-100 flex-shrink-0 ${item.status === 'Published' ? 'text-emerald-500' : 'text-slate-300'}`}
                      title={`Status: ${item.status}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${item.status === 'Published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key={item._id}
                className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-6 group"
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${item.foodType === 'Veg' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight whitespace-normal">{item.name}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">#{item.sku}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.category?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right min-w-[100px]">
                    <div className="flex items-center justify-end gap-1 mb-1 opacity-60">
                       <Clock size={10} />
                       <span className="text-[10px] font-black uppercase tracking-widest">{item.preparationTime || 20}m</span>
                    </div>
                    <p className="text-lg font-black text-[#2C2C2C] leading-none">
                      ₹{item.hasVariants ? Math.min(...item.variants.map(v => v.price)) : item.basePrice}
                    </p>
                    {((item.hasVariants ? Math.min(...item.variants.map(v => v.originalPrice || 0)) : item.originalPrice) || 0) > (item.hasVariants ? Math.min(...item.variants.map(v => v.price)) : item.basePrice) && (
                      <p className="text-[9px] font-bold text-slate-400 line-through mt-0.5 tracking-tighter">
                         ₹{item.hasVariants ? Math.min(...item.variants.map(v => v.originalPrice)) : item.originalPrice}
                      </p>
                    )}
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60 leading-none">{item.modifiers?.length || 0} Modifiers</p>
                    {item.trackStock && (
                      <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${item.stockCount <= (item.minStockLevel || 5) ? 'text-rose-500' : 'text-emerald-500'}`}>{item.stockCount} In Stock</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleStatus(item)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl hover:bg-white transition-all border border-slate-100 hover:border-slate-300 active:scale-95"
                      title={`Toggle Live Status`}
                    >
                      <div className={`w-2 h-2 rounded-full ${item.status === 'Published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                      <span className={`text-[8px] font-black uppercase tracking-widest ${item.status === 'Published' ? 'text-emerald-600' : 'text-slate-400'}`}>{item.status}</span>
                    </button>
                    <Link 
                      to={`/admin/menu/items/${item._id}`}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                    >
                      <Eye size={16} />
                    </Link>
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-amber-500 hover:text-white transition-all"
                    ><Edit2 size={16} /></button>
                    <button 
                      onClick={() => handleDeleteClick(item)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                    ><Trash2 size={16} /></button>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </div>
      )}

      {/* Item Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Item Details' : 'Design New Item'}
        subtitle="Catalog & Pricing Matrix"
        onSubmit={handleSave}
        maxWidth="max-w-4xl"
      >
        <div className="max-h-[75vh] overflow-y-auto px-1 pr-3 thin-scrollbar space-y-8 pb-4">
          {/* Section 1: Visual & Basic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div className="relative group mx-auto w-full aspect-square max-w-[240px]">
                  <div className="w-full h-full rounded-[3rem] border-4 border-dashed border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden relative shadow-inner">
                    {formData.image ? (
                      <>
                        <img src={formData.image} alt="Item" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest"
                        >Change Image</button>
                      </>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="flex flex-col items-center gap-3 cursor-pointer text-slate-300 hover:text-amber-500 transition-all"
                      >
                         <Camera size={48} strokeWidth={1} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Synchronize Visual</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                         <Loader2 className="animate-spin text-amber-500" />
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/50 rounded-2xl"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Dynamite Burger"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 p-4 text-[10px] font-black uppercase outline-none focus:border-amber-500/50 rounded-2xl"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Food Type</label>
                    <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                      {['Veg', 'Non-Veg', 'Egg'].map(type => (
                        <button 
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, foodType: type })}
                          className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${formData.foodType === type ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                        >{type}</button>
                      ))}
                    </div>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 p-4 text-[10px] font-bold outline-none focus:border-amber-500/50 rounded-2xl h-24 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the flavors..."
                  />
               </div>
            </div>
          </div>

          {/* Section 2: Pricing Strategy */}
          <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500">
                      <DollarSign size={20} />
                   </div>
                   <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Pricing Strategy</h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Base price or Variant matrix</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, hasVariants: false })}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${!formData.hasVariants ? 'bg-[#2C2C2C] text-white shadow-lg' : 'text-slate-400'}`}
                  >Simple</button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, hasVariants: true })}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${formData.hasVariants ? 'bg-[#2C2C2C] text-white shadow-lg' : 'text-slate-400'}`}
                  >Variant</button>
                </div>
             </div>

             {!formData.hasVariants ? (
               <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Actual Price (₹)</label>
                          <input 
                            type="number"
                            className="w-full bg-white border border-slate-100 p-4 text-sm font-black text-slate-400 line-through outline-none rounded-2xl shadow-sm"
                            value={formData.originalPrice}
                            onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                            placeholder="0.00"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selling Price (₹)</label>
                          <input 
                            type="number"
                            className="w-full bg-white border border-slate-100 p-4 text-sm font-black text-emerald-600 outline-none rounded-2xl shadow-sm ring-2 ring-emerald-500/20"
                            value={formData.basePrice}
                            onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                            placeholder="0.00"
                          />
                       </div>
                    </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax (%)</label>
                    <input 
                      type="number"
                      className="w-full bg-white border border-slate-100 p-4 text-sm font-black text-slate-900 outline-none rounded-2xl shadow-sm"
                      value={formData.tax}
                      onChange={(e) => setFormData({...formData, tax: e.target.value})}
                      placeholder="5"
                    />
                  </div>
               </div>
             ) : (
               <div className="space-y-4 animate-in slide-in-from-top-4">
                  <div className="overflow-hidden border border-slate-100 rounded-2xl">
                     <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-100">
                           <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="px-4 py-3">Variant (Size/Type)</th>
                              <th className="px-4 py-3">Actual (₹)</th>
                              <th className="px-4 py-3">Selling (₹)</th>
                              <th className="px-4 py-3 w-32">SKU</th>
                              <th className="px-4 py-3 text-center">Default</th>
                              <th className="px-4 py-3"></th>
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50 text-xs font-bold text-slate-700">
                           {formData.variants.map((v, i) => (
                             <tr key={i}>
                                <td className="px-2 py-2">
                                   <input className="w-full bg-slate-50 border-none p-2 rounded-lg text-xs font-black uppercase" placeholder="e.g. Large" value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} />
                                </td>
                                <td className="px-2 py-2">
                                   <input type="number" className="w-20 bg-slate-50 border-none p-2 rounded-lg text-xs font-bold text-slate-400 line-through" placeholder="0" value={v.originalPrice} onChange={(e) => updateVariant(i, 'originalPrice', e.target.value)} />
                                </td>
                                <td className="px-2 py-2">
                                   <input type="number" className="w-20 bg-slate-50 border-none p-2 rounded-lg text-xs font-black text-emerald-600" placeholder="0" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} />
                                </td>
                                <td className="px-2 py-2">
                                   <input className="w-full bg-slate-50 border-none p-2 rounded-lg text-[10px] font-bold" placeholder="AUTO" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} />
                                </td>
                                <td className="px-2 py-2 text-center">
                                   <button type="button" onClick={() => updateVariant(i, 'isDefault', !v.isDefault)} className={`w-6 h-6 rounded-lg inline-flex items-center justify-center transition-all ${v.isDefault ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-200'}`}>
                                      <Check size={12} />
                                   </button>
                                </td>
                                <td className="px-2 py-2">
                                   <button type="button" onClick={() => removeVariant(i)} className="text-slate-200 hover:text-rose-500 p-1"><X size={14} /></button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                     {formData.variants.length === 0 && <div className="p-10 text-center bg-white text-[10px] font-black text-slate-300 uppercase tracking-widest">No variants defined</div>}
                  </div>
                  <button type="button" onClick={addVariant} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-amber-200 hover:text-amber-500 transition-all flex items-center justify-center gap-2">
                     <Plus size={14} /> Add New Variant Row
                  </button>
               </div>
             )}
          </div>

          {/* Section 3: Modifiers Attachment */}
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-[#2C2C2C] rounded-2xl text-white">
                   <Sliders size={20} />
                </div>
                <div>
                   <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Attached Modifiers</h4>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Select groups for customizations</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {modifierGroups.map((mod) => (
                  <button 
                    key={mod._id}
                    type="button"
                    onClick={() => toggleModifier(mod._id)}
                    className={`p-4 rounded-3xl border-2 text-left transition-all relative overflow-hidden ${formData.modifiers.includes(mod._id) ? 'border-amber-500 bg-amber-50/50 shadow-lg shadow-amber-500/5' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                     <p className={`text-[10px] font-black uppercase tracking-tight ${formData.modifiers.includes(mod._id) ? 'text-amber-900' : 'text-slate-900'}`}>{mod.name}</p>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{mod.options.length} Options</p>
                     {formData.modifiers.includes(mod._id) && (
                       <div className="absolute top-2 right-2 text-amber-500"><Check size={14} /></div>
                     )}
                  </button>
                ))}
             </div>
          </div>

          {/* Section 4: Settings & Metadata */}
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock SKU</label>
                <div className="relative">
                   <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                   <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 text-[10px] font-black text-slate-900 outline-none rounded-2xl uppercase"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                   />
                </div>
              </div>
              <div className="flex flex-col justify-end gap-3 pb-1">
                 <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.isFeatured ? 'bg-amber-400 border-amber-500 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                 >
                    <div className="flex items-center gap-2">
                       <Star size={16} fill={formData.isFeatured ? "white" : "none"} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Featured</span>
                    </div>
                    {formData.isFeatured && <Check size={14} />}
                 </button>
              </div>
          </div>

          {/* Section 4: Stock Management */}
          <div className="bg-slate-900 text-white p-8 rounded-[3rem] space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-white/10 rounded-2xl text-amber-500">
                      <Package size={20} />
                   </div>
                   <div>
                      <h4 className="text-xs font-black uppercase tracking-tight">Inventory Control</h4>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Manage real-time availability</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, trackStock: false })}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${!formData.trackStock ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                  >Manual</button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, trackStock: true })}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${formData.trackStock ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                  >Tracked</button>
                </div>
             </div>

             {formData.trackStock && (
               <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Stock Level</label>
                     <input 
                       type="number"
                       className="w-full bg-white/5 border border-white/10 p-4 text-sm font-black text-white outline-none rounded-2xl focus:border-amber-500/50"
                       value={formData.stockCount}
                       onChange={(e) => setFormData({...formData, stockCount: e.target.value})}
                       placeholder="0"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Low Stock Alert Level</label>
                     <input 
                       type="number"
                       className="w-full bg-white/5 border border-white/10 p-4 text-sm font-black text-rose-500 outline-none rounded-2xl focus:border-amber-500/50"
                       value={formData.minStockLevel}
                       onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                       placeholder="5"
                     />
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

          {/* Action Footer */}
          <div className="flex gap-4 pt-8 sticky bottom-0 bg-white pb-2">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
            >Discard Changes</button>
            <button 
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-2 py-5 bg-[#2C2C2C] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingItem ? 'Update Master Record' : 'Commit To Catalog'}
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Exclusion"
        subtitle="Remove this item from operational catalog?"
        icon={Trash2}
      >
        <form onSubmit={confirmDelete} className="space-y-6">
          <div className="p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Trash2 size={24} />
             </div>
             <div>
                <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Warning</p>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">This item will be archived permanently.</p>
             </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white shadow-sm">
                <img src={itemToDelete?.image} alt="" className="w-full h-full object-cover" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Target Item</p>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{itemToDelete?.name}</p>
             </div>
          </div>

          <div className="flex gap-3 pt-2">
             <button 
               type="button" 
               onClick={() => setIsDeleteModalOpen(false)}
               className="flex-1 py-5 bg-white border border-slate-200 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all outline-none"
             >No, Retain</button>
             <button 
               type="submit"
               className="flex-1 py-5 bg-rose-500 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all outline-none"
             >Yes, Exclude</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}



