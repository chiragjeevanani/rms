import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Search, Filter, Download, 
  Eye, Receipt, ArrowUpDown, Calendar, RefreshCcw, Menu
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CompletedOrders() {
  const { toggleSidebar } = usePos();
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/completed`);
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      } else {
        toast.error('Failed to fetch completed orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Network error while fetching history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const filteredOrders = orders.filter(order => 
    order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.tableName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.totalAmount?.toString().includes(searchQuery)
  );

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] animate-in fade-in duration-500">
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0 flex items-center gap-6">
        <button onClick={toggleSidebar} className="p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
          <Menu size={18} className="text-slate-600" />
        </button>
        <div className="flex items-center justify-between flex-1">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">Order History</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review Past Transactions & Payments</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchCompletedOrders}
              disabled={loading}
              className="h-10 px-4 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-100 flex items-center gap-2 outline-none disabled:opacity-50"
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh Data
            </button>
            <button className="h-10 px-4 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 outline-none">
              <Download size={14} />
              Export History
            </button>
          </div>
        </div>
      </header>

      <div className="px-8 py-4 bg-white border-b border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH BY ORDER ID, TABLE, OR TOTAL AMOUNT..."
              className="w-full bg-slate-50 border border-slate-100 rounded py-2.5 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all underline decoration-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="h-10 px-4 bg-white border border-slate-200 text-slate-400 rounded text-[10px] font-black uppercase tracking-widest hover:text-slate-900 flex items-center gap-2 transition-all outline-none">
            <Filter size={14} />
            More Filters
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/6">Order ID</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/6 text-center">Table / Type</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/6 text-center">Items Count</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/6 text-center">Protocol</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/6 text-right">Total Amount</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredOrders.map((order) => (
                  <motion.tr 
                    key={order._id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">#{order.orderNumber?.split('-').pop()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{order.tableName}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{order.items?.length || 0} ITEMS</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={10} />
                          SETTLED
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[11px] font-black text-slate-900 italic">₹{order.grandTotal || order.totalAmount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 border border-slate-200 rounded hover:bg-slate-900 hover:text-white transition-all"><Eye size={14} /></button>
                        <button className="p-2 border border-slate-200 rounded hover:bg-slate-900 hover:text-white transition-all"><Receipt size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredOrders.length === 0 && !loading && (
             <div className="p-20 text-center flex flex-col items-center justify-center gap-4 opacity-20">
                <Calendar size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No History Found</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
