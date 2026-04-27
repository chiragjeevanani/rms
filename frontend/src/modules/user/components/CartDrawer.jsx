import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, ArrowRight, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export function CartDrawer({ isOpen, onClose }) {
  const { items, updateQuantity, removeFromCart, clearCart, total, itemCount, isOrderOnline } = useCart();
  const navigate = useNavigate();

  if (!isOrderOnline) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-cream-50 dark:bg-charcoal-900 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-charcoal-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-charcoal-900">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Your <span className="text-brand-500">Cart</span></h2>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-charcoal-400 uppercase tracking-widest">{itemCount} Items Added</p>
                    {items.length > 0 && (
                      <button 
                        onClick={() => { if(window.confirm('Clear your entire cart?')) clearCart(); }}
                        className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-charcoal-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag size={48} className="mb-4 text-charcoal-300" />
                  <p className="text-xs font-black uppercase tracking-widest">Cart is empty</p>
                  <p className="text-[10px] mt-2">Add some delicious food to start ordering</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.cartId} className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-charcoal-100 dark:bg-white/5 shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold truncate pr-2">{item.name}</h4>
                        <button 
                          onClick={() => removeFromCart(item.cartId)}
                          className="text-charcoal-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-[10px] font-bold text-brand-500 mt-1">₹{item.price}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 bg-charcoal-100 dark:bg-white/5 rounded-lg p-1 px-2 border border-charcoal-200/10">
                          <button 
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                            className="p-1 hover:text-brand-500 transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                            className="p-1 hover:text-brand-500 transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className="text-xs font-black">₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 bg-white dark:bg-white/5 border-t border-charcoal-100 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-charcoal-400">Total Amount</span>
                  <span className="text-2xl font-display font-bold text-brand-500">₹{total}</span>
                </div>
                <button 
                  onClick={() => {
                    onClose();
                    navigate('/checkout');
                  }}
                  className="w-full py-4 bg-brand-500 text-charcoal-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Confirm Order
                  <ArrowRight size={16} strokeWidth={3} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
