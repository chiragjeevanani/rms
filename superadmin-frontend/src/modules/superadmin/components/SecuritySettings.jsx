import { Lock, Eye, EyeOff } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export default function SecuritySettings() {
  const { 
    accentColor, 
    passFormData, 
    setPassFormData, 
    showPasswords, 
    setShowPasswords, 
    handlePasswordChange, 
    loading 
  } = useOutletContext();
  return (
    <div className="max-w-2xl mx-auto">
      {/* Password Change Form */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-slate-950 px-8 py-8 text-white relative flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest leading-tight">Access Control</h2>
            <p className="text-amber-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-1.5">Change Superadmin Password</p>
          </div>
          <Lock size={20} className="text-white/20" />
        </div>

        <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Access Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type={showPasswords.current ? "text" : "password"} 
                required 
                value={passFormData.currentPassword} 
                onChange={e => setPassFormData({...passFormData, currentPassword: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-300" 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#EF4444] cursor-pointer"
              >
                {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-300" 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#EF4444] cursor-pointer"
              >
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-300" 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#EF4444] cursor-pointer"
              >
                {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            style={{ backgroundColor: accentColor }}
            className="w-full py-4 text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-[10px] transition-all hover:brightness-95 active:scale-[0.98] cursor-pointer"
          >
            {loading ? 'Updating Key...' : 'Confirm Key Change'}
          </button>
        </form>
      </div>
    </div>
  );
}
