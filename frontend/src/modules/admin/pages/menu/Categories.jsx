import React, { useState, useEffect, useRef } from 'react';
import { Utensils, Search, Plus, Filter, MoreVertical, Edit2, Trash2, ChevronRight, Save, Camera, Loader2, Image as ImageIcon, LayoutGrid, List, X, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import BranchSelector from '../../components/BranchSelector';

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [branches, setBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: '',
    status: 'Published',
    branchId: ''
  });

  useEffect(() => {
    fetchBranches();
    fetchCategories();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/branches`);
      const result = await response.json();
      if (result.success) {
        setBranches(result.data);
      }
    } catch (error) {
      console.error('Fetch Branches Error:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/category`);
      const data = await response.json();
      if (response.ok) {
        setCategories(data);
      }
    } catch (err) {
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ 
        name: category.name, 
        image: category.image || '', 
        description: category.description || '',
        status: category.status || 'Published',
        branchId: category.branchId || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', image: '', description: '', status: 'Published', branchId: '' });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('profileImg', file); // API expects 'profileImg' key from previous setup

    setIsUploading(true);
    const toastId = toast.loading('Uploading image...');

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
        toast.success('Image uploaded!', { id: toastId });
      } else {
        toast.error(data.message || 'Upload failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Upload error', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return toast.error('Category Name is required');
    if (!formData.image) return toast.error('Category Image is required');
    if (!formData.branchId) return toast.error('Please select a branch');

    setIsSaving(true);
    const method = editingCategory ? 'PUT' : 'POST';
    const url = editingCategory 
      ? `${import.meta.env.VITE_API_URL}/category/${editingCategory._id}` 
      : `${import.meta.env.VITE_API_URL}/category`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(editingCategory ? 'Category updated' : 'Category created');
        fetchCategories();
        setIsModalOpen(false);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (cat) => {
    setCategoryToDelete(cat);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!categoryToDelete) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/category/${categoryToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      if (response.ok) {
        toast.success('Category deleted');
        fetchCategories();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  const toggleStatus = async (category) => {
    const newStatus = category.status === 'Published' ? 'Draft' : 'Published';
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/category/${category._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ ...category, status: newStatus })
      });
      if (response.ok) {
        toast.success(`Category ${newStatus}`);
        fetchCategories();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Menu Categories</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Manage your food and drink categories</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="h-12 px-8 bg-[#2C2C2C] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-black active:scale-95 transition-all outline-none"
        >
          <Plus size={16} />
          Create New Category
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-2 flex flex-col md:flex-row items-center gap-2 shadow-sm flex-1 w-full">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2C2C2C] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search categories..."
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

          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

          {/* Branch Filter */}
          <BranchSelector 
            branches={branches}
            selectedBranch={selectedBranchFilter}
            onSelect={setSelectedBranchFilter}
          />

          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-2xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-[#2C2C2C] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-[#2C2C2C] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            viewMode === 'grid' ? (
              <div key={i} className="bg-white border border-slate-50 p-5 rounded-[2.5rem] space-y-4">
                <Skeleton className="w-full h-40" />
                <Skeleton className="w-2/3 h-5" />
                <Skeleton className="w-full h-10" />
                <div className="flex justify-between pt-2">
                   <div className="flex gap-2"><Skeleton className="w-10 h-10 rounded-xl" /> <Skeleton className="w-10 h-10 rounded-xl" /></div>
                   <Skeleton className="w-16 h-4" />
                </div>
              </div>
            ) : (
              <div key={i} className="bg-white border border-slate-50 p-4 rounded-3xl flex items-center gap-6">
                <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                   <Skeleton className="w-1/4 h-4" />
                   <Skeleton className="w-1/2 h-3" />
                </div>
                <Skeleton className="w-24 h-8 rounded-full" />
                <div className="flex gap-2"><Skeleton className="w-10 h-10 rounded-xl" /> <Skeleton className="w-10 h-10 rounded-xl" /></div>
              </div>
            )
          ))}
        </div>
      ) : (
        <>
          {categories
            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(c => filterStatus === 'All' || c.status === filterStatus)
            .filter(c => {
              if (selectedBranchFilter === 'all') return true;
              const branchId = typeof c.branchId === 'object' ? c.branchId?._id : c.branchId;
              return branchId === selectedBranchFilter;
            }).length === 0 ? (
            <EmptyState 
              title="No Categories Cataloged" 
              subtitle="Initialize your menu with new item classifications"
              onAction={() => handleOpenModal()}
              actionLabel="Append Category"
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .filter(c => filterStatus === 'All' || c.status === filterStatus)
                .filter(c => {
                  if (selectedBranchFilter === 'all') return true;
                  const branchId = typeof c.branchId === 'object' ? c.branchId?._id : c.branchId;
                  return branchId === selectedBranchFilter;
                })
                .map((cat) => (
                <motion.div 
                  key={cat._id}
                  whileHover={{ y: -6 }}
                  className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-xl hover:shadow-2xl hover:border-amber-200 transition-all group relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="w-full h-40 bg-slate-100 rounded-2xl mb-4 overflow-hidden relative border border-slate-50 shadow-inner">
                      {cat.image ? (
                        <img 
                          src={cat.image.startsWith('http') ? cat.image : `${import.meta.env.VITE_API_URL.replace('/api', '')}/${cat.image}`} 
                          alt={cat.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <button 
                          onClick={() => toggleStatus(cat)}
                          className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg transition-all ${cat.status === 'Published' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white opacity-90'}`}
                        >
                          {cat.status}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{cat.name}</h3>
                      <div className="bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-blue-100">
                        <Utensils size={10} className="text-blue-500" />
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{cat.itemCount || 0} Items</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-2 h-8">
                      {cat.description || 'No description provided'}
                    </p>
                    
                     <div className="mt-4 pt-4 border-t border-stone-50 flex items-center justify-center gap-3">
                        <button 
                           onClick={() => handleOpenModal(cat)}
                           className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                           title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                           onClick={() => handleDelete(cat)}
                           className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                           title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                           onClick={() => toggleStatus(cat)}
                           className={`w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-100 shadow-sm ${cat.status === 'Published' ? 'text-emerald-500' : 'text-slate-300'}`}
                           title={`Status: ${cat.status}`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${cat.status === 'Published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                        </button>
                     </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
               {categories
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .filter(c => filterStatus === 'All' || c.status === filterStatus)
                .filter(c => {
                  if (selectedBranchFilter === 'all') return true;
                  const branchId = typeof c.branchId === 'object' ? c.branchId?._id : c.branchId;
                  return branchId === selectedBranchFilter;
                })
                .map((cat) => (
                  <motion.div 
                    key={cat._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-6 group"
                  >
                     <div className="flex items-center gap-6 flex-1">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                           {cat.image ? (
                             <img 
                               src={cat.image.startsWith('http') ? cat.image : `${import.meta.env.VITE_API_URL.replace('/api', '')}/${cat.image}`} 
                               alt={cat.name} 
                               className="w-full h-full object-cover" 
                             />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-200">
                               <ImageIcon size={20} />
                             </div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{cat.name}</h3>
                              <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-widest">{cat.itemCount || 0} Assets</span>
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-md">
                             {cat.description || 'No description provided'}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-8">
                        <button 
                          onClick={() => toggleStatus(cat)}
                          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${cat.status === 'Published' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                        >
                          {cat.status}
                        </button>

                         <div className="flex gap-3">
                            <button 
                               onClick={() => handleOpenModal(cat)}
                               className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-amber-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm"
                               title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                               onClick={() => handleDelete(cat)}
                               className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm"
                               title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button 
                               onClick={() => toggleStatus(cat)}
                               className={`w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-100 shadow-sm ${cat.status === 'Published' ? 'text-emerald-500' : 'text-slate-300'}`}
                               title={`Status: ${cat.status}`}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full ${cat.status === 'Published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                            </button>
                         </div>
                     </div>
                  </motion.div>
                ))}
            </div>
          )}
        </>

      )}

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        subtitle="Configure your menu organization"
        onSubmit={handleSave}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 py-2">
             <div className="relative group">
                <div className="w-40 h-40 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shadow-inner relative">
                   {formData.image ? (
                     <>
                       <img src={formData.image} alt="Category" className="w-full h-full object-cover" />
                       <button 
                         type="button" 
                         onClick={() => setFormData({...formData, image: ''})}
                         className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg shadow-lg hover:bg-rose-600 transition-all z-20"
                       >
                         <X size={12} />
                       </button>
                     </>
                   ) : (
                     <ImageIcon size={48} className="text-slate-200" />
                   )}
                   {isUploading && (
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                        <Loader2 className="animate-spin text-white" />
                     </div>
                   )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                <button 
                  type="button"
                  disabled={isUploading}
                  className="absolute -bottom-2 -right-2 p-3 bg-amber-500 text-stone-900 rounded-2xl shadow-xl hover:scale-110 transition-all border-4 border-white disabled:opacity-50"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Camera size={20} />
                </button>
             </div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category Banner Image</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/50 rounded-2xl"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Starters"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/50 rounded-2xl h-24 resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of this category..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Branch</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2C2C2C] transition-colors" size={16} />
                <select 
                  required
                  className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 text-[11px] font-bold outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/50 rounded-2xl appearance-none cursor-pointer"
                  value={formData.branchId}
                  onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b._id} value={b._id}>{b.branchName}</option>
                  ))}
                </select>
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

          <button 
            type="submit"
            disabled={isSaving || isUploading}
            className="w-full bg-[#2C2C2C] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {editingCategory ? 'Update Category' : 'Create Category'}</>}
          </button>
        </div>
      </AdminModal>

      {/* Custom Delete Modal */}
      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        subtitle="Are you sure you want to remove this category?"
        icon={Trash2}
      >
        <form onSubmit={confirmDelete} className="space-y-6">
          <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Trash2 size={24} />
             </div>
             <div>
                <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Warning</p>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">This action cannot be undone.</p>
             </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Target Category</p>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200">
                   <img src={categoryToDelete?.image} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{categoryToDelete?.name}</p>
             </div>
          </div>

          <div className="flex gap-3">
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
        </form>
      </AdminModal>
    </div>
  );
}



