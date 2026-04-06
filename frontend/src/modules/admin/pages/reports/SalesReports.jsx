import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Calendar, ArrowUpRight, TrendingUp, 
  DollarSign, Package, ShoppingBag, Activity, Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';

export default function SalesReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSalesData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/reports/sales`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        throw new Error('Failed to fetch sales data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
           <Activity className="animate-spin text-slate-900" size={40} />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Fetching Intelligence...</p>
        </div>
      </div>
    );
  }

  const { metrics, trends, topProducts } = data || {};

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50/30 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Sales Intelligence</h1>
          <div className="flex items-center gap-3 mt-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fiscal Performance & Revenue Operations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
             <Calendar size={14} className="text-slate-400" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Last 7 Days</span>
          </div>
          <button className="h-12 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all outline-none">
            <Download size={14} />
            Export Dataset
          </button>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Today\'s Earning', value: `₹${metrics?.todayRevenue?.toLocaleString()}`, icon: DollarSign, trend: '+12.5%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Today\'s Orders', value: metrics?.todayOrders, icon: ShoppingBag, trend: 'Optimal', color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Total Revenue', value: `₹${metrics?.totalRevenue?.toLocaleString()}`, icon: TrendingUp, trend: 'Gross', color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Gross Volume', value: metrics?.totalOrders, icon: Package, trend: 'All Time', color: 'text-slate-500', bg: 'bg-slate-100' },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ${item.bg}`} />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                <item.icon size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tighter mb-2">{item.value || 0}</div>
            <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest ${item.color}`}>
               <ArrowUpRight size={10} />
               {item.trend} Growth
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Revenue Stream Analysis</h3>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Inflow</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
                   itemStyle={{ color: '#fff', textTransform: 'uppercase', fontWeight: 900 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Sidebar */}
        <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col">
           <div className="flex items-center gap-4 mb-10">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Top Selling Units</h3>
           </div>
           
           <div className="space-y-6 flex-1">
              {topProducts?.map((product, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-tight text-slate-700 group-hover:text-emerald-500 transition-colors">
                      {product.name}
                    </span>
                    <span className="text-[10px] font-black text-slate-400">{product.volume} Sold</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${(product.volume / Math.max(...topProducts.map(p => p.volume))) * 100}%` }}
                       className="h-full bg-slate-900 group-hover:bg-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                     <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Market Volume</span>
                     <span className="text-[9px] font-black text-slate-500">₹{product.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
           </div>

           <div className="mt-10 pt-10 border-t border-slate-50 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Production Efficiency</p>
              <div className="flex items-center justify-center gap-4">
                 <div className="text-center">
                    <div className="text-xl font-black text-slate-900">98.2%</div>
                    <div className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Quality Score</div>
                 </div>
                 <div className="w-px h-10 bg-slate-100" />
                 <div className="text-center">
                    <div className="text-xl font-black text-slate-900">14m</div>
                    <div className="text-[7px] font-black text-blue-500 uppercase tracking-widest">Avg Prep Time</div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Comparative Analysis Table */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Temporal Sales Breakdown</h3>
           </div>
           <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                 type="text" 
                 placeholder="Search Transactions..." 
                 className="h-10 pl-10 pr-6 bg-slate-50 border-none rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 focus:ring-2 ring-slate-900/5 transition-all outline-none"
              />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Time Period</th>
                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Total Orders</th>
                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Gross Inflow</th>
                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Average Value</th>
                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {trends?.map((day, i) => (
                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-10 py-6 text-xs font-black text-slate-700 uppercase tracking-tight">{day.name}</td>
                  <td className="px-10 py-6 text-xs font-black text-slate-900">{day.orders}</td>
                  <td className="px-10 py-6 text-xs font-black text-slate-900">₹{day.revenue.toLocaleString()}</td>
                  <td className="px-10 py-6 text-xs font-black text-slate-500">₹{(day.revenue / (day.orders || 1)).toFixed(0)}</td>
                  <td className="px-10 py-6 text-right">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      day.revenue > 1000 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {day.revenue > 1000 ? 'High Velocity' : 'Stable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
