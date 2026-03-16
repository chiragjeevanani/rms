import React from 'react';
import { motion } from 'framer-motion';
import { Timer, Target, Clock, AlertCircle, Save } from 'lucide-react';
import { useTheme } from '../../user/context/ThemeContext';

export default function PreparationTime() {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className={`px-8 py-6 border-b shrink-0 flex items-center justify-between ${
        isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h1 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Preparation Time
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
            Configure SLOs & Prep Time Thresholds
          </p>
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20">
          <Save size={16} strokeWidth={3} />
          Save Configuration
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 no-scrollbar">
        <div className="max-w-4xl space-y-12">
          {/* Global Target */}
          <section>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 px-1">Global Targets</h2>
            <div className={`p-8 rounded-[2rem] border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Ideal Window</label>
                  <div className="flex items-end gap-3">
                    <input type="number" defaultValue="12" className={`text-4xl font-black bg-transparent border-b-2 outline-none w-24 ${isDarkMode ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'}`} />
                    <span className="text-xl font-black text-slate-500 mb-1">MINS</span>
                  </div>
                </div>
                <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Warning Spike</label>
                    <div className="flex items-end gap-3">
                      <input type="number" defaultValue="18" className={`text-4xl font-black bg-transparent border-b-2 outline-none w-24 border-amber-500/30 text-amber-500`} />
                      <span className="text-xl font-black text-slate-500 mb-1">MINS</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Critical Breach</label>
                    <div className="flex items-end gap-3">
                      <input type="number" defaultValue="25" className={`text-4xl font-black bg-transparent border-b-2 outline-none w-24 border-rose-500/30 text-rose-500`} />
                      <span className="text-xl font-black text-slate-500 mb-1">MINS</span>
                    </div>
                  </div>
              </div>
            </div>
          </section>

          {/* Station Specifics */}
          <section>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 px-1">Station Performance SLOs</h2>
            <div className={`rounded-[2rem] border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <table className="w-full text-left">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-white/5 bg-black/20' : 'bg-slate-50 border-slate-100'}`}>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Station Name</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Target</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Avg Actual</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Drift</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-50'}`}>
                  {[
                    { name: 'GRILL STATION', target: '15m', avg: '14.2m', drift: '-0.8m', color: 'emerald' },
                    { name: 'MAIN KITCHEN', target: '20m', avg: '22.5m', drift: '+2.5m', color: 'rose' },
                    { name: 'SALAD & COLD', target: '10m', avg: '8.4m', drift: '-1.6m', color: 'emerald' },
                    { name: 'BEVERAGES', target: '5m', avg: '4.8m', drift: '-0.2m', color: 'emerald' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6 font-black text-xs uppercase tracking-tight">{row.name}</td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-500">{row.target}</td>
                      <td className="px-8 py-6 text-sm font-black">{row.avg}</td>
                      <td className={`px-8 py-6 text-sm font-black text-right text-${row.color}-500`}>{row.drift}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
