import React, { useState, useEffect } from 'react';
import { 
  Package, AlertTriangle, ArrowRight, BarChart3, Database, 
  TrendingDown, TrendingUp, Search, Calendar, Filter, Activity,
  Trash2, ArrowUpRight, ChevronRight, Layers, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

export default function InventoryReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('distribution'); // distribution, wastage
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInventoryData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/stock/reports/inventory`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        throw new Error('Failed to fetch inventory reports');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const { stats, categories, items, wastage } = data || {};

  const filteredItems = items?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !data) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
           <Activity className="animate-spin text-slate-900" size={40} />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Stock Node...</p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
     if (!items || items.length === 0) return;
     const headers = ['SKU Name', 'Quantity', 'Unit', 'Category', 'Price', 'Asset Value', 'Min Level', 'Status'];
     const rows = items.map(i => {
       const status = i.quantity === 0 ? 'Zero Point' : (i.quantity <= i.minLevel ? 'Low' : (i.quantity > i.minLevel * 3 ? 'High' : 'Nominal'));
       return [
         i.name, i.quantity, i.unit, i.category, i.price, (i.quantity * i.price), i.minLevel, status
       ];
     });
     const csvContent = "data:text/csv;charset=utf-8," 
       + headers.join(",") + "\n" 
       + rows.map(r => r.join(",")).join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "inventory_audit.csv");
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50/20 min-h-screen pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Inventory Intelligence</h1>
          <div className="flex items-center gap-3 mt-3">
             <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Logistics & Raw Material Ledger Control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
             <button 
                onClick={() => setView('distribution')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'distribution' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Market Dist.
             </button>
             <button 
                onClick={() => setView('wastage')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'wastage' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Wastage Log
             </button>
          </div>
          <button 
            onClick={handleExport}
            className="h-12 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all outline-none"
          >
            <Package size={14} />
            Export Audit
          </button>
        </div>
      </div>

      {/* Metric Cards - Premium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Asset Valuation', value: `₹${stats?.totalValue?.toLocaleString()}`, icon: TrendingUp, desc: 'Total Inventory Capital', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Critical Alert', value: stats?.lowStock + stats?.outOfStock, icon: AlertTriangle, desc: 'Below Minimum Threshold', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Logistics Loss', value: `₹${stats?.wastageValue?.toLocaleString()}`, icon: Trash2, desc: 'Wastage Value (Month)', color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Stock Health', value: `${stats?.totalItems - stats?.lowStock - stats?.outOfStock}/${stats?.totalItems}`, icon: Activity, desc: 'Optimized vs Total SKU', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            <div className={`absolute right-[-10px] top-[-10px] w-20 h-20 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ${item.bg}`} />
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                <item.icon size={18} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{item.value || 0}</div>
            <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest ${item.color}`}>
               <ArrowUpRight size={10} />
               {item.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dynamic Chart Area */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-4">
                <div className={`w-1.5 h-6 rounded-full ${view === 'distribution' ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                  {view === 'distribution' ? 'Capital Distribution Analysis' : 'Wastage Inflow Analysis'}
                </h3>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Logistics Inflow</p>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {view === 'distribution' ? (
                <BarChart data={categories}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                  <Tooltip 
                     cursor={{ fill: '#f8fafc' }}
                     contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
                     itemStyle={{ color: '#fff', textTransform: 'uppercase', fontWeight: 900 }}
                  />
                  <Bar dataKey="value" fill="#0f172a" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              ) : (
                <AreaChart data={wastage?.trends}>
                  <defs>
                    <linearGradient id="colorWastage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
                     itemStyle={{ color: '#fff', textTransform: 'uppercase', fontWeight: 900 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorWastage)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories / Wastage Sidebar */}
        <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col h-full overflow-hidden">
           <div className="flex items-center gap-4 mb-10">
              <div className={`w-1.5 h-6 rounded-full ${view === 'distribution' ? 'bg-indigo-500' : 'bg-rose-500'}`} />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                {view === 'distribution' ? 'Tier Composition' : 'Recent Depletions'}
              </h3>
           </div>
           
           <div className="space-y-6 flex-1 overflow-y-auto pr-4 scrollbar-hide">
              {view === 'distribution' ? (
                categories?.map((cat, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[11px] font-black uppercase tracking-tight text-slate-700 group-hover:text-indigo-500 transition-colors">{cat.name}</span>
                       <span className="text-[10px] font-black text-slate-400">{cat.items} SKUs</span>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(cat.value / Math.max(...categories.map(c => c.value))) * 100}%` }}
                          className="h-full bg-slate-900 group-hover:bg-indigo-500 transition-colors"
                       />
                    </div>
                    <div className="flex justify-between mt-1.5">
                       <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Asset Value</span>
                       <span className="text-[9px] font-black text-slate-500">₹{cat.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                wastage?.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50 hover:border-rose-100 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                           <Box size={18} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-tight text-slate-700">{item.item}</span>
                           <span className="text-[8px] font-bold text-slate-400">{item.quantity} depleted • {item.reason}</span>
                        </div>
                     </div>
                     <span className="text-[10px] font-black text-rose-500">-₹{item.value || 0}</span>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* Detailed Stock Table */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Comprehensive SKU Ledger</h3>
           </div>
           <div className="flex items-center gap-4">
              <div className="relative">
                 <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Quick Search SKUs..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 pl-11 pr-6 bg-slate-50 border-none rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 focus:ring-2 ring-slate-900/5 transition-all outline-none"
                 />
              </div>
           </div>
        </div>
        <div className="overflow-x-auto flex-1">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50">
                    <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Stock Identity</th>
                    <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Fulfillment Level</th>
                    <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Logistics Category</th>
                    <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Asset Valuation</th>
                    <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Threshold</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredItems?.map((item, i) => (
                   <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                      <td className="px-10 py-7">
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.quantity} {item.unit} available</span>
                         </div>
                      </td>
                      <td className="px-10 py-7">
                         <div className="flex flex-col gap-2 max-w-[120px] mx-auto">
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                  className={`h-full rounded-full ${
                                    (item.quantity / (item.minLevel * 3)) < 0.3 ? 'bg-rose-500' : (item.quantity <= item.minLevel ? 'bg-amber-500' : 'bg-emerald-500')
                                  }`}
                                  style={{ width: `${Math.min((item.quantity / (item.minLevel * 3)) * 100, 100)}%` }}
                               />
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest text-center ${
                               (item.quantity / (item.minLevel * 3)) < 0.3 ? 'text-rose-500' : (item.quantity <= item.minLevel ? 'text-amber-500' : 'text-emerald-500')
                            }`}>
                               {item.quantity === 0 ? 'Zero Point' : (item.quantity <= item.minLevel ? 'Low' : (item.quantity > item.minLevel * 3 ? 'High' : 'Nominal'))}
                            </span>
                         </div>
                      </td>
                      <td className="px-10 py-7">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                               <Layers size={14} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{item.category}</span>
                         </div>
                      </td>
                      <td className="px-10 py-7 text-right">
                         <span className="text-xs font-black text-slate-900 tracking-tight">₹{(item.quantity * item.price).toLocaleString()}</span>
                      </td>
                      <td className="px-10 py-7 text-center">
                         <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.minLevel} Min.</span>
                         </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Activity size={14} className="text-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">System Inventory Heartbeat: Stable</span>
           </div>
           <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 animate-pulse">
              Live Feed Active
           </div>
        </div>
      </div>
    </div>
  );
}



