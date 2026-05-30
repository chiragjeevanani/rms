import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, RefreshCw, LogOut, LayoutGrid, Users, Key, FileText
} from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSuperAdminTheme } from '../context/SuperAdminThemeContext';

// Provision Modal remains in the layout shell
import ProvisionAdminModal from '../components/ProvisionAdminModal';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accentColor, setAccentColor } = useSuperAdminTheme();
  
  // ── Modal State ─────────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // ── Database & Dynamic States ───────────────────────────────────────────────
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', branchLimit: 5, status: 'Active', thirdPartyApi: false
  });
  
  const [passFormData, setPassFormData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  
  // Profile editing (kept for decorative sidebar footer)
  const [profileData, setProfileData] = useState({
    name: 'Super Admin Operator',
    email: 'superadmin@gmail.com',
    phone: '+91 99887 76655',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'
  });

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
    if (!token) navigate('/login');
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
          branchLimit: formData.branchLimit,
          thirdPartyApi: formData.thirdPartyApi,
          mobileNumber: formData.phone,
          status: formData.status
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Node Admin Provisioned Successfully');
        setFormData({ name: '', email: '', phone: '', branchLimit: 5, status: 'Active', thirdPartyApi: false });
        setIsCreateModalOpen(false);
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

  return (
    <div className="flex h-full bg-[#F4F6FA] text-slate-700 font-sans overflow-hidden select-none">
      
      {/* ══ LEFT: Curated Sidebar Layout ═════════════════════════════════════ */}
      <aside 
        style={{ backgroundColor: accentColor }}
        className="w-[270px] text-white flex flex-col shrink-0 relative overflow-hidden z-20 shadow-2xl transition-all duration-500"
      >
        {/* No gradient overlay - flat single color */}

        {/* Sidebar Header Brand */}
        <div className="p-8 border-b border-white/10 flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-white/15 backdrop-blur-md">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.1em] text-white leading-none">RMS <span className="text-white/80">Global</span></h1>
            <p className="text-[9px] text-white/60 font-black uppercase tracking-widest mt-1.5 leading-none">Orchestrator Node</p>
          </div>
        </div>

        {/* Sidebar Nav Items List */}
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-3 no-scrollbar relative z-10">
          
          {/* TAB 1: Dashboard */}
          <button 
            onClick={() => navigate('/dashboard/overview')}
            style={location.pathname === '/dashboard/overview' ? { backgroundColor: 'rgba(255, 255, 255, 0.18)' } : {}}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-all cursor-pointer ${
              location.pathname === '/dashboard/overview' ? 'text-white shadow-md backdrop-blur-sm' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid size={18} />
            <span>Dashboard</span>
          </button>

          {/* TAB 2: Admin Management (Direct) */}
          <button 
            onClick={() => navigate('/dashboard/admins')}
            style={location.pathname === '/dashboard/admins' ? { backgroundColor: 'rgba(255, 255, 255, 0.18)' } : {}}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-all cursor-pointer ${
              location.pathname === '/dashboard/admins' ? 'text-white shadow-md backdrop-blur-sm' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={18} />
            <span>Admin Management</span>
          </button>

          {/* TAB 3: Security (Direct) */}
          <button 
            onClick={() => navigate('/dashboard/security')}
            style={location.pathname === '/dashboard/security' ? { backgroundColor: 'rgba(255, 255, 255, 0.18)' } : {}}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-all cursor-pointer ${
              location.pathname === '/dashboard/security' ? 'text-white shadow-md backdrop-blur-sm' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key size={18} />
            <span>Security Settings</span>
          </button>

          {/* TAB 4: Reports & Analytics */}
          <button 
            onClick={() => navigate('/dashboard/reports')}
            style={location.pathname === '/dashboard/reports' ? { backgroundColor: 'rgba(255, 255, 255, 0.18)' } : {}}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-all cursor-pointer ${
              location.pathname === '/dashboard/reports' ? 'text-white shadow-md backdrop-blur-sm' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText size={18} />
            <span>Reports & Analytics</span>
          </button>
        </nav>

        {/* Sidebar Footer - Logout */}
        <div className="p-4 border-t border-white/10 bg-black/15 relative z-10">
          <button 
            onClick={() => { localStorage.removeItem('superadmin_token'); navigate('/login'); toast.success('Secure Logout Complete.'); }}
            className="w-full h-11 flex items-center justify-center gap-2 bg-white/10 hover:bg-rose-600/20 hover:text-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/80 border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ══ RIGHT: Main View Content Panels ═══════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Top Floating Dashboard Title Navbar */}
        <header 
          style={{ backgroundColor: accentColor }}
          className="px-8 h-20 flex items-center justify-between shrink-0 shadow-md relative z-30 text-white transition-all duration-500"
        >
          {/* No gradient - flat single color */}

          <div className="relative z-10">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">
              {location.pathname === '/dashboard/overview' ? 'Overview Stats' :
               location.pathname === '/dashboard/admins' ? 'Admin Management Module' :
               location.pathname === '/dashboard/reports' ? 'Reports & Analytics Ledgers' : 'Security & Access Protocols'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">Global Network Nodes Active • 99.9% Uptime</span>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={fetchData} 
              className={`p-2.5 bg-white/10 border border-white/20 text-white hover:text-white hover:bg-white/20 rounded-xl transition-all cursor-pointer ${isSyncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic Inner views container */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#F4F6FA] no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-[1440px] mx-auto space-y-8"
            >
              <Outlet context={{
                admins,
                searchQuery,
                setSearchQuery,
                setIsCreateModalOpen,
                toggleApi,
                accentColor,
                setAccentColor,
                passFormData,
                setPassFormData,
                showPasswords,
                setShowPasswords,
                handlePasswordChange,
                loading,
                fetchData
              }} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Provision Admin Modal */}
        <ProvisionAdminModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
          formData={formData}
          setFormData={setFormData}
          loading={loading}
          accentColor={accentColor}
        />

      </main>

    </div>
  );
}
