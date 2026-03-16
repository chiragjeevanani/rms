
import React, { useState } from 'react';
import { 
  Settings, Shield, Printer, Bell, 
  CreditCard, Globe, Zap, Database,
  Lock, Key, Sliders, ChevronRight,
  CheckCircle2, AlertCircle, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useParams, useNavigate } from 'react-router-dom';

export default function SystemSettings() {
  const { section = 'general' } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [autoCommit, setAutoCommit] = useState(true);
  const [config, setConfig] = useState({
    currency: 'INR (₹) - Indian Rupee',
    timezone: '(UTC+05:30) IST'
  });

  const settingsGroups = [
    { id: 'general', label: 'Store Preferences', icon: Sliders },
    { id: 'payment', label: 'Taxation & Billing', icon: CreditCard },
    { id: 'printers', label: 'Printers & KOT', icon: Printer },
    { id: 'security', label: 'Staff Permissions', icon: Shield },
    { id: 'notifications', label: 'Alert Protocols', icon: Bell },
  ];

  const handleCommit = () => {
    setIsSaving(true);
    setTimeout(() => {
       setIsSaving(false);
       window.alert('CONFIGURATION SUCCESS: Global protocols synchronized across all terminal nodes.');
    }, 1500);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar max-h-full">
       <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">System Core Configuration</h1>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configure global protocols, security frameworks, and hardware routing</p>
        </div>
        <button 
          onClick={handleCommit}
          disabled={isSaving}
          className={`h-9 px-6 bg-slate-900 text-white rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
        >
           {isSaving ? <Zap size={14} className="animate-spin" /> : <Save size={14} />}
           {isSaving ? 'Synchronizing...' : 'Commit Changes'}
        </button>
      </div>      <div className="grid grid-cols-1 gap-8">
         {/* Content Area */}
         <div className="space-y-8">
            <div className="bg-white border border-slate-100 rounded-sm p-8 shadow-sm space-y-8 min-h-[400px]">
               <AnimatePresence mode="wait">
                  {section === 'general' && (
                     <motion.div 
                        key="general"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                     >
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-12 h-12 bg-slate-50 rounded-sm flex items-center justify-center text-slate-900">
                              <Globe size={24} />
                           </div>
                           <div>
                              <h3 className="text-sm font-black uppercase tracking-tight">Regional Protocol</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global system behavior and formatting</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Currency Unit</label>
                              <select 
                                 className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                                 value={config.currency}
                                 onChange={(e) => setConfig({...config, currency: e.target.value})}
                              >
                                 <option>INR (₹) - Indian Rupee</option>
                                 <option>USD ($) - US Dollar</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal Zone</label>
                              <select 
                                 className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                                 value={config.timezone}
                                 onChange={(e) => setConfig({...config, timezone: e.target.value})}
                              >
                                 <option>(UTC+05:30) IST</option>
                                 <option>(UTC+00:00) GMT</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Auto-Commit</label>
                              <div className="flex items-center gap-3 mt-2">
                                 <div 
                                    onClick={() => setAutoCommit(!autoCommit)}
                                    className={`w-8 h-4 rounded-full relative p-1 cursor-pointer transition-colors ${autoCommit ? 'bg-slate-900' : 'bg-slate-200'}`}
                                 >
                                    <div className={`w-2 h-2 bg-white rounded-full absolute shadow-sm transition-all ${autoCommit ? 'right-1' : 'left-1'}`} />
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-900 uppercase">{autoCommit ? 'ENABLED' : 'DISABLED'}</span>
                              </div>
                           </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50 flex items-center gap-4">
                           <Zap size={16} className="text-amber-500" />
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-loose max-w-lg">
                              Caution: Modifying regional protocols may affect historical data indexing and billing reconciliation logic.
                           </p>
                        </div>
                     </motion.div>
                  )}

                  {section === 'security' && (
                     <motion.div 
                        key="security"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                     >
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-12 h-12 bg-slate-50 rounded-sm flex items-center justify-center text-slate-900">
                              <Lock size={24} />
                           </div>
                           <div>
                              <h3 className="text-sm font-black uppercase tracking-tight">Access Control Protocol</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authentication and permission layers</p>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <Shield size={20} className="text-slate-900" />
                                 <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-tight">Two-Factor Auth (2FA)</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest leading-tight">Secondary verification for all admin logins</p>
                                 </div>
                              </div>
                              <button 
                                onClick={() => window.alert('SECURITY: Connecting to multi-factor authentication gateway...')}
                                className="px-3 py-1 bg-white border border-slate-200 text-slate-900 text-[8px] font-black uppercase tracking-widest rounded-sm active:scale-95 transition-all"
                              >CONFIGURE</button>
                           </div>

                           <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <Key size={20} className="text-slate-900" />
                                 <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-tight">Protocol API Access</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest leading-tight">Management of secure communication tokens</p>
                                 </div>
                              </div>
                              <button 
                                onClick={() => window.alert('SECURITY: Regenerating secure terminal handshaking keys...')}
                                className="px-3 py-1 bg-white border border-slate-200 text-slate-900 text-[8px] font-black uppercase tracking-widest rounded-sm active:scale-95 transition-all"
                              >MANAGE KEYS</button>
                           </div>
                        </div>
                     </motion.div>
                  )}

                  {(section !== 'general' && section !== 'security') && (
                     <motion.div 
                        key="others"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 text-center space-y-4"
                     >
                        <Database size={48} className="mx-auto text-slate-100" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Module Synchronizing</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Establishing hardware handshakes and registry links</p>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-sm">
               <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
               <p className="text-[9px] font-bold text-blue-700 uppercase tracking-widest leading-loose">
                  All system configurations are currently operating under the latest protocol version (v2.4.0). Commit changes to synchronize with secondary terminals.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
