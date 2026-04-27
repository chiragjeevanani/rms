import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Plus, Star, Leaf, Flame, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export function FoodCard({ item, onAdd }) {
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();
  const { addToCart, isOrderOnline } = useCart();

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (!isOrderOnline) return;
    setIsAdding(true);
    addToCart(item, 1, [], 0);
    if (onAdd) onAdd();
    setTimeout(() => setIsAdding(false), 900);
  };

  return (
    <motion.div 
      whileHover={isOrderOnline ? { y: -4 } : {}}
      onClick={() => isOrderOnline && navigate(`/item/${item.id}`)}
      className={`bg-white border-charcoal-900/10 dark:bg-white/5 backdrop-blur-md rounded-[2.5rem] p-5 border dark:border-white/5 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl ${
        isOrderOnline ? 'hover:border-brand-500/30 dark:hover:border-white/10 cursor-pointer group' : 'cursor-default grayscale-[0.3]'
      }`}
    >
      <div className="flex gap-5">
        {/* Image Area */}
        <div className="relative w-28 h-36 rounded-[1.5rem] overflow-hidden bg-charcoal-100 dark:bg-charcoal-800 shrink-0">
          <motion.img
            layoutId={`img-${item.id}`}
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          
          <div className="absolute top-2 left-2">
            <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-full ring-1 ring-white/10">
              {item.isVeg ? (
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              )}
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="flex-1 flex flex-col pt-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-display font-bold text-charcoal-900 dark:text-white group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
              {item.name}
            </h3>
          </div>

          <div className="mt-auto">
             <div className="flex items-center gap-3 text-charcoal-500 dark:text-white/40 mb-3 flex-wrap">
                <div className="flex items-center gap-1 bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/10 shrink-0">
                  <Star size={10} className="text-brand-500 fill-brand-500" />
                  <span className="text-[10px] font-black text-brand-500 flex items-center gap-1">
                    {item.reviews > 0 
                      ? (item.reviews.reduce((acc, r) => acc + r.rating, 0) / item.reviews.length).toFixed(1)
                      : (item.rating || 0)}
                    <span className="opacity-50 text-[8px] font-medium">({item.reviews?.length || 0})</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock size={10} />
                  <span className="text-[10px] font-black uppercase tracking-tight">{item.preparationTime || 15} Mins</span>
                </div>
                {item.originalPrice > item.price && (
                  <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-emerald-500/10">
                    {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                  </div>
                )}
             </div>
             <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 flex-wrap">
                   <span className="text-2xl font-display font-bold text-brand-500 text-nowrap">
                     ₹{item.price}
                   </span>
                   {item.originalPrice && (
                     <span className="text-[13px] font-bold text-charcoal-400/60 line-through text-nowrap">
                       ₹{item.originalPrice}
                     </span>
                   )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuickAdd}
                  disabled={!isOrderOnline || isAdding}
                  className={`relative overflow-hidden px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isAdding 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-brand-500 text-charcoal-900 border-brand-500 hover:shadow-lg hover:shadow-brand-500/30'
                  } border`}
                >
                  <AnimatePresence mode="wait">
                    {isAdding ? (
                      <motion.div key="check" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-2">
                         <CheckCircle2 size={12} strokeWidth={3} /> Added
                      </motion.div>
                    ) : (
                      <motion.div key="add" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-2">
                         <Plus size={12} strokeWidth={3} /> Add
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
             </div>
             
             <p className="text-xs text-charcoal-500 font-medium line-clamp-2 mt-2 leading-relaxed italic opacity-80">
               {item.description}
             </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}



