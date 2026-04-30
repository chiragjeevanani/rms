import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Settings2, 
  RefreshCcw, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Zap,
  ArrowRight,
  Database,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Integrations() {
  const [activeTab, setActiveTab] = useState('swiggy');
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [swiggySettings, setSwiggySettings] = useState({
    apiKey: '',
    merchantId: '',
    outletId: '',
    baseUrl: 'https://api.swiggy.com',
    isConnected: false
  });

  const branchId = localStorage.getItem('branchId');

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/swiggy/${branchId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swiggySettings)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Swiggy settings saved');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setConnecting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/swiggy/${branchId}/test`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.connected) {
        setSwiggySettings(prev => ({ ...prev, isConnected: true }));
        toast.success('Connected to Swiggy Successfully');
      } else {
        toast.error(data.message || 'Connection failed');
      }
    } catch (err) {
      toast.error('Handshake failed');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">External <span className="text-indigo-600">Integrations</span></h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Connect your RMS with global delivery channels</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
           <Cloud size={14} /> Global Sync Active
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => setActiveTab('swiggy')}
          className={`flex items-center gap-4 px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all bg-[#ff7a00] text-white shadow-xl shadow-orange-100 active:scale-[0.98]`}
        >
          <img src="https://www.vectorlogo.zone/logos/swiggy/swiggy-ar21.svg" className="h-6 w-auto object-contain brightness-0 invert" alt="Swiggy" />
          <div className="w-[1px] h-4 bg-white/20 mx-1" />
          Protocol Active
        </button>
      </div>

      {activeTab === 'swiggy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                    <Settings2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight italic">Merchant Credentials</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Authorized Swiggy Protocol Details</p>
                  </div>
                </div>
                {swiggySettings.isConnected ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                    <CheckCircle2 size={16} /> Connection Secure
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-widest">
                    <AlertCircle size={16} /> Not Connected
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Merchant ID</label>
                  <input 
                    type="text" 
                    value={swiggySettings.merchantId}
                    onChange={(e) => setSwiggySettings({...swiggySettings, merchantId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
                    placeholder="Enter Swiggy Merchant ID"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Outlet ID</label>
                  <input 
                    type="text" 
                    value={swiggySettings.outletId}
                    onChange={(e) => setSwiggySettings({...swiggySettings, outletId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
                    placeholder="Enter Outlet/Branch ID"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">API Access Key</label>
                  <input 
                    type="password" 
                    value={swiggySettings.apiKey}
                    onChange={(e) => setSwiggySettings({...swiggySettings, apiKey: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
                    placeholder="••••••••••••••••••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <button 
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all"
                >
                  {loading ? 'Saving Protocol...' : 'Save Swiggy Config'}
                </button>
                <button 
                  onClick={testConnection}
                  disabled={connecting}
                  className="flex-1 py-4 border-2 border-orange-600 text-orange-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-3"
                >
                  {connecting ? <RefreshCcw size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                  Test Handshake
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <RefreshCcw size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight italic">Menu Synchronization</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Global Protocol for Catalog Syncing</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-slate-100 rounded-3xl hover:border-indigo-200 transition-all group">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <ArrowDownCircle size={20} />
                  </div>
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Import from Swiggy</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed italic">Pull existing menu categories and items from Swiggy to RMS.</p>
                  <button className="mt-6 w-full py-3 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Start Import Flow</button>
                </div>
                <div className="p-6 border border-slate-100 rounded-3xl hover:border-orange-200 transition-all group">
                  <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                    <ArrowUpCircle size={20} />
                  </div>
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Push to Swiggy</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed italic">Broadcast your RMS menu directly to Swiggy as the master source.</p>
                  <button className="mt-6 w-full py-3 bg-slate-50 group-hover:bg-orange-600 group-hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Sync Master Menu</button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-indigo-600 text-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-100 relative overflow-hidden">
               <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
               <Zap className="text-white/20 absolute bottom-6 right-6" size={80} strokeWidth={3} />
               <h3 className="font-black text-xl uppercase italic leading-none tracking-tighter">Live Status<br/><span className="text-indigo-200 text-sm">Dashboard Monitoring</span></h3>
               <div className="mt-10 space-y-6">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Daily Syncs</span>
                    <span className="font-black">124</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Mapped Items</span>
                    <span className="font-black">82%</span>
                  </div>
                  <div className="flex justify-between items-center pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Network Uptime</span>
                    <span className="font-black text-emerald-400">99.9%</span>
                  </div>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-widest mb-6 italic flex items-center gap-2">
                <Database size={14} className="text-indigo-600" /> Essential Mapping Protocol
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Category Maps', count: 12, status: 'Synced' },
                  { label: 'Item Links', count: 156, status: 'Pending 4' },
                  { label: 'Addon Groups', count: 48, status: 'Synced' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{item.label}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{item.count} Active Entities</p>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${item.status === 'Synced' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-4 border border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                View All Mappings <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
