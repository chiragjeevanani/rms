import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, SlidersHorizontal, Sparkles, Sun, Moon, Loader2, ShoppingBag, Eye, Grid, ChevronRight, Hash, CheckCircle2 } from 'lucide-react';
import { FoodCard } from '../components/FoodCard';
import { CategoryScroller } from '../components/CategoryScroller';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { RESTAURANT_INFO } from '../data/mockData';
import { BottomNav } from '../components/BottomNav';
import CryptoJS from 'crypto-js';

const TABLE_SECRET = 'RMS_SECURE_DYNAMIC_PROTOCOL_2026';

export default function MenuPage() {
  const { isOrderOnline, setOrderingMode, tableNumber, setTable } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [combos, setCombos] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVegOnly, setIsVegOnly] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [showTablePicker, setShowTablePicker] = useState(false);

  useEffect(() => {
    // Check URL for table parameter
    const params = new URLSearchParams(window.location.search);
    const encryptedTable = params.get('t');
    const urlTable = params.get('table'); // Legacy support
    
    if (encryptedTable) {
      try {
        const bytes = CryptoJS.AES.decrypt(decodeURIComponent(encryptedTable), TABLE_SECRET);
        const decryptedCode = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedCode) {
           setTable(decryptedCode);
        }
      } catch (e) {
        console.error('Table Decryption Failed');
      }
    } else if (urlTable) {
      setTable(urlTable);
    } else if (!tableNumber || tableNumber === '7') {
       setShowTablePicker(true);
    }

    const fetchData = async () => {
      try {
        const [itemsRes, categoriesRes, combosRes, tablesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/item`),
          fetch(`${import.meta.env.VITE_API_URL}/category`),
          fetch(`${import.meta.env.VITE_API_URL}/combo`),
          fetch(`${import.meta.env.VITE_API_URL}/table`)
        ]);

        const itemsData = await itemsRes.json();
        const categoriesData = await categoriesRes.json();
        const combosData = await combosRes.json();
        const tablesData = await tablesRes.json();

        setItems((Array.isArray(itemsData) ? itemsData : []).filter(i => i.status === 'Published'));
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setCombos((combosData?.success ? combosData.data : []).filter(c => c.status === 'Published'));
        setTables(Array.isArray(tablesData) ? tablesData : []);
      } catch (err) {
        console.error('Failed to fetch menu data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const allCategories = useMemo(() => {
    const base = [
      { id: 'all', label: 'All', icon: '◉' },
      { id: 'popular', label: 'Popular', icon: '★' },
      { id: 'combo', label: 'Combo', icon: '📦' }
    ];
    const backendCats = categories
      .filter(cat => cat.status === 'Published')
      .map(cat => ({
        id: cat._id,
        label: cat.name,
        icon: '◉'
      }));
    return [...base, ...backendCats];
  }, [categories]);

  const filteredItems = useMemo(() => {
    let result = [];
    const isSearching = searchQuery.trim().length > 0;

    if (isSearching) {
      result = [...items, ...combos];
    } else {
      if (activeCategory === 'all') result = items;
      else if (activeCategory === 'popular') result = items.filter(i => i.isFeatured || i.tags?.includes('popular'));
      else if (activeCategory === 'combo') result = combos;
      else result = items.filter(i => i.category?._id === activeCategory);
    }

    if (isVegOnly) result = result.filter(i => i.foodType === 'Veg' || i.isVeg);

    if (isSearching) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q)));
    }

    return result.map(i => ({
      ...i,
      id: i._id,
      price: i.hasVariants ? i.variants.find(v => v.isDefault)?.price : (i.sellingPrice || i.basePrice || i.price),
      originalPrice: i.hasVariants ? i.variants.find(v => v.isDefault)?.originalPrice : (i.basePrice || i.originalPrice),
      rating: i.reviews?.length > 0 ? (i.reviews.reduce((acc, r) => acc + r.rating, 0) / i.reviews.length).toFixed(1) : (i.rating || 0),
      isVeg: i.foodType === 'Veg' || i.isVeg,
    }));
  }, [activeCategory, items, combos, searchQuery, isVegOnly]);

  const handleSelectTable = (code) => {
    setTable(code);
    setShowTablePicker(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 dark:bg-charcoal-900 gap-4">
        <div className="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-charcoal-400 animate-pulse">Initializing Kitchen...</p>
      </div>
    );
  }

  if (showTablePicker) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-charcoal-900 transition-colors duration-500 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-brand-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-lg mx-auto h-screen flex flex-col px-6 py-12">
             <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-12 h-12 bg-charcoal-900 dark:bg-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                      <Grid size={24} className="text-brand-500" />
                   </div>
                   <div>
                      <h1 className="text-3xl font-display font-bold tracking-tight">Select your <span className="text-brand-500">Seat</span></h1>
                      <p className="text-[10px] font-black text-charcoal-400 uppercase tracking-widest">Main Dining Area</p>
                   </div>
                </div>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 leading-relaxed max-w-[80%]">Welcome to RMS Kitchen! Please select your table code to browse our hand-picked menu.</p>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                <div className="grid grid-cols-1 gap-4">
                   {tables.filter(t => t.status === 'Available').map((table) => (
                      <motion.button
                        key={table._id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectTable(table.tableCode)}
                        className="bg-white dark:bg-white/5 border border-charcoal-100 dark:border-white/5 p-5 rounded-[2rem] flex items-center justify-between group hover:border-brand-500 transition-all shadow-sm"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-charcoal-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-charcoal-100 dark:border-white/10 group-hover:bg-brand-500 transition-colors">
                               <Hash size={14} className="text-charcoal-400 dark:text-charcoal-500 group-hover:text-charcoal-900 mb-0.5" />
                               <span className="text-[11px] font-black text-charcoal-900 dark:text-white group-hover:text-charcoal-900">{table.capacity}</span>
                            </div>
                            <div className="flex flex-col items-start">
                               <span className="text-lg font-bold text-charcoal-900 dark:text-white tracking-tight">{table.tableName}</span>
                               <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest">{table.tableCode} · {table.floor}</span>
                            </div>
                         </div>
                         <div className="w-10 h-10 bg-charcoal-50 dark:bg-white/5 rounded-full flex items-center justify-center text-charcoal-300 dark:text-charcoal-600 group-hover:bg-brand-500 group-hover:text-charcoal-900 transition-all">
                            <ChevronRight size={20} />
                         </div>
                      </motion.button>
                   ))}
                </div>
             </div>

             <div className="pt-6 border-t border-charcoal-100 dark:border-white/5 bg-cream-50/80 dark:bg-charcoal-900/80 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-charcoal-400">Live Table Sync Active</span>
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-charcoal-400">{tables.length} Total Nodes</span>
                </div>
             </div>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-white selection:bg-brand-500 selection:text-charcoal-900 transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-orange-400/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto pb-40">
        <header className="sticky top-0 z-40 bg-cream-50/80 dark:bg-charcoal-900/80 backdrop-blur-3xl border-b border-charcoal-900/10 dark:border-white/5 px-6 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-0.5">
              <div 
                className="flex items-center gap-1.5 opacity-60 cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => setShowTablePicker(true)}
              >
                <MapPin size={10} className="text-brand-500" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none border-b border-brand-500/30 pb-0.5">Table {tableNumber} · Change Table</span>
              </div>
              <h1 className="text-2xl font-display font-bold tracking-tight text-charcoal-900 dark:text-white leading-tight">
                RMS <span className="text-brand-500">Kitchen</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-charcoal-900/5 dark:bg-white/5 text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-white"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>
            </div>
          </div>

          {/* Online Toggle */}
          <div className="mb-6 px-1">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setOrderingMode(!isOrderOnline)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                isOrderOnline ? 'bg-brand-500 border-brand-500 shadow-lg shadow-brand-500/20 text-charcoal-900 font-bold' : 'bg-white border-charcoal-900/10 dark:bg-white/5 dark:border-white/5 text-charcoal-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isOrderOnline ? 'bg-charcoal-900/10' : 'bg-charcoal-100 dark:bg-white/5'}`}>
                  {isOrderOnline ? <ShoppingBag size={18} /> : <Eye size={18} />}
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs uppercase tracking-widest font-black">{isOrderOnline ? 'Order Online' : 'View Menu Only'}</span>
                  <span className={`text-[9px] opacity-70 ${isOrderOnline ? 'font-bold' : ''}`}>
                    {isOrderOnline ? 'Tap any item to start ordering' : 'Enable to place an order'}
                  </span>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full relative transition-colors ${isOrderOnline ? 'bg-charcoal-900/20' : 'bg-charcoal-200 dark:bg-white/10'}`}>
                <motion.div animate={{ x: isOrderOnline ? 18 : 2 }} className={`w-4 h-4 rounded-full mt-1 bg-white shadow-sm`} />
              </div>
            </motion.button>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1 group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-500 dark:text-charcoal-400 group-focus-within:text-brand-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find your feast..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-charcoal-900/10 dark:bg-white/5 dark:border-white/5 rounded-xl text-xs font-medium focus:bg-charcoal-900/5 dark:focus:bg-white/10 outline-none transition-all text-charcoal-900 dark:text-white"
              />
            </div>
            <button 
              onClick={() => setIsVegOnly(!isVegOnly)}
              className={`p-3 border rounded-xl transition-all duration-300 ${isVegOnly ? 'bg-brand-500 border-brand-500 text-charcoal-900 ring-4 ring-brand-500/20' : 'bg-white border-charcoal-900/10 dark:bg-white/5 dark:border-white/5'}`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          <CategoryScroller categories={allCategories} activeCategory={activeCategory} onSelect={setActiveCategory} />
        </header>

        <main className="px-6 pt-6">
           <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-lg font-display font-bold tracking-tight">Today's Specials</h2>
              <span className="text-[9px] font-black text-charcoal-500 uppercase tracking-[0.1em]">{filteredItems.length} Dishes</span>
           </div>

           <div className="space-y-5">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => (
                <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.03 }}>
                  <FoodCard item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
