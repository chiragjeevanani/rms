import React, { useState, useEffect } from 'react';
import { 
  Plus, ToggleLeft as Toggle, ToggleRight, Store, Mail, 
  Search, LogOut, ShieldCheck, Zap, Activity, 
  Globe, Server, ChevronRight, RefreshCcw, Calendar
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
        toast.success('Node Provisioned & Synced');
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

  // Toggle API (Updating both using Email as unique link)
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

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', thirdPartyApi: false
  });

  const filteredAdmins = admins.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 font-sans selection:bg-indigo-100 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-50 blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-50 blur-[100px] rounded-full opacity-60" />
      </div>

      <nav className="sticky top-0 z-50 px-8 h-20 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.1em] text-slate-900">
              System <span className="text-indigo-600">Orchestrator</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Global Network Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={fetchData} className={`p-2.5 text-slate-400 hover:text-indigo-600 transition-all ${isSyncing ? 'animate-spin' : ''}`}>
            <RefreshCcw size={18} />
          </button>
          <button 
            onClick={() => { localStorage.removeItem('superadmin_token'); navigate('/superadmin/login'); }}
            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all text-slate-500 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut size={14} /> Exit System
          </button>
        </div>
      </nav>

      <main className="relative z-10 p-8 max-w-[1200px] mx-auto w-full">
        <div className="flex flex-wrap items-end justify-between gap-8 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em] mb-2 ml-1">Fleet Management</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Admin Directory</h1>
            <p className="text-slate-500 text-sm font-medium">Monitoring global restaurant nodes across the network</p>
          </motion.div>
          
        
        </div>

        {/* Simplified Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between gap-6 bg-white">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="Search admins or emails..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
               {admins.length} Total Nodes
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</th>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Third-Party API</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                {filteredAdmins.map((admin, idx) => (
                  <motion.tr key={admin._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-slate-300" />
                          <span className="text-xs font-black text-slate-700">
                             {new Date(admin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm">
                             {admin.name.charAt(0)}
                          </div>
                          <span className="font-black text-sm text-slate-800 tracking-tight">{admin.name}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                          <Mail size={14} className="text-slate-300" />
                          {admin.email}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-center">
                          <button 
                            onClick={() => toggleApi(admin.email)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${admin.thirdPartyApi ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                          >
                            {admin.thirdPartyApi ? <ToggleRight size={24} /> : <Toggle size={24} />}
                            <span className="text-[9px] font-black uppercase tracking-widest">
                               {admin.thirdPartyApi ? 'Enabled' : 'Disabled'}
                            </span>
                          </button>
                       </div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white border border-slate-200 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black uppercase tracking-tight italic text-slate-900">Provision <span className="text-indigo-600">Node</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors text-sm">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
               <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Restaurant Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="e.g. Royal Kitchen" />
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Admin Email</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="admin@example.com" />
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Password</label>
                    <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="••••••••" />
                 </div>
               </div>
               <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-100 uppercase tracking-[0.2em] text-[10px]">
                 {loading ? 'Processing...' : 'Confirm Registration'}
               </button>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}
