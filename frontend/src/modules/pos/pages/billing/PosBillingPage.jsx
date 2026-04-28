import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, X, Check, CreditCard, Banknote, Smartphone, Receipt, Printer, Pause, Spline, Trash2, Clock, User, Phone, MapPin, Truck, ChevronRight, Hash, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PosBillingPage() {
  const [activeTab, setActiveTab] = useState('dine_in'); // dine_in, delivery, pick_up
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Mock Data
  const categories = ['All', 'Starters', 'Main Course', 'Beverages', 'Desserts'];
  const menuItems = [
    { id: 1, name: 'Paneer Tikka', price: 250, category: 'Starters' },
    { id: 2, name: 'Chicken Kebab', price: 320, category: 'Starters' },
    { id: 3, name: 'Butter Chicken', price: 450, category: 'Main Course' },
    { id: 4, name: 'Dal Makhani', price: 280, category: 'Main Course' },
    { id: 5, name: 'Garlic Naan', price: 60, category: 'Main Course' },
    { id: 6, name: 'Cold Coffee', price: 150, category: 'Beverages' },
    { id: 7, name: 'Fresh Lime Soda', price: 90, category: 'Beverages' },
    { id: 8, name: 'Gulab Jamun', price: 120, category: 'Desserts' },
    { id: 9, name: 'Brownie Ice Cream', price: 180, category: 'Desserts' },
  ];

  const filteredItems = menuItems.filter(item => 
    (selectedCategory === 'All' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1, notes: '' }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05; // 5% GST
  const total = subtotal + tax;

  const handleAction = (action) => {
    if (cart.length === 0 && !['Clear Table'].includes(action)) {
      toast.error('Cart is empty!');
      return;
    }
    toast.success(`${action} successful!`);
    if (['Save', 'Save & Print', 'Clear Table'].includes(action)) {
      setCart([]);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden font-sans">
      
      {/* LEFT SECTION - ORDER DETAILS */}
      <div className="w-[45%] flex flex-col bg-white border-r border-slate-200 shadow-xl z-10">
        {/* Top Order Info */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex bg-slate-200/50 p-1 rounded-xl mb-4">
            {['dine_in', 'delivery', 'pick_up'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab ? 'bg-white text-[var(--primary-color)] shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              {activeTab === 'dine_in' && (
                <>
                  <select className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[var(--primary-color)]">
                    <option>Select Table</option>
                    <option>Table 1</option>
                    <option>Table 2</option>
                    <option>Table 3</option>
                  </select>
                  <select className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[var(--primary-color)]">
                    <option>Assign Captain</option>
                    <option>Raju</option>
                    <option>Ramesh</option>
                  </select>
                  <div className="col-span-2 relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Customer Name/Mobile (Optional)" className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm font-bold outline-none focus:border-[var(--primary-color)]" />
                  </div>
                </>
              )}
              {activeTab === 'delivery' && (
                <>
                  <div className="col-span-2 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Mobile Number *" className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm font-bold outline-none focus:border-[var(--primary-color)]" />
                  </div>
                  <div className="col-span-2 relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                    <textarea placeholder="Delivery Address *" rows={2} className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm font-bold outline-none focus:border-[var(--primary-color)] resize-none" />
                  </div>
                  <select className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[var(--primary-color)]">
                    <option>Direct Delivery</option>
                    <option>Zomato</option>
                    <option>Swiggy</option>
                  </select>
                </>
              )}
              {activeTab === 'pick_up' && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Customer Name" className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm font-bold outline-none focus:border-[var(--primary-color)]" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Mobile Number" className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm font-bold outline-none focus:border-[var(--primary-color)]" />
                  </div>
                  <div className="col-span-2 relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="time" className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm font-bold outline-none focus:border-[var(--primary-color)]" />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <ShoppingCart size={48} className="mb-4 opacity-50" />
              <p className="text-sm font-bold uppercase tracking-widest">No Items Added</p>
            </div>
          ) : (
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{item.name}</h4>
                    <p className="text-xs text-slate-400 font-medium">₹ {item.price}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-[var(--primary-color)]"><Minus size={14}/></button>
                      <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-[var(--primary-color)]"><Plus size={14}/></button>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-black text-slate-800">₹ {item.price * item.qty}</span>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Payment & Totals */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Subtotal</span>
              <span>₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Taxes (5%)</span>
              <span>₹ {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-[var(--primary-color)] border-t border-slate-100 pt-2 mt-2">
              <span>Total Amount</span>
              <span>₹ {total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[{icon: Banknote, label: 'Cash'}, {icon: CreditCard, label: 'Card'}, {icon: Smartphone, label: 'UPI'}, {icon: Spline, label: 'Split'}, {icon: Clock, label: 'Due'}].map(method => (
              <button key={method.label} className="flex flex-col items-center justify-center py-2 px-1 rounded-xl border border-slate-200 hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)]/5 text-slate-600 hover:text-[var(--primary-color)] transition-all">
                <method.icon size={18} className="mb-1" />
                <span className="text-[9px] font-black uppercase tracking-wider">{method.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
             <button onClick={() => handleAction('KOT')} className="py-3 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 shadow-lg active:scale-95 transition-all">KOT</button>
             <button onClick={() => handleAction('KOT & Print')} className="py-3 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">KOT <Printer size={14}/></button>
             <button onClick={() => handleAction('Save')} className="py-3 bg-[var(--primary-color)] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-[var(--primary-color)]/30 active:scale-95 transition-all">Save Bill</button>
             <button onClick={() => handleAction('Save & Print')} className="py-3 bg-[var(--primary-color)] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-[var(--primary-color)]/30 active:scale-95 transition-all flex items-center justify-center gap-2">Save <Printer size={14}/></button>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => handleAction('Hold')} className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-1"><Pause size={12}/> Hold</button>
            <button onClick={() => handleAction('Clear Table')} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-1"><X size={12}/> Clear</button>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION - MENU */}
      <div className="flex-1 flex flex-col bg-slate-100">
        <div className="p-4 bg-white border-b border-slate-200 shrink-0 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items, categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-transparent text-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold outline-none focus:bg-white focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[var(--primary-color)]/10 transition-all"
            />
          </div>
        </div>

        <div className="px-4 pt-4 pb-0 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/30' : 'bg-white text-slate-500 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map(item => (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-[var(--primary-color)]/30 transition-all text-left group flex flex-col justify-between aspect-square"
              >
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{item.category}</span>
                  <h3 className="font-bold text-slate-800 leading-tight group-hover:text-[var(--primary-color)] transition-colors line-clamp-2">{item.name}</h3>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-black text-slate-800">₹ {item.price}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[var(--primary-color)] group-hover:bg-[var(--primary-color)] group-hover:text-white transition-all">
                    <Plus size={16} />
                  </div>
                </div>
              </motion.button>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                <Search size={48} className="mb-4 opacity-50" />
                <p className="font-bold uppercase tracking-widest text-sm">No items found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
