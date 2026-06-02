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
  const [adminInfo, setAdminInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_info') || '{}');
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setAdminInfo(JSON.parse(localStorage.getItem('admin_info') || '{}'));
      } catch (e) {}
    };
    window.addEventListener('admin_info_updated', handleUpdate);
    return () => {
      window.removeEventListener('admin_info_updated', handleUpdate);
    };
  }, []);

  const isIntegrationEnabled = adminInfo.thirdPartyApi;

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [pushingPlatform, setPushingPlatform] = useState(null);
  const [settings, setSettings] = useState({
    apiKey: '',
    merchantId: '',
    outletId: '',
    baseUrl: 'https://api.werafoods.com',
    isConnected: false,
    lastMenuPushedAt: null,
    lastMenuPushedItemsCount: null
  });

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch((() => { const _rid = localStorage.getItem('admin_restaurantId'); return _rid ? `${import.meta.env.VITE_API_URL}/branches?restaurantId=${_rid}` : `${import.meta.env.VITE_API_URL}/branches`; })());
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
            baseUrl: result.data.baseUrl || 'https://api.werafoods.com',
            isConnected: result.data.isConnected || false,
            lastMenuPushedAt: result.data.lastMenuPushedAt || null,
            lastMenuPushedItemsCount: result.data.lastMenuPushedItemsCount || null
          });
        } else {
          setSettings({
            apiKey: '',
            merchantId: '',
            outletId: '',
            baseUrl: 'https://api.werafoods.com',
            isConnected: false,
            lastMenuPushedAt: null,
            lastMenuPushedItemsCount: null
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

  const handlePushMenu = async (platform) => {
    if (!selectedBranchId) return toast.error('Please select a branch first');
    setPushingPlatform(platform);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/integrations/wera/${platform}/${selectedBranchId}/menu/push`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${platform.toUpperCase()} menu pushed successfully!`);
        
        let pushedCount = data.pushedItemsCount || 0;
        let pushedItemsList = [];
        
        if (data.details) {
          console.log(`%c--- ${platform.toUpperCase()} MENU PUSH DETAILS ---`, 'color: #ea580c; font-weight: bold; font-size: 14px;');
          console.log('Request ID:', data.details.request_id);
          console.log('Message:', data.details.message);
          
          // Try parsing swiggy_response
          if (data.details.swiggy_response) {
            try {
              const swiggyRes = typeof data.details.swiggy_response === 'string'
                ? JSON.parse(data.details.swiggy_response)
                : data.details.swiggy_response;
              
              const outletId = Object.keys(swiggyRes)[0];
              if (outletId && swiggyRes[outletId]) {
                const outletData = swiggyRes[outletId];
                const entity = outletData?.data?.[2]?.entity;
                if (entity && Array.isArray(entity.items)) {
                  pushedItemsList = entity.items;
                  if (!pushedCount) {
                    pushedCount = entity.items.length;
                  }
                }
              }
            } catch (err) {
              console.error('Failed to parse swiggy_response:', err);
            }
          }
          
          // Try parsing Zomato response if it exists
          if (data.details.zomato_response) {
            try {
              const zomatoRes = typeof data.details.zomato_response === 'string'
                ? JSON.parse(data.details.zomato_response)
                : data.details.zomato_response;
              
              const outletId = Object.keys(zomatoRes)[0];
              if (outletId && zomatoRes[outletId]) {
                const outletData = zomatoRes[outletId];
                const menu = outletData?.data?.[2]?.menu;
                if (menu && Array.isArray(menu.catalogues)) {
                  pushedItemsList = menu.catalogues;
                  if (!pushedCount) {
                    pushedCount = menu.catalogues.length;
                  }
                }
              }
            } catch (err) {
              console.error('Failed to parse zomato_response:', err);
            }
          }

          if (pushedItemsList.length === 0) {
            const possibleItems = data.details.items || data.details.entity?.items || data.details.menu?.items || data.details.menu?.catalogues;
            if (Array.isArray(possibleItems)) {
              pushedItemsList = possibleItems;
              if (!pushedCount) {
                pushedCount = possibleItems.length;
              }
            }
          }

          console.log(`Pushed Items Count (${platform.toUpperCase()}):`, pushedCount);
          console.log('Pushed Items List:', pushedItemsList);
          console.log('%c----------------------------------', 'color: #ea580c; font-weight: bold; font-size: 14px;');
        }

        if (platform === 'swiggy') {
          setSettings(prev => ({ 
            ...prev, 
            lastMenuPushedAt: new Date().toISOString(),
            lastMenuPushedItemsCount: pushedCount
          }));
        }
      } else {
        toast.error(data.message || `Failed to push ${platform} menu`);
      }
    } catch (err) {
      toast.error(`Error connecting to menu push service`);
    } finally {
      setPushingPlatform(null);
    }
  };

  const activeColor = '#6366f1';

  // Format last sync time relative to now
  const formatSyncTime = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (!isIntegrationEnabled) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-md w-full bg-white border border-slate-200/80 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center text-center space-y-8 relative z-10">
            {/* Lock Icon Wrapper */}
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-100 rounded-3xl blur-md scale-110 opacity-70 animate-pulse" />
              <div className="w-20 h-20 bg-indigo-50 border border-indigo-100/50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner relative">
                {/* Lock icon with a key icon mini badge */}
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-orange-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg border border-orange-400">
                  PRO
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-9 h-9">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                Swiggy & Zomato <span className="text-indigo-600">Integrations</span>
              </h2>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 border border-amber-100/50 px-3 py-1.5 rounded-full inline-block">
                Feature Locked
              </p>
              <p className="text-slate-500 text-sm font-medium leading-relaxed italic max-w-sm pt-2">
                Manage your catalog, sync menus, and accept delivery orders directly through your RMS dashboard. Contact us to activate this feature for your account.
              </p>
            </div>

            {/* Support Action Section */}
            <div className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="w-8 h-px bg-slate-200" />
                Contact support to unlock
                <span className="w-8 h-px bg-slate-200" />
              </div>

              <div className="flex flex-col items-center gap-2">
                <a 
                  href="tel:9311472355" 
                  className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 0 1-7.108-7.108c-.145-.44.02-.927.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                  Call +91 93114 72355
                </a>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Support hours: 9 AM - 9 PM
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
                  placeholder="https://api.werafoods.com"
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

                {/* Sync status message */}
                {settings.lastMenuPushedAt ? (
                  <div className="flex items-center gap-2.5 mb-4 px-3 py-2 bg-emerald-50 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                    <div>
                      <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        Swiggy menu is up to date
                        {settings.lastMenuPushedItemsCount !== null && settings.lastMenuPushedItemsCount !== undefined && (
                          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide">
                            {settings.lastMenuPushedItemsCount} Items
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] text-emerald-500 font-medium mt-0.5">Last synced: {formatSyncTime(settings.lastMenuPushedAt)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-50 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></div>
                    <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Menu not pushed yet</p>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic mb-4">
                  Sync menu catalog, push inventory updates, or import menu directly from Swiggy.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePushMenu('swiggy')}
                    disabled={pushingPlatform !== null}
                    className="flex-1 py-2.5 bg-slate-50 hover:bg-[#ff7a00] hover:text-white disabled:opacity-50 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {pushingPlatform === 'swiggy' ? 'Pushing Menu...' : 'Push Menu'}
                  </button>
                </div>
              </div>

              {/* Zomato Sync Card */}
              <div className="p-6 border border-slate-100 rounded-3xl opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-black italic tracking-tighter text-[#cb202d]">zomato</span>
                  <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2.5 py-1 rounded-lg uppercase tracking-wider">Coming Soon</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic mb-6">
                  Zomato menu sync is currently disabled. Swiggy integration is active.
                </p>
                <div className="flex gap-2">
                  <button
                    disabled
                    title="Zomato integration coming soon"
                    className="flex-1 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
