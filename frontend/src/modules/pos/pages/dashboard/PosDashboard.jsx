import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, ShoppingCart, Clock, 
  ArrowUpRight, ArrowDownRight, Activity,
  Zap, Calendar, DollarSign, Table as TableIcon, Menu,
  Award, ChevronRight, BarChart2, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { usePos } from '../../context/PosContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PosDashboard() {
  const navigate = useNavigate();
  const { toggleSidebar } = usePos();
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    totalRevenue: 0,
    orderCount: 0,
    activeTables: 0,
    pendingOrders: 0,
    occupancy: 0,
    hourlySales: [],
    topItems: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const savedToken = localStorage.getItem('pos_token') || localStorage.getItem('pos_access') || localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${savedToken}`,
        'Content-Type': 'application/json'
      };

      const [salesRes, kitchenRes, activeRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/orders/reports/sales`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/orders/analytics`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/orders/active`, { headers })
      ]);

      const salesData = await salesRes.json();
      const kitchenData = await kitchenRes.json();
      const activeData = await activeRes.json();

      setMetrics({
        todayRevenue: salesData.data?.metrics?.todayRevenue || 0,
        totalRevenue: salesData.data?.metrics?.totalRevenue || 0,
        orderCount: kitchenData.data?.counts?.total || 0,
        pendingOrders: kitchenData.data?.counts?.new || 0,
        activeTables: activeData.data?.filter(o => o.status !== 'Paid').length || 0,
        occupancy: salesData.data?.metrics?.occupancy || 0,
        hourlySales: salesData.data?.hourlySales || [],
        topItems: salesData.data?.topItems || []
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 20000); 
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Today's Revenue", value: `₹${metrics.todayRevenue}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: '+12.5%' },
    { label: "Active Sessions", value: metrics.activeTables, icon: TableIcon, color: 'text-blue-500', bg: 'bg-blue-50', trend: 'Live' },
    { label: "Pending Orders", value: metrics.pendingOrders, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', trend: 'Priority' },
    { label: "Total Orders", value: metrics.orderCount, icon: ShoppingCart, color: 'text-slate-900', bg: 'bg-slate-100', trend: 'Today' }
  ];

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB] animate-in fade-in duration-700 overflow-y-auto no-scrollbar pb-20 font-sans select-none">
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center gap-6">
         <button onClick={toggleSidebar} className="p-3 bg-slate-900 border border-slate-900 rounded-xl hover:bg-slate-800 transition-all active:scale-95">
            <Menu size={20} className="text-white" />
         </button>
          <div className="flex items-center justify-between flex-1">
             <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Terminal Insights</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Real-time Performance Metrics</p>
             </div>
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/pos/orders/active?newOrder=true')}
                  className="px-8 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 hover:scale-105 transition-all font-black text-[10px] uppercase tracking-[0.2em] group active:scale-95"
                >
                   <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/40 transition-colors">
                      <Plus size={14} className="text-white" />
                   </div>
                   Make Order For Customer
                </button>
                <button onClick={fetchDashboardData} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:rotate-180 duration-500">
                   <Zap size={20} />
                </button>
             </div>
          </div>
      </header>

      <main className="p-10 space-y-10 max-w-[1600px] mx-auto w-full">
         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
               >
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-6 relative z-10">
                     <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm shadow-black/5`}>
                        <stat.icon size={24} strokeWidth={2.5} />
                     </div>
                     <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.trend}</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">{stat.label}</p>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic relative z-10">{stat.value}</h2>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase tracking-widest relative z-10">
                     <Activity size={12} />
                     <span>Syncing with Cloud</span>
                  </div>
               </motion.div>
            ))}
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* Revenue Area Chart */}
            <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="mb-10 flex items-center justify-between relative z-10">
                  <div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Revenue Progression</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hourly Sales Momentum</p>
                  </div>
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-900" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Net Sales</span>
                     </div>
                  </div>
               </div>
               <div className="h-[340px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.hourlySales.length > 0 ? metrics.hourlySales : [{ time: '00:00', revenue: 0 }, { time: '12:00', revenue: 0 }, { time: '23:00', revenue: 0 }]}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 9, fontWeight: 900, fill: '#94A3B8', letterSpacing: '0.1em'}} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 9, fontWeight: 900, fill: '#94A3B8'}} 
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#0F172A" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Side Analytics */}
            <div className="space-y-10">
               {/* Occupancy Card */}
               <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-4 right-4 animate-pulse">
                     <Zap className="text-amber-400 fill-amber-400" size={24} />
                  </div>
                  <div className="mb-8 relative z-10">
                     <h3 className="text-sm font-black text-white uppercase tracking-widest">Global Occupancy</h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live Seat Status</p>
                  </div>
                  <div className="flex flex-col items-center">
                     <div className="relative w-36 h-36">
                         <svg className="w-full h-full" viewBox="0 0 100 100">
                             <circle className="text-slate-800 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent" />
                             <circle className="text-emerald-500 stroke-current transition-all duration-1000" strokeWidth="10" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" 
                                     strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * metrics.occupancy) / 100} />
                         </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-3xl font-black text-white italic leading-none">{metrics.occupancy}%</span>
                             <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-2">Occupied</span>
                         </div>
                     </div>
                  </div>
               </div>

               {/* Top Items Card */}
               <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
                  <div className="mb-8 flex items-center justify-between">
                     <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Popular Choices</h3>
                     <Award className="text-blue-500" size={20} />
                  </div>
                  <div className="space-y-6">
                     {metrics.topItems.length > 0 ? metrics.topItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all text-[11px] font-black">
                                 {i + 1}
                              </div>
                              <span className="text-xs font-black text-slate-700 uppercase italic tracking-tighter truncate w-32">{item.name}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900">{item.count}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sold</span>
                           </div>
                        </div>
                     )) : (
                        <div className="py-10 text-center opacity-30 text-[9px] font-black uppercase tracking-[0.2em]">No Sales Data Yet</div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}
