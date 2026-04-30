import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Key, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PosSecurityPage() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('New passwords do not match');
    }

    setIsLoading(true);
    try {
      const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/change-password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pos_access')}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Password updated successfully');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#F8F9FB] p-10 overflow-y-auto no-scrollbar">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Security Settings</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage your terminal access credentials</p>
            </div>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Lock size={16} className="text-indigo-500" /> Change Password
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Current Password</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <Key size={18} />
                </div>
                <input 
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-14 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-900"
                  placeholder="Enter current password"
                />
                <button 
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">New Password</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showNew ? 'text' : 'password'}
                    required
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-14 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-900"
                    placeholder="Min. 8 characters"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Confirm New Password</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                    <CheckCircle2 size={18} />
                  </div>
                  <input 
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-14 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-900"
                    placeholder="Repeat new password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex gap-4">
              <AlertTriangle className="text-amber-500 shrink-0" size={20} />
              <div className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                Warning: Changing your password will affect all terminal access. Ensure you remember your new credentials to avoid being locked out of the POS system.
              </div>
            </div>

            <button
              disabled={isLoading}
              className="w-full bg-indigo-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <><Save size={18} /> Update Password</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
