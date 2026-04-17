import React, { useState } from 'react';
import { Lock, ShieldCheck, ShieldAlert, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SecuritySettings() {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });
  const [isChanging, setIsChanging] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    setIsChanging(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ oldPassword: passwords.oldPassword, newPassword: passwords.newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to change password');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-stone-200"
      >
        <div className="bg-[#2C2C2C] px-8 py-10 text-white relative">
          <h2 className="text-2xl font-black uppercase tracking-widest">Change Password</h2>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 text-amber-400">Security Settings</p>
        </div>

        <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
          <div className="flex items-center gap-3 bg-stone-50 p-4 border border-stone-200 rounded-2xl mb-4">
             <ShieldCheck className="text-green-600" size={20} />
             <p className="text-xs font-bold text-stone-800 uppercase tracking-tight leading-none">Security Tip: <span className="font-medium text-stone-600">Always use a strong password for your account.</span></p>
          </div>

          <div className="space-y-6">
             {/* Old Password */}
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1 leading-none">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type={showPass.old ? "text" : "password"} 
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                    placeholder="Enter current password"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800"
                    required
                  />
                  <button type="button" onClick={() => setShowPass({...showPass, old: !showPass.old})} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-500 transition-colors">
                    {showPass.old ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* New Password */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-1 leading-none">New Password</label>
                   <div className="relative">
                     <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                     <input 
                       type={showPass.new ? "text" : "password"} 
                       value={passwords.newPassword}
                       onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                       placeholder="Enter new password"
                       className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800"
                       required
                     />
                     <button type="button" onClick={() => setShowPass({...showPass, new: !showPass.new})} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-500 transition-colors">
                       {showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                   </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-1 leading-none">Confirm New Password</label>
                   <div className="relative">
                     <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                     <input 
                       type={showPass.confirm ? "text" : "password"} 
                       value={passwords.confirmPassword}
                       onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                       placeholder="Repeat new password"
                       className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800"
                       required
                     />
                     <button type="button" onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-500 transition-colors">
                       {showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                   </div>
                </div>
             </div>
          </div>

          <button 
            type="submit"
            disabled={isChanging}
            className="w-full bg-[#2C2C2C] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 active:scale-[0.98]"
          >
            {isChanging ? <Loader2 className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> Update Password</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}



