import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  LayoutGrid, Bell, Clock, CheckCircle, TrendingUp, 
  Package, Calendar, PieChart as PieIcon, Activity
} from 'lucide-react';
import { useOrders } from '../../../context/OrderContext';
import { useTheme } from '../../user/context/ThemeContext';

const COLORS = ['#D4AF37', '#5D4037', '#8D6E63', '#BDBDBD', '#4E342E'];

export default function KdsDashboard() {
  const { orders, isLoading, fetchOrders, updateOrderStatus } = useOrders();
  const { isDarkMode } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch real analytics from backend
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/analytics`);
      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  const liveStats = useMemo(() => {
    return {
      total: orders.length,
      incoming: orders.filter(o => o.status === 'new').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      completed: orders.filter(o => ['ready', 'completed', 'served'].includes(o.status)).length,
    };
  }, [orders]);

  const finalStats = analytics?.counts || liveStats;
  const trendData = analytics?.trends || [];
  const categoryData = analytics?.categories || [];

  if (isLoading && isAnalyticsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Activity className="animate-spin text-[#D4AF37]" size={48} />
      </div>
    );
  }

  return (
    <div className={`h-full p-6 overflow-y-auto no-scrollbar transition-colors duration-500 ${
      isDarkMode ? 'bg-[#121416] text-white' : 'bg-stone-50 text-stone-900'
    }`}>
      
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Kitchen Dashboard</h1>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-1">Order Analytics & Performance</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${
          isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-stone-200'
        }`}>
          <Calendar size={16} className="text-[#D4AF37]" />
          <span className="text-[10px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: finalStats.total, icon: Package, color: 'text-stone-400', bg: 'bg-stone-500/10' },
          { label: 'New Orders', value: finalStats.incoming || finalStats.new, icon: Bell, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Preparing', value: finalStats.preparing, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Completed', value: finalStats.completed, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((item, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={item.label}
            className={`p-6 rounded-[2.2rem] border flex items-center justify-between transition-all ${
              isDarkMode ? 'bg-[#1a1c1e] border-white/5 shadow-2xl shadow-black/20' : 'bg-white border-stone-100 hover:shadow-xl shadow-sm'
            }`}
          >
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {item.label}
              </p>
              <h2 className="text-4xl font-black tracking-tight">{item.value || 0}</h2>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center`}>
              <item.icon className={item.color} size={28} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className={`lg:col-span-2 p-8 rounded-[2.5rem] border transition-all ${
          isDarkMode ? 'bg-[#1a1c1e] border-white/5 shadow-xl' : 'bg-white border-stone-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-[#D4AF37]" size={20} />
              <h3 className="text-sm font-black uppercase tracking-widest">Order Trends (Weekly)</h3>
            </div>
          </div>
          <div className="h-[300px] w-full relative min-h-[300px]">
            <ResponsiveContainer width="99%" height="99%" aspect={2.5}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#ffffff05' : '#00000005'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: isDarkMode ? '#555' : '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: isDarkMode ? '#555' : '#888' }} />
                <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1a1c1e' : '#fff', borderRadius: '1.2rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', fontSize: '11px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="orders" stroke="#D4AF37" strokeWidth={5} fillOpacity={1} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border transition-all ${
          isDarkMode ? 'bg-[#1a1c1e] border-white/5 shadow-xl' : 'bg-white border-stone-100 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 mb-8">
            <PieIcon className="text-[#D4AF37]" size={20} />
            <h3 className="text-sm font-black uppercase tracking-widest">Category Distribution</h3>
          </div>
          <div className="h-[240px] relative w-full min-h-[240px]">
            <ResponsiveContainer width="99%" height="99%" aspect={1.5}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={10} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black">Top Items</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {categoryData.slice(0, 3).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className={`text-[10px] font-black uppercase tracking-tight ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}>{cat.name}</span>
                </div>
                <span className="text-[11px] font-black">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operations Feed */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
             <h3 className="text-3xl font-black uppercase tracking-tighter">Active Orders</h3>
          </div>
          <button 
            onClick={() => { fetchOrders(); fetchAnalytics(); }}
            className="flex items-center gap-3 px-6 py-3 bg-[#5D4037] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#4E342E] transition-all"
          >
            <Activity size={16} className="animate-pulse" />
            Refresh Dashboard
          </button>
        </div>

        {orders.filter(o => o.status !== 'ready' && o.status !== 'completed' && o.status !== 'cancelled').length === 0 ? (
          <div className="py-24 rounded-[3rem] border border-dashed flex flex-col items-center justify-center opacity-40">
            <Package size={64} className="mb-6 text-stone-500" />
            <h4 className="text-lg font-black uppercase tracking-widest text-[#5D4037]">No Active Orders</h4>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {orders.filter(o => o.status !== 'ready' && o.status !== 'completed' && o.status !== 'cancelled').map((order) => (
              <KdsDashboardOrderCard key={order.id} order={order} onUpdate={updateOrderStatus} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KdsDashboardOrderCard({ order, onUpdate }) {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  return (
    <motion.div layout className={`p-7 rounded-[2.5rem] border transition-all flex flex-col ${isDarkMode ? 'bg-[#1a1c1e] border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${isDarkMode ? 'bg-black/40 border-white/5 text-[#D4AF37]' : 'bg-stone-50 border-stone-100 text-[#5D4037]'}`}>
          #{order.orderNum}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{order.status}</span>
      </div>

      <div className="mb-8 flex-1">
        <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">Table #{order.table}</h4>
        <div className="space-y-2">
          {order.items.slice(0, 3).map((item, id) => (
            <div key={id} className="text-xs font-bold text-stone-500 flex items-center gap-2">
              <span className="text-[#D4AF37] font-black">{item.quantity}x</span>
              <span className="truncate">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-stone-100 dark:border-white/5 space-y-3">
        {order.status === 'new' && (
          <button onClick={() => onUpdate(order.id, 'preparing')} className="w-full bg-[#5D4037] text-white py-4 rounded-2xl text-[11px] font-black uppercase hover:bg-[#4E342E] transition-all">
            Start Preparing
          </button>
        )}
        {order.status === 'preparing' && (
          <button onClick={() => onUpdate(order.id, 'ready')} className="w-full bg-emerald-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase hover:bg-emerald-500 transition-all">
            Mark Ready
          </button>
        )}
        <button 
          onClick={() => navigate(`/kds/orders/${order.id}`)}
          className="w-full bg-black/5 dark:bg-white/5 text-stone-500 py-4 rounded-2xl text-[11px] font-black uppercase hover:bg-black/10 transition-all"
        >
          View Detail
        </button>
      </div>
    </motion.div>
  );
}
