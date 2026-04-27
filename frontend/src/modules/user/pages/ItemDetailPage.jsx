import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Clock, ShoppingBag, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { QuantityStepper } from '../components/QuantityStepper';
import { useCart } from '../context/CartContext';
import { CartDrawer } from '../components/CartDrawer';
import toast from 'react-hot-toast';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, tableNumber, setTable, itemCount } = useCart();
  
  const [item, setItem] = useState(null);
  const [tables, setTables] = useState([]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [addedToCart, setAddedToCart] = useState(false);
  const [tempTable, setTempTable] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ userName: '', rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchItem = async () => {
      try {
        let res = await fetch(`${import.meta.env.VITE_API_URL}/item/${id}`);
        let data = await res.json();
        
        if (!res.ok) {
          res = await fetch(`${import.meta.env.VITE_API_URL}/combo/${id}`);
          const comboData = await res.json();
          if (comboData.success) {
            data = comboData.data;
          } else {
             data = null;
          }
        }

        if (data) {
          if (data.status !== 'Published') {
             data = null;
          } else {
            const price = data.hasVariants ? data.variants.find(v => v.isDefault)?.price : (data.sellingPrice || data.basePrice || data.price);
            const originalPrice = data.hasVariants ? data.variants.find(v => v.isDefault)?.originalPrice : (data.basePrice || data.originalPrice);
            
            const avgRating = data.reviews?.length > 0 
              ? (data.reviews.reduce((acc, r) => acc + r.rating, 0) / data.reviews.length).toFixed(1)
              : (data.rating || 4.8);

            setItem({
              ...data,
              id: data.id || data._id,
              price,
              originalPrice,
              preparationTime: data.preparationTime || 15,
              prepTime: data.preparationTime ? `${data.preparationTime} min` : '15 min',
              ratingFallback: data.rating || 4.8,
              isVeg: data.foodType === 'Veg' || data.isVeg,
              modifiers: data.modifiers || [],
              reviews: data.reviews || [],
              sku: data.sku || '',
              tax: data.tax || 0,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load item:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
    fetchTables();
  }, [id]);

  const fetchTables = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/table`);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/item/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      if (res.ok) {
        const newReview = await res.json();
        setItem(prev => ({ ...prev, reviews: [newReview, ...(prev?.reviews || [])] }));
        setShowReviewForm(false);
        setReviewData({ userName: '', rating: 5, comment: '' });
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-charcoal-900 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-charcoal-400">Fetching Recipe...</p>
      </div>
    );
  }

  if (!item) {
    return <div className="min-h-screen bg-cream-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-white flex items-center justify-center font-display text-2xl uppercase tracking-tighter text-center px-8">Dish missing or removed</div>;
  }

  const handleModifierSelect = (groupName, optionId) => {
    setSelectedModifiers(prev => ({ ...prev, [groupName]: optionId }));
  };

  const currentPrice = (item?.price || 0) + Object.entries(selectedModifiers).reduce((acc, [group, optId]) => {
     const modGroup = item?.modifiers?.find(m => m.name === group);
     const option = modGroup?.options?.find(o => o._id === optId);
     return acc + (option?.price || 0);
  }, 0);

  const avgRating = item?.reviews?.length > 0
    ? (item.reviews.reduce((acc, r) => acc + r.rating, 0) / item.reviews.length).toFixed(1)
    : (item?.ratingFallback || 0);

  const handleAddToCart = (selectedTable) => {
    if (!item) return;
    if (selectedTable) {
       setTable(selectedTable);
    }
    const modArray = Object.entries(selectedModifiers).map(([group, val]) => ({ group, value: val }));
    addToCart(item, quantity, modArray, currentPrice - item.price);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const processDirectOrder = async (targetTable) => {
    if (!targetTable || !item) return;
    setIsBooking(true);
    try {
      // 1. Update backend table status to 'Occupied'
      const tableObj = tables.find(t => t.tableName === targetTable || t.tableCode === targetTable);
      const tableName = tableObj?.tableName || targetTable;
      
      if (tableObj) {
        await fetch(`${import.meta.env.VITE_API_URL}/table/${tableObj._id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
          },
          body: JSON.stringify({ status: 'Occupied' })
        });
      }

      // 1a. Formalize Order in Backend
      try {
        const modSummary = Object.entries(selectedModifiers).map(([group, value]) => ({ group, value }));
        await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableName: tableName,
            items: [{
              itemId: item.id || item._id,
              name: item.name,
              quantity: quantity,
              price: currentPrice,
              modifiers: modSummary
            }],
            subTotal: currentPrice * quantity,
            grandTotal: currentPrice * quantity,
            tax: 0,
            orderType: 'Dine-In',
            waiterName: 'Customer App'
          })
        });
      } catch (e) {
        console.error('Backend Order creation failed:', e);
      }

      // 2. Add to Cart / Persist local order (for POS visibility)
      handleAddToCart(tableName);

      // 3. Sync Tables (Re-fetch current status)
      await fetchTables();

      // 4. Create POS sync (Update localStorage specifically for POS)
      try {
        const savedOrders = JSON.parse(localStorage.getItem('rms_pos_orders') || '{}');
        const existingOrder = savedOrders[tableName] || { 
          kots: [], 
          status: 'running-kot', 
          sessionStartTime: new Date().toISOString(),
          waiter: { name: 'Customer App', id: 'app' }
        };
        
        const modSummary = Object.entries(selectedModifiers).map(([g, v]) => v).join(', ');
        
        const newKOT = {
          id: (existingOrder.kots?.length || 0) + 1,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          items: [{
            id: item.id,
            name: `${item.name}${modSummary ? ` (${modSummary})` : ''}`,
            quantity: quantity,
            price: currentPrice
          }],
          total: currentPrice * quantity
        };

        savedOrders[tableName] = {
          ...existingOrder,
          kots: [...(existingOrder.kots || []), newKOT],
          status: 'running-kot'
        };
        localStorage.setItem('rms_pos_orders', JSON.stringify(savedOrders));
      } catch (e) {
        console.error('POS Sync failed:', e);
      }

      toast.success(`Order Placed for Table ${tableName}!`);
      setShowTableModal(false);
      setTempTable(null);
      // Small delay to show confirmation then navigate back
      setTimeout(() => navigate('/menu'), 1500);
    } catch (err) {
      console.error('Order failed:', err);
      toast.error('Failed to place order');
    } finally {
      setIsBooking(false);
    }
  };

  const handleBookTable = () => processDirectOrder(tempTable);

  const handleMainOrderAction = () => {
    if (tableNumber && tableNumber !== '7') {
       processDirectOrder(tableNumber);
    } else {
       setShowTableModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-white selection:bg-brand-500 selection:text-charcoal-900 transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[60%] h-[40%] bg-brand-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto pb-24">
        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-b-[4rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
          <img src={item?.image} className="w-full h-full object-cover" alt={item?.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-cream-50 dark:from-charcoal-900 via-transparent to-black/20" />
          <button onClick={() => navigate(-1)} className="absolute top-10 left-6 w-12 h-12 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center text-charcoal-900 dark:text-white border border-charcoal-900/10 dark:border-white/10 z-20">
            <ArrowLeft size={20} />
          </button>

          <button 
            onClick={() => setIsCartOpen(true)} 
            className="absolute top-10 right-6 w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-charcoal-900 border border-brand-500/20 shadow-lg shadow-brand-500/20 z-20"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-charcoal-900 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-brand-500">
                {itemCount}
              </span>
            )}
          </button>

          <div className="absolute bottom-10 left-8 right-8">
             <div className="flex gap-2 mb-4">
                {item?.isVeg ? (
                  <span className="bg-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-green-500/30 backdrop-blur-md">Vegetarian</span>
                ) : (
                  <span className="bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-red-500/30 backdrop-blur-md">Meat Lovers</span>
                )}
             </div>
             <h1 className="text-5xl font-display font-bold leading-[0.9] tracking-tighter mb-4">{item?.name}</h1>
             <div className="flex items-center gap-6 text-white/40 mb-6">
                  <div className="flex items-center gap-1.5">
                     <Star size={14} className="text-brand-500 fill-brand-500" />
                     <span className="text-sm font-black text-white/80">{avgRating}</span>
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">({item?.reviews?.length || 0} reviews)</span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/20 mx-1" />
                  <div className="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest">
                     <Clock size={14} /> {item?.preparationTime || 15} Mins
                  </div>
              </div>

              <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/5 p-4 rounded-[2rem]">
                 <div className="flex flex-col gap-1">
                    <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em]">Investment Per Unit</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-display font-bold text-brand-500">₹{item?.price}</span>
                       {item?.originalPrice && <span className="text-xs font-bold text-white/20 line-through tracking-tighter">₹{item?.originalPrice}</span>}
                    </div>
                 </div>
                 <QuantityStepper value={quantity} onChange={setQuantity} min={1} />
              </div>
          </div>
        </div>

        <div className="px-8 pt-8">


          <div className="flex items-center gap-2 mb-8 bg-white/5 p-2 rounded-[2rem] border border-white/5">
             <div className="flex-1 bg-black/20 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-charcoal-500 mb-1">SKU CODE</p>
                <p className="text-xs font-bold text-brand-500">{item?.sku || 'N/A'}</p>
             </div>
             <div className="flex-1 bg-black/20 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-charcoal-500 mb-1">TAX (GST)</p>
                <p className="text-xs font-bold text-emerald-500">{item?.tax || 0}% Inc.</p>
             </div>
          </div>

          <div className="space-y-8">
             {item?.modifiers?.map((mod) => (
               <div key={mod.name}>
                  <div className="flex justify-between items-center mb-3 text-white">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500">Choice of {mod.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-white">
                     {mod?.options?.map((opt) => {
                       const isSelected = selectedModifiers[mod.name] === opt._id;
                       return (
                         <motion.button key={opt._id} onClick={() => handleModifierSelect(mod.name, opt._id)} whileTap={{ scale: 0.95 }} className={`p-4 rounded-3xl font-bold transition-all border-2 text-left group ${isSelected ? 'border-brand-500 bg-brand-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}>
                            <p className={`text-sm mb-0.5 transition-colors ${isSelected ? 'text-white' : 'text-charcoal-400'}`}>{opt.name}</p>
                            {opt.price > 0 ? <span className="text-[9px] font-black uppercase tracking-widest text-brand-500">+₹{opt.price}</span> : <span className="text-[9px] font-black uppercase tracking-widest text-charcoal-600">Free</span>}
                         </motion.button>
                       );
                     })}
                  </div>
               </div>
             ))}
          </div>

          {/* Combo Items Section */}
          {item?.items?.length > 0 && (
             <div className="mb-10 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500">Includes in this Combo</h3>
                <div className="grid grid-cols-1 gap-3">
                   {item.items.map((ci, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                         <div className="w-12 h-12 rounded-2xl overflow-hidden bg-charcoal-800 shrink-0 border border-white/5">
                            <img src={ci.item?.image} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-bold text-white uppercase">{ci.item?.name}</p>
                            <p className="text-[9px] font-black text-charcoal-500 uppercase tracking-widest">{ci.item?.category?.name || 'Main Course'}</p>
                         </div>
                         <div className="text-right">
                            <span className="bg-brand-500/10 text-brand-500 text-[10px] font-black px-3 py-1 rounded-lg border border-brand-500/10 uppercase">x{ci.quantity}</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          <div className="flex justify-between items-baseline mb-6 border-t border-white/5 pt-8">
             <p className="text-charcoal-700 dark:text-charcoal-300 font-medium leading-relaxed italic opacity-90 text-sm">{item?.description}</p>
          </div>

          <div className="border-t border-white/5 pt-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black font-display uppercase tracking-[0.2em]">Guest Reviews</h2>
              <button onClick={() => setShowReviewForm(true)} className="text-brand-500 text-[10px] font-black uppercase tracking-widest border border-brand-500/20 px-4 py-2 rounded-xl bg-brand-500/5 hover:bg-brand-500 hover:text-charcoal-900 transition-all">Write Review</button>
            </div>

            <AnimatePresence>
              {showReviewForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReviewForm(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                  <motion.form initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} onSubmit={handleReviewSubmit} className="relative w-full max-w-sm bg-charcoal-900 border border-white/10 p-8 rounded-[3rem] shadow-2xl space-y-6">
                    <div className="text-center">
                       <h3 className="text-2xl font-bold font-display uppercase tracking-widest text-brand-500">Your Feedback</h3>
                       <p className="text-[10px] text-charcoal-400 mt-2 font-black uppercase tracking-[0.2em]">We value your taste!</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-charcoal-500 ml-4 mb-2 block">Name</label>
                        <input required placeholder="Your Name" value={reviewData.userName} onChange={e => setReviewData({...reviewData, userName: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-xs outline-none focus:border-brand-500 transition-colors" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-charcoal-500 ml-4 mb-2 block">Rating</label>
                        <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-5 py-4">
                           {[1,2,3,4,5].map(star => <Star key={star} size={20} onClick={() => setReviewData({...reviewData, rating: star})} className={`cursor-pointer transition-all hover:scale-125 ${star <= reviewData.rating ? 'text-brand-500 fill-brand-500' : 'text-white/10'}`} />)}
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-charcoal-500 ml-4 mb-2 block">Comment</label>
                        <textarea required placeholder="Tell us what you liked..." value={reviewData.comment} onChange={e => setReviewData({...reviewData, comment: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-xs outline-none focus:border-brand-500 transition-colors h-32 resize-none" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setShowReviewForm(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Cancel</button>
                      <button disabled={submittingReview} className="flex-[2] bg-brand-500 text-charcoal-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-500/20 disabled:opacity-50 font-display">{submittingReview ? 'Posting...' : 'Submit'}</button>
                    </div>
                  </motion.form>
                </div>
              )}
            </AnimatePresence>
            
            <div className="space-y-6">
              {item?.reviews?.length > 0 ? item.reviews.map((rev, idx) => (
                <div key={idx} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 hover:border-brand-500/20 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-black uppercase text-brand-500">{rev.userName?.slice(0, 2)}</div>
                      <span className="text-sm font-bold text-white/90">{rev.userName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={s <= rev.rating ? 'text-brand-500 fill-brand-500' : 'text-white/10'} />)}
                    </div>
                  </div>
                  <p className="text-xs text-charcoal-400 leading-relaxed italic px-2">"{rev.comment}"</p>
                  <p className="text-[9px] font-black uppercase text-charcoal-600 mt-5 tracking-[0.2em] text-right">{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
              )) : (
                <div className="text-center py-16 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center">
                   <Star size={32} className="text-white/5 mb-4" />
                   <p className="font-display text-sm font-black uppercase text-white/20 tracking-[0.3em]">No Reviews Yet</p>
                   <p className="text-[9px] uppercase font-black text-charcoal-600 mt-2 tracking-widest">Be the first player to rate this!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-charcoal-900/80 backdrop-blur-3xl border-t border-charcoal-900/10 dark:border-white/5 p-4 z-50 transition-colors duration-300">
         <div className="max-w-lg mx-auto flex items-center gap-4 px-6 py-2">
            <motion.button 
               onClick={() => {
                  handleAddToCart();
                  setIsCartOpen(true);
               }} 
               whileTap={{ scale: 0.95 }} 
               className="flex-1 h-14 bg-white dark:bg-white/5 text-charcoal-900 dark:text-white rounded-2xl font-black flex flex-col items-center justify-center gap-0 border border-charcoal-900/10 dark:border-white/10 shadow-sm group"
            >
               <ShoppingBag size={14} className="mb-0.5 group-hover:scale-110 transition-transform" />
               <span className="text-[10px] uppercase tracking-widest">Add to Cart</span>
            </motion.button>

            <motion.button 
               onClick={handleMainOrderAction} 
               disabled={isBooking}
               whileTap={{ scale: 0.95 }} 
               className="flex-[2] h-14 bg-brand-500 text-charcoal-900 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-brand-500/20 disabled:opacity-50 active:shadow-inner"
            >
              <AnimatePresence mode="wait">
                 {isBooking ? (
                   <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-charcoal-900/20 border-t-charcoal-900 rounded-full animate-spin" />
                      <span className="text-xs uppercase tracking-widest">Processing</span>
                   </motion.div>
                 ) : addedToCart ? (
                   <motion.div key="conf" initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-2">
                      <Check size={18} strokeWidth={4} /> 
                      <span className="text-xs uppercase tracking-widest">Added</span>
                   </motion.div>
                 ) : (
                   <motion.div key="order" initial={{ y: 20 }} animate={{ y: 0 }} className="flex flex-col items-center leading-none">
                      <span className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-1">Direct Order</span>
                      <span className="text-sm font-bold">₹{currentPrice * quantity}</span>
                   </motion.div>
                 )}
              </AnimatePresence>
            </motion.button>
         </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <AnimatePresence>
        {showTableModal && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTableModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-lg bg-charcoal-900 border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] p-8 max-h-[85vh] overflow-y-auto">
               <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold font-display uppercase tracking-widest text-brand-500">Pick Your Table</h3>
                  <p className="text-[10px] text-charcoal-400 mt-2 font-black uppercase tracking-[0.2em]">Select an available spot to feast</p>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                  {tables
                    .filter(t => t.isAvailable)
                    .map((table) => {
                      const isOccupied = table.status === 'Occupied' || table.status === 'Reserved';
                      const isSelected = tempTable === table.tableName;
                      return (
                        <button 
                          key={table._id} 
                          disabled={isOccupied || isBooking} 
                          onClick={() => setTempTable(table.tableName)} 
                          className={`p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-2 relative overflow-hidden group ${isSelected ? 'border-brand-500 bg-brand-500/10' : isOccupied ? 'border-white/5 bg-white/5 opacity-50 grayscale cursor-not-allowed' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                        >
                           <div className="flex justify-between items-start">
                              <span className={`text-2xl font-display font-bold ${isSelected ? 'text-brand-500' : 'text-white'}`}>{table.tableName}</span>
                              <div className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`} />
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-charcoal-500 text-ellipsis overflow-hidden">{table.status}</p>
                              <p className="text-[8px] font-bold text-charcoal-400">{table.capacity} Person Capacity</p>
                           </div>
                           {isOccupied && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white -rotate-12 border-2 border-white/20 px-3 py-1 rounded-lg bg-black/60">Reserved</span>
                              </div>
                           )}
                           {isSelected && <div className="absolute top-2 right-2"><Check size={16} className="text-brand-500" /></div>}
                        </button>
                      );
                    })}
               </div>

               <AnimatePresence>
                 {tempTable && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                     <button 
                       onClick={handleBookTable}
                       disabled={isBooking}
                       className="w-full py-5 bg-brand-500 text-charcoal-900 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 mb-4 flex items-center justify-center gap-3 font-display"
                     >
                       {isBooking ? (
                         <>
                           <div className="w-4 h-4 border-2 border-charcoal-900/20 border-t-charcoal-900 rounded-full animate-spin" />
                           Booking...
                         </>
                       ) : (
                         <>Confirm Booking & Order</>
                       )}
                     </button>
                   </motion.div>
                 )}
               </AnimatePresence>
               
               <button onClick={() => { setShowTableModal(false); setTempTable(null); }} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-charcoal-500 hover:text-white transition-colors">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}



