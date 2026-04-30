import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock as LockIcon, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('superadmin@gmail.com');
  const [password, setPassword] = useState('123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {  
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('superadmin_token', data.token);
        toast.success('Access Granted');
        navigate('/superadmin/dashboard');
      } else {
        toast.error(data.message || 'Invalid Credentials');
      }
    } catch (err) {
      toast.error('Connection Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans selection:bg-[#ff7a00]/10">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-orange-50/40 blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-50/40 blur-[100px] rounded-full opacity-60" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] shadow-2xl shadow-orange-100 mb-8 border border-slate-100">
            <ShieldCheck size={48} className="text-[#ff7a00]" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Control <span className="text-[#ff7a00]">Center</span></h1>
          <p className="text-slate-400 mt-3 font-black text-[10px] uppercase tracking-[0.3em]">RMS Global Orchestration Module</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-slate-200 p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/60">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">System Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff7a00] transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 pl-14 pr-5 py-5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300 font-bold text-sm"
                  placeholder="name@system.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Access Key</label>
              <div className="relative group">
                <LockIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff7a00] transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 pl-14 pr-14 py-5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300 font-bold text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ff7a00] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-slate-900 hover:bg-[#ff7a00] text-white font-black py-6 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"
            >
              {loading ? 'Authenticating...' : (
                <>
                  Enter Orchestrator
                  <ArrowRight size={20} strokeWidth={3} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          Authorized Personnel Only • Secure Session Enabled
        </p>
      </motion.div>
    </div>
  );
}
