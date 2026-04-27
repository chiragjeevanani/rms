import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrders } from '../../../context/OrderContext';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ArrowLeft, 
  Clock, 
  ShieldCheck,
  Utensils,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function CheckoutPage() {
  const { subtotal, tax, total, items, orderType, tableNumber, clearCart } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const { createOrder } = useOrders();

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    
    const newOrder = {
      tableName: tableNumber || '7',
      items: items.map(item => ({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      orderType: orderType === 'dine-in' ? 'Dine-In' : (orderType || 'Dine-In'),
      subTotal: subtotal,
      tax: tax,
      grandTotal: total,
      waiterName: 'Customer App'
    };

    createOrder(newOrder);
    clearCart();

    setTimeout(() => {
      navigate('/order-success');
    }, 2500);
  };

  const methods = [
    { id: 'card', name: 'Credit / Debit Card', icon: CreditCard, sub: 'Safe with Stripe' },
    { id: 'upi', name: 'UPI Transfer', icon: Smartphone, sub: 'Popular apps' },
    { id: 'cash', name: 'Pay at Counter', icon: Banknote, sub: 'After your meal' },
  ];

  const taxes = tax;
  const grandTotal = total;

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-white selection:bg-brand-500 selection:text-charcoal-900 transition-colors duration-300">
      <div className="max-w-lg mx-auto px-6 pt-8 pb-32">
        <header className="flex items-center gap-6 mb-12">
           <button 
             onClick={() => navigate(-1)}
             className="w-12 h-12 bg-white border border-charcoal-900/10 dark:bg-white/5 dark:border-white/5 rounded-2xl flex items-center justify-center text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none"
           >
              <ArrowLeft size={22} />
           </button>
           <div>
              <h1 className="text-4xl font-display font-bold tracking-tight">Checkout</h1>
              <p className="text-charcoal-500 font-black mt-1 uppercase text-[10px] tracking-[0.2em]">SECURE TRANSACTION</p>
           </div>
        </header>

        <main className="space-y-10">
          {/* Order Summary & Payment */}
          <section className="bg-white dark:bg-charcoal-800 rounded-[2.5rem] p-8 border border-charcoal-900/10 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-2xl">
             <div className="flex justify-between items-center mb-8 border-b border-charcoal-900/10 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500">
                      <Utensils size={20} />
                   </div>
                   <span className="font-display font-bold text-lg capitalize text-charcoal-900 dark:text-white">Order Summary</span>
                </div>
                <div className="bg-charcoal-900/5 dark:bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-charcoal-700 dark:text-charcoal-400">
                   Table {tableNumber}
                </div>
             </div>

             {/* Order Details List */}
             <div className="space-y-6 mb-8">
                {items.map((item) => (
                  <div key={item.cartId} className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-charcoal-50 dark:bg-white/5 border border-charcoal-100 dark:border-white/10 overflow-hidden shrink-0">
                       <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                       <h4 className="text-sm font-bold text-charcoal-900 dark:text-white">{item.name}</h4>
                       <p className="text-[10px] font-black text-charcoal-400 uppercase tracking-widest">{item.quantity} Unit · ₹{item.price}</p>
                    </div>
                    <span className="text-sm font-bold text-charcoal-900 dark:text-white">₹{item.price * item.quantity}</span>
                  </div>
                ))}
             </div>

             <div className="space-y-4 pt-6 border-t border-charcoal-900/10 dark:border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal-600 dark:text-charcoal-500 mb-4">Payment Method</h3>
                <div className="p-6 rounded-[2rem] border-2 border-brand-500 bg-brand-500/5 flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-500 text-charcoal-900 border-b-4 border-black/20">
                         <Banknote size={22} strokeWidth={2.5} />
                      </div>
                      <div className="text-left">
                         <p className="font-bold text-charcoal-900 dark:text-white">Pay at Counter</p>
                         <p className="text-[10px] uppercase font-black tracking-widest mt-1 text-brand-600 dark:text-brand-400">Settlement after your meal</p>
                      </div>
                   </div>
                   <div className="w-6 h-6 rounded-full border-2 border-brand-500 bg-brand-500 ring-4 ring-brand-500/20 flex items-center justify-center">
                      <ShieldCheck size={12} className="text-charcoal-900" />
                   </div>
                </div>
             </div>
          </section>

          {/* Time Guarantee */}
          <div className="bg-white dark:bg-white/5 rounded-3xl p-6 text-charcoal-900 dark:text-white flex items-center justify-between border border-charcoal-900/10 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
             <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-charcoal-600 dark:text-charcoal-500 mb-1">Preparation Time</p>
                <div className="flex items-center gap-2 text-brand-500">
                   <Clock size={16} strokeWidth={3} />
                   <span className="text-lg font-display font-bold">
                     {items.reduce((total, i) => total + (Number(i.preparationTime || 15) * i.quantity), 0)} minutes
                   </span>
                </div>
             </div>
             <ShieldCheck size={32} className="text-charcoal-700" />
          </div>

          {/* Bill Summary */}
          <div className="bg-white dark:bg-charcoal-800 rounded-[2.5rem] p-10 border border-charcoal-900/10 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-2xl">
             <div className="space-y-4 mb-8">
                {items.map(item => (
                  <div key={item.cartId} className="flex justify-between text-sm font-medium text-charcoal-500 dark:text-charcoal-400">
                     <span className="truncate max-w-[150px]">{item.quantity}× {item.name}</span>
                     <span className="text-charcoal-900 dark:text-white">₹{item.price * item.quantity}</span>
                  </div>
                ))}
             </div>

             <div className="h-[1px] bg-charcoal-900/10 dark:bg-white/5 w-full mb-8" />

             <div className="space-y-4 mb-10">
                <div className="flex justify-between text-sm font-medium text-charcoal-400">
                   <span>GST (18%)</span>
                   <span className="text-charcoal-900 dark:text-white">₹{taxes}</span>
                </div>
                <div className="flex justify-between text-3xl font-display font-bold text-charcoal-900 dark:text-white pt-4">
                   <span>Total</span>
                   <span className="text-brand-500">₹{grandTotal}</span>
                </div>
             </div>

             <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={handlePlaceOrder}
                className="w-full bg-brand-500 text-charcoal-900 py-5 rounded-[1.5rem] font-black shadow-xl shadow-brand-500/20 disabled:opacity-50 group flex items-center justify-center gap-3"
                disabled={isProcessing}
             >
                {isProcessing ? (
                   <div className="w-5 h-5 border-2 border-charcoal-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Confirm Order <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                )}
             </motion.button>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isProcessing && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-charcoal-900 flex flex-col items-center justify-center p-8 text-center"
           >
              <div className="relative mb-12">
                 <motion.div
                   animate={{ rotate: 360 }}
                   transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                   className="w-24 h-24 border-2 border-white/5 border-t-brand-500 rounded-full"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={32} className="text-brand-500 animate-pulse" />
                 </div>
              </div>
              <h2 className="text-3xl font-display font-bold mb-4 tracking-tight">Crafting Your Feast</h2>
              <p className="text-charcoal-500 max-w-xs font-medium italic opacity-80 leading-relaxed">
                 "Patience is the secret ingredient for a perfect meal."
              </p>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



