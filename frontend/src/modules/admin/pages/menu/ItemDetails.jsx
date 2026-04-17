import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Package, Tag, Clock, DollarSign, 
  Leaf, Flame, Star, Edit2, Archive, Globe, 
  CheckCircle2, AlertCircle, Trash2, Printer,
  Sparkles, Layers, Info, MessageSquare, ArrowUpRight,
  TrendingUp, ShieldCheck, Heart, Hash, Settings,
  Eye, LayoutDashboard, Share2, ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Skeleton from '../../components/ui/Skeleton';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/item/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      if (response.ok) {
        toast.success('Item terminated');
        navigate('/admin/menu/items');
      } else {
        toast.error('Deletion failed');
      }
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const fetchItem = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/item/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setItem(data);
      } else {
        toast.error('Item not discovered');
        navigate('/admin/menu/items');
      }
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <Skeleton className="w-40 h-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-4 h-[600px] rounded-[3rem]" />
          <Skeleton className="lg:col-span-8 h-[600px] rounded-[3rem]" />
        </div>
      </div>
    );
  }

  if (!item) return null;

  const avgRating = item.reviews?.length > 0 
    ? (item.reviews.reduce((acc, r) => acc + r.rating, 0) / item.reviews.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0B101B] p-4 sm:p-8 transition-colors duration-500 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Navigation Rail */}
        <header className="flex items-center justify-between">
           <button 
             onClick={() => navigate('/admin/menu/items')}
             className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
           >
             <ChevronLeft size={18} className="text-slate-400 group-hover:text-blue-500 group-hover:-translate-x-1 transition-all" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">Catalog Management</span>
           </button>
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Node Locked</span>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* SECTION A: THE CORE SPEC SIDEBAR (LEFT) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Visual Manifest */}
            <div className="relative group">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="aspect-square bg-white dark:bg-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 p-4"
               >
                  <img 
                    src={item.image} 
                    className="w-full h-full object-cover rounded-[2.5rem] group-hover:scale-110 transition-transform duration-1000" 
                    alt={item.name} 
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-8 left-8 flex flex-col gap-3">
                     <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl backdrop-blur-md border border-white/20 ${item.isAvailable ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-white/50'}`}>
                        {item.isAvailable ? 'Active Distribution' : 'Distribution Paused'}
                     </div>
                     {item.isFeatured && (
                       <div className="px-4 py-2 bg-amber-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl border border-white/20 animate-bounce-slow">
                          <Sparkles size={12} fill="white" /> Featured SKU
                       </div>
                     )}
                  </div>
               </motion.div>
            </div>

            {/* Price & Fiscal Card */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-[#1A1F2C] text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform"
            >
               <div className="absolute -bottom-10 -right-10 p-12 opacity-5 text-blue-400 group-hover:scale-125 transition-transform duration-1000">
                  <TrendingUp size={200} />
               </div>
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3 py-2 px-4 bg-white/5 w-fit rounded-full border border-white/5">
                     <TrendingUp size={14} className="text-blue-400" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Profit Matrix</span>
                  </div>

                  <div className="space-y-1">
                     <h2 className="text-5xl font-black text-blue-400 tracking-tighter">₹{item.basePrice}</h2>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Selling Value</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Retail Point</p>
                        <p className="text-lg font-bold text-slate-300/50 line-through">₹{item.originalPrice || item.basePrice}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Net Margin</p>
                        <p className="text-lg font-black text-emerald-400">
                           {item.originalPrice ? `+₹${item.originalPrice - item.basePrice}` : 'Optimal'}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                     <div className="flex items-center gap-2">
                        <ShieldCheck size={16} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Taxation {item.tax || 0}%</span>
                     </div>
                     <Info size={16} className="cursor-help hover:text-white transition-colors" />
                  </div>
               </div>
            </motion.div>

            {/* Catalog Placement Card */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
            >
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <Layers size={24} className="text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Division</p>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none mt-1">{item.category?.name || 'Classified'}</h4>
                  </div>
               </div>
               <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase opacity-80">
                  {item.category?.description || 'Structural placement data for this SKU is pending manual verification.'}
               </p>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="flex gap-4 pt-4"
            >
               <button 
                 onClick={() => navigate(`/admin/menu/items?edit=${id}`)}
                 className="flex-1 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                  <Edit2 size={16} /> Edit
               </button>
               <button 
                 onClick={() => window.print()}
                 className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all shadow-sm"
               >
                  <Printer size={20} />
               </button>
               <button 
                 onClick={handleDelete}
                 className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-[2rem] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10"
               >
                  <Trash2 size={20} />
               </button>
            </motion.div>
          </aside>

          {/* SECTION B: WORKFLOW & SENTIMENT (RIGHT) */}
          <main className="lg:col-span-8 space-y-10">
            {/* The Hero Banner */}
            <section className="space-y-6">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-6 flex-1">
                     <div className="flex flex-wrap gap-2">
                        {item.tags?.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-[0.2em] rounded-md border border-blue-100 dark:border-blue-500/20">
                             {tag}
                          </span>
                        ))}
                        <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-md border ${item.foodType === 'Veg' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                           {item.foodType} Class
                        </span>
                     </div>
                     <h1 className="text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{item.name}</h1>
                  </div>
                  
                  {/* Real-time Performance Node */}
                  <div className="p-8 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center">
                     <div className="relative mb-3">
                        <Star size={56} className="text-amber-400 fill-amber-400" />
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{avgRating}</span>
                     </div>
                     <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Store Rating</p>
                  </div>
               </div>
               <p className="text-xl font-bold text-slate-400 dark:text-slate-500 leading-tight italic max-w-3xl">
                 "{item.description}"
               </p>
            </section>

            {/* Operational Attributes Grid */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { icon: Clock, label: 'Cook Cycle', value: `${item.preparationTime}m`, color: 'text-amber-500' },
                 { icon: Globe, label: 'Cuisine Origin', value: item.cuisineType || 'Global', color: 'text-blue-500' },
                 { icon: Hash, label: 'Asset Code', value: item.sku, color: 'text-purple-500' },
                 { icon: ClipboardCheck, label: 'Audit Status', value: 'Verified', color: 'text-emerald-500' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white dark:bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    <stat.icon size={20} className={`${stat.color} mb-3 group-hover:scale-110 transition-transform`} />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{stat.value}</p>
                 </div>
               ))}
            </section>

            {/* Configurations & Modules Side-by-Side */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Pricing Variants List */}
               <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] p-10 border border-slate-100 dark:border-slate-800 space-y-8">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <Package size={20} className="text-blue-500" /> Variant Build
                     </h4>
                     <span className="px-2 py-1 bg-slate-900 text-white text-[8px] font-black rounded-md">{item.variants?.length || 0}</span>
                  </div>
                  <div className="space-y-3">
                    {item.variants?.length > 0 ? item.variants.map((v, i) => (
                      <div key={i} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all group">
                         <span className="text-xs font-black text-slate-900 dark:text-white uppercase group-hover:text-blue-500 transition-colors">{v.name}</span>
                         <span className="text-sm font-black text-blue-600">₹{v.price}</span>
                      </div>
                    )) : (
                      <div className="py-20 text-center opacity-20"><Archive size={40} className="mx-auto" /></div>
                    )}
                  </div>
               </div>

               {/* Active Modifiers List */}
               <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] p-10 border border-slate-100 dark:border-slate-800 space-y-8">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <Settings size={20} className="text-purple-500" /> Logic Modules
                     </h4>
                     <span className="px-2 py-1 bg-slate-900 text-white text-[8px] font-black rounded-md">{item.modifiers?.length || 0}</span>
                  </div>
                  <div className="space-y-4">
                    {item.modifiers?.length > 0 ? item.modifiers.map((mod, i) => (
                      <div key={i} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-4 border border-transparent hover:border-purple-500/20 transition-all">
                         <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                            <span className="text-xs font-black uppercase">{mod.name}</span>
                            <span className="text-[8px] font-bold text-slate-400 italic">{mod.selectionType}</span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {mod.options?.map((opt, oi) => (
                              <span key={oi} className="px-3 py-1 bg-white dark:bg-slate-800 text-[9px] font-black text-slate-500 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                {opt.name} {opt.price > 0 && <span className="text-blue-500 ml-1">+₹{opt.price}</span>}
                              </span>
                            ))}
                         </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center opacity-20"><Flame size={40} className="mx-auto" /></div>
                    )}
                  </div>
               </div>
            </section>

            {/* The Master Feedback Terminal */}
            <section className="bg-[#0F141E] text-white rounded-[4rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
                  <MessageSquare size={300} />
               </div>
               
               <div className="relative z-10 space-y-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="space-y-2">
                        <h4 className="text-4xl font-black uppercase tracking-tighter">Verified Sentiments</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Audited Customer Stream</p>
                     </div>
                     <div className="flex gap-4">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                           <Eye size={16} /> Full Analytics
                        </button>
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                           <Share2 size={16} />
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {item.reviews?.length > 0 ? item.reviews.map((rev, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        key={idx} 
                        className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 hover:bg-white/10 transition-all space-y-6 group"
                      >
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-black text-sm uppercase shadow-2xl group-hover:scale-110 transition-transform">
                                  {rev.userName?.slice(0, 1)}
                               </div>
                               <div>
                                  <p className="text-sm font-black uppercase tracking-tight">{rev.userName}</p>
                                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                               </div>
                            </div>
                            <div className="px-3 py-1 bg-black/40 rounded-xl flex gap-1 items-center">
                               <Star size={12} className="text-amber-400 fill-amber-400" />
                               <span className="text-xs font-black">{rev.rating}</span>
                            </div>
                         </div>
                         <p className="text-[13px] text-slate-400 italic leading-relaxed font-medium">"{rev.comment}"</p>
                      </motion.div>
                    )) : (
                      <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white/5 rounded-[4rem] border-2 border-dashed border-white/5">
                         <MessageSquare size={48} className="text-slate-800 mb-6" />
                         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">Zero Sentiment Patterns Detected</p>
                      </div>
                    )}
                  </div>
               </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}



