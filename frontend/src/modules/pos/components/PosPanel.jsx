import { useState, useMemo } from 'react';
import { X, Search, Plus, Minus,Trash2, CreditCard, Receipt, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { POS_CATEGORIES, POS_MENU_ITEMS } from '../data/posMenu';

export default function PosPanel({ table, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState(POS_CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);

  const filteredItems = useMemo(() => {
    return POS_MENU_ITEMS.filter(item => {
      const matchesCategory = item.catId === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.code.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full max-w-5xl bg-white shadow-2xl z-[60] flex flex-col"
    >
      {/* Panel Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#5D4037] flex items-center justify-center text-white font-bold">
            {table.name[0]}
          </div>
          <h2 className="font-bold text-gray-800">Order for {table.name}</h2>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
            Running Table
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Menu (65%) */}
        <div className="w-[65%] flex flex-col border-r border-gray-200 bg-gray-50/50">
          {/* Categories */}
          <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar bg-white border-b border-gray-100">
            {POS_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id 
                    ? 'bg-[#5D4037] text-white shadow-md shadow-stone-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Search items by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20 focus:border-[#5D4037] transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-4 content-start">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <motion.button
                  key={item.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(item)}
                  className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-[#5D4037]/20 transition-all text-left flex flex-col gap-2 group relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 px-1 back-white/80 rounded text-[10px] font-bold text-gray-400">
                    #{item.code}
                  </div>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-24 object-cover rounded-lg mb-1"
                  />
                  <h3 className="font-bold text-sm text-gray-800 line-clamp-1 group-hover:text-[#5D4037] transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[#5D4037] font-black">₹{item.price}</span>
                    <div className="w-6 h-6 rounded-full bg-stone-50 text-[#5D4037] flex items-center justify-center group-hover:bg-[#5D4037] group-hover:text-white transition-all">
                      <Plus size={14} strokeWidth={3} />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary (35%) */}
        <div className="w-[35%] flex flex-col bg-white">
          <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <span className="font-bold text-gray-700">Order Summary</span>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {cart.length} Items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 opacity-50">
                <Receipt size={48} strokeWidth={1} />
                <p className="text-sm font-medium">No items added yet</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800">{item.name}</h4>
                    <span className="text-xs text-gray-500">₹{item.price} per unit</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-gray-600 shadow-sm hover:text-[#5D4037]"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-gray-600 shadow-sm hover:text-[#5D4037]"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-800">₹{item.price * item.quantity}</span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-[#5D4037] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>GST (5%)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                <Send size={18} /> KOT
              </button>
              <button className="flex items-center justify-center gap-2 py-3 bg-[#5D4037] text-white rounded-xl font-bold hover:bg-[#4E342E] transition-all shadow-lg shadow-stone-200">
                <CreditCard size={18} /> Pay
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
