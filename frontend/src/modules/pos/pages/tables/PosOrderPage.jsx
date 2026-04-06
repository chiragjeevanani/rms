import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Minus, Trash2, Receipt, ArrowLeft, ArrowRight,
  ChevronDown, User, Users, Edit3, Bell, 
  ChevronUp, Star, Wine, Soup, Apple, Zap, RefreshCw,
  Save, Printer, FileText, Send, PauseCircle, Split, 
  Ticket, Wallet, CheckCircle2, ShoppingBag, Truck, X, Check, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePos } from '../../context/PosContext';
import { printKOTReceipt } from '../../utils/printKOT';
import { printBillReceipt } from '../../utils/printBill';
import { playClickSound } from '../../utils/sounds';
import PosTopNavbar from '../../components/PosTopNavbar';
import toast from 'react-hot-toast';

export default function PosOrderPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { 
    placeKOT, settleOrder, orders, fetchActiveTableOrders, loading: contextLoading 
  } = usePos();
  
  // Real-time data from backend
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shortCode, setShortCode] = useState('');
  
  // Cart & Order State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Dine-In'); // Dine-In, Takeaway, Delivery
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [selectedWaiter, setSelectedWaiter] = useState({ name: 'Staff' });
  
  // Financial State
  const [discount, setDiscount] = useState({ amount: 0, type: 'fixed', reason: '' });
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [containerCharge, setContainerCharge] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [customerPaid, setCustomerPaid] = useState(0);

  // Multi-Payment State
  const [payments, setPayments] = useState([]); // [{ method, amount }]
  const [isMultiPaymentModalOpen, setIsMultiPaymentModalOpen] = useState(false);
  
  // Split Billing State
  const [splitItems, setSplitItems] = useState([]); // [{ name, amount, status }]
  const [splitCount, setSplitCount] = useState(2);

  // Table Management State
  const [isTableMoveModalOpen, setIsTableMoveModalOpen] = useState(false);
  const [targetTable, setTargetTable] = useState('');

  // Modals
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isExtraMenuOpen, setIsExtraMenuOpen] = useState(false);
  const [isCustomerSectionOpen, setIsCustomerSectionOpen] = useState(false);

  // Fetch Menu Data
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [catRes, itemRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/category`),
          fetch(`${import.meta.env.VITE_API_URL}/item`)
        ]);
        const [catData, itemData] = await Promise.all([catRes.json(), itemRes.json()]);
        if (catData.success) setCategories(catData.data);
        if (itemData.success) setMenuItems(itemData.data);
      } catch (err) {
        toast.error('Failed to load menu data');
      }
    };
    fetchMenu();
  }, []);

  // Find current order for this table from Context
  const activeOrder = useMemo(() => {
    return Object.values(orders).find(o => o.tableName === tableId || o.tableId === tableId);
  }, [orders, tableId]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.code?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' ? true : item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const addToCart = (item) => {
    playClickSound();
    setCart(prev => {
      const existing = prev.find(i => i.id === item._id || i._id === item._id);
      if (existing) {
        return prev.map(i => (i.id === item._id || i._id === item._id) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        ...item, 
        id: item._id, 
        price: item.basePrice || item.price || 0,
        quantity: 1, 
        kotId: Date.now() 
      }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId && i._id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId || item._id === itemId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  // Logic for totals
  const financials = useMemo(() => {
    const unplacedItems = cart;
    const placedItems = activeOrder?.items || [];
    const allItems = [...placedItems, ...unplacedItems];
    
    const subTotal = allItems.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0);
    const tax = Math.round(subTotal * 0.05); // 5% GST
    
    let discAmount = 0;
    if (discount.type === 'percentage') {
       discAmount = Math.round((subTotal * (discount.amount || 0)) / 100);
    } else {
       discAmount = Number(discount.amount || 0);
    }

    const total = (subTotal + tax + Number(deliveryCharge || 0) + Number(containerCharge || 0) + Number(serviceCharge || 0)) - discAmount;
    
    return {
       subTotal: subTotal || 0,
       tax: tax || 0,
       discountAmount: discAmount || 0,
       grandTotal: Math.round(total) || 0,
       roundOff: Number((Math.round(total) - total).toFixed(2))
    };
  }, [cart, activeOrder, discount, deliveryCharge, containerCharge, serviceCharge]);

  // Handlers
  const handleKOT = async (isPrint = false) => {
    playClickSound();
    if (cart.length === 0) return;
    
    const data = {
       tableName: tableId, 
       items: cart.map(i => ({
         itemId: i.id || i._id,
         name: i.name,
         quantity: i.quantity,
         price: i.price,
         image: i.image
       })),
       subTotal: financials.subTotal,
       tax: financials.tax,
       discount: { amount: discount.amount, type: discount.type, reason: discount.reason },
       serviceCharge,
       deliveryCharge,
       containerCharge,
       grandTotal: financials.grandTotal,
       orderType,
       waiterName: selectedWaiter.name
    };

    const success = await placeKOT(tableId, data.items, data, selectedWaiter);
    if (success) {
      if (isPrint) printKOTReceipt({ items: cart }, { name: tableId });
      setCart([]);
      navigate('/pos/tables');
    }
  };

  const handleSettle = async (isPrint = false) => {
    if (!activeOrder && cart.length === 0) {
       toast.error("No items to settle");
       return;
    }

    if (!activeOrder && cart.length > 0) {
      toast.error("Please place KOT first or implement direct settling");
      return;
    }

    const paymentsToUse = payments.length > 0 ? payments : [{ method: paymentMode, amount: financials.grandTotal }];
    
    if (payments.length > 0) {
      const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
      if (paidTotal < financials.grandTotal) {
        toast.error(`Short by ₹${financials.grandTotal - paidTotal}. Please add more payment.`);
        return;
      }
    }

    const success = await settleOrder(activeOrder._id, paymentsToUse);
    if (success) {
      if (isPrint) printBillReceipt({ ...activeOrder, cart }, { name: tableId }, { total: financials.grandTotal, ...financials });
      navigate('/pos/tables');
    }
  };

  const addPayment = (method, amount) => {
     setPayments(prev => [...prev, { method, amount: Number(amount) }]);
  };

  const removePayment = (index) => {
     setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSplitBill = () => {
     const perPerson = Math.floor(financials.grandTotal / splitCount);
     const splits = Array.from({ length: splitCount }, (_, i) => ({
        customerName: `Guest ${i + 1}`,
        amount: i === splitCount - 1 ? financials.grandTotal - (perPerson * (splitCount - 1)) : perPerson,
        status: 'Pending'
     }));
     setSplitItems(splits);
     setIsSplitModalOpen(true);
  };

  return (
    <div className="h-screen bg-[#F4F4F7] flex flex-col font-sans text-gray-800 overflow-hidden">
      <PosTopNavbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-[12%] bg-[#6D6D6D] flex flex-col shrink-0">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`w-full p-4 text-left font-bold text-[11px] uppercase tracking-wider border-b border-white/10 transition-all ${selectedCategory === 'all' ? 'bg-white text-gray-800 border-r-4 border-r-[#5D4037]' : 'text-white'}`}
          >
            All Menu
          </button>
          <div className="flex-1 overflow-y-auto">
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`w-full p-4 text-left font-bold text-[11px] uppercase tracking-wider border-b border-white/10 transition-all ${selectedCategory === cat._id ? 'bg-white text-gray-800 border-r-4 border-r-[#5D4037]' : 'text-white hover:bg-white/5'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Area */}
        <div className="flex-1 flex flex-col bg-[#E0E0E0] border-r border-gray-300">
          <div className="p-2 flex gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search Item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border-2 border-gray-400 rounded-md text-sm font-bold focus:outline-none"
              />
            </div>
            <button className="bg-white border-2 border-gray-400 p-2 rounded-md"><RefreshCw size={20} className="text-gray-500" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 content-start no-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredItems.map(item => (
                <button
                  key={item._id}
                  onClick={() => addToCart(item)}
                  className="bg-white p-0 rounded-xl shadow-sm border border-gray-300 overflow-hidden flex flex-col transition-all hover:shadow-xl group active:scale-95"
                >
                  <div className="h-28 relative overflow-hidden">
                    <img 
                      src={item.image || `https://source.unsplash.com/400x400/?food,${item.name}`} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black text-white">₹{item.basePrice || item.price}</div>
                  </div>
                  <div className="p-3 text-left">
                    <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight line-clamp-2">{item.name}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">{item.code || 'ITEM'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary Area */}
        <div className="w-[35%] flex flex-col bg-white shrink-0 scrollbar-hide border-l border-gray-200">
          <div className="flex bg-[#424242] h-14 shrink-0">
            {['Dine-In', 'Takeaway', 'Delivery'].map(type => (
              <button 
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 font-black text-xs uppercase tracking-[0.2em] transition-all ${orderType === type ? 'bg-[#5D4037] text-white' : 'text-white/40 hover:bg-white/5'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FFC107] rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                   <Soup size={20} className="text-[#5D4037]" />
                </div>
                <div>
                   <h2 className="text-lg font-black text-slate-900 tracking-tighter uppercase">{tableId}</h2>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{activeOrder?.orderNumber || 'New Order'}</p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => setIsCustomerSectionOpen(!isCustomerSectionOpen)} className={`p-2 rounded-lg border border-slate-200 ${isCustomerSectionOpen ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                   <User size={18} />
                </button>
                <button className="p-2 rounded-lg border border-slate-200 bg-white"><Bell size={18} /></button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
             {activeOrder?.items?.map(item => (
                <div key={item._id} className="p-4 border-b border-dashed border-gray-100 bg-slate-50/50 flex items-center justify-between opacity-80">
                   <div className="flex items-center gap-4">
                      <span className="text-[11px] font-black text-slate-400">{item.quantity}x</span>
                      <span className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">{item.name}</span>
                   </div>
                   <span className="text-[12px] font-black text-slate-600">₹{item.price * item.quantity}</span>
                </div>
             ))}

             {cart.map(item => (
                <div key={item.id} className="p-4 border-b border-gray-100 flex items-center justify-between group">
                   <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden">
                         <button onClick={() => updateQuantity(item.id, -1)} className="p-1 px-3 hover:bg-slate-200"><Minus size={12} /></button>
                         <span className="px-3 text-xs font-black">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.id, 1)} className="p-1 px-3 hover:bg-slate-200"><Plus size={12} /></button>
                      </div>
                      <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight truncate max-w-[120px]">{item.name}</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="text-[12px] font-black text-slate-950">₹{item.price * item.quantity}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                   </div>
                </div>
             ))}
             
             {(!activeOrder && !cart.length) && (
                <div className="p-20 text-center flex flex-col items-center gap-4 opacity-10">
                   <ShoppingBag size={48} />
                   <p className="text-[10px] font-black uppercase tracking-widest uppercase">Cart Empty</p>
                </div>
             )}
          </div>

          <div className="bg-[#1E1E1E] p-10 flex flex-col gap-8 shadow-2xl">
             <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 tracking-widest">
                      <span>Subtotal</span>
                      <span className="text-white">₹{financials.subTotal}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 tracking-widest">
                      <span>Tax (5%)</span>
                      <span className="text-white">₹{financials.tax}</span>
                   </div>
                   <button onClick={() => setIsDiscountModalOpen(true)} className="flex justify-between items-center w-full text-[10px] font-black uppercase tracking-widest">
                      <span className="text-cyan-400">Discount</span>
                      <span className="text-cyan-400">-₹{financials.discountAmount}</span>
                   </button>
                </div>
                <div className="flex flex-col items-end justify-center">
                   <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">Total Amount</p>
                   <h1 className="text-5xl font-black text-white tracking-tighter leading-none italic">₹{financials.grandTotal}</h1>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleKOT(true)}
                  disabled={!cart.length}
                  className="bg-white text-slate-900 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-slate-100 transition-all disabled:opacity-20 active:scale-95 flex items-center justify-center gap-3"
                >
                   <Send size={18} /> Place Order (KOT)
                </button>
                <button 
                  onClick={handleSettle}
                  className="bg-emerald-500 text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                   <CheckCircle2 size={18} /> Settle Bill
                </button>
             </div>
             
             <div className="grid grid-cols-3 gap-3">
                <button onClick={handleSplitBill} className="bg-slate-800 text-white p-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 border border-white/5 hover:bg-slate-700">
                   <Split size={14} /> Split Bill
                </button>
                <button onClick={() => setIsMultiPaymentModalOpen(true)} className="bg-slate-800 text-white p-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 border border-white/5 hover:bg-slate-700">
                   <Wallet size={14} /> Multi-Pay
                </button>
                <button onClick={() => setIsTableMoveModalOpen(true)} className="bg-slate-800 text-white p-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 border border-white/5 hover:bg-slate-700">
                   <ArrowRight size={14} /> Move Table
                </button>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMultiPaymentModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMultiPaymentModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[3rem] p-12 max-w-2xl w-full relative z-10 shadow-3xl text-slate-900">
               <div className="flex justify-between items-start mb-8">
                  <div>
                     <h2 className="text-3xl font-black uppercase tracking-tighter italic">Split Payment</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pay using multiple methods</p>
                  </div>
                  <button onClick={() => setIsMultiPaymentModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
               </div>

               <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Add Payment</p>
                     <div className="grid grid-cols-2 gap-2">
                        {['Cash', 'Card', 'UPI', 'Cheque'].map(m => (
                           <button key={m} onClick={() => addPayment(m, financials.grandTotal - payments.reduce((sum, p) => sum + p.amount, 0))} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-[11px] uppercase hover:border-slate-900 transition-all">{m}</button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Summary</p>
                     <div className="bg-slate-900 rounded-[2rem] p-6 text-white min-h-[160px]">
                        {payments.length === 0 && <p className="text-white/20 text-[10px] font-black uppercase text-center mt-12">No payments added</p>}
                        {payments.map((p, i) => (
                           <div key={i} className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-black uppercase text-white/60">{p.method}</span>
                              <div className="flex items-center gap-3">
                                 <span className="text-sm font-black italic">₹{p.amount}</span>
                                 <button onClick={() => removePayment(i)} className="text-rose-500"><X size={14} /></button>
                              </div>
                           </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center italic">
                           <span className="text-[10px] font-black uppercase text-amber-400 italic">Balance</span>
                           <span className="text-lg font-black tracking-tighter italic">₹{Math.max(0, financials.grandTotal - payments.reduce((sum, p) => sum + p.amount, 0))}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <button onClick={() => handleSettle(true)} disabled={payments.reduce((sum, p) => sum + p.amount, 0) < financials.grandTotal} className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs mt-10 shadow-xl shadow-emerald-500/10 active:scale-95 transition-all disabled:opacity-20">Finalize Payment</button>
            </motion.div>
          </div>
        )}

        {isSplitModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSplitModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[3rem] p-12 max-w-lg w-full relative z-10 shadow-3xl text-slate-900">
               <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-8">Split Bill</h2>
               <div className="mb-8 flex items-center justify-between bg-slate-50 p-6 rounded-[2rem]">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Total Persons</span>
                  <div className="flex items-center gap-6">
                     <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm"><Minus size={16} /></button>
                     <span className="text-2xl font-black italic">{splitCount}</span>
                     <button onClick={() => { setSplitCount(splitCount + 1); handleSplitBill(); }} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm"><Plus size={16} /></button>
                  </div>
               </div>
               <div className="space-y-4 mb-8">
                  {splitItems.map((s, i) => (
                     <div key={i} className="flex justify-between items-center p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <span className="text-[11px] font-black uppercase text-slate-900 tracking-widest">{s.customerName}</span>
                        <span className="text-lg font-black italic tracking-tighter">₹{s.amount}</span>
                     </div>
                  ))}
               </div>
               <button className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl active:scale-95 transition-all">Settle Split Bill</button>
            </motion.div>
          </div>
        )}

        {isDiscountModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDiscountModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-10 max-w-md w-full relative z-10 shadow-2xl">
               <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Add Discount</h2>
               <div className="space-y-6">
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Discount Type</label>
                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setDiscount({ ...discount, type: 'fixed' })} className={`py-4 rounded-xl font-black text-[10px] uppercase border ${discount.type === 'fixed' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Fixed Amount</button>
                        <button onClick={() => setDiscount({ ...discount, type: 'percentage' })} className={`py-4 rounded-xl font-black text-[10px] uppercase border ${discount.type === 'percentage' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Percentage %</button>
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Value</label>
                     <input 
                       type="number" 
                       value={discount.amount} 
                       onChange={(e) => setDiscount({ ...discount, amount: e.target.value })} 
                       className="w-full p-5 bg-slate-100 rounded-2xl text-xl font-black focus:outline-none focus:ring-2 focus:ring-slate-900" 
                       placeholder="Enter amount..."
                     />
                  </div>
                  <button onClick={() => setIsDiscountModalOpen(false)} className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl text-xs mt-6">Apply Discount</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
