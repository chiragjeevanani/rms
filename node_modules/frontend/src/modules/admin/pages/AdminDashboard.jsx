import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, ShoppingBag, Clock, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, Package, Utensils,
  BarChart3
} from 'lucide-react';
import { ADMIN_STATS_HISTORY } from '../data/adminData';

const stats = [
  { label: "Today's Revenue", value: "₹42,850", trend: "+12.5%", isUp: true, icon: TrendingUp, color: "blue" },
  { label: "Total Orders", value: "156", trend: "+8.2%", isUp: true, icon: ShoppingBag, color: "slate" },
  { label: "Active Orders", value: "12", trend: "Normal", isUp: true, icon: Clock, color: "orange" },
  { label: "Avg Prep Time", value: "18m", trend: "-2.1%", isUp: false, icon: Utensils, color: "emerald" },
];

export default function AdminDashboard() {
  const maxRevenue = Math.max(...ADMIN_STATS_HISTORY.map(d => d.revenue));

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Operational Overview</h1>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time performance monitoring</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Export Report</button>
           <button className="px-4 py-2 bg-slate-900 text-white rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95 transition-all">Configure</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 border border-slate-100 rounded-sm shadow-sm hover:border-slate-300 transition-all group"
          >
             <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all`}>
                   <stat.icon size={20} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${stat.isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                   {stat.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                   {stat.trend}
                </div>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
             <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Sales Chart Section */}
         <div className="lg:col-span-2 bg-white border border-slate-100 rounded-sm shadow-sm flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
               <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Hourly Sales Performance</h3>
               </div>
               <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded text-[8px] font-bold text-slate-400 uppercase">
                     <div className="w-2 h-2 rounded-full bg-blue-500" />
                     Dine-in
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded text-[8px] font-bold text-slate-400 uppercase">
                     <div className="w-2 h-2 rounded-full bg-slate-200" />
                     Takeaway
                  </div>
               </div>
            </div>
            <div className="flex-1 p-8">
               <div className="h-full w-full flex flex-col relative overflow-hidden group/chart-area rounded-sm">
                  {/* Grid Lines Context */}
                  <div className="absolute inset-0 pb-12 pr-6 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                    {[1,2,3,4].map(i => <div key={i} className="w-full h-px bg-slate-900" />)}
                  </div>

                  {/* SVG Line Graph Layer */}
                  <div className="absolute inset-0 pb-12 pr-6">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area Fill - Smoother Curve using quadratic approximation */}
                      <motion.path
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        d={`M 0 100 
                           ${ADMIN_STATS_HISTORY.map((item, i) => {
                             const x = (i / (ADMIN_STATS_HISTORY.length - 1)) * 100;
                             const y = 98 - (item.revenue / maxRevenue) * 90; 
                             return `L ${x} ${y}`;
                           }).join(' ')} 
                           L 100 100 Z`}
                        fill="url(#lineGlow)"
                        stroke="none"
                      />

                      {/* Line Stroke */}
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        d={`M 0 100 
                           ${ADMIN_STATS_HISTORY.map((item, i) => {
                             const x = (i / (ADMIN_STATS_HISTORY.length - 1)) * 100;
                             const y = 98 - (item.revenue / maxRevenue) * 90;
                             return `L ${x} ${y}`;
                           }).join(' ')}`}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>

                  {/* Interaction & Labels Layer */}
                  <div className="flex-1 flex justify-between gap-0 h-full relative z-10 pr-6">
                     {ADMIN_STATS_HISTORY.map((item, idx) => {
                        const yPos = 98 - (item.revenue / maxRevenue) * 90;
                        return (
                           <div key={idx} className="flex-1 flex flex-col items-center group relative h-full">
                              {/* Hover Point indicator - Constrained within graph area */}
                              <div 
                                className="absolute inset-x-0 bottom-12 transition-all duration-300 opacity-0 group-hover:opacity-100 flex flex-col items-center pointer-events-none"
                                style={{ top: `${yPos}%` }}
                              >
                                <div className="w-3.5 h-3.5 bg-white border-[3px] border-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] -mt-1.5 z-20" />
                                <div className="w-[1.5px] h-full bg-gradient-to-b from-blue-500/30 to-transparent" />
                              </div>

                              {/* Tooltip on hover */}
                              <div 
                                className="absolute mb-6 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 pointer-events-none scale-90 group-hover:scale-100"
                                style={{ top: `calc(${yPos}% - 40px)` }}
                              >
                                 <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-sm shadow-2xl whitespace-nowrap border border-white/10 uppercase tracking-widest">
                                    ₹{item.revenue.toLocaleString()}
                                 </div>
                                 <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 mx-auto -mt-1.5 border-r border-b border-white/10" />
                              </div>
                              
                              {/* Label */}
                              <div className="mt-auto pt-4 w-full h-12 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter w-full text-center truncate px-1">
                                   {item.time}
                                </span>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
         </div>

         {/* Right Activity Sidebar */}
         <div className="bg-white border border-slate-100 rounded-sm shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-50">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Recent Transactions</h3>
            </div>
            <div className="p-4 space-y-4">
               {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-sm transition-all cursor-pointer group">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                           <ShoppingBag size={14} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-slate-900">Order #88{20 + i}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">2 mins ago • Card</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black text-slate-900">₹{450 * i}</span>
                  </div>
               ))}
            </div>
            <div className="p-4 mt-auto border-t border-slate-50">
               <button className="w-full py-2 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-100 transition-colors">View All Logs</button>
            </div>
         </div>
      </div>
      
      {/* Footer Industrial Info */}
      <footer className="pt-8 border-t border-slate-100 flex items-center justify-between opacity-40">
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">RMS Terminal v2.4.0 • System Synchronized • {new Date().toLocaleDateString()}</p>
         <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="hover:text-slate-900 cursor-pointer">Security Center</span>
            <span className="hover:text-slate-900 cursor-pointer">Support Protocol</span>
         </div>
      </footer>
    </div>
  );
}
