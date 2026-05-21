import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Settings2, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Integrations() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    apiKey: '',
    merchantId: '',
    outletId: '',
    baseUrl: 'https://pos.werafoods.com',
    isConnected: false
  });

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/branches`);
        const result = await res.json();
        if (result.success && result.data) {
          setBranches(result.data);
          
          // Determine default branch ID from local storage
          const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
          const localBranchId = localStorage.getItem('branchId') || 
            (typeof staffInfo.branchId === 'object' ? staffInfo.branchId?._id : staffInfo.branchId);
            
          const hasLocal = result.data.some(b => b._id === localBranchId);
          if (hasLocal) {
            setSelectedBranchId(localBranchId);
          } else if (result.data.length > 0) {
            setSelectedBranchId(result.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch settings whenever selectedBranchId changes
  useEffect(() => {
    const fetchSettings = async () => {
      if (!selectedBranchId) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/swiggy/${selectedBranchId}/settings`);
        const result = await res.json();
        if (result.success && result.data) {
          setSettings({
            apiKey: result.data.apiKey || '',
            merchantId: result.data.merchantId || '',
            outletId: result.data.outletId || '',
            baseUrl: result.data.baseUrl || 'https://pos.werafoods.com',
            isConnected: result.data.isConnected || false
          });
        } else {
          setSettings({
            apiKey: '',
            merchantId: '',
            outletId: '',
            baseUrl: 'https://pos.werafoods.com',
            isConnected: false
          });
        }
      } catch (err) {
        console.error('Failed to load integration settings:', err);
      }
    };
    fetchSettings();
  }, [selectedBranchId]);

  const handleSaveSettings = async () => {
    if (!selectedBranchId) return toast.error('Please select a branch first');
    setLoading(true);
    try {
      const payload = {
        ...settings,
        merchantId: settings.outletId
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/swiggy/${selectedBranchId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Integration settings saved successfully');
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!selectedBranchId) return toast.error('Please select a branch first');
    setConnecting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/swiggy/${selectedBranchId}/test`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.connected) {
        setSettings(prev => ({ ...prev, isConnected: true }));
        toast.success('Connected to Wera Gateway Successfully');
      } else {
        toast.error(data.message || 'Connection failed');
      }
    } catch (err) {
      toast.error('Handshake failed');
    } finally {
      setConnecting(false);
    }
  };

  const activeColor = '#6366f1'; // Premium Indigo theme for unified page

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">External <span className="text-indigo-600">Integrations</span></h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Connect your RMS with global delivery channels</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
           <Cloud size={14} /> Global Sync Active
        </div>
      </div>

      {/* Branch Selector Card */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Store size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight italic">Active Branch Configuration</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Select a branch to view and edit Wera settings</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <select 
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer pr-12"
          >
            {branches.length === 0 ? (
              <option value="">Loading branches...</option>
            ) : (
              branches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.branchName} ({branch.branchCode})
                </option>
              ))
            )}
          </select>
          <div 
            className="absolute right-5 top-1/2 pointer-events-none text-slate-400"
            style={{ transform: 'translateY(-50%)' }}
          >
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {selectedBranchId && (
        <div className="space-y-8">
          {/* Unified Configuration settings */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl" style={{ color: activeColor }}>
                  <Settings2 size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight italic">Wera Gateway Credentials</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Universal credentials common for Swiggy & Zomato</p>
                </div>
              </div>
              {settings.isConnected ? (
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
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Wera ID (Outlet ID)</label>
                <input 
                  type="text" 
                  value={settings.outletId}
                  onChange={(e) => setSettings({...settings, outletId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:ring-4 transition-all animate-none"
                  placeholder="Enter Wera ID (e.g., 4343)"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Wera API Access Key</label>
                <div className="relative">
                  <input 
                    type={showApiKey ? "text" : "password"} 
                    value={settings.apiKey}
                    onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-xs font-bold focus:outline-none focus:ring-4 transition-all"
                    placeholder="••••••••••••••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-5 top-1/2 text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center z-10 cursor-pointer"
                    style={{ transform: 'translateY(-50%)' }}
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Wera Base URL</label>
                <input 
                  type="text" 
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({...settings, baseUrl: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:ring-4 transition-all"
                  placeholder="https://pos.werafoods.com"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
              <button 
                onClick={handleSaveSettings}
                disabled={loading}
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
              >
                {loading ? 'Saving Protocol...' : 'Save Configuration'}
              </button>
              <button 
                onClick={testConnection}
                disabled={connecting}
                className="flex-1 py-4 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 cursor-pointer"
                style={{ 
                  color: activeColor, 
                  borderColor: activeColor 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${activeColor}08` }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {connecting ? <RefreshCcw size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                Test Handshake
              </button>
            </div>
          </div>

          {/* Menu Synchronization Section */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <RefreshCcw size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight italic">Channel Menu Sync</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Control Menu Catalog Sync per Channel</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Swiggy Sync Card */}
              <div className="p-6 border border-slate-100 rounded-3xl hover:border-orange-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-black italic tracking-tighter text-[#ff7a00]">swiggy</span>
                  <span className="text-[8px] font-black bg-orange-50 text-[#ff7a00] px-2.5 py-1 rounded-lg uppercase tracking-wider">Channel Active</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic mb-6">
                  Sync menu catalog, push inventory updates, or import menu directly from Swiggy.
                </p>
                <div className="flex gap-2">
                 
                  <button className="flex-1 py-2.5 bg-slate-50 hover:bg-[#ff7a00] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">Push Menu</button>
                </div>
              </div>

              {/* Zomato Sync Card */}
              <div className="p-6 border border-slate-100 rounded-3xl hover:border-red-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-black italic tracking-tighter text-[#cb202d]">zomato</span>
                  <span className="text-[8px] font-black bg-red-50 text-[#cb202d] px-2.5 py-1 rounded-lg uppercase tracking-wider">Channel Active</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic mb-6">
                  Sync menu catalog, push inventory updates, or import menu directly from Zomato.
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 bg-slate-50 hover:bg-[#cb202d] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">Push Menu</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
