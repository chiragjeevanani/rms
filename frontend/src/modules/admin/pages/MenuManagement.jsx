
import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Edit3, Trash2, 
  ChevronRight, LayoutGrid, List, Utensils,
  Tag, Image as ImageIcon, CheckCircle2,
  X, Save, AlertCircle, Leaf, Flame, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { POS_CATEGORIES, POS_MENU_ITEMS as INITIAL_ITEMS } from '../../pos/data/posMenu';
import { playClickSound } from '../../pos/utils/sounds';

export default function MenuManagement() {
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'categories'
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [categories, setCategories] = useState(POS_CATEGORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    catId: 1,
    price: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    code: '',
    shortcut: '',
    isVeg: true,
    spiceLevel: 0,
    prepTime: '15 MINS'
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: 'Soup'
  });

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.includes(searchQuery) ||
    item.shortcut.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        catId: 1,
        price: '',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
        code: `ITEM-${items.length + 100}`,
        shortcut: '',
        isVeg: true,
        spiceLevel: 0,
        prepTime: '15 MINS'
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData(category);
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        icon: 'Soup'
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...categoryFormData, id: c.id } : c));
    } else {
      setCategories([...categories, { ...categoryFormData, id: `cat${categories.length + 1}` }]);
    }
    handleCloseCategoryModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...formData, id: i.id } : i));
    } else {
      setItems([...items, { ...formData, id: Date.now() }]);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('PROTOCOL: Proceed with record termination? This action is immutable.')) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative min-h-full no-scrollbar">
      {/* Header Module */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Catalog Management</h1>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configure menu items, categories, and modifiers</p>
        </div>
        <div className="flex bg-white p-1 border border-slate-200 rounded-sm shadow-sm">
           <button 
             onClick={() => { playClickSound(); setActiveTab('items'); }}
             className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all ${activeTab === 'items' ? 'bg-[#5D4037] text-white shadow-md shadow-stone-100' : 'text-slate-400 hover:text-slate-900'}`}
           >
              Menu Items
           </button>
           <button 
             onClick={() => { playClickSound(); setActiveTab('categories'); }}
             className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all ${activeTab === 'categories' ? 'bg-[#5D4037] text-white shadow-md shadow-stone-100' : 'text-slate-400 hover:text-slate-900'}`}
           >
              Categories
           </button>
        </div>
      </div>

      {/* Controller Module */}
      <div className="bg-white p-4 border border-slate-100 rounded-sm shadow-sm flex items-center justify-between sticky top-0 z-20">
         <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input 
                 type="text" 
                 placeholder="Search by name, code, or shortcut..." 
                 className="w-full bg-slate-50 border border-slate-100 rounded-sm py-2 pl-10 pr-4 text-[11px] font-bold uppercase tracking-wider outline-none focus:ring-1 focus:ring-slate-900/10 transition-all placeholder:text-slate-300"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-400 rounded-sm hover:text-slate-900 transition-colors">
               <Filter size={14} />
               <span className="text-[9px] font-black uppercase tracking-widest">Filters</span>
            </button>
         </div>

         <div className="flex items-center gap-3">
             <div className="flex items-center border border-slate-100 rounded-sm p-1 mr-4 bg-white shadow-sm">
                <button 
                  onClick={() => { playClickSound(); setViewMode('grid'); }}
                  className={`p-1.5 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-[#424242] text-white' : 'text-slate-400 hover:text-slate-950'}`}
                >
                   <LayoutGrid size={12} />
                </button>
                <button 
                  onClick={() => { playClickSound(); setViewMode('list'); }}
                  className={`p-1.5 rounded-sm transition-all ${viewMode === 'list' ? 'bg-[#424242] text-white' : 'text-slate-400 hover:text-slate-950'}`}
                >
                   <List size={12} />
                </button>
             </div>
             <button 
               onClick={() => { playClickSound(); activeTab === 'items' ? handleOpenModal() : handleOpenCategoryModal(); }}
               className="h-9 px-6 bg-[#5D4037] text-white rounded-sm text-[10px] font-bold uppercase tracking-[0.1em] flex items-center gap-2 shadow-lg shadow-stone-900/10 active:scale-95 transition-all"
             >
                <Plus size={14} strokeWidth={3} />
                Add New {activeTab === 'items' ? 'Item' : 'Category'}
             </button>
         </div>
      </div>

      {activeTab === 'items' ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-3'}>
           {filteredItems.map(item => (
              viewMode === 'grid' ? (
                <div key={item.id} className="bg-white border border-slate-100 rounded-sm overflow-hidden shadow-sm hover:border-slate-300 transition-all group">
                   <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden underline decoration-transparent">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
                       <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm border border-slate-100 px-2 py-1 rounded-sm text-[8px] font-black text-slate-900 tracking-tighter uppercase line-clamp-1 flex items-center gap-2">
                          #{item.code} • {item.shortcut}
                          {item.isVeg && <Leaf size={10} className="text-emerald-500 fill-emerald-500/20" />}
                       </div>
                       {item.spiceLevel > 0 && (
                          <div className="absolute top-2 right-2 bg-amber-500/90 text-white px-1.5 py-0.5 rounded-sm text-[8px] font-black flex items-center gap-1">
                             <Flame size={10} className="fill-white" />
                             {item.spiceLevel}
                          </div>
                       )}
                   </div>
                   <div className="p-4">
                       <div className="flex items-start justify-between mb-1">
                          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight line-clamp-1">{item.name}</h4>
                          <span className="text-[10px] font-black text-[#5D4037] tracking-tighter">₹{item.price}</span>
                       </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                        {categories.find(c => c.id === item.catId)?.name}
                      </p>
                      <div className="flex items-center gap-2 border-t border-slate-50 pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { playClickSound(); handleOpenModal(item); }}
                            className="flex-1 py-1.5 bg-[#424242] text-white text-[8px] font-black uppercase tracking-widest rounded-sm hover:bg-black transition-all shadow-sm"
                          >Edit Item</button>
                         <button 
                           onClick={() => handleDelete(item.id)}
                           className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded-sm transition-colors border border-slate-100"
                         ><Trash2 size={12} /></button>
                      </div>
                   </div>
                </div>
              ) : (
                <div key={item.id} className="bg-white border border-slate-100 rounded-sm p-3 flex items-center justify-between hover:shadow-md transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-sm overflow-hidden border border-slate-100">
                         <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                         <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.name}</h4>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CODE: {item.code}</span>
                             <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-1 rounded-sm">{item.shortcut}</span>
                             {item.isVeg && <Leaf size={8} className="text-emerald-500" />}
                             {item.prepTime && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={8} /> {item.prepTime}</span>}
                          </div>
                       </div>
                    </div>
                   <div className="flex items-center gap-8">
                      <div className="hidden md:flex flex-col text-right">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                         <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mt-0.5">{categories.find(c => c.id === item.catId)?.name}</span>
                      </div>
                      <div className="flex flex-col text-right w-20">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price</span>
                         <span className="text-[11px] font-black text-slate-900 tracking-tighter mt-0.5">₹{item.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => handleOpenModal(item)}
                           className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                         ><Edit3 size={14} /></button>
                         <button 
                           onClick={() => handleDelete(item.id)}
                           className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                         ><Trash2 size={14} /></button>
                         <ChevronRight size={14} className="text-slate-200" />
                      </div>
                   </div>
                </div>
              )
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => handleOpenCategoryModal(cat)}
                className="bg-white border border-slate-100 rounded-sm p-6 shadow-sm hover:border-slate-400 transition-all group cursor-pointer"
              >
                 <div className="w-12 h-12 bg-slate-50 rounded-sm flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all mb-4">
                    <Utensils size={24} />
                 </div>
                 <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight mb-1">{cat.name}</h4>
                 <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{items.filter(i => i.catId === cat.id).length} Items cataloged</span>
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* Industrial CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm shadow-2xl relative overflow-hidden flex flex-col"
            >
               {/* Modal Header */}
               <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#333333]">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-[#5D4037] text-white rounded-sm flex items-center justify-center shadow-lg shadow-stone-900/20">
                        {editingItem ? <Edit3 size={16} /> : <Plus size={16} />}
                     </div>
                     <div>
                        <h3 className="text-[13px] font-black uppercase tracking-tight text-white">
                           {editingItem ? 'Update Catalog Record' : 'Initialize New Record'}
                        </h3>
                        <p className="text-[9px] font-black text-[#FFC107] uppercase tracking-widest mt-0.5">Catalog Protocol v2.5.0</p>
                     </div>
                  </div>
                  <button onClick={() => { playClickSound(); handleCloseModal(); }} className="p-2 text-white/40 hover:text-white transition-colors"><X size={18} /></button>
               </div>

               {/* Modal Body */}
               <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto max-h-[70vh] no-scrollbar">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Designation</label>
                        <input 
                           type="text" 
                           required
                           className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           placeholder="e.g. PANEER BUTTER MASALA"
                        />
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Unit</label>
                        <select 
                           className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                           value={formData.catId}
                           onChange={(e) => setFormData({...formData, catId: parseInt(e.target.value)})}
                        >
                           {POS_CATEGORIES.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                           ))}
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Value (INR)</label>
                        <input 
                           type="number" 
                           required
                           className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                           value={formData.price}
                           onChange={(e) => setFormData({...formData, price: e.target.value})}
                           placeholder="0.00"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Code</label>
                        <input 
                           type="text" 
                           required
                           className="w-full bg-slate-100 border border-slate-200 p-2 text-[11px] font-bold uppercase outline-none rounded-sm cursor-not-allowed"
                           value={formData.code}
                           readOnly
                        />
                     </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">POS Shortcut</label>
                         <input 
                            type="text" 
                            required
                            className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                            value={formData.shortcut}
                            onChange={(e) => setFormData({...formData, shortcut: e.target.value.toUpperCase()})}
                            placeholder="e.g. PBM"
                            maxLength={4}
                         />
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spice Metric (0-3)</label>
                         <select 
                            className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                            value={formData.spiceLevel}
                            onChange={(e) => setFormData({...formData, spiceLevel: parseInt(e.target.value)})}
                         >
                            <option value={0}>0 - NONE</option>
                            <option value={1}>1 - MILD</option>
                            <option value={2}>2 - MEDIUM</option>
                            <option value={3}>3 - HIGH BLAZE</option>
                         </select>
                      </div>

                      <div className="space-y-4 pt-2">
                         <div className="flex items-center justify-between bg-slate-50 p-3 border border-slate-100 rounded-sm">
                            <div className="flex items-center gap-2">
                               <Leaf size={14} className={formData.isVeg ? "text-emerald-500" : "text-slate-300"} />
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Vegetarian Protocol</span>
                            </div>
                            <button 
                               type="button"
                               onClick={() => setFormData({...formData, isVeg: !formData.isVeg})}
                               className={`w-10 h-5 rounded-full transition-all relative ${formData.isVeg ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isVeg ? 'right-1' : 'left-1'}`} />
                            </button>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preparation Buffer</label>
                         <input 
                            type="text" 
                            required
                            className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                            value={formData.prepTime}
                            onChange={(e) => setFormData({...formData, prepTime: e.target.value.toUpperCase()})}
                            placeholder="e.g. 20 MINS"
                         />
                      </div>
                   </div>

                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-sm flex items-start gap-3">
                     <AlertCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
                     <p className="text-[9px] font-bold text-blue-700 uppercase tracking-widest leading-relaxed">
                        Validation: All catalog records are synchronized across POS terminals in real-time upon commitment.
                     </p>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="pt-6 flex items-center gap-3">
                     <button 
                        type="button"
                         onClick={() => { playClickSound(); handleCloseModal(); }}
                         className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
                      >Cancel</button>
                      <button 
                         type="submit"
                         onClick={playClickSound}
                         className="flex-1 py-3 bg-[#5D4037] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm shadow-xl shadow-stone-900/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                         <Save size={14} />
                         {editingItem ? 'Update Protocol' : 'Commit Record'}
                      </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
       {/* Category CRUD Modal */}
       <AnimatePresence>
         {isCategoryModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={handleCloseCategoryModal}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white w-full max-w-sm rounded-sm shadow-2xl relative overflow-hidden flex flex-col"
             >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#5D4037] text-white rounded-sm flex items-center justify-center">
                         {editingCategory ? <Edit3 size={16} /> : <Plus size={16} />}
                      </div>
                      <div>
                         <h3 className="text-[13px] font-black uppercase tracking-tight text-slate-900">
                            {editingCategory ? 'Update Category' : 'New Category'}
                         </h3>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Protocol v2.4.0</p>
                      </div>
                   </div>
                   <button onClick={handleCloseCategoryModal} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={18} /></button>
                </div>

                <form onSubmit={handleSaveCategory} className="p-8 space-y-6">
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Name</label>
                         <input 
                            type="text" 
                            required
                            className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                            value={categoryFormData.name}
                            onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                            placeholder="e.g. STARTERS"
                         />
                      </div>
                      
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Icon</label>
                         <select 
                            className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                            value={categoryFormData.icon}
                            onChange={(e) => setCategoryFormData({...categoryFormData, icon: e.target.value})}
                         >
                            <option value="Soup">Soup/Starter</option>
                            <option value="Utensils">Main Course</option>
                            <option value="Beer">Beverages</option>
                            <option value="IceCream">Desserts</option>
                            <option value="Pizza">Fast Food</option>
                         </select>
                      </div>
                   </div>

                   <div className="pt-6 flex items-center gap-3">
                      <button 
                         type="button"
                         onClick={handleCloseCategoryModal}
                         className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm transition-all"
                      >Abort</button>
                      <button 
                         type="submit"
                         className="flex-1 py-3 bg-[#5D4037] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                         <Save size={14} />
                         {editingCategory ? 'Update' : 'Establish'}
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
