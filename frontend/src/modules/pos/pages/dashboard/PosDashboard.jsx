import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { 
  History, FileText, LayoutGrid, Clock, Banknote, 
  RefreshCw, Menu, XCircle, Calendar, Plus, 
  TrendingUp, Users, ShoppingBag, IndianRupee,
  ChevronRight, ArrowUpRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { usePos } from '../../context/PosContext';
import { playClickSound } from '../../utils/sounds';
import PosTopNavbar from '../../components/PosTopNavbar';
import dbClient from '../../../../config/dbClient';


export default function PosDashboard() {
  const navigate = useNavigate();
  const { toggleSidebar } = usePos();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
  const branchName = staffInfo.branchName || staffInfo.branchId?.branchName || 'Main Branch';

  const fetchStats = async () => {
    try {
      const bId = typeof staffInfo.branchId === 'object' ? staffInfo.branchId?._id : staffInfo.branchId;
      const branchQuery = bId ? `?branchId=${bId}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/stats/staff-snapshot${branchQuery}`);
      const result = await response.json();
      if (result.success) setStats(result.data);
    } catch (err) {
      console.error('Stats fetch error online:', err);
      if (dbClient.isElectron) {
        console.log('[PosDashboard] Offline/Electron, calculating stats locally from SQLite.');
        try {
          const localOrders = await dbClient.getOrders();
          
          // Get today's range in local date
          const todayStr = new Date().toDateString();
          const todayOrders = localOrders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
          
          const todayRevenue = todayOrders
            .filter(o => o.status === 'paid')
            .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
            
          const completedToday = todayOrders.filter(o => o.status === 'paid').length;
          
          const pendingOrders = localOrders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length;
          
          // Let's compute hourlyTrends
          // Initialize hours 9 to 22 with 0 sales
          const hourlyMap = {};
          for (let h = 9; h <= 22; h++) {
            hourlyMap[h] = 0;
          }
          
          todayOrders.forEach(o => {
            if (o.status === 'paid') {
              const hour = new Date(o.createdAt).getHours();
              if (hour >= 9 && hour <= 22) {
                hourlyMap[hour] += o.grandTotal || 0;
              }
            }
          });
          
          const hourlyTrends = Object.keys(hourlyMap).map(h => {
            const hourNum = parseInt(h);
            const label = hourNum > 12 ? `${hourNum - 12} PM` : hourNum === 12 ? '12 PM' : `${hourNum} AM`;
            return { name: label, sales: hourlyMap[h] };
          });
          
          // Get tables cache for available tables
          let availableTables = 0;
          try {
            const cachedTables = await dbClient.getTablesCache();
            if (cachedTables) {
              availableTables = cachedTables.filter(t => t.status === 'available' || t.status === 'Available').length;
            }
          } catch(e) {}
          
          setStats({
            todayRevenue,
            completedToday,
            pendingOrders,
            availableTables,
            hourlyTrends
          });
        } catch (localErr) {
          console.error('[PosDashboard] Failed to calculate local stats:', localErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const operationTiles = [
    { label: 'Table Layout', icon: <LayoutGrid size={24} />, path: '/pos/tables', color: 'bg-blue-500' },
    { label: 'Active Orders', icon: <Clock size={24} />, path: '/pos/orders/active', color: 'bg-amber-500' },
    { label: 'Completed Orders', icon: <History size={24} />, path: '/pos/orders/completed', color: 'bg-emerald-500' },
    { label: 'Cancelled Orders', icon: <XCircle size={24} />, path: '/pos/orders/cancelled', color: 'bg-rose-500' },
    { label: 'Billing History', icon: <FileText size={24} />, path: '/pos/billing/history', color: 'bg-indigo-500' },
  ];

  const handleTileClick = (path) => {
    playClickSound();
    if (path !== '#') navigate(path);
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F5F9] font-sans overflow-hidden select-none">
      <PosTopNavbar />
      
      {/* ── CUSTOM HEADER ── */}
      <div className="bg-white px-8 py-5 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-5">
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">{branchName}</h1>
              <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Online • Terminal #01</span>
              </div>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <button type="button" 
              onClick={() => navigate('/pos/tables')}
              style={{ backgroundColor: 'var(--pos-sidebar-color, var(--primary-color))' }}
              className="text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={14} strokeWidth={3} /> New Order
            </button>
           <button type="button" onClick={fetchStats} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* ── DASHBOARD CONTENT ── */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Row 1: Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Today's Sales" 
              value={`₹${stats?.todayRevenue || 0}`} 
              icon={<IndianRupee size={20} />} 
              trend="+12.5%" 
              color="text-emerald-600" 
              bg="bg-emerald-50"
            />
            <StatCard 
              label="Completed Orders" 
              value={stats?.completedToday || 0} 
              icon={<ShoppingBag size={20} />} 
              trend="+8" 
              color="text-blue-600" 
              bg="bg-blue-50"
            />
            <StatCard 
              label="Live Tables" 
              value={stats?.pendingOrders || 0} 
              icon={<Users size={20} />} 
              trend="Active" 
              isDynamic
            />
            <StatCard 
              label="Available" 
              value={stats?.availableTables || 0} 
              icon={<LayoutGrid size={20} />} 
              trend="Tables" 
              isDynamic
            />
          </div>

          {/* Row 2: Charts & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Sales Chart */}
             <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-8">
                   <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Hourly Sales Pulse</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Real-time revenue performance</p>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">
                      <TrendingUp size={12} /> Live
                   </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.hourlyTrends || []}>
                      <defs>
                         <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--pos-sidebar-color, var(--primary-color, #ff7a00))" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--pos-sidebar-color, var(--primary-color, #ff7a00))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                      />
                       <Area type="monotone" dataKey="sales" stroke="var(--pos-sidebar-color, var(--primary-color, #ff7a00))" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Operations Grid */}
             <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Terminal Ops</h3>
                <div className="grid grid-cols-2 gap-4">
                   {operationTiles.map((tile, idx) => (
                     <button type="button"
                       key={idx}
                       onClick={() => handleTileClick(tile.path)}
                       className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all active:scale-95 text-center gap-3"
                     >
                        <div 
                          style={{
                            '--tile-hover-color': 'var(--pos-sidebar-color, var(--primary-color))',
                          }}
                          className={`p-3 rounded-xl text-white ${tile.color} shadow-lg shadow-black/5 group-hover:scale-110 group-hover:bg-[var(--tile-hover-color)] transition-all`}
                        >
                           {tile.icon}
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight group-hover:text-slate-950 transition-colors">
                           {tile.label}
                        </span>
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="px-10 py-4 bg-white border-t border-slate-100 flex items-center justify-between text-slate-400 shrink-0">
         <span className="text-[9px] font-bold uppercase tracking-widest">© 2026 RMS Terminal System • Secure Node</span>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 leading-none">Cloud Link Active</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest italic">{staffInfo.name || 'Staff User'}</span>
         </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon, trend, color, bg, isDynamic }) {
  const dynamicStyle = isDynamic ? {
    color: 'var(--pos-sidebar-color, var(--primary-color))',
    backgroundColor: 'color-mix(in srgb, var(--pos-sidebar-color, var(--primary-color)) 8%, transparent)'
  } : null;

  return (
    <m.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden group"
    >
      <div 
        style={isDynamic ? { backgroundColor: 'var(--pos-sidebar-color, var(--primary-color))' } : null}
        className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700 ${!isDynamic ? bg : ''}`} 
      />
      <div className="flex items-center justify-between relative z-10">
        <div 
          style={dynamicStyle}
          className={`p-3 rounded-2xl ${!isDynamic ? `${bg} ${color}` : ''}`}
        >
          {icon}
        </div>
        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
           {trend} <ArrowUpRight size={10} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <h4 className="text-2xl font-black text-slate-900 mt-1">{value}</h4>
      </div>
    </m.div>
  );
}
