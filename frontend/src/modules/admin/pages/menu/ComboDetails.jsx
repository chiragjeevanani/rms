import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Package, Clock, DollarSign, 
  Layers, Star, Edit2, Share2, 
  CheckCircle2, AlertCircle, Trash2, Printer, 
  LayoutGrid, Info, TrendingUp, ShieldCheck,
  Sparkles, MessageSquare, ArrowUpRight, ClipboardCheck,
  Eye, Archive, Settings, Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Skeleton from '../../components/ui/Skeleton';

export default function ComboDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [combo, setCombo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCombo();
  }, [id]);

  const fetchCombo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/combo/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setCombo(result.data);
      } else {
        toast.error('Combo matrix not discovered');
        navigate('/admin/menu/combos');
      }
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Terminate this combo assembly?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/combo/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Combo de-cataloged');
        navigate('/admin/menu/combos');
      }
    } catch (err) {
      toast.error('Sync failed');
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

  if (!combo) return null;

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0B101B] p-4 sm:p-8 transition-colors duration-500 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Navigation Rail */}
        <header className="flex items-center justify-between">
           <button 
             onClick={() => navigate('/admin/menu/combos')}
             className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
           >
             <ChevronLeft size={18} className="text-slate-400 group-hover:text-blue-500 group-hover:-translate-x-1 transition-all" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">Bundle Management</span>
           </button>
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Sync Active</span>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* SECTION A: COMBO SPECS SIDEBAR (LEFT) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Visual Manifest */}
            <div className="relative group">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="aspect-square bg-white dark:bg-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 p-4"
               >
                  <img 
                    src={combo.image || 'https://via.placeholder.com/600x600?text=Combo'} 
                    className="w-full h-full object-cover rounded-[2.5rem] group-hover:scale-110 transition-transform duration-1000" 
                    alt={combo.name} 
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-8 left-8 flex flex-col gap-3">
                     <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl backdrop-blur-md border border-white/20 ${combo.isAvailable ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-white/50'}`}>
                        {combo.isAvailable ? 'In Distribution' : 'Draft Assembly'}
                     </div>
                     <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl border border-white/20">
                        <Package size={12} /> Bundle SKU: {combo.sku}
                     </div>
                  </div>
               </motion.div>
            </div>

            {/* Bundle Pricing Card */}
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
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Value Logic</span>
                  </div>

                  <div className="space-y-1">
                     <h2 className="text-5xl font-black text-blue-400 tracking-tighter">₹{combo.price}</h2>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Optimized Selling Value</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Itemized Total</p>
                        <p className="text-lg font-bold text-slate-300/50 line-through">₹{combo.originalPrice || combo.price}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Customer Gain</p>
                        <p className="text-lg font-black text-emerald-400">
                           {combo.originalPrice ? `Save ₹${combo.originalPrice - combo.price}` : 'Unified'}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                     <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Verified Assembly</span>
                     </div>
                     <Info size={16} className="cursor-help hover:text-white transition-colors" />
                  </div>
               </div>
            </motion.div>

            {/* Quick Record Actions */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="flex gap-4 pt-4"
            >
               <button 
                onClick={() => navigate(`/admin/menu/combos?edit=${id}`)}
                className="flex-1 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                  <Edit2 size={16} /> Edit
               </button>
               <button 
                 onClick={() => window.print()}
                 className="w-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400"
               >
                  <Printer size={20} />
               </button>
               <button 
                 onClick={handleDelete}
                 className="w-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-[2rem] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all outline-none"
               >
                  <Trash2 size={24} />
               </button>
            </motion.div>
          </aside>

          {/* SECTION B: WORKFLOW & COMPOSITION (RIGHT) */}
          <main className="lg:col-span-8 space-y-10">
            {/* The Hero Banner */}
            <section className="space-y-6">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-6 flex-1">
                     <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-[0.2em] rounded-md border border-blue-100 dark:border-blue-500/20">
                           Bundle
                        </span>
                        <span className="px-3 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[8px] font-black uppercase tracking-[0.2em] rounded-md border border-purple-100 dark:border-purple-500/20">
                           {combo.items?.length || 0} Assets
                        </span>
                        <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-md border ${combo.status === 'Published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                           {combo.status}
                        </span>
                     </div>
                     <h1 className="text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{combo.name}</h1>
                  </div>
                  
                  {/* Real-time Status Node */}
                  <div className="p-8 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center">
                     <div className="relative mb-3">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                           <Layers size={24} />
                        </div>
                     </div>
                     <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Matrix Mode</p>
                  </div>
               </div>
               <p className="text-xl font-bold text-slate-400 dark:text-slate-500 leading-tight italic max-w-3xl">
                 "{combo.description || 'Strategically assembled multi-asset food bundle designed for maximum customer value and kitchen efficiency.'}"
               </p>
            </section>

            {/* Operational Attributes Grid */}
            <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {[
                 { icon: Clock, label: 'Assembly Cycle', value: `${combo.preparationTime || 20}m`, color: 'text-amber-500' },
                 { icon: Hammer, label: 'Asset Composition', value: `${combo.items?.length || 0} Elements`, color: 'text-blue-500' },
                 { icon: ClipboardCheck, label: 'Audit Status', value: 'Verified', color: 'text-emerald-500' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white dark:bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    <stat.icon size={20} className={`${stat.color} mb-3 group-hover:scale-110 transition-transform`} />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{stat.value}</p>
                 </div>
               ))}
            </section>

            {/* Composition Matrix (Detailed Items) */}
            <section className="bg-white dark:bg-slate-800 rounded-[3.5rem] p-10 border border-slate-100 dark:border-slate-800 space-y-8">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <LayoutGrid size={20} className="text-blue-600" /> Composition Matrix
                     </h4>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-7">Detailed asset breakdown within bundle</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg">{combo.items?.length || 0} Elements</span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {combo.items?.map((comboItem, idx) => (
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     key={idx} 
                     className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-transparent hover:border-blue-500/20 transition-all group flex items-center gap-4"
                   >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white dark:border-slate-800 shadow-sm flex-shrink-0">
                         <img src={comboItem.item?.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate">{comboItem.item?.name}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{comboItem.item?.category?.name || 'Classified'}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-blue-600">x{comboItem.quantity}</p>
                         <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-black text-slate-400 uppercase">Linked</span>
                         </div>
                      </div>
                   </motion.div>
                 ))}
                 {(!combo.items || combo.items.length === 0) && (
                   <div className="col-span-full py-20 text-center opacity-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[3rem]">
                      <Archive size={48} className="mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No compositions discovered</p>
                   </div>
                 )}
               </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}



