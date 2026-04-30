import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  RefreshCcw, 
  LogOut, 
  Plus, 
  Search, 
  Settings2, 
  Database, 
  Activity, 
  Key, 
  LockIcon,
  Server,
  Network,
  ToggleLeft as Toggle, 
  ToggleRight, 
  Store, 
  Mail, 
  ChevronRight,
  Calendar,
  BarChart3, 
  Users, 
  Settings, 
  LayoutGrid,
  Globe,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

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

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', thirdPartyApi: false
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Node Provisioned Successfully');
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '', thirdPartyApi: false });
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Provisioning Failed');
    } finally {
      setLoading(false);
    }
  };

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

  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passFormData, setPassFormData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

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
          email: 'superadmin@gmail.com', // Fixed for this module
          currentPassword: passFormData.currentPassword,
          newPassword: passFormData.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password updated successfully');
        setIsPassModalOpen(false);
        setPassFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Nodes', value: admins.length, icon: Server, color: '#ff7a00', bg: 'bg-orange-50' },
    { label: 'Network Health', value: '99.9%', icon: Activity, color: '#10b981', bg: 'bg-emerald-50' },
    { label: 'Active APIs', value: admins.filter(a => a.thirdPartyApi).length, icon: Zap, color: '#f59e0b', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 font-sans selection:bg-[#ff7a00]/10 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-50/50 blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-orange-50/50 blur-[100px] rounded-full opacity-60" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 px-8 h-20 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative w-11 h-11 bg-[#ff7a00] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.1em] text-slate-900">
              RMS <span className="text-[#ff7a00]">Orchestrator</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Global Network Active</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
         
          <button onClick={() => setIsPassModalOpen(true)} className="p-2.5 text-slate-400 hover:text-[#ff7a00] transition-all bg-slate-50 border border-slate-200 rounded-xl">
            <ShieldCheck size={18} />
          </button>
          <button onClick={fetchData} className={`p-2.5 text-slate-400 hover:text-[#ff7a00] transition-all bg-slate-50 border border-slate-200 rounded-xl ${isSyncing ? 'animate-spin' : ''}`}>
            <RefreshCcw size={18} />
          </button>
          <div className="h-8 w-[1px] bg-slate-200 mx-2" />
          <button 
            onClick={() => { localStorage.removeItem('superadmin_token'); navigate('/superadmin/login'); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-red-600 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200"
          >
            <LogOut size={14} /> Exit
          </button>
        </div>
      </header>

      <main className="relative z-10 p-8 max-w-[1400px] mx-auto w-full space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-[#ff7a00] font-black text-[10px] uppercase tracking-[0.4em] mb-2 ml-1">Fleet Management</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 italic">Global <span className="text-[#ff7a00]">Interface.</span></h1>
            <p className="text-slate-500 text-sm font-medium">Monitoring synchronized restaurant nodes across the global network</p>
          </motion.div>
          
        
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                  <s.icon size={28} style={{ color: s.color }} />
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-[#ff7a00] transition-colors" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{s.label}</p>
              <p className="text-4xl font-black text-slate-900 tracking-tight">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Directory Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/40"
        >
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search global nodes by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Globe size={14} className="text-[#ff7a00]" />
                 {admins.length} Total Nodes
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registered Identity</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">API Protocol</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode='popLayout'>
                {filteredAdmins.map((admin, idx) => (
                  <motion.tr 
                    key={admin._id} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }} 
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 flex flex-col items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200 group-hover:bg-[#ff7a00] group-hover:shadow-orange-100 transition-all duration-300">
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-base text-slate-900 tracking-tight">{admin.name}</p>
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5 flex items-center gap-2">
                            <Mail size={12} className="text-slate-300" /> {admin.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Synchronized</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                          <Calendar size={12} className="text-slate-300" /> {new Date(admin.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <button 
                        onClick={() => toggleApi(admin.email)}
                        className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border-2 ${admin.thirdPartyApi ? 'bg-orange-50 text-[#ff7a00] border-orange-100 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                      >
                        {admin.thirdPartyApi ? <ToggleRight size={28} /> : <Toggle size={28} />}
                        <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                           {admin.thirdPartyApi ? 'Active' : 'Disabled'}
                        </span>
                      </button>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button className="w-10 h-10 inline-flex items-center justify-center bg-slate-50 hover:bg-[#ff7a00] text-slate-400 hover:text-white rounded-xl transition-all shadow-sm">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>

      {/* Provisioning Modal */}
      <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsModalOpen(false)} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
            className="relative bg-white border border-slate-200 w-full max-w-lg rounded-[3.5rem] shadow-3xl overflow-hidden"
          >
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Provision <span className="text-[#ff7a00]">Node</span></h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Authorized Deployment Interface</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-10 space-y-8">
               <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Restaurant Name</label>
                    <div className="relative group">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff7a00] transition-colors" size={20} />
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" placeholder="e.g. Royal Kitchen" />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Admin Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff7a00] transition-colors" size={20} />
                      <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" placeholder="admin@rms.com" />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Access Key</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff7a00] transition-colors" size={20} />
                      <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" placeholder="••••••••" />
                    </div>
                 </div>
               </div>

               <button 
                 disabled={loading} 
                 type="submit" 
                 className="w-full bg-slate-900 hover:bg-[#ff7a00] text-white font-black py-6 rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98]"
               >
                 {loading ? 'Processing...' : 'Confirm Registration'}
               </button>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
      {/* Change Password Modal */}
      <AnimatePresence>
      {isPassModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsPassModalOpen(false)} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
            className="relative bg-white border border-slate-200 w-full max-w-lg rounded-[3.5rem] shadow-3xl overflow-hidden"
          >
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Secure <span className="text-[#ff7a00]">Key</span> Update</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Authorized Credential Protocol</p>
              </div>
              <button onClick={() => setIsPassModalOpen(false)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm">✕</button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-10 space-y-8">
               <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Current Access Key</label>
                    <div className="relative group">
                      <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff7a00] transition-colors" size={20} />
                      <input 
                        type={showPasswords.current ? "text" : "password"} 
                        required 
                        value={passFormData.currentPassword} 
                        onChange={e => setPassFormData({...passFormData, currentPassword: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" 
                        placeholder="••••••••" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#ff7a00] transition-colors"
                      >
                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">New Access Key</label>
                    <div className="relative group">
                      <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff7a00] transition-colors" size={20} />
                      <input 
                        type={showPasswords.new ? "text" : "password"} 
                        required 
                        value={passFormData.newPassword} 
                        onChange={e => setPassFormData({...passFormData, newPassword: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" 
                        placeholder="••••••••" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#ff7a00] transition-colors"
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Confirm New Key</label>
                    <div className="relative group">
                      <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff7a00] transition-colors" size={20} />
                      <input 
                        type={showPasswords.confirm ? "text" : "password"} 
                        required 
                        value={passFormData.confirmPassword} 
                        onChange={e => setPassFormData({...passFormData, confirmPassword: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" 
                        placeholder="••••••••" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#ff7a00] transition-colors"
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                 </div>
               </div>

               <button 
                 disabled={loading} 
                 type="submit" 
                 className="w-full bg-slate-900 hover:bg-[#ff7a00] text-white font-black py-6 rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98]"
               >
                 {loading ? 'Executing Update...' : 'Confirm Key Reset'}
               </button>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}
