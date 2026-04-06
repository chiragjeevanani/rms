import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle2, Search, Filter, 
  MoreVertical, Receipt, ChevronRight,
  Timer, AlertCircle, Utensils, RefreshCcw,
  Zap, ArrowRight, User, Menu, X, Trash2, Printer, Globe,
  Plus, ShoppingBag, ShoppingCart, CreditCard, ChevronDown, Check,
  Minus, Layout, Sparkles, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { usePos } from '../../context/PosContext';
import { useNavigate, useLocation } from 'react-router-dom';

const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''));

export default function ActiveOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebar, tables, fetchActiveTableOrders } = usePos();

  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // New Order State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuSearch, setMenuSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/active`);
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuData = async () => {
    try {
      const [itemsRes, catsRes, combosRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/item`),
        fetch(`${import.meta.env.VITE_API_URL}/category`),
        fetch(`${import.meta.env.VITE_API_URL}/combo`)
      ]);
      const itemsData = await itemsRes.json();
      const catsData = await catsRes.json();
      const combosData = await combosRes.json();
      
      let allItems = Array.isArray(itemsData) ? itemsData.map(i => ({ 
        ...i, 
        price: i.basePrice || i.price || (i.variants && i.variants[0]?.price) || 0,
        categoryName: typeof i.category === 'object' ? i.category?.name : i.category
      })) : [];
      
      let allCombos = (combosData && combosData.success) ? combosData.data.map(c => ({ 
        ...c, 
        price: c.comboPrice || c.price || 0, 
        categoryName: 'Combos', 
        isCombo: true 
      })) : [];
      
      setMenuItems([...allItems, ...allCombos]);

      let backendCats = Array.isArray(catsData) ? catsData : [];
      // Manually add Popular and Combos to category list for filtering
      setCategories([
        { name: 'Popular', _id: 'popular' },
        ...backendCats,
        { name: 'Combos', _id: 'combos' }
      ]);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('newOrder') === 'true') {
      setShowOrderModal(true);
      fetchMenuData(); // Load menu for the modal
      // Clean up URL
      navigate('/pos/orders/active', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    fetchActiveOrders();
    fetchMenuData();

    socket.on('statusUpdated', (updatedOrder) => {
      fetchActiveOrders();
      if (selectedOrder?._id === updatedOrder._id) {
        setSelectedOrder(prev => ({ ...prev, ...updatedOrder }));
      }
    });

    socket.on('orderCreated', (newOrder) => {
       fetchActiveOrders();
       toast.success(`New Order: #${newOrder.orderNumber.split('-').pop()}`);
    });

    return () => {
      socket.off('statusUpdated');
      socket.off('orderCreated');
    };
  }, [selectedOrder]);

  const getOrderTimerLabel = (order) => {
    const maxPrepTime = Math.max(...order.items.map(i => i.itemId?.preparationTime || 15), 0);
    
    if (order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'confirmed') {
      return { label: 'EXPECTED PREP', value: `${maxPrepTime} MIN`, color: 'text-slate-400' };
    }

    if (order.status.toLowerCase() === 'preparing') {
      const startedAt = new Date(order.prepStartedAt || order.updatedAt);
      const diffMs = currentTime - startedAt;
      const targetMs = maxPrepTime * 60000;
      const remainingMs = targetMs - diffMs;
      
      const absRemaining = Math.abs(remainingMs);
      const minutes = Math.floor(absRemaining / 60000);
      const seconds = Math.floor((absRemaining % 60000) / 1000);
      
      return { 
        label: remainingMs < 0 ? 'ALERT' : 'COUNTDOWN', 
        value: remainingMs < 0 ? 'TIME OVER' : `${minutes}:${seconds.toString().padStart(2, '0')}`,
        color: remainingMs < 0 ? 'text-rose-500 animate-pulse font-black' : 'text-amber-500'
      };
    }

    if (order.status.toLowerCase() === 'ready') {
      const startedAt = new Date(order.prepStartedAt || order.createdAt);
      const readyAt = new Date(order.readyAt || order.updatedAt);
      const totalMinutes = Math.floor((readyAt - startedAt) / 60000);
      return { label: 'PREPARED IN', value: `${totalMinutes} MIN`, color: 'text-emerald-500 font-black' };
    }

    return { label: 'ELAPSED', value: `${Math.floor((currentTime - new Date(order.createdAt))/60000)} MIN`, color: 'text-slate-400' };
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    const status = order.status.toLowerCase();
    if (activeTab === 'Pending') return status === 'pending' || status === 'confirmed';
    return status === activeTab.toLowerCase();
  });

  const updateStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Cart Functions
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item._id);
      if (existing) {
        return prev.map(i => i.itemId === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { itemId: item._id, name: item.name, price: item.price, quantity: 1, image: item.image }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === itemId);
      if (existing?.quantity > 1) {
        return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.itemId !== itemId);
    });
  };

  const handleCreateOrder = async () => {
    if (!selectedTable) return toast.error('Please select a table');
    if (cart.length === 0) return toast.error('Cart is empty');

    setIsSubmitting(true);
    const subTotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const tax = Math.round(subTotal * 0.05);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: selectedTable,
          items: cart,
          subTotal,
          tax,
          grandTotal: subTotal + tax,
          orderType: 'Dine-In',
          waiterName: 'Staff Admin',
          source: 'pos terminal',
          status: 'Preparing'
        })
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Order Created Successfully');
        setShowOrderModal(false);
        setCart([]);
        setSelectedTable('');
        fetchActiveOrders();
      }
    } catch (err) {
      toast.error('Order creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    // Categorization logic
    let matchesCategory = true;
    if (selectedCategory === 'All') {
       matchesCategory = true;
    } else if (selectedCategory === 'Popular') {
       matchesCategory = item.isFeatured === true;
    } else if (selectedCategory === 'Combos') {
       matchesCategory = item.isCombo === true;
    } else {
       matchesCategory = item.categoryName === selectedCategory;
    }

    const matchesSearch = item.name?.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB] animate-in fade-in duration-700 overflow-hidden font-sans select-none relative">
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-[60] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={toggleSidebar} className="p-4 bg-slate-900 border border-slate-900 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10">
            <Menu size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Order Queue</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Active Service Floor</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowOrderModal(true)}
             className="h-14 px-8 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3 active:scale-95"
           >
              <Plus size={18} />
              Make Order for Customer
           </button>
           <button 
             onClick={fetchActiveOrders}
             className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all"
           >
             <RefreshCcw size={20} className={`text-slate-600 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </header>

      <div className="px-10 py-6 border-b border-slate-100 bg-white">
        <nav className="flex items-center gap-10">
          {[
            { id: 'all', label: 'All Orders', icon: Utensils },
            { id: 'Pending', label: 'New', icon: Clock },
            { id: 'Preparing', label: 'Preparing', icon: RefreshCcw },
            { id: 'Ready', label: 'Ready', icon: CheckCircle2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 py-2 border-b-2 transition-all ${
                activeTab === tab.id 
                ? 'border-slate-900 text-slate-900' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} />
              <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
          {filteredOrders.length === 0 ? (
             <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-30 italic">
                <Utensils size={48} className="text-slate-300 mb-6" />
                <p className="text-[11px] font-black uppercase tracking-[0.3em]">The queue is clear</p>
             </div>
          ) : filteredOrders.map((order) => {
            const timer = getOrderTimerLabel(order);
            const isManual = order.waiterName && order.waiterName !== 'Customer App';
            
            return (
              <motion.div
                key={order._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-slate-300 transition-all group overflow-hidden cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Table: {order.tableName}</span>
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">#{order.orderNumber.split('-').pop()}</h3>
                    </div>
                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                      order.status.toLowerCase() === 'ready' ? 'bg-emerald-50 text-emerald-600' : 
                      order.status.toLowerCase() === 'preparing' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {order.status}
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {order.items.slice(0, 2).map((item, i) => (
                      <div key={i} className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                         <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                            {item.itemId?.image ? (
                               <img src={item.itemId.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-200"><Utensils size={14} /></div>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate block">{item.name}</span>
                            <span className="text-[9px] font-bold text-slate-400">Qty: {item.quantity}</span>
                         </div>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center italic">+ {order.items.length - 2} More Items</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                     <div className={`flex flex-col ${timer.color}`}>
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-60 mb-0.5">{timer.label}</span>
                        <div className="flex items-center gap-2 font-black italic">
                           <Clock size={12} className="opacity-40" />
                           <span className="text-xs">{timer.value}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Value</span>
                        <span className="text-lg font-black text-slate-950 tracking-tighter italic">₹{order.grandTotal}</span>
                     </div>
                  </div>
                </div>

                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const currentStatus = order.status?.toLowerCase();
                    const nextStatus = (currentStatus === 'pending' || currentStatus === 'confirmed' || currentStatus === 'new') ? 'Preparing' : 'Ready';
                    updateStatus(order._id, nextStatus); 
                  }}
                  
                  disabled={order.status?.toLowerCase() === 'ready'}
                  className={`w-full py-5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                     order.status?.toLowerCase() === 'ready' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {order.status?.toLowerCase() === 'ready' ? (
                     <><CheckCircle2 size={16} /> Serving Ready</>
                  ) : (
                     <>
                        <Zap size={16} className={order.status?.toLowerCase() === 'preparing' ? 'text-amber-400' : 'text-slate-400'} />
                        { (order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'new' || order.status?.toLowerCase() === 'confirmed') ? 'Preparing' : 'Mark Ready' }
                     </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* NEW ORDER MODAL - THE FULL MENU EXPERIENCE */}
      <AnimatePresence>
         {showOrderModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 overflow-hidden select-none">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setShowOrderModal(false)}
                 className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.98, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.98, y: 30 }}
                 className="w-full max-w-7xl bg-[#F9FAFB] rounded-[3rem] shadow-3xl relative overflow-hidden flex h-full max-h-[90vh] border border-white"
               >
                  {/* Left Layer: Categories & Filter */}
                  <div className="w-[120px] bg-white border-r border-slate-100 flex flex-col items-center py-10 gap-8 shrink-0">
                      <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-4">
                         <Menu size={24} />
                      </div>
                      <div className="flex flex-col gap-6 w-full items-center overflow-y-auto no-scrollbar">
                         {['All', ...categories.map(c => c.name)].map((cat, idx) => (
                            <button
                               key={idx}
                               onClick={() => setSelectedCategory(cat)}
                               className={`w-20 aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group ${
                                  selectedCategory === cat ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                               }`}
                            >
                               <Utensils size={20} />
                               <span className="text-[8px] font-black uppercase tracking-widest text-center px-1 truncate w-full">{cat}</span>
                            </button>
                         ))}
                      </div>
                  </div>

                  {/* Center Layer: Item Grid */}
                  <div className="flex-1 flex flex-col overflow-hidden bg-[#F9FAFB]">
                      <header className="px-10 py-8 flex items-center justify-between shrink-0">
                         <div className="flex items-center gap-4">
                            <Sparkles className="text-amber-500" size={24} />
                            <div>
                               <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none">Global Menu</h3>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Items To Begin</p>
                            </div>
                         </div>
                         <div className="relative group w-96">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                              type="text" 
                              placeholder="SEARCH DISHES..." 
                              value={menuSearch}
                              onChange={(e) => setMenuSearch(e.target.value)}
                              className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-14 pr-6 text-xs font-black uppercase outline-none focus:ring-1 focus:ring-slate-900 shadow-sm"
                            />
                         </div>
                      </header>

                      <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 no-scrollbar scroll-smooth">
                         {filteredMenuItems.map(item => {
                            const inCart = cart.find(i => i.itemId === item._id);
                            return (
                               <motion.div 
                                 key={item._id}
                                 whileHover={{ y: -5 }}
                                 className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-slate-900 hover:shadow-2xl transition-all relative overflow-hidden flex flex-col h-[340px]"
                               >
                                  <div className="h-44 bg-slate-50 overflow-hidden relative group-hover:scale-105 transition-transform duration-700">
                                     {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200"><Utensils size={40} /></div>
                                     )}
                                     <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-xl px-3 py-1.5 shadow-xl border border-white">
                                        <span className="text-xs font-black text-slate-900 italic">₹{item.price}</span>
                                     </div>
                                  </div>
                                  
                                  <div className="p-6 flex flex-col flex-1 justify-between bg-white relative z-10">
                                     <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2 italic line-clamp-2 leading-snug">{item.name}</h4>
                                        <div className="flex items-center gap-2">
                                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.categoryName || 'General'}</span>
                                        </div>
                                     </div>

                                     <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5">
                                           <Clock size={12} className="text-slate-300" />
                                           <span className="text-[9px] font-black text-slate-400 uppercase">{item.preparationTime || 15} Min</span>
                                        </div>
                                        {inCart ? (
                                           <div className="flex items-center gap-3 bg-slate-900 text-white rounded-xl px-4 py-2 shadow-lg shadow-slate-900/20">
                                              <button onClick={() => removeFromCart(item._id)} className="p-1 hover:text-amber-400 transition-colors"><Minus size={14} /></button>
                                              <span className="text-xs font-black w-4 text-center">{inCart.quantity}</span>
                                              <button onClick={() => addToCart(item)} className="p-1 hover:text-amber-400 transition-colors"><Plus size={14} /></button>
                                           </div>
                                        ) : (
                                           <button 
                                             onClick={() => addToCart(item)}
                                             className="h-10 px-5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-90 flex items-center gap-2 italic font-black text-[10px] uppercase tracking-widest border border-slate-100"
                                           >
                                              <Plus size={14} /> Add
                                           </button>
                                        )}
                                     </div>
                                  </div>
                               </motion.div>
                            );
                         })}
                      </div>
                  </div>

                  {/* Right Layer: Cart & Settlement */}
                  <div className="w-[380px] bg-white border-l border-slate-100 flex flex-col overflow-hidden">
                      <header className="p-10 pb-6 shrink-0 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <ShoppingCart className="text-slate-900" size={24} />
                            <h3 className="text-lg font-black text-slate-900 uppercase italic">Bucket List</h3>
                         </div>
                         <button onClick={() => setShowOrderModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                            <X size={20} />
                         </button>
                      </header>
                      <div className="flex-1 overflow-y-auto px-6 no-scrollbar relative min-h-0">
                         {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
                               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                  <ShoppingBag size={24} />
                               </div>
                               <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest text-center">Empty</p>
                            </div>
                         ) : (
                            <div className="space-y-3 py-4">
                               {cart.map(item => (
                                 <motion.div 
                                   initial={{ opacity: 0, scale: 0.98 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   key={item.itemId} 
                                   className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex items-center gap-5 min-h-[100px]"
                                 >
                                     <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                     </div>
                                     <div className="flex-1 min-w-0 pr-2">
                                        <h5 className="text-[10px] font-black text-slate-950 uppercase tracking-tight italic mb-2 truncate leading-none">{item.name}</h5>
                                        <div className="flex items-center justify-between gap-3">
                                           <span className="text-xs font-black text-slate-950 italic">₹{item.price * item.quantity}</span>
                                           <div className="flex items-center gap-3 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                              <button onClick={() => removeFromCart(item.itemId)} className="p-0.5 hover:text-rose-500 transition-colors"><Minus size={12} /></button>
                                              <span className="text-[11px] font-black w-3 text-center">{item.quantity}</span>
                                              <button onClick={() => addToCart({_id: item.itemId, name: item.name, price: item.price, image: item.image})} className="p-0.5 hover:text-emerald-500 transition-colors"><Plus size={12} /></button>
                                           </div>
                                        </div>
                                     </div>
                                 </motion.div>
                               ))}
                            </div>
                         )}
                      </div>
 
                      <footer className="p-6 bg-slate-50/30 border-t border-slate-100 shrink-0 z-20 space-y-4">
                          {/* Table Selection */}
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Target Table Node</p>
                             <div className="relative group">
                                <Layout className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <select 
                                  value={selectedTable}
                                  onChange={(e) => setSelectedTable(e.target.value)}
                                  className="w-full h-12 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-slate-900 shadow-sm appearance-none"
                                >
                                   <option value="">SELECT TABLE</option>
                                   {tables.filter(t => t.status === 'Available').map(t => (
                                      <option key={t._id} value={t.tableName}>{t.tableName} ({t.area})</option>
                                   ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                             </div>
                          </div>
 
                          <div className="pt-4 border-t border-slate-100">
                             <div className="flex justify-between items-end mb-4 text-slate-900 px-1">
                                <div className="flex flex-col">
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Grand Payable</span>
                                   <span className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none">₹{cart.reduce((acc, i) => acc + (i.price * i.quantity), 0)}</span>
                                </div>
                                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 italic font-black text-[9px] uppercase">
                                   {cart.reduce((acc, i) => acc + i.quantity, 0)} Items
                                </div>
                             </div>
                             <button 
                               onClick={handleCreateOrder}
                               disabled={isSubmitting || cart.length === 0 || !selectedTable}
                               className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-30 active:scale-95"
                             >
                                {isSubmitting ? <RefreshCcw className="animate-spin" size={20} /> : <><Sparkles size={16} className="text-amber-400" /> Confirm Order</>}
                             </button>
                          </div>
                      </footer>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* ORDER DETAILS PANEL */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[200]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="absolute top-0 right-0 h-full w-[500px] bg-white z-[201] shadow-2xl overflow-hidden flex flex-col"
            >
               <header className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                         <Receipt size={24} />
                      </div>
                      <div>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Reference Insight</span>
                         <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none mt-1">#{selectedOrder.orderNumber.split('-').pop()}</h2>
                      </div>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-4 bg-white border border-slate-200 rounded-[1.5rem] hover:bg-rose-50 hover:text-rose-500 transition-all text-slate-400 relative active:scale-90">
                     <X size={20} />
                  </button>
               </header>

               <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-10">
                  <div className="grid grid-cols-2 gap-5">
                     <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TableIcon size={32} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Serving Table</span>
                        <span className="text-2xl font-black text-slate-900 italic uppercase leading-none">{selectedOrder.tableName}</span>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><User size={32} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Attendant</span>
                        <span className="text-lg font-black text-amber-600 uppercase italic tracking-tighter">{selectedOrder.waiterName === 'Customer App' ? 'Online' : selectedOrder.waiterName}</span>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex items-center justify-between px-2">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                           <Utensils size={14} className="text-amber-500" /> Items List
                        </h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{selectedOrder.items.length} Elements</span>
                     </div>
                     <div className="space-y-4">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex gap-5 p-5 bg-white rounded-[2.5rem] border border-slate-100 hover:border-slate-300 transition-all relative group shadow-sm">
                             <div className="w-20 h-20 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                {item.itemId?.image ? (
                                   <img src={item.itemId.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                ) : (
                                   <Utensils className="text-slate-200" size={32} />
                                )}
                             </div>
                             <div className="flex-1 py-1">
                                <div className="flex justify-between items-start mb-2">
                                   <h5 className="font-black text-slate-900 uppercase tracking-tight text-lg italic leading-none truncate w-48">{item.name}</h5>
                                   <span className="text-[10px] font-black text-slate-900 bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg">x{item.quantity}</span>
                                </div>
                                <div className="flex items-center gap-6 mt-4">
                                   <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-slate-400 uppercase">Unit Price</span>
                                      <span className="text-sm font-black text-slate-700 italic">₹{item.price}</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-slate-400 uppercase">Total</span>
                                      <span className="text-sm font-black text-slate-900 italic">₹{item.price * item.quantity}</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               <footer className="p-10 bg-white border-t border-slate-100 space-y-4 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
                  <div className="grid grid-cols-2 gap-4">
                     <button className="flex-1 h-16 bg-slate-50 text-slate-900 rounded-[1.5rem] border border-slate-100 flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 group">
                        <Printer size={18} className="group-hover:text-amber-400" /> Send to Print
                     </button>
                     <button 
                       onClick={() => { updateStatus(selectedOrder._id, 'Ready'); setSelectedOrder(null); }}
                       className="flex-1 h-16 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
                     >
                        <CheckCircle2 size={18} /> Instant Ready
                     </button>
                  </div>
                  <button 
                    onClick={() => {
                      if(window.confirm('🚨 TERMINATE SESSION?\n\nThis action will void the order and clear the table. This cannot be undone.')) {
                        updateStatus(selectedOrder._id, 'Cancelled');
                        setSelectedOrder(null);
                      }
                    }}
                    className="w-full h-14 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all border border-dashed border-rose-200 active:scale-95"
                  >
                    Terminate Service Session
                  </button>
               </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
