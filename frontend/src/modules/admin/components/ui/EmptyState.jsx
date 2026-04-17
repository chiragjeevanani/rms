import React from 'react';
import { Plus, DatabaseZap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyState({ 
  title = "No data found", 
  subtitle = "Looks like there's nothing here yet.", 
  onAction,
  actionLabel = "Add New Record" 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-20 bg-white border border-slate-50 rounded-[3rem] shadow-sm"
    >
      <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6 relative">
         <DatabaseZap size={40} strokeWidth={1} />
         <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg border-4 border-white">
            <Plus size={16} />
         </div>
      </div>
      
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 mb-8">{subtitle}</p>
      
      {onAction && (
        <button 
          onClick={onAction}
          className="px-8 py-4 bg-[#2C2C2C] text-white rounded-[2rem] text-[9px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={14} />
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}



