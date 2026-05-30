import React, { useState, useEffect } from 'react';
import { Server, Users, Zap, Database, HardDrive, Cpu, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DashboardOverview() {
  const { admins, accentColor } = useOutletContext();
  const [registrationPeriod, setRegistrationPeriod] = useState('weekly');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Dashboard Stats on Mount
  const fetchStats = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/dashboard-stats`);
      const result = await res.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      toast.error('Failed to fetch platform metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Stats Calculations from admins array fallback
  const activeAdminsCount = admins.filter(a => (a.status || '').toLowerCase() !== 'inactive').length;
  const inactiveAdminsCount = admins.length - activeAdminsCount;

  // Weekly Registrations Calculation
  const getWeeklyRegistrations = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateString: d.toDateString(),
        registrations: 0
      });
    }

    admins.forEach(admin => {
      if (!admin.createdAt) return;
      const createdStr = new Date(admin.createdAt).toDateString();
      const match = days.find(day => day.dateString === createdStr);
      if (match) match.registrations += 1;
    });

    return days;
  };

  // Monthly Registrations Calculation
  const getMonthlyRegistrations = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        name: d.toLocaleDateString('en-US', { month: 'short' }),
        key: `${d.getFullYear()}-${d.getMonth()}`,
        registrations: 0
      });
    }

    admins.forEach(admin => {
      if (!admin.createdAt) return;
      const d = new Date(admin.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const match = months.find(m => m.key === key);
      if (match) match.registrations += 1;
    });

    return months;
  };

  const chartData = registrationPeriod === 'weekly' ? getWeeklyRegistrations() : getMonthlyRegistrations();

  const pieData = [
    { name: 'Active Node Admins', value: activeAdminsCount },
    { name: 'Inactive Node Admins', value: inactiveAdminsCount }
  ].filter(d => d.value > 0);

  const PIE_COLORS = [accentColor, '#EF4444'];

  if (loading || !stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-800 rounded-full animate-spin" style={{ borderTopColor: accentColor }} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Syncing Platform Metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Platform Overview KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="Admins (Active/Total)" 
          value={`${stats.accounts.active}/${stats.accounts.total}`} 
          icon={<Server size={22} />} 
          trend={`${stats.accounts.inactive} Suspended Nodes`} 
          bg="bg-blue-500" 
        />
        <StatCard 
          label="Allocated Branches Limit" 
          value={stats.branches.allocated} 
          icon={<Layers size={22} />} 
          trend={`${stats.branches.used} Branches Active`} 
          bg="bg-indigo-500" 
        />
        <StatCard 
          label="Available Branches Left" 
          value={stats.branches.available} 
          icon={<Users size={22} />} 
          trend={`${stats.branches.allocated - stats.branches.used} Free Pools`} 
          bg="bg-emerald-500" 
        />
        <StatCard 
          label="DB Storage Utilization" 
          value={`${stats.system.storageUsageMb} MB`} 
          icon={<HardDrive size={22} />} 
          trend={`${stats.system.latencyMs}ms Database Latency`} 
          bg="bg-amber-500" 
        />
      </div>

      {/* 2. Database Latency and System Resource Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResourceMiniCard label="Engine Latency" value={`${stats?.system?.latencyMs ?? 0} ms`} icon={<Cpu size={16} />} color="text-emerald-500" desc="System response nominal" />
        <ResourceMiniCard label="Total DB Document Records" value={(stats?.system?.totalDocuments ?? 0).toLocaleString()} icon={<Database size={16} />} color="text-indigo-500" desc="Across all isolated nodes" />
        <ResourceMiniCard label="Active Staff Resources" value={(stats?.users?.totalStaff ?? 0).toLocaleString()} icon={<Users size={16} />} color="text-amber-500" desc="Active terminal workers" />
      </div>

      {/* 3. Registrations Area Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Admin Registrations</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Timeline of provisioned nodes</p>
            </div>
            
            {/* Weekly / Monthly Toggle Buttons */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button 
                onClick={() => setRegistrationPeriod('weekly')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${registrationPeriod === 'weekly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-655'}`}
                style={registrationPeriod === 'weekly' ? { color: accentColor } : {}}
              >
                Weekly
              </button>
              <button 
                onClick={() => setRegistrationPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${registrationPeriod === 'monthly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-655'}`}
                style={registrationPeriod === 'monthly' ? { color: accentColor } : {}}
              >
                Monthly
              </button>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94A3B8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94A3B8'}} allowDecimals={false} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', fontSize: '11px', fontBold: true}} />
                <Area type="monotone" dataKey="registrations" stroke={accentColor} strokeWidth={4} fillOpacity={1} fill="url(#colorPulse)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proportions Donut Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Admin Node Proportions</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-6">Distribution by active status</p>
          </div>
          <div className="h-[180px] w-full flex items-center justify-center relative">
            {pieData.length === 0 ? (
              <span className="text-slate-300 italic text-[11px]">No node data available</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', fontSize: '11px', fontBold: true}} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800">{admins.length}</span>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Total Nodes</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Active ({activeAdminsCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Inactive ({inactiveAdminsCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Database & Resource Monitoring (Highest Resource Users Table) */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Database & Resource Consumption</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Identify highest resource consuming restaurant nodes</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Restaurant Identity</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Active Branches</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Orders</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Staff</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Tables</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Combined Resource Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.resourceConsumption.map((node, index) => (
                <tr key={node.restaurantId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shadow-inner">
                        {(index + 1).toString().padStart(2, '0')}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{node.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">{node.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[11px] font-black text-slate-800">{node.branchesCount}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">/ {node.branchLimit} Limit</span>
                  </td>
                  <td className="px-6 py-4 text-center font-extrabold text-[11px] text-slate-500 tabular-nums">{(node.ordersCount ?? 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center font-extrabold text-[11px] text-slate-500 tabular-nums">{(node.staffCount ?? 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center font-extrabold text-[11px] text-slate-500 tabular-nums">{(node.tablesCount ?? 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg text-[10px] font-black tracking-tight shadow-sm">
                      <Database size={10} />
                      <span>{(node.totalDocuments ?? 0).toLocaleString()} records</span>
                    </div>
                  </td>
                </tr>
              ))}
              {stats.resourceConsumption.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-300 italic text-[11px]">No database consumption records.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend, bg }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-between relative overflow-hidden group"
    >
      <div>
        <p className="text-[9px] font-black text-slate-450 uppercase tracking-[0.2em]">{label}</p>
        <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{value}</h4>
        <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
          {trend}
        </span>
      </div>
      <div className={`w-14 h-14 rounded-2xl ${bg} text-white flex items-center justify-center shadow-lg group-hover:rotate-6 duration-300`}>
        {icon}
      </div>
    </motion.div>
  );
}

function ResourceMiniCard({ label, value, icon, color, desc }) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center ${color} shadow-sm shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
        <p className="text-base font-black text-slate-950 mt-1 leading-none">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 truncate leading-none">{desc}</p>
      </div>
    </div>
  );
}
