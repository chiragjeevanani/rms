import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, RefreshCcw, LogOut, Plus, Search, Settings2, 
  Database, Activity, Key, Lock, Server, Network, 
  ToggleLeft as Toggle, ToggleRight, Store, Mail, ChevronRight,
  Calendar, BarChart3, Users, Settings, LayoutGrid, Globe, 
  Zap, Eye, EyeOff, User, Phone, CheckCircle2, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  
  // ── Core Navigation States ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'admins', 'security', 'profile'
  const [activeSubTab, setActiveSubTab] = useState('list'); // admins: 'list'/'create'/'delete', security: 'password'/'reset'/'logs', profile: 'view'/'edit'/'avatar'
  
  // Collapsed states for submenus in sidebar
  const [expandedMenus, setExpandedMenus] = useState({
    admins: true,
    security: true,
    profile: true
  });

  const toggleSubMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // ── Database & Dynamic States ───────────────────────────────────────────────
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', branchRestriction: 'None', status: 'Active', thirdPartyApi: false
  });
  
  const [passFormData, setPassFormData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  
  // Profile editing
  const [profileData, setProfileData] = useState({
    name: 'Super Admin Operator',
    email: 'superadmin@gmail.com',
    phone: '+91 99887 76655',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'
  });

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format&fit=crop'
  ];

  // ── Sync Database ───────────────────────────────────────────────────────────
  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/global-admins`);
      const data = await res.json();
      if (data.success) setAdmins(data.data);
    } catch (err) {
      toast.error('Failed to sync node data');
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) navigate('/superadmin/login');
    fetchData();
  }, []);

  // ── Provision Node (Admin Management) ───────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          thirdPartyApi: formData.thirdPartyApi
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Node Admin Provisioned Successfully');
        setFormData({ name: '', email: '', password: '', phone: '', branchRestriction: 'None', status: 'Active', thirdPartyApi: false });
        setActiveSubTab('list');
        fetchData();
      } else {
        toast.error(data.message || 'Provisioning Failed');
      }
    } catch (err) {
      toast.error('Provisioning Failed');
    } finally {
      setLoading(false);
    }
  };

  // Toggle third party API protocol
  const toggleApi = async (email) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/restaurants/${email}/toggle-api`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('API Protocol Updated');
        fetchData();
      }
    } catch (err) {
      toast.error('Communication Error');
    }
  };

  // ── Change password (Security Settings) ────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passFormData.newPassword !== passFormData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: profileData.email,
          currentPassword: passFormData.currentPassword,
          newPassword: passFormData.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Credential recalibrated successfully');
        setPassFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message || 'Failed to update key');
      }
    } catch (err) {
      toast.error('Failed to update key');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    toast.success('Profile credentials calibrated');
    setActiveSubTab('view');
  };

  // ── Filters & Analytics ────────────────────────────────────────────────────
  const filteredAdmins = admins.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats Calculations
  const activeAdminsCount = admins.filter(a => a.status !== 'Inactive').length;
  
  // Charts
  const hourlyTrends = [
    { name: '09 AM', sales: 4000 },
    { name: '11 AM', sales: 7500 },
    { name: '01 PM', sales: 9000 },
    { name: '03 PM', sales: 4800 },
    { name: '05 PM', sales: 6200 },
    { name: '07 PM', sales: 12500 },
    { name: '09 PM', sales: 15000 },
    { name: '11 PM', sales: 8500 }
  ];

  return (
    <div className="flex h-screen bg-[#F4F6FA] text-slate-700 font-sans overflow-hidden select-none">
      
      {/* ══ LEFT: Curated Sidebar Layout ═════════════════════════════════════ */}
      <aside className="w-[300px] bg-[#0F172A] text-white flex flex-col shrink-0 relative overflow-hidden z-20 shadow-2xl">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
        
        {/* Sidebar Header Brand */}
        <div className="p-8 border-b border-slate-800/60 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.1em] text-white leading-none">RMS <span className="text-amber-500">Global</span></h1>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1.5 leading-none">Orchestrator Node</p>
          </div>
        </div>

        {/* Sidebar Nav Items List */}
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-3 no-scrollbar">
          
          {/* TAB 1: Dashboard */}
          <button 
            onClick={() => { setActiveTab('dashboard'); setActiveSubTab('overview'); }}
            style={activeTab === 'dashboard' ? { background: 'var(--pos-sidebar-color, var(--primary-color, #ff7a00))' } : {}}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-all ${
              activeTab === 'dashboard' ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <LayoutGrid size={18} />
            <span>Dashboard</span>
          </button>

          {/* TAB 2: Admin Management */}
          <div className="space-y-1">
            <button 
              onClick={() => { setActiveTab('admins'); toggleSubMenu('admins'); }}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-all ${
                activeTab === 'admins' ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <Users size={18} />
                <span>Admin Management</span>
              </div>
              <ChevronRight size={14} className={`transform transition-transform ${expandedMenus.admins ? 'rotate-90' : ''}`} />
            </button>

            {expandedMenus.admins && (
              <div className="pl-9 space-y-1.5 mt-1">
                {[
                  { id: 'list', label: 'Admin List' },
                  { id: 'create', label: 'Create Admin' },
                  { id: 'delete', label: 'Delete / Disable' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => { setActiveTab('admins'); setActiveSubTab(sub.id); }}
                    className={`w-full text-left py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      activeTab === 'admins' && activeSubTab === sub.id ? 'text-amber-500 font-extrabold bg-slate-800/30' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    • &nbsp;{sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB 3: Security */}
          <div className="space-y-1">
            <button 
              onClick={() => { setActiveTab('security'); toggleSubMenu('security'); }}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-all ${
                activeTab === 'security' ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <Key size={18} />
                <span>Security Settings</span>
              </div>
              <ChevronRight size={14} className={`transform transition-transform ${expandedMenus.security ? 'rotate-90' : ''}`} />
            </button>

            {expandedMenus.security && (
              <div className="pl-9 space-y-1.5 mt-1">
                {[
                  { id: 'password', label: 'Change Password' },
                  { id: 'reset', label: 'Reset Admin Key' },
                  { id: 'logs', label: 'Login Activity Logs' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => { setActiveTab('security'); setActiveSubTab(sub.id); }}
                    className={`w-full text-left py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      activeTab === 'security' && activeSubTab === sub.id ? 'text-amber-500 font-extrabold bg-slate-800/30' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    • &nbsp;{sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB 4: Profile */}
          <div className="space-y-1">
            <button 
              onClick={() => { setActiveTab('profile'); toggleSubMenu('profile'); }}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-all ${
                activeTab === 'profile' ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <User size={18} />
                <span>My Profile</span>
              </div>
              <ChevronRight size={14} className={`transform transition-transform ${expandedMenus.profile ? 'rotate-90' : ''}`} />
            </button>

            {expandedMenus.profile && (
              <div className="pl-9 space-y-1.5 mt-1">
                {[
                  { id: 'view', label: 'View Profile' },
                  { id: 'edit', label: 'Edit Profile Details' },
                  { id: 'avatar', label: 'Profile Avatars' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => { setActiveTab('profile'); setActiveSubTab(sub.id); }}
                    className={`w-full text-left py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      activeTab === 'profile' && activeSubTab === sub.id ? 'text-amber-500 font-extrabold bg-slate-800/30' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    • &nbsp;{sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </nav>

        {/* Sidebar Footer - Secured Logout */}
        <div className="p-6 border-t border-slate-850 bg-slate-900/50 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={profileData.avatar} alt="avatar" className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0F172A] rounded-full" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-black truncate leading-none text-white">{profileData.name}</h4>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1.5 truncate">Super Operator</p>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('superadmin_token'); navigate('/superadmin/login'); toast.success('Secure Logout Complete.'); }}
            className="w-full h-11 flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-600/10 hover:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-700 hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span>Secure Exit</span>
          </button>
        </div>
      </aside>

      {/* ══ RIGHT: Main View Content Panels ═══════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Top Floating Dashboard Title Navbar */}
        <header className="px-8 h-20 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-sm relative z-30">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              {activeTab === 'dashboard' ? 'Overview Stats' :
               activeTab === 'admins' ? 'Admin Management Module' :
               activeTab === 'security' ? 'Security & Access Protocols' : 'Account Settings'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Global Network Nodes Active • 99.9% Uptime</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData} 
              className={`p-2.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#ff7a00] hover:bg-[#ff7a00]/5 hover:border-[#ff7a00]/20 rounded-xl transition-all ${isSyncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic Inner views container */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#F4F6FA] no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + '_' + activeSubTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              
              {/* SECTION 1: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Global Admins" value={admins.length} icon={<Server size={22} />} trend="+2 Nodes" bg="bg-blue-500" />
                    <StatCard label="Active Admins" value={activeAdminsCount} icon={<Users size={22} />} trend="Uptime 100%" bg="bg-emerald-500" />
                    <StatCard label="Live API Protocols" value={admins.filter(a => a.thirdPartyApi).length} icon={<Zap size={22} />} trend="API Active" bg="bg-amber-500" />
                  </div>

                  {/* Hourly pulse sales chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Global Node Requests</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Real-time api calls count</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">
                          <Activity size={12} className="animate-pulse" /> Live Pulse
                        </div>
                      </div>
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={hourlyTrends}>
                            <defs>
                              <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--pos-sidebar-color, var(--primary-color, #ff7a00))" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="var(--pos-sidebar-color, var(--primary-color, #ff7a00))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94A3B8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94A3B8'}} />
                            <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', fontSize: '11px', fontWeight: 'bold'}} />
                            <Area type="monotone" dataKey="sales" stroke="var(--pos-sidebar-color, var(--primary-color, #ff7a00))" strokeWidth={4} fillOpacity={1} fill="url(#colorPulse)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Recent Activity lists */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Recent Activity Logs</h3>
                      <div className="space-y-6">
                        {[
                          { title: 'New node provisioned', desc: 'Added Royale Food branch', time: '10 min ago', icon: <Plus size={12} />, bg: 'bg-blue-50 text-blue-500' },
                          { title: 'API connection toggled', desc: 'Enabled third party on priority', time: '1 hr ago', icon: <Zap size={12} />, bg: 'bg-amber-50 text-amber-500' },
                          { title: 'Database calibrator ran', desc: 'Synced sqlite records', time: '3 hrs ago', icon: <Database size={12} />, bg: 'bg-emerald-50 text-emerald-500' }
                        ].map((act, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${act.bg}`}>
                              {act.icon}
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="text-[11px] font-black text-slate-900 leading-snug truncate uppercase">{act.title}</h4>
                              <p className="text-[10px] text-slate-400 font-bold truncate">{act.desc}</p>
                              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block mt-1">{act.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* SECTION 2: ADMIN MANAGEMENT */}
              {activeTab === 'admins' && (
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                  
                  {/* Inner Tab header bar */}
                  <div className="px-8 py-5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                    <div className="flex gap-2">
                      {[
                        { id: 'list', label: 'Admin List' },
                        { id: 'create', label: 'Create Admin' },
                        { id: 'delete', label: 'Delete / Disable Admin' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveSubTab(tab.id)}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeSubTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SUBTAB 1: Admin List */}
                  {activeSubTab === 'list' && (
                    <div className="p-8 space-y-6">
                      <div className="relative w-full max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="SEARCH GLOBAL NODE ADMINS..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-xs font-black uppercase tracking-wider text-slate-800 outline-none focus:bg-white transition-all placeholder:text-slate-300"
                        />
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-150">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-150">
                              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Administrator</th>
                              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Email</th>
                              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">API Protocol</th>
                              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Security Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAdmins.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="px-6 py-20 text-center text-slate-300 italic">No node admins provisioned yet.</td>
                              </tr>
                            ) : (
                              filteredAdmins.map(admin => (
                                <tr key={admin._id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                                        {admin.name.charAt(0)}
                                      </div>
                                      <span className="text-[12px] font-bold text-slate-900 uppercase">{admin.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">{admin.email}</td>
                                  <td className="px-6 py-4 text-center">
                                    <button 
                                      onClick={() => toggleApi(admin.email)}
                                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${admin.thirdPartyApi ? 'bg-orange-50 border-orange-100 text-[#ff7a00] shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                    >
                                      <Zap size={14} />
                                      <span className="text-[8px] font-black uppercase tracking-wider">{admin.thirdPartyApi ? 'Active' : 'Disabled'}</span>
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100 shadow-sm">
                                      <CheckCircle2 size={10} /> Active
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: Create Admin */}
                  {activeSubTab === 'create' && (
                    <div className="p-10 max-w-2xl">
                      <form onSubmit={handleCreate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Display Name</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" placeholder="e.g. Royal Kitchen Admin" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" placeholder="email@rms.com" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" placeholder="+91 9988776655" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Password</label>
                            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" placeholder="••••••••" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch Restriction Mapping</label>
                            <select value={formData.branchRestriction} onChange={e => setFormData({...formData, branchRestriction: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-500 focus:outline-none transition-all">
                              <option>None</option>
                              <option>Branch #01 (Acropolis)</option>
                              <option>Branch #02 (Downtown)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Calibration</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-500 focus:outline-none transition-all">
                              <option>Active</option>
                              <option>Inactive</option>
                            </select>
                          </div>
                        </div>

                        <button 
                          disabled={loading} 
                          type="submit" 
                          style={{ backgroundColor: 'var(--pos-sidebar-color, var(--primary-color, #ff7a00))' }}
                          className="px-8 py-4 text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-[10px] transition-all hover:brightness-95 active:scale-[0.98]"
                        >
                          {loading ? 'Registering...' : 'Provision Admin'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* SUBTAB 3: Delete / Disable */}
                  {activeSubTab === 'delete' && (
                    <div className="p-8 space-y-6 max-w-4xl">
                      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 shadow-sm animate-pulse">
                        <ShieldAlert size={24} className="text-rose-500 shrink-0" />
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-rose-700 leading-none">Global Administration Access Control</h4>
                          <p className="text-[9px] font-bold uppercase text-rose-500 mt-1.5">Disabling an admin shuts down all terminal synchronizations mapped to that restaurant node.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {admins.map(admin => (
                          <div key={admin._id} className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-300 shadow-sm transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 bg-rose-50 text-rose-500 rounded-xl font-black text-sm flex items-center justify-center">
                                {admin.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase">{admin.name}</h4>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{admin.email}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => { toast.error('Security protocol locks this administrator node.'); }}
                                className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                              >
                                Revoke Node
                              </button>
                              <button 
                                onClick={() => { toast.error('Calibrating Node access restricted.'); }}
                                className="h-10 px-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all hover:bg-rose-100"
                              >
                                Terminate
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* SECTION 3: SECURITY */}
              {activeTab === 'security' && (
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                  
                  {/* Tab menu */}
                  <div className="px-8 py-5 bg-slate-50 border-b border-slate-200/60 flex gap-2">
                    {[
                      { id: 'password', label: 'Change Password' },
                      { id: 'reset', label: 'Reset Admin Password' },
                      { id: 'logs', label: 'Session / Activity Logs' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          activeSubTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* SUBTAB 1: Change password */}
                  {activeSubTab === 'password' && (
                    <div className="p-10 max-w-xl">
                      <form onSubmit={handlePasswordChange} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Access Key</label>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                              type={showPasswords.current ? "text" : "password"} 
                              required 
                              value={passFormData.currentPassword} 
                              onChange={e => setPassFormData({...passFormData, currentPassword: e.target.value})} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-350" 
                              placeholder="••••••••" 
                            />
                            <button type="button" onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#ff7a00]"><Eye size={16} /></button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">New Access Key</label>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                              type={showPasswords.new ? "text" : "password"} 
                              required 
                              value={passFormData.newPassword} 
                              onChange={e => setPassFormData({...passFormData, newPassword: e.target.value})} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-350" 
                              placeholder="••••••••" 
                            />
                            <button type="button" onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#ff7a00]"><Eye size={16} /></button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Access Key</label>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                              type={showPasswords.confirm ? "text" : "password"} 
                              required 
                              value={passFormData.confirmPassword} 
                              onChange={e => setPassFormData({...passFormData, confirmPassword: e.target.value})} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-350" 
                              placeholder="••••••••" 
                            />
                            <button type="button" onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#ff7a00]"><Eye size={16} /></button>
                          </div>
                        </div>

                        <button 
                          disabled={loading} 
                          type="submit" 
                          style={{ backgroundColor: 'var(--pos-sidebar-color, var(--primary-color, #ff7a00))' }}
                          className="px-8 py-4 text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-[10px] transition-all hover:brightness-95 active:scale-[0.98]"
                        >
                          {loading ? 'Updating Key...' : 'Confirm Key Change'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* SUBTAB 2: Reset Admin Key */}
                  {activeSubTab === 'reset' && (
                    <div className="p-8 space-y-6 max-w-3xl">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Reset Node Password Protocol</h4>
                      
                      <div className="space-y-4">
                        {admins.map(admin => (
                          <div key={admin._id} className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-300 shadow-sm transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black">
                                {admin.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase">{admin.name}</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{admin.email}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => { toast.success(`Password reset trigger sent for ${admin.name}`); }}
                              className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                              Reset Key
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 3: Session Logs */}
                  {activeSubTab === 'logs' && (
                    <div className="p-8 space-y-6">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">System Access Directory</h4>
                      
                      <div className="overflow-x-auto border border-slate-150 rounded-xl">
                        <table className="w-full text-left border-collapse text-[10px] font-bold">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-150 uppercase tracking-widest text-slate-400">
                              <th className="px-6 py-4">Node Account</th>
                              <th className="px-6 py-4">IP Node Address</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Closed Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 uppercase">
                            {[
                              { name: 'Royale Kitchen Admin', ip: '192.168.1.104', status: 'SYNCS_OK', time: 'Today, 10:24 AM' },
                              { name: 'Downtown Acropolis', ip: '124.88.22.4', status: 'SYNCS_OK', time: 'Yesterday, 08:12 PM' },
                              { name: 'Royale Kitchen Admin', ip: '192.168.1.104', status: 'DEACTIVATED', time: 'May 28, 04:55 PM' }
                            ].map((log, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                                <td className="px-6 py-4 text-slate-900 font-black">{log.name}</td>
                                <td className="px-6 py-4 text-slate-500">{log.ip}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[8px] font-black ${
                                    log.status === 'SYNCS_OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                  }`}>
                                    {log.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-slate-400">{log.time}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* SECTION 4: MY PROFILE */}
              {activeTab === 'profile' && (
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                  
                  {/* Sub menu tabs */}
                  <div className="px-8 py-5 bg-slate-50 border-b border-slate-200/60 flex gap-2">
                    {[
                      { id: 'view', label: 'View Profile' },
                      { id: 'edit', label: 'Edit Profile Details' },
                      { id: 'avatar', label: 'Profile Avatars' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          activeSubTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* SUBTAB 1: View Profile */}
                  {activeSubTab === 'view' && (
                    <div className="p-10 max-w-xl space-y-8">
                      <div className="flex items-center gap-6">
                        <img src={profileData.avatar} alt="avatar" className="w-24 h-24 rounded-3xl object-cover border-2 border-slate-200" />
                        <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none">{profileData.name}</h3>
                          <span className="inline-block mt-3 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase">
                            GLOBAL SUPER OPERATOR
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-6 space-y-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <div className="flex justify-between border-b border-slate-50 pb-3"><span>Operational Identity:</span><span className="text-slate-900">{profileData.name}</span></div>
                        <div className="flex justify-between border-b border-slate-50 pb-3"><span>Registered Email:</span><span className="text-slate-900 lowercase">{profileData.email}</span></div>
                        <div className="flex justify-between border-b border-slate-50 pb-3"><span>Mapping Node:</span><span className="text-slate-900">{profileData.phone}</span></div>
                        <div className="flex justify-between pb-3"><span>Access Rank:</span><span className="text-amber-500">Super Admin Rank 0</span></div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: Edit Profile */}
                  {activeSubTab === 'edit' && (
                    <div className="p-10 max-w-xl">
                      <form onSubmit={handleProfileSave} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator Display Name</label>
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-350" size={18} />
                            <input type="text" required value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Super Email Contact</label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-355" size={18} />
                            <input type="email" required value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Node Number</label>
                          <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-355" size={18} />
                            <input type="text" required value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          style={{ backgroundColor: 'var(--pos-sidebar-color, var(--primary-color, #ff7a00))' }}
                          className="px-8 py-4 text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-[10px] transition-all hover:brightness-95 active:scale-[0.98]"
                        >
                          Calibrate Profile
                        </button>
                      </form>
                    </div>
                  )}

                  {/* SUBTAB 3: Avatars */}
                  {activeSubTab === 'avatar' && (
                    <div className="p-10 space-y-6">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Choose Abstract Operator Avatar</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {avatarPresets.map((avatar, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setProfileData({...profileData, avatar}); toast.success('Profile avatar updated'); }}
                            className={`relative rounded-3xl overflow-hidden border-4 transition-all duration-300 cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                              profileData.avatar === avatar ? 'border-[#ff7a00] ring-4 ring-orange-100' : 'border-white hover:border-slate-200'
                            }`}
                          >
                            <img src={avatar} alt="preset" className="w-full h-24 object-cover" />
                            {profileData.avatar === avatar && (
                              <div className="absolute inset-0 bg-[#ff7a00]/10 flex items-center justify-center">
                                <span className="bg-[#ff7a00] text-white p-1 rounded-full"><CheckCircle2 size={12} /></span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </main>

    </div>
  );
}

// ── Generic Stats Card Component ─────────────────────────────────────────────
function StatCard({ label, value, icon, trend, bg }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-between relative overflow-hidden group"
    >
      <div>
        <p className="text-[9px] font-black text-slate-450 uppercase tracking-[0.2em]">{label}</p>
        <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{value}</h4>
        <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
          {trend}
        </span>
      </div>
      <div className={`w-14 h-14 rounded-2xl ${bg} text-white flex items-center justify-center shadow-lg group-hover:rotate-6 duration-300`}>
        {icon}
      </div>
    </motion.div>
  );
}
