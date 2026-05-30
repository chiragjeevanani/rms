import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProvisionAdminModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  loading, 
  accentColor 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-8 py-6 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white">Provision Admin Node</h3>
                <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mt-1">Register new global administrator</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={onSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Display Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-300" 
                    placeholder="e.g. Royal Kitchen Admin" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-300" 
                    placeholder="email@rms.com" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                  <input 
                    type="text" 
                    value={formData.phone || ''} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-300" 
                    placeholder="+91 9988776655" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Calibration</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-500 focus:outline-none transition-all"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch Creation Limit</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={formData.branchLimit} 
                    onChange={e => setFormData({...formData, branchLimit: parseInt(e.target.value) || 1})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all" 
                    placeholder="e.g. 5"
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 mt-4">
                    <span className="text-[9px] font-bold text-amber-600 uppercase leading-normal">
                      Password will be generated randomly and sent to the admin's email.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  disabled={loading} 
                  type="submit" 
                  style={{ backgroundColor: accentColor }}
                  className="px-8 py-3 text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-[10px] transition-all hover:brightness-95 active:scale-[0.98] cursor-pointer"
                >
                  {loading ? 'Registering...' : 'Provision Admin'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
