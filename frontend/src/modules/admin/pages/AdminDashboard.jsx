
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Clock, CheckCircle2, Utensils, 
  Package, LayoutGrid, Layers, Activity, 
  RefreshCcw, ChevronRight, TrendingUp, ArrowRight, Calendar,
  TrendingDown, Box, PieChart, Users, Building2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueFilter, setRevenueFilter] = useState('daily'); 
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const navigate = useNavigate();

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/branches`);
      const result = await response.json();
      if (result.success) {
        setBranches(result.data);
      }
    } catch (error) {
      console.error('Fetch Branches Error:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const branchParam = selectedBranch !== 'all' ? `?branchId=${selectedBranch}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard-stats${branchParam}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); 
    return () => clearInterval(interval);
  }, [selectedBranch]);

  const chartData = useMemo(() => {
    if (!data?.trends) return [];
    if (revenueFilter === 'daily') {
      return data.trends.daily.slice(-14).map(t => ({ name: t.day, revenue: t.revenue }));
    }
    if (revenueFilter === 'weekly') {
      const weekly = [];
      const history = data.trends.daily;
      for (let i = 0; i < history.length; i += 7) {
        const slice = history.slice(i, i + 7);
        const total = slice.reduce((acc, curr) => acc + curr.revenue, 0);
        weekly.push({ name: `Week ${Math.floor(i/7) + 1}`, revenue: total });
      }
      return weekly;
    }
    if (revenueFilter === 'monthly') {
       return data.trends.monthly;
    }
    return [];
  }, [data, revenueFilter]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
           <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Accessing Intelligence Central</p>
        </div>
      </div>
    );
  }

  const { orders, content, recentOrders, metrics } = data || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-8 selection:bg-slate-900 selection:text-white pb-32">
      {/* Top Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff7a00] bg-[#ff7a00]/10 px-2 py-0.5 rounded">Management Node</span>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Dashboard</h1>
           <p className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-wide flex items-center gap-2">
             <Calendar size={12} /> {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} · Status: Nominal
           </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           {/* Branch Dropdown */}
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm min-w-[200px]">
              <Building2 size={16} className="text-slate-400" />
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-900 outline-none w-full cursor-pointer"
              >
                <option value="all">Global (All Branches)</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.branchName}</option>
                ))}
              </select>
           </div>

           <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm h-[42px]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">System Live</span>
           </div>
           
           <button 
             onClick={fetchDashboardData}
             className="h-[42px] flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all text-xs font-bold uppercase tracking-widest shadow-lg shadow-slate-900/10 active:scale-95"
           >
             <RefreshCcw size={14} strokeWidth={3} /> Sync
           </button>
        </div>
      </div>

      {/* Row 1: Primary KPI Cards (Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Revenue Today', value: `₹${metrics?.todayRevenue?.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', path: '/admin/reports/sales' },
          { label: 'Queue Orders', value: orders?.pending, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', path: '/admin/orders/all' },
          { label: 'Kitchen Prep', value: orders?.preparing, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', path: '/admin/orders/all' },
          { label: 'Completed', value: orders?.completed, icon: CheckCircle2, color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-200', path: '/admin/orders/all' },
        ].map((stat, i) => (
          <motion.div 
             key={i} 
             onClick={() => navigate(stat.path)}
             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
             className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] group hover:border-slate-800 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
          >
             <div className="flex items-center justify-between mb-6">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                   <stat.icon size={18} strokeWidth={2.5} />
                </div>
                <div className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight size={14} className="text-slate-400" />
                </div>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
             <div className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{stat.value || 0}</div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Menu Resource Grid (Clickable) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { label: 'Categories', total: content?.categories?.total, active: content?.categories?.active, inactive: content?.categories?.inactive, icon: LayoutGrid, accent: 'bg-[#ff7a00]', path: '/admin/menu/categories' },
          { label: 'Menu Inventory', total: content?.items?.total, active: content?.items?.active, inactive: content?.items?.inactive, icon: Utensils, accent: 'bg-slate-900', path: '/admin/menu/items' },
          { label: 'Combo Packages', total: content?.combos?.total, active: content?.combos?.active, inactive: content?.combos?.inactive, icon: Layers, accent: 'bg-indigo-900', path: '/admin/menu/combos' },
        ].map((c, i) => (
          <div 
             key={i} 
             onClick={() => navigate(c.path)}
             className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-6 group hover:border-slate-800 hover:shadow-xl transition-all cursor-pointer active:scale-[0.98]"
          >
             <div className={`w-14 h-14 rounded-[1.25rem] ${c.accent} text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                <c.icon size={24} strokeWidth={1.5} />
             </div>
             <div className="flex-1">
                <div className="flex items-baseline justify-between mb-3 border-b border-slate-50 pb-2">
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{c.label}</h3>
                   <span className="text-xl font-black text-slate-900 tracking-tighter">{c.total || 0}</span>
                </div>
                <div className="flex gap-4">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Published</span>
                      <span className="text-base font-black text-emerald-600">{c.active || 0}</span>
                   </div>
                   <div className="w-px h-6 bg-slate-100" />
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Drafts</span>
                      <span className="text-base font-black text-slate-300">{c.inactive || 0}</span>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Row 3: Analytics Hub & Activity List */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm flex flex-col relative overflow-hidden">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-slate-50 pb-6">
              <div className="flex items-center gap-4">
                 <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                 <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Revenue Performance</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Market Inflow Distribution</p>
                 </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                 {['Daily', 'Weekly', 'Monthly'].map((f) => (
                    <button 
                       key={f} 
                       onClick={() => setRevenueFilter(f.toLowerCase())}
                       className={`px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                         revenueFilter === f.toLowerCase() 
                         ? 'bg-white text-slate-900 shadow-sm border border-slate-100' 
                         : 'text-slate-400 hover:text-slate-700'
                       }`}
                    >
                       {f}
                    </button>
                 ))}
              </div>
           </div>
           
           <div className="flex-1 h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                       <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f172a" stopOpacity={0.08}/>
                          <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8', textTransform: 'uppercase' }} 
                       dy={15} 
                    />
                    <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                    />
                    <Tooltip 
                       contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: '12px', 
                          border: 'none', 
                          padding: '12px 16px',
                          color: '#fff',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
                       }}
                       cursor={{ stroke: '#0f172a', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" strokeLinecap="round" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Transaction Panel */}
        <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.1em]">Recent Orders</h3>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-[9px] font-black text-slate-400 uppercase underline decoration-blue-500/30 underline-offset-4">Live Activity</span>
              </div>
           </div>
           
           <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {recentOrders?.map((order, i) => (
                <motion.div 
                   key={i} 
                   whileHover={{ x: 5 }}
                   onClick={() => navigate('/admin/orders/all')}
                   className="flex items-center gap-5 p-5 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all cursor-pointer group"
                >
                   <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0 shadow-sm">
                      <ShoppingBag size={18} strokeWidth={1.5} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-slate-900 uppercase truncate leading-none mb-2">{order.orderNumber}</p>
                      <div className="flex items-center gap-3">
                         <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            order.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                         }`}>
                           {order.status}
                         </span>
                         <span className="text-[9px] font-bold text-slate-300">
                            {order.tableName}
                         </span>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-base font-black text-slate-900">₹{order.grandTotal}</p>
                   </div>
                </motion.div>
              ))}
              {recentOrders?.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 grayscale">
                    <Activity size={40} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Active Stream</p>
                </div>
              )}
           </div>

           <button 
             onClick={() => navigate('/admin/orders/all')}
             className="mt-10 w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-95"
           >
             View All History <ArrowRight size={14} />
           </button>
        </div>
      </div>
    </div>
  );
}



