import React, { useState, useEffect, useMemo } from 'react';
import { 
  Grid, Search, Clock, Building2, DollarSign, 
  History, TrendingUp, ShoppingCart, Calendar, ArrowRight, Eye, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import BranchSelector from '../components/BranchSelector';
import AdminModal from '../components/ui/AdminModal';

export default function TableHistory() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tableRes, orderRes, branchRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/table`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/orders`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
        }),
        fetch((() => { const _rid = localStorage.getItem('admin_restaurantId'); return _rid ? `${import.meta.env.VITE_API_URL}/branches?restaurantId=${_rid}` : `${import.meta.env.VITE_API_URL}/branches`; })(), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
        })
      ]);
      const tableData = await tableRes.json();
      const orderData = await orderRes.json();
      const branchData = await branchRes.json();
      
      setTables(tableData);
      if (orderData.success) setOrders(orderData.data);
      if (branchData.success) setBranches(branchData.data);
    } catch (err) {
      toast.error('Failed to load table order analytics');
    } finally {
      setIsLoading(false);
    }
  };

  // Compile statistics for each table
  const tableAnalytics = useMemo(() => {
    // Filter tables and orders based on branch filter
    const filteredTablesList = tables.filter(t => selectedBranchFilter === 'all' || t.branchId === selectedBranchFilter);
    let filteredOrdersList = orders.filter(o => selectedBranchFilter === 'all' || o.branchId === selectedBranchFilter);

    // Apply time filter
    if (selectedTimeFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
      const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

      filteredOrdersList = filteredOrdersList.filter(o => {
        const orderTime = new Date(o.createdAt).getTime();
        if (selectedTimeFilter === 'today') {
          return orderTime >= todayStart;
        } else if (selectedTimeFilter === 'week') {
          return orderTime >= weekStart;
        } else if (selectedTimeFilter === 'month') {
          return orderTime >= monthStart;
        }
        return true;
      });
    }

    return filteredTablesList.map(table => {
      // Find all orders corresponding to this table
      // Some orders use tableName (e.g. "Table 1" or code like "TBL-1234"), let's match both
      const tableOrders = filteredOrdersList.filter(o => 
        o.tableName?.toUpperCase() === table.tableName?.toUpperCase() || 
        o.tableName?.toUpperCase() === table.tableCode?.toUpperCase() ||
        o.tableId === table._id
      );

      const completedOrders = tableOrders.filter(o => ['completed', 'Completed', 'paid', 'Paid'].includes(o.status));
      const totalSales = completedOrders.reduce((sum, o) => sum + (o.grandTotal || o.subTotal || 0), 0);
      
      const lastOrder = tableOrders.length > 0 ? tableOrders[0] : null; // Sorted descending by api

      return {
        ...table,
        totalOrdersCount: tableOrders.length,
        completedOrdersCount: completedOrders.length,
        totalSales,
        lastActive: lastOrder ? new Date(lastOrder.createdAt) : null,
        orders: tableOrders
      };
    }).sort((a, b) => b.totalOrdersCount - a.totalOrdersCount); // Sort by most orders first
  }, [tables, orders, selectedBranchFilter, selectedTimeFilter]);

  // Apply search query
  const filteredTableAnalytics = useMemo(() => {
    return tableAnalytics.filter(t => 
      t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.tableCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tableAnalytics, searchQuery]);

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA] overflow-hidden admin-layout">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
            <History size={20} strokeWidth={2.5} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none italic">Table Orders History</h1>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Analytics & Historical Orders Per Table</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search tables..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="h-8 w-px bg-slate-100 hidden md:block" />

          {/* Time Filter Switch */}
          <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedTimeFilter(filter.id)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  selectedTimeFilter === filter.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-100 hidden md:block" />

          <BranchSelector 
            branches={branches}
            selectedBranch={selectedBranchFilter}
            onSelect={setSelectedBranchFilter}
          />
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar bg-slate-50/30">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} className="bg-white rounded-3xl h-44 animate-pulse border border-slate-100 shadow-sm" />
             ))}
          </div>
        ) : filteredTableAnalytics.length === 0 ? (
          <EmptyState 
            title="No History Found" 
            subtitle="No orders or tables mapped under this query"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {filteredTableAnalytics.map((analytics) => (
               <motion.div 
                 layout
                 key={analytics._id} 
                 onClick={() => setSelectedTable(analytics)}
                 className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between h-56 hover:border-amber-200"
               >
                  {/* Top Line */}
                  <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-base font-black text-slate-900 tracking-tight uppercase group-hover:text-amber-500 transition-colors">
                          {analytics.tableName}
                       </h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Code: {analytics.tableCode}</p>
                     </div>
                     <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm">
                        <Grid size={16} />
                     </div>
                  </div>

                  {/* Aggregated Counters */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 mt-2">
                     <div>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total Orders</span>
                       <span className="text-xl font-black text-slate-800 tabular-nums">{analytics.totalOrdersCount.toString().padStart(2, '0')}</span>
                     </div>
                     <div>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total Value</span>
                       <span className="text-xl font-black text-emerald-600 tabular-nums">₹{analytics.totalSales}</span>
                     </div>
                  </div>

                  {/* Bottom Line Info */}
                  <div className="mt-4 flex items-center justify-between pt-2">
                     <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={12} className="text-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {analytics.lastActive ? analytics.lastActive.toLocaleDateString() : 'Never Active'}
                        </span>
                     </div>
                     <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 group-hover:translate-x-1.5 transition-transform uppercase tracking-widest">
                        View Details
                        <ChevronRight size={10} strokeWidth={3} />
                     </div>
                  </div>
               </motion.div>
             ))}
          </div>
        )}
      </div>

      {/* Modal showing table order details */}
      <AdminModal
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={`${selectedTable?.tableName} - Historical Log`}
        subtitle={`Summary of all ${selectedTable?.totalOrdersCount || 0} orders processed`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 p-5 bg-slate-900 text-white rounded-[2rem]">
            <div className="text-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Orders placed</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">{selectedTable?.totalOrdersCount}</span>
            </div>
            <div className="text-center border-x border-white/10">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Cash Settle</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">{selectedTable?.completedOrdersCount}</span>
            </div>
            <div className="text-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Gross Revenue</span>
              <span className="text-2xl font-black text-white mt-1 block">₹{selectedTable?.totalSales}</span>
            </div>
          </div>

          {/* Orders History List */}
          <div className="space-y-3">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Processed Transactions</h4>
             <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-2 thin-scrollbar">
                {selectedTable?.orders.map((order, idx) => (
                  <div key={order._id || idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-700 shadow-sm shrink-0">
                           <ShoppingCart size={16} />
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-900 uppercase">{order.orderNumber}</p>
                           <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-400 uppercase">
                             <span>Waiter: {order.waiterName || 'POS'}</span>
                             <span className="w-1 h-1 rounded-full bg-slate-200" />
                             <span>Type: {order.orderType}</span>
                             <span className="w-1 h-1 rounded-full bg-slate-200" />
                             <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-6">
                        <div className="text-right">
                           <p className="text-sm font-black text-slate-900">₹{order.grandTotal || order.subTotal}</p>
                           <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border mt-1 inline-block ${
                             ['completed', 'paid'].includes(order.status?.toLowerCase()) 
                               ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                               : order.status === 'cancelled' 
                                 ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                 : 'bg-amber-50 text-amber-600 border-amber-100'
                           }`}>
                             {order.status}
                           </span>
                        </div>
                     </div>
                  </div>
                ))}
                {selectedTable?.orders.length === 0 && (
                  <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                     No orders recorded for this table yet.
                  </div>
                )}
             </div>
          </div>

          <div className="flex justify-end pt-2">
             <button 
               onClick={() => setSelectedTable(null)}
               className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
             >
               Close Log
             </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border border-slate-100 shadow-sm max-w-md mx-auto mt-20 text-center">
       <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-[1.5rem] flex items-center justify-center mb-6">
          <History size={28} />
       </div>
       <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">{title}</h3>
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{subtitle}</p>
    </div>
  );
}
