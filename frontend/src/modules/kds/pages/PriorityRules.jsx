import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Users, ShoppingBag, ArrowUpCircle, Info, Save } from 'lucide-react';
import { useTheme } from '../../user/context/ThemeContext';

export default function PriorityRules() {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className={`px-8 py-6 border-b shrink-0 flex items-center justify-between ${
        isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h1 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Priority Rules
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
            Define Auto-Prioritization Logic for Kitchen Bundles
          </p>
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20">
          <Save size={16} strokeWidth={3} />
          Deploy Rules
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 no-scrollbar">
        <div className="max-w-3xl space-y-8">
          <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4 mb-10">
            <Info className="text-blue-500 shrink-0" size={24} />
            <div>
              <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-1">How rules work</h4>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-relaxed">
                Rules are evaluated from top to bottom. The first rule that matches an order will apply the specified priority boost.
              </p>
            </div>
          </div>

          {[
            { id: 1, title: 'VIP & High Loyalty Customers', icon: Users, desc: 'Priority +100 (Immediate Action Required)', active: true },
            { id: 2, title: 'Dine-In Hot Mains', icon: Zap, desc: 'Priority +50 (Before Takeaway/Online)', active: true },
            { id: 3, title: 'Scheduled Orders (Pre-orders)', icon: ShoppingBag, desc: 'Priority +25 (Based on Target Time)', active: false },
            { id: 4, title: 'Small Orders (1-2 items)', icon: ArrowUpCircle, desc: 'Priority +10 (Fast fulfillment throughput)', active: true }
          ].map((rule) => (
            <div 
              key={rule.id}
              className={`p-6 rounded-3xl border flex items-center justify-between transition-all ${
                isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  rule.active ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-500/10 text-slate-500 opacity-50'
                }`}>
                  <rule.icon size={24} />
                </div>
                <div>
                  <h3 className={`text-lg font-black uppercase tracking-tight mb-1 ${
                    rule.active ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-slate-500'
                  }`}>
                    {rule.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {rule.desc}
                  </p>
                </div>
              </div>

              <div className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors relative ${
                rule.active ? 'bg-teal-500' : 'bg-slate-700'
              }`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                  rule.active ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
