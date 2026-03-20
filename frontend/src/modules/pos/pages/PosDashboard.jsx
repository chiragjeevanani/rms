
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Minus, Trash2, CreditCard, Banknote, 
  Smartphone, Trash, Receipt, Send, Pause, Table, 
  X, ChevronRight, User, ShoppingCart, Filter,
  Soup, Utensils, Beer, IceCream, Pizza, LayoutGrid,
  MoreVertical, Clock, CheckCircle2, AlertCircle,
  Star, GlassWater, Wine, CupSoda
} from 'lucide-react';
import { POS_CATEGORIES, POS_MENU_ITEMS } from '../data/posMenu';
import { TABLE_SECTIONS } from '../data/tablesMockData';
import { useOrders } from '../../../context/OrderContext';
import { useMemo } from 'react';

const ICON_MAP = {
  Soup, Utensils, Beer, IceCream, Pizza, Star, GlassWater, Wine, CupSoda, LayoutGrid
};

export default function PosDashboard() {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { orders, createOrder, updateOrderStatus } = useOrders();

  const searchInputRef = useRef(null);

  // Derived tables list for selector
  const allTables = useMemo(() => TABLE_SECTIONS.flatMap(s => s.tables), []);

  // Keyboard shortcut logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') setShowTableSelector(false);
      
      // Function Keys for POS actions
      if (e.key === 'F8') handleSendKOT();
      if (e.key === 'F9') alert('Printing Bill...');
      if (e.key === 'F10') handleCheckout();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedTable]);

  // Smart Search logic
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results = POS_MENU_ITEMS.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.code.includes(query) || 
      item.shortcut.toLowerCase().includes(query)
    );
    setSearchResults(results);
  }, [searchQuery]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSendKOT = () => {
    if (cart.length === 0) return;
    const orderData = {
      table: selectedTable?.name || 'Takeaway',
      source: 'POS Terminal',
      items: cart.map(i => ({ ...i, status: 'new' })),
      total: calculateTotal(),
      status: 'pending'
    };
    createOrder(orderData);
    setCart([]);
    setSelectedTable(null);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckoutModal(true);
  };

  const completeTransaction = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Update Table Status if needed (Mock)
      if (selectedTable) {
        // In a real app we'd call an API to free the table
      }

      setTimeout(() => {
        setCart([]);
        setSelectedTable(null);
        setShowCheckoutModal(false);
        setIsSuccess(false);
      }, 2000);
    }, 1500);
  };

  const filteredItems = activeCategory === 'all' 
    ? POS_MENU_ITEMS 
    : POS_MENU_ITEMS.filter(item => item.catId === activeCategory);

  return (
    <div className="h-full bg-[#F4F4F7] flex flex-col overflow-hidden font-sans text-[#1A1C1E] relative">
      {/* Universal Header - Industrial Style */}
      <header className="h-14 bg-white border-b border-[#E2E4E9] flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-[#1A1C1E] rounded-md flex items-center justify-center text-white">
              <Receipt size={18} />
           </div>
           <div>
              <h1 className="text-sm font-black tracking-tight uppercase">RMS POS</h1>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Terminal 01 • Active</span>
              </div>
           </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search Item (Code/Shortcut/Name)... [/]" 
                className="w-full bg-[#F8F9FB] border border-[#E2E4E9] rounded-md py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all outline-none placeholder:text-slate-400 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchResults.length > 0) {
                    addToCart(searchResults[0]);
                  }
                }}
              />
              <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-xl border border-[#E2E4E9] overflow-hidden z-[60]"
                >
                   {searchResults.map((item, idx) => (
                      <button 
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className={`w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none ${idx === 0 ? 'bg-blue-50/50' : ''}`}
                      >
                         <div className="flex items-center gap-3">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 border border-slate-200">{item.code}</span>
                            <div className="text-left">
                               <p className="text-xs font-bold text-slate-900">{item.name}</p>
                               <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">{item.shortcut}</span>
                            </div>
                         </div>
                         <span className="text-xs font-bold text-slate-900">₹{item.price}</span>
                      </button>
                   ))}
                </motion.div>
              )}
              </AnimatePresence>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowTableSelector(true)}
             className={`flex items-center gap-2 h-9 px-4 rounded-md text-xs font-bold transition-all border ${
               selectedTable 
               ? 'bg-blue-600 border-blue-700 text-white shadow-sm' 
               : 'bg-white border-[#E2E4E9] text-slate-600 hover:bg-slate-50'
             }`}
           >
              <Table size={14} />
              {selectedTable ? selectedTable.name : 'TABLES'}
           </button>
           <div className="h-9 w-px bg-[#E2E4E9] mx-1" />
           <div className="flex items-center gap-3 pl-1">
              <div className="text-right">
                 <p className="text-[10px] font-bold uppercase text-slate-900 leading-none">C. Jeevanani</p>
                 <span className="text-[9px] text-slate-500 uppercase font-medium">Cashier</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                 <User size={14} className="text-slate-600" />
              </div>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar - Structured Industrial Panel */}
        <aside className="w-20 bg-white border-r border-[#E2E4E9] flex flex-col shrink-0 overflow-y-auto no-scrollbar">
           <button 
             onClick={() => setActiveCategory('all')}
             className={`h-20 w-full flex flex-col items-center justify-center border-b border-[#F4F4F7] transition-all relative ${
               activeCategory === 'all' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'
             }`}
           >
              {activeCategory === 'all' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
              <LayoutGrid size={20} />
              <span className="text-[9px] font-bold uppercase mt-2">All Items</span>
           </button>
           {POS_CATEGORIES.map(cat => {
             const Icon = ICON_MAP[cat.icon] || LayoutGrid;
             return (
               <button 
                 key={cat.id}
                 onClick={() => setActiveCategory(cat.id)}
                 className={`h-20 w-full flex flex-col items-center justify-center border-b border-[#F4F4F7] transition-all relative ${
                   activeCategory === cat.id ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'
                 }`}
               >
                  {activeCategory === cat.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                  <Icon size={20} />
                  <span className="text-[9px] font-bold uppercase mt-2 text-center px-1">{cat.name}</span>
               </button>
             );
           })}
        </aside>

        {/* Catalog Panel */}
        <main className="flex-1 p-5 flex flex-col overflow-hidden">
           <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-3">
                 <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Menu Catalog</h2>
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[#E2E4E9] rounded-md">
                    <span className="text-[10px] font-bold text-slate-800 uppercase">
                      {activeCategory === 'all' ? 'Full Menu' : POS_CATEGORIES.find(c => c.id === activeCategory).name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">• {filteredItems.length} items</span>
                 </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                 <MoreVertical size={16} />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                 {filteredItems.map(item => (
                   <motion.button
                     key={item.id}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => addToCart(item)}
                     className="bg-white rounded-md p-3 border border-[#E2E4E9] text-left hover:border-blue-400 hover:shadow-md transition-all flex flex-col group relative"
                   >
                      <div className="absolute top-2 right-2 z-10">
                         <span className="bg-slate-900/10 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 uppercase border border-white/20">
                           {item.code}
                         </span>
                      </div>
                      <div className="aspect-[4/3] rounded-sm bg-slate-50 mb-3 overflow-hidden relative">
                         <img 
                           src={item.image} 
                           alt={item.name} 
                           className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-500" 
                           onError={(e) => {
                             e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                             e.target.onerror = null;
                           }}
                         />
                      </div>
                      <div className="flex-1">
                         <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight line-clamp-2 leading-snug mb-2">{item.name}</h4>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-2">
                         <span className="text-xs font-black text-slate-950">₹{item.price}</span>
                         <div className="p-1 px-2 rounded bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Plus size={14} />
                         </div>
                      </div>
                   </motion.button>
                 ))}
              </div>
           </div>
        </main>

        {/* Right Panel - Cart Manifest */}
        <section className="w-[360px] bg-white border-l border-[#E2E4E9] flex flex-col shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.02)]">
           <div className="p-4 border-b border-[#E2E4E9] flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                 <ShoppingCart size={16} className="text-slate-900" />
                 <h2 className="text-xs font-bold uppercase tracking-wider">Current Order</h2>
              </div>
              <button 
                onClick={() => setCart([])}
                className="text-slate-400 hover:text-red-600 transition-colors uppercase text-[9px] font-bold tracking-widest flex items-center gap-1.5"
              >
                 <Trash size={12} />
                 Clear
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                   <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <ShoppingCart size={24} strokeWidth={1.5} />
                   </div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="group border border-slate-100 rounded-md p-3 hover:bg-[#F8F9FB] transition-all relative overflow-hidden">
                     <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="min-w-0">
                           <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate mb-0.5">{item.name}</h5>
                           <p className="text-[10px] font-medium text-slate-500">₹{item.price} • <span className="text-blue-600 font-bold">{item.shortcut}</span></p>
                        </div>
                        <span className="text-[11px] font-black text-slate-900">₹{item.price * item.quantity}</span>
                     </div>
                     
                     <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded px-2 py-1 shadow-sm">
                           <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-blue-600 p-0.5"><Minus size={12} /></button>
                           <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-blue-600 p-0.5"><Plus size={12} /></button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                           <Trash2 size={14} />
                        </button>
                     </div>
                  </div>
                ))
              )}
           </div>

           {/* Receipt Footer - Structured Totals */}
           <div className="p-5 border-t border-[#E2E4E9] bg-slate-50/50 space-y-4">
              <div className="space-y-2 px-1">
                 <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[9px] tracking-widest">
                    <span>Order Subtotal</span>
                    <span>₹{calculateTotal()}</span>
                 </div>
                 <div className="flex items-center justify-between text-slate-500 font-bold uppercase text-[9px] tracking-widest">
                    <span>Taxes (5%)</span>
                    <span>₹{(calculateTotal() * 0.05).toFixed(0)}</span>
                 </div>
                 <div className="pt-2 flex items-center justify-between text-slate-900 font-black uppercase text-base border-t border-slate-200 mt-2">
                    <span className="tracking-tighter">Amount Due</span>
                    <span className="text-blue-600 tracking-tighter">₹{(calculateTotal() * 1.05).toFixed(0)}</span>
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                 <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={handleSendKOT}
                      disabled={cart.length === 0}
                      className="h-10 flex items-center justify-center gap-2 bg-[#1A1C1E] text-white rounded font-bold uppercase text-[9px] tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                       <Send size={12} />
                       Send KOT [F8]
                    </button>
                    <button className="h-10 flex items-center justify-center gap-2 bg-white border border-[#E2E4E9] text-slate-900 rounded font-bold uppercase text-[9px] tracking-widest hover:bg-slate-50 transition-all">
                       <Receipt size={12} />
                       Bill [F9]
                    </button>
                 </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="h-12 w-full flex items-center justify-center gap-3 bg-blue-600 text-white rounded font-bold uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50"
                  >
                    <CreditCard size={16} />
                    Finalize Checkout [F10]
                  </button>
              </div>
           </div>
        </section>
      </div>

      {/* Premium Dark Status Bar */}
      <footer className="h-9 bg-[#1a1c1e] text-white/50 px-6 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.15em] shrink-0">
         <div className="flex items-center gap-8">
            <span className="flex items-center gap-2 hover:text-orange-400 transition-colors cursor-pointer group">
               <Pause size={12} className="text-orange-500 group-hover:scale-110 transition-transform" />
               Hold [F2]
            </span>
            <span className="flex items-center gap-2 hover:text-red-400 transition-colors cursor-pointer group">
               <AlertCircle size={12} className="text-red-500 group-hover:scale-110 transition-transform" />
               Cancel [F4]
            </span>
            <span className="flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-pointer group">
               <CheckCircle2 size={12} className="text-emerald-500 group-hover:scale-110 transition-transform" />
               Reports
            </span>
         </div>
         
         <div className="flex items-center gap-6 text-white/40">
            <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
               <Clock size={12} className="text-blue-400" />
               <span className="tabular-nums">
                 {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
               </span>
            </div>
            <div className="flex items-center gap-2 text-emerald-500/80 bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Connected
            </div>
         </div>
      </footer>

      {/* Table Selector - Professional Modal */}
      <AnimatePresence>
         {showTableSelector && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowTableSelector(false)}
               className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[100]"
             />
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-8 w-full max-w-xl z-[101] shadow-2xl border border-[#E2E4E9]"
             >
                <div className="flex items-center justify-between mb-8">
                   <div>
                      <h2 className="text-lg font-black uppercase tracking-widest">Select Table / Zone</h2>
                      <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Floor Layout & Table Availability</p>
                   </div>
                   <button onClick={() => setShowTableSelector(false)} className="p-2 bg-slate-50 rounded-md text-slate-400 hover:text-slate-900 transition-colors">
                      <X size={18} />
                   </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                   {allTables.map(table => (
                      <button 
                        key={table.id}
                        onClick={() => {
                          setSelectedTable(table);
                          setShowTableSelector(false);
                        }}
                        className={`aspect-square rounded-md border text-center flex flex-col items-center justify-center gap-2 transition-all group ${
                          table.status === 'occupied' 
                          ? 'bg-orange-50 border-orange-100 text-orange-600' 
                          : table.status === 'billing'
                          ? 'bg-blue-50 border-blue-100 text-blue-600'
                          : 'bg-white border-slate-100 text-slate-400 hover:border-blue-600 hover:bg-slate-50'
                        }`}
                      >
                         <Table size={18} className="group-hover:scale-110 transition-transform" />
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-wider">{table.name}</p>
                            <span className="text-[7px] font-bold uppercase tracking-widest opacity-60">
                               {table.status}
                            </span>
                         </div>
                      </button>
                   ))}
                </div>

                <div className="mt-8 flex items-center justify-between p-4 bg-slate-50 rounded-md">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 uppercase text-[8px] font-black text-slate-400">
                         <div className="w-2 h-2 rounded bg-white border border-slate-200" />
                         Available
                      </div>
                      <div className="flex items-center gap-1.5 uppercase text-[8px] font-black text-orange-400">
                         <div className="w-2 h-2 rounded bg-orange-500" />
                         Occupied
                      </div>
                   </div>
                   <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Manage Zones</button>
                </div>
             </motion.div>
           </>
         )}
      </AnimatePresence>

      {/* Checkout Modal - Industrial Finish */}
      <AnimatePresence>
        {showCheckoutModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-lg z-[201] shadow-2xl overflow-hidden border border-slate-200"
            >
              {isSuccess ? (
                <div className="p-12 text-center animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">Checkout Complete</h2>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Recipt Printed Successfully • Table {selectedTable?.name || 'T/W'}</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">Finalize Checkout</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Process Payment for {selectedTable?.name || 'Takeaway'}</p>
                    </div>
                    <button onClick={() => !isProcessing && setShowCheckoutModal(false)} className="p-2 text-slate-400 hover:text-slate-900">
                      <X size={20} />
                    </button>
                  </header>

                  <div className="p-8 space-y-8">
                    {/* Bill Summary */}
                    <div className="p-6 bg-[#F8F9FA] rounded-xl border border-slate-100 space-y-3">
                       <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                          <span>Subtotal</span>
                          <span>₹{calculateTotal()}</span>
                       </div>
                       <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                          <span>Taxes & Fees</span>
                          <span>₹{(calculateTotal() * 0.05).toFixed(0)}</span>
                       </div>
                       <div className="pt-4 border-t-2 border-dashed border-slate-200 flex justify-between">
                          <span className="text-lg font-black text-slate-950 uppercase tracking-tighter">Amount Payable</span>
                          <span className="text-3xl font-black text-blue-600 tracking-tighter">₹{(calculateTotal() * 1.05).toFixed(0)}</span>
                       </div>
                    </div>

                    {/* Payment Selection */}
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Payment Mode</label>
                       <div className="grid grid-cols-3 gap-4">
                          {[
                            { id: 'cash', icon: Banknote, label: 'Cash' },
                            { id: 'card', icon: CreditCard, label: 'Card' },
                            { id: 'upi', icon: Smartphone, label: 'UPI / Scan' }
                          ].map(mode => (
                            <button
                              key={mode.id}
                              onClick={() => setPaymentMethod(mode.id)}
                              className={`p-5 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                                paymentMethod === mode.id 
                                ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-lg shadow-blue-600/10' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              <mode.icon size={28} />
                              <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setShowCheckoutModal(false)}
                        className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Go Back
                      </button>
                      <button 
                        onClick={completeTransaction}
                        disabled={isProcessing}
                        className="flex-[2] py-5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                      >
                        {isProcessing ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Confirm & Settle Bill <ArrowRight size={16} /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
