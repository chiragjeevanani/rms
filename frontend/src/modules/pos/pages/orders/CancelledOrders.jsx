import React, { useState, useEffect } from 'react';
import { 
  XCircle, Search, Filter, AlertTriangle, 
  Trash2, RefreshCcw, Eye, ShieldAlert, Menu, Receipt, History
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CancelledOrders() {
  const { toggleSidebar } = usePos();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCancelledOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/cancelled`);
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      } else {
        toast.error('Failed to fetch cancelled orders');
      }
    } catch (err) {
      console.error('Error fetching cancelled orders:', err);
      toast.error('Network error while fetching history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelledOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    (o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     o.tableName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (o.grandTotal || o.totalAmount)?.toString().includes(searchQuery))
  );

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] animate-in fade-in duration-500 font-sans select-none">
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-6">
            <button onClick={toggleSidebar} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10">
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 leading-none">Cancelled Exceptions</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Review Terminated Sessions & Voided Transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 shadow-sm animate-pulse">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Audit Protocol Active</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH BY ORDER ID, TABLE, OR REASON..."
              className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-rose-600 focus:bg-white transition-all underline decoration-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchCancelledOrders}
            disabled={loading}
            className="h-12 px-6 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-3 outline-none disabled:opacity-50"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Sync Vault
          </button>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto no-scrollbar scroll-smooth">
        {loading && orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 italic">
            <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Querying Exceptions...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 grayscale grayscale-100 mix-blend-multiply italic">
            <XCircle size={64} className="mb-4 text-slate-300" />
            <p className="text-[11px] font-black uppercase tracking-[0.3em]">No Exceptions Logged</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div 
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 hover:border-rose-400 hover:shadow-2xl hover:shadow-rose-600/5 transition-all group relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Transaction Ref</span>
                       <span className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">#{order.orderNumber?.split('-').pop()}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Floor Node</span>
                       <span className="text-sm font-black text-slate-900 uppercase italic">{order.tableName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-400 uppercase">Impacted Value</span>
                       <span className="text-lg font-black text-rose-600 italic">₹{(order.grandTotal || order.totalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[8px] font-black text-slate-400 uppercase">Timestamp</span>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mt-1">{new Date(order.updatedAt).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <button className="flex-1 h-12 bg-slate-50 text-slate-900 rounded-xl border border-slate-100 flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95">
                        <History size={14} /> Audit Trace
                     </button>
                     <button className="h-12 w-12 bg-white border border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all hover:border-rose-100 flex items-center justify-center active:scale-95">
                        <Eye size={18} />
                     </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}



