
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Edit3, Trash2, AlertCircle } from 'lucide-react';

export default function AdminModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  icon: Icon = Plus, 
  children, 
  onSubmit, 
  submitLabel = 'Commit Record',
  maxWidth = 'max-w-lg',
  isSubmitDisabled = false
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`bg-white w-full ${maxWidth} rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col`}
          >
             {/* Modal Header */}
             <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white underline decoration-transparent">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-[#2C2C2C] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10">
                      <Icon size={20} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
                         {title}
                      </h3>
                      {subtitle && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 underline decoration-transparent">{subtitle}</p>
                      )}
                   </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all"><X size={18} /></button>
             </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[70vh] no-scrollbar">
                 {onSubmit ? (
                   <form onSubmit={onSubmit}>
                     <div className="p-8 pb-4 underline decoration-transparent">
                        {children}
                     </div>
                     <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-end gap-3 bg-white sticky bottom-0 z-20">
                        <button 
                          type="button" 
                          onClick={onClose}
                          className="h-12 px-6 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
                        >Cancel Protocol</button>
                        <button 
                          type="submit" 
                          disabled={isSubmitDisabled}
                          className={`h-12 px-10 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center gap-2 ${
                            isSubmitDisabled 
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                              : 'bg-[#2C2C2C] text-white shadow-slate-900/20 hover:scale-[1.02] active:scale-95'
                          }`}
                        >
                          <Save size={14} strokeWidth={3} />
                          {submitLabel}
                        </button>
                     </div>
                   </form>
                 ) : (
                   <div className="p-8">
                     {children}
                   </div>
                 )}
              </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}



