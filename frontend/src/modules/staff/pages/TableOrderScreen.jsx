import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Plus, Minus, ShoppingCart, Trash2, Send, Eye, Clock, Sparkles, Box } from 'lucide-react';
import { usePos } from '../../../modules/pos/context/PosContext';

export default function TableOrderScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Sync ID with POS format (t1, t2 etc)
  const tableId = id;
  
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [combos, setCombos] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentOrder, setCurrentOrder] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [staff, setStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { placeKOT, tables, loading } = usePos();
  const cartRef = useRef(null);
  
  const selectedTable = tables.find(t => t._id === id);
  const tableDisplay = loading ? 'Loading...' : (selectedTable?.tableName || `Table ${id?.slice(-4)}`);

  useEffect(() => {
    // Fetch real categories, items and combos
    const fetchData = async () => {
      try {
        const [catRes, itemRes, comboRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/category`),
          fetch(`${import.meta.env.VITE_API_URL}/item`),
          fetch(`${import.meta.env.VITE_API_URL}/combo`)
        ]);
        const catData = await catRes.json();
        const itemData = await itemRes.json();
        const comboData = await comboRes.json();
        
        setCategories(catData);
        setItems(itemData);
        setCombos(comboData?.data || []);
      } catch (err) {
        console.error("Fetch error", err);
      }
    };
    fetchData();

    const savedStaff = localStorage.getItem('staff_info');
    if (savedStaff && savedStaff !== "undefined") {
      try {
        setStaff(JSON.parse(savedStaff));
      } catch (e) {
        console.error("Staff parsing error", e);
      }
    }
  }, []);

  const getFilteredItems = () => {
    let baseList = [];
    
    if (activeCategory === 'combos') {
      baseList = (Array.isArray(combos) ? combos : []).map(c => ({ ...c, isCombo: true }));
    } else if (activeCategory === 'popular') {
      baseList = items.filter(i => i.isFeatured);
    } else {
      baseList = items.filter(item => {
        if (activeCategory === 'all') return true;
        // Handle both object and string formats
        const catId = typeof item.category === 'object' ? item.category?._id : item.category;
        return catId === activeCategory;
      });
    }

    return baseList.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredItemsResult = getFilteredItems();

  const addToOrder = (item) => {
    // Visual feedback
    setFeedback(item._id);
    setTimeout(() => setFeedback(null), 800);

    setCurrentOrder(prev => {
      const existing = prev.find(i => i.id === item._id);
      if (existing) {
        return prev.map(i => i.id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        id: item._id, 
        itemId: item._id,
        name: item.name, 
        price: item.basePrice || item.price, 
        image: item.image,
        isCombo: !!item.isCombo,
        quantity: 1 
      }];
    });
    // Auto-scroll to cart
    cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const removeFromOrder = (itemId) => {
    setCurrentOrder(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCurrentOrder(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const total = currentOrder.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-lg bg-white min-h-screen flex flex-col shadow-2xl relative overflow-hidden">
        {/* Menu Side */}
        <div className="flex-[3] flex flex-col h-[60vh] md:h-full bg-white border-b md:border-b-0 md:border-r border-slate-200 overflow-hidden">
          <header className="p-6 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => navigate(-1)} className="p-3 bg-slate-100 rounded-2xl text-slate-900 group">
                 <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{tableDisplay}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add Items to Order</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-xs font-medium outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                />
              </div>
            </div>
          </header>

          <div className="flex overflow-x-auto p-3 gap-2 no-scrollbar bg-slate-50 sticky top-0 z-10 shrink-0">
             <button
               onClick={() => setActiveCategory('all')}
               className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all flex items-center gap-2 ${
                 activeCategory === 'all' 
                 ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                 : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
               }`}
             >
               All
             </button>
             
             {/* Dynamic Filter Badges */}
             <button
               onClick={() => setActiveCategory('popular')}
               className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all flex items-center gap-2 ${
                 activeCategory === 'popular' 
                 ? 'bg-amber-400 text-slate-900 border-amber-400 shadow-lg' 
                 : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
               }`}
             >
               <Sparkles size={12} /> Popular
             </button>

             <button
               onClick={() => setActiveCategory('combos')}
               className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all flex items-center gap-2 ${
                 activeCategory === 'combos' 
                 ? 'bg-rose-500 text-white border-rose-500 shadow-lg' 
                 : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
               }`}
             >
               <Box size={12} /> Combos
             </button>

             {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${
                    activeCategory === cat._id 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat.name}
                </button>
             ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 auto-rows-max no-scrollbar">
             {filteredItemsResult.map((item) => (
               <motion.div
                 key={item._id}
                 whileTap={{ scale: 0.96 }}
                 onClick={() => addToOrder(item)}
                 className="bg-slate-50 border border-slate-200 rounded-[2rem] p-4 flex flex-col items-center text-center group cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-slate-900/5 hover:border-slate-300 transition-all relative overflow-hidden"
               >
                 <AnimatePresence>
                   {feedback === item._id && (
                     <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="absolute inset-0 z-20 bg-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4"
                     >
                        <motion.div
                           initial={{ scale: 0.5 }}
                           animate={{ scale: 1 }}
                           transition={{ type: "spring", damping: 12 }}
                           className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-lg"
                        >
                           <Plus size={20} className="text-emerald-500 stroke-[3px]" />
                        </motion.div>
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Added!</span>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden mb-4 bg-slate-200 relative">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                    {!item.isCombo && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/staff/item/${item._id}`);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-900 border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                 </div>
                 <h3 className="text-xs font-bold text-slate-900 mb-1">{item.name}</h3>
                 <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                       <p className="text-lg font-black text-teal-600">₹{item.basePrice || item.price}</p>
                       {(item.originalPrice || item.basePrice || item.price) && (
                         <p className="text-[10px] font-bold text-slate-400 line-through">₹{item.originalPrice || item.basePrice || item.price}</p>
                       )}
                    </div>
                    {item.preparationTime && (
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                         <Clock size={10} className="text-slate-400" />
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">{item.preparationTime} min</span>
                      </div>
                    )}
                 </div>
                 <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                       Add to Basket
                    </span>
                 </div>
               </motion.div>
             ))}
          </div>
        </div>


        {/* Cart Side */}
        <div ref={cartRef} className="flex-[2] bg-slate-900 flex flex-col h-[45vh] md:h-full shadow-2xl overflow-hidden mt-auto md:mt-0">
           <div className="p-8 border-b border-white/5 shrink-0">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-2xl font-black text-white">Guest Order</h2>
                 <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-teal-400">
                    <ShoppingCart size={20} />
                 </div>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tableDisplay} • {currentOrder.length} Items</p>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {currentOrder.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                   <div className="w-20 h-20 border-2 border-dashed border-white/10 rounded-full flex items-center justify-center mb-4">
                      <Minus size={24} className="text-white" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Basket is empty</p>
                </div>
              ) : (
                <AnimatePresence>
                  {currentOrder.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white font-black overflow-hidden">
                         <img src={item.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                         <p className="text-teal-400 font-black text-sm">₹{item.price * item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                         <button 
                           onClick={() => updateQuantity(item.id, -1)}
                           className="w-8 h-8 rounded-lg bg-white/5 text-white flex items-center justify-center hover:bg-white/10"
                         >
                            <Minus size={14} />
                         </button>
                         <span className="w-8 text-center text-sm font-black text-white">{item.quantity}</span>
                         <button 
                           onClick={() => updateQuantity(item.id, 1)}
                           className="w-8 h-8 rounded-lg bg-white/5 text-white flex items-center justify-center hover:bg-white/10"
                         >
                            <Plus size={14} />
                         </button>
                      </div>
                      <button 
                        onClick={() => removeFromOrder(item.id)}
                        className="ml-2 p-2 text-white/20 hover:text-red-400 transition-colors"
                      >
                         <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
           </div>

           <div className="p-8 bg-black/30 border-t border-white/5 backdrop-blur-xl shrink-0">
              {/* Financial Summary Breakout */}
              <div className="space-y-4 mb-8">
                 <div className="flex justify-between items-center text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <span>Subtotal</span>
                    <span>₹{total}</span>
                 </div>
                 <div className="flex justify-between items-center text-teal-400 text-[10px] uppercase font-black tracking-widest">
                    <span>GST (5%)</span>
                    <span>₹{Math.round(total * 0.05)}</span>
                 </div>
                 <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Grand Total</p>
                       <p className="text-3xl font-black text-white tracking-tighter italic">₹{Math.round(total * 1.05)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[11px] font-black text-teal-500 uppercase tracking-widest mb-1">Payable Amount</p>
                    </div>
                 </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={currentOrder.length === 0 || isSubmitting}
                onClick={async () => {
                  try {
                    setIsSubmitting(true);
                    const tax = Math.round(total * 0.05);
                    await placeKOT(selectedTable?.tableName, currentOrder, {
                      subTotal: total,
                      tax: tax,
                      grandTotal: total + tax
                    }, staff);
                    navigate(-1);
                  } catch (err) {
                    console.error("Order failed", err);
                    setIsSubmitting(false);
                  }
                }}
                className="w-full bg-teal-500 text-slate-900 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-teal-400 transition-all disabled:opacity-30 disabled:grayscale"
              >
                 {isSubmitting ? 'Processing...' : 'Confirm Order'} <Send size={18} />
              </motion.button>
           </div>
        </div>
      </div>
    </div>
  );
}
