import React, { useState, useEffect } from 'react';
import { 
  XCircle, Search, Filter, AlertTriangle, 
  Trash2, RefreshCcw, Eye, ShieldAlert, Menu
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
    <div className="h-full flex flex-col bg-[#F8F9FB] animate-in fade-in duration-500">
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0 flex items-center gap-6">
        <button onClick={toggleSidebar} className="p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
          <Menu size={18} className="text-slate-600" />
        </button>
        <div className="flex items-center justify-between flex-1">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Cancelled Orders</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review Cancelled Transactions & Reasons</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded border border-rose-100 shadow-sm animate-pulse">
            <ShieldAlert size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">System Logs Active</span>
          </div>
        </div>
      </header>

      <div className="px-8 py-4 bg-white border-b border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH CANCELLED ORDERS..."
              className="w-full bg-slate-50 border border-slate-100 rounded py-2.5 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-rose-600 focus:bg-white transition-all underline decoration-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchCancelledOrders}
            disabled={loading}
            className="h-10 px-4 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 outline-none disabled:opacity-50"
          >
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
        {loading && orders.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center opacity-20 grayscale">
            <XCircle size={48} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center">No Cancelled Orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div 
                  key={order._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 4 }}
                  className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex items-center justify-between hover:border-rose-200 transition-all group relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ORDER ID</span>
                       <span className="text-sm font-black text-slate-900 uppercase italic">#{order.orderNumber?.split('-').pop()}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TABLE</span>
                       <span className="text-sm font-black text-slate-900 uppercase italic">{order.tableName}</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL AMOUNT</span>
                       <span className="text-sm font-black text-rose-600 italic">₹{order.grandTotal || order.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <button className="px-4 py-2 border border-slate-100 rounded text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all">Audit Logs</button>
                     <button className="p-2 border border-slate-100 rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all hover:border-rose-100"><Eye size={16} /></button>
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
