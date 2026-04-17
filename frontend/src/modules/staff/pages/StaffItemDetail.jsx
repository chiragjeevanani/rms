import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, ShoppingCart, ChevronRight, Info, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/item/${id}`);
        const data = await res.json();
        if (res.ok) setItem(data);
        else toast.error("Item not found");
      } catch (err) {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!item) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <Info size={48} className="text-slate-300 mb-4" />
      <h2 className="text-xl font-black text-slate-900 uppercase italic">Product Not Found</h2>
      <button onClick={() => navigate(-1)} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Go Back</button>
    </div>
  );

  const discountValue = item.originalPrice ? Math.round(((item.originalPrice - (item.basePrice || item.price)) / item.originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-lg mx-auto w-full bg-white min-h-screen flex flex-col shadow-2xl relative pb-20">
        
        {/* Header Image Section */}
        <div className="relative h-[45vh] w-full bg-slate-100 overflow-hidden">
           <motion.img 
             initial={{ scale: 1.1 }}
             animate={{ scale: 1 }}
             transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
             src={item.image} 
             className="w-full h-full object-cover" 
           />
           <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
           <button 
             onClick={() => navigate(-1)}
             className="absolute top-8 left-8 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-900 shadow-xl border border-white active:scale-90 transition-all"
           >
             <ArrowLeft size={20} strokeWidth={3} />
           </button>

           {discountValue > 0 && (
             <div className="absolute top-8 right-8 bg-amber-400 text-slate-900 px-4 py-2 rounded-xl font-black italic text-sm shadow-xl flex items-center gap-2">
                <ShieldCheck size={16} />
                {discountValue}% OFF
             </div>
           )}
        </div>

        <div className="px-8 -mt-10 relative z-10 flex-1">
           <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-900/5 border border-slate-50">
              <div className="flex flex-col gap-2 mb-6 text-center">
                 <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-black text-teal-500 uppercase tracking-[0.3em]">{item.cuisineType || 'Classic'}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">{item.foodType}</span>
                 </div>
                 <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">{item.name}</h1>
              </div>

              <div className="flex items-center justify-center gap-6 mb-10 pb-10 border-b border-slate-50">
                 <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Selling Price</p>
                    <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">₹{item.basePrice || item.price}</p>
                 </div>
                 {item.originalPrice > 0 && (
                   <div className="text-center border-l border-slate-100 pl-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Actual Price</p>
                      <p className="text-xl font-black text-slate-300 line-through italic tracking-tighter leading-none">₹{item.originalPrice}</p>
                   </div>
                 )}
              </div>

              <div className="space-y-8">
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                       <Info size={14} className="text-slate-400" /> Description
                    </h4>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                       {item.description || "Indulge in our exquisite selection crafted with premium ingredients and authentic culinary techniques. A perfect harmony of flavors designed to satisfy your gourmet cravings."}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                       <div className="flex items-center gap-2 mb-2">
                          <Clock size={14} className="text-blue-500" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prep Time</span>
                       </div>
                       <span className="text-lg font-black text-slate-900 italic uppercase leading-none">{item.preparationTime || 15} MIN</span>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                       <div className="flex items-center gap-2 mb-2">
                          <Star size={14} className="text-amber-500 fill-amber-500" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rating</span>
                       </div>
                       <span className="text-lg font-black text-slate-900 italic uppercase leading-none">4.8 / 5.0</span>
                    </div>
                 </div>

                 {item.tags?.length > 0 && (
                   <div className="flex flex-wrap gap-2 pt-4">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest">#{tag}</span>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </div>

        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-6">
           <button 
             onClick={() => navigate(-1)}
             className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/40 flex items-center justify-center gap-4 hover:bg-slate-800 transition-all active:scale-95"
           >
              Add To Order Basket <ShoppingCart size={20} className="text-amber-400" />
           </button>
        </div>
      </div>
    </div>
  );
}



