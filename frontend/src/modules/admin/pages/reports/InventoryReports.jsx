
import React, { useState, useEffect } from 'react';
import { 
  Package, AlertTriangle, ArrowRight, BarChart3, Database, 
  TrendingDown, TrendingUp, Search, Calendar, Filter, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

export default function InventoryReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
           <Activity className="animate-spin text-slate-900" size={40} />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Stock Node...</p>
        </div>
      </div>
    );
  }

  const { stats, categories, items } = data || {};

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
          <button className="h-12 px-6 border border-slate-200 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all outline-none">
            <Filter size={14} />
            Filter Categories
          </button>
          <button className="h-12 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all outline-none">
            <Package size={14} />
            Manage Stock
          </button>
        </div>
      </div>

      {/* Metric Cards - Premium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Asset Valuation', value: `₹${stats?.totalValue?.toLocaleString()}`, icon: TrendingUp, desc: 'Total Inventory Capital', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'SKU Density', value: stats?.totalItems, icon: Database, desc: 'Total Unique Identifiers', color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Critical Alert', value: stats?.lowStock, icon: AlertTriangle, desc: 'Below Minimum Threshold', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Deficit Point', value: stats?.outOfStock, icon: TrendingDown, desc: 'Zero Quantity Stock', color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            <div className={`absolute right-[-10px] top-[-10px] w-20 h-20 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ${item.bg}`} />
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                <item.icon size={18} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{item.value || 0}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Breakdown Chart */}
        <div className="lg:col-span-1 bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center gap-4 mb-10">
             <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Capital Distribution</h3>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={categories} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={70} 
                  outerRadius={90} 
                  paddingAngle={8} 
                  dataKey="value"
                >
                  {categories?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
                   itemStyle={{ color: '#fff', textTransform: 'uppercase', fontWeight: 900 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full mt-10 space-y-3 px-4">
            {categories?.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{cat.name}</span>
                </div>
                <span className="text-[10px] font-black text-slate-900">₹{cat.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Item Ledger */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
          <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">SKU Fulfillment Ledger</h3>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                 type="text" 
                 placeholder="Search Stock Identifiers..." 
                 className="h-11 pl-11 pr-6 bg-slate-50 border-none rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 focus:ring-2 ring-slate-900/5 transition-all outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto flex-1 h-[450px]">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50/50 sticky top-0 z-10">
                      <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Stock Identifier</th>
                      <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Category</th>
                      <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Fulfillment Status</th>
                      <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Asset Value</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {items?.map((item, i) => (
                     <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{item.name}</span>
                              <span className="text-[9px] font-bold text-slate-400 mt-0.5">{item.quantity} {item.unit} available</span>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-[8px] font-black uppercase tracking-widest">{item.category}</span>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                item.quantity === 0 ? 'bg-rose-500' : (item.quantity <= item.minLevel ? 'bg-amber-500' : 'bg-emerald-500')
                              }`} />
                              <span className={`text-[9px] font-black uppercase tracking-widest ${
                                item.quantity === 0 ? 'text-rose-500' : (item.quantity <= item.minLevel ? 'text-amber-600' : 'text-slate-500')
                              }`}>
                                 {item.quantity === 0 ? 'Zero Point' : (item.quantity <= item.minLevel ? 'Threshold Alert' : 'Logistics Target Met')}
                              </span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <span className="text-xs font-black text-slate-900">₹{(item.quantity * item.price).toLocaleString()}</span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Logistics Heartbeat</span>
             </div>
             <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-900">
                Data Real-Time <ArrowRight size={12} className="text-indigo-500" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
