import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import { useTheme } from '../../user/context/ThemeContext';

export default function KdsAccountSettings() {
  const { isDarkMode } = useTheme();
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/change-password/${staffInfo.staff?._id || staffInfo._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kds_access')}`
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password successfully updated' });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update password' });
      }
    } catch (error) {
       setMessage({ type: 'error', text: 'Network synchronization error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-8 h-full overflow-y-auto transition-colors duration-500 ${isDarkMode ? 'bg-[#121416] text-white' : 'bg-stone-50 text-stone-900'}`}>
      <div className="max-w-2xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Kitchen Settings</h1>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-2">Manage your terminal access credentials</p>
        </header>

        <section className={`p-8 lg:p-12 rounded-[3rem] border shadow-2xl transition-all ${
          isDarkMode ? 'bg-[#1a1c1e] border-white/5 shadow-black/40' : 'bg-white border-stone-100'
        }`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Security Access</h3>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Update your keycode below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] ml-1">Current Keycode</label>
              <div className="relative">
                <input 
                  type={showPassword.current ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  className={`w-full py-5 px-6 rounded-2xl border outline-none transition-all font-bold text-sm ${
                    isDarkMode ? 'bg-black/40 border-white/5 focus:border-[#D4AF37]' : 'bg-stone-50 border-stone-200 focus:border-[#D4AF37]'
                  }`}
                  placeholder="Enter current password"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-500"
                >
                  {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">New Keycode</label>
                <div className="relative">
                  <input 
                    type={showPassword.new ? "text" : "password"}
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className={`w-full py-5 px-6 rounded-2xl border outline-none transition-all font-bold text-sm ${
                      isDarkMode ? 'bg-black/40 border-white/5 focus:border-[#D4AF37]' : 'bg-stone-50 border-stone-200 focus:border-[#D4AF37]'
                    }`}
                    placeholder="New password"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-500"
                  >
                    {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Confirm Keycode</label>
                <div className="relative">
                  <input 
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    className={`w-full py-5 px-6 rounded-2xl border outline-none transition-all font-bold text-sm ${
                      isDarkMode ? 'bg-black/40 border-white/5 focus:border-[#D4AF37]' : 'bg-stone-50 border-stone-200 focus:border-[#D4AF37]'
                    }`}
                    placeholder="Confirm new password"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-500"
                  >
                    {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {message.text && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl flex items-center gap-3 text-xs font-black uppercase tracking-widest ${
                  message.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' 
                    : 'bg-red-500/10 text-red-500 border border-red-500/10'
                }`}
              >
                <AlertCircle size={14} />
                {message.text}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ff7a00] text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[#ff7a00]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save size={16} /> Update Credentials</>
              )}
            </button>
          </form>
        </section>

        <footer className="mt-12 p-8 border border-white/5 rounded-[2.5rem] bg-black/10 flex items-center justify-between opacity-50">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active Node Synchronization Enabled</span>
           </div>
           <p className="text-[9px] font-bold uppercase tracking-widest">v4.2.0-STABLE</p>
        </footer>
      </div>
    </div>
  );
}



