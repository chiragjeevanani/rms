import { Lock, Eye, EyeOff, Sliders, Check } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export default function SecuritySettings() {
  const { 
    accentColor, 
    setAccentColor, 
    passFormData, 
    setPassFormData, 
    showPasswords, 
    setShowPasswords, 
    handlePasswordChange, 
    loading 
  } = useOutletContext();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#ff7a00] cursor-pointer"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#ff7a00] cursor-pointer"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff7a00]/50 transition-all placeholder:text-slate-300" 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#ff7a00] cursor-pointer"
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

      {/* Design Studio Theme Picker */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden animate-fade-in">
        <div className="bg-slate-950 px-8 py-8 text-white relative flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest leading-tight">Design Studio</h2>
            <p className="text-amber-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-1.5">Craft Dashboard Aesthetics</p>
          </div>
          <Sliders size={20} className="text-white/20" />
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-800">Color Palette</p>
            <div className="relative">
              <input 
                type="color" 
                value={accentColor} 
                onChange={(e) => setAccentColor(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-white transition-all">
                <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: accentColor }} />
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Custom Tint</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {[
              { color: '#ff7a00', name: 'RMS Orange' },
              { color: '#3B82F6', name: 'Electric Blue' },
              { color: '#EF4444', name: 'Passion Red' },
              { color: '#10B981', name: 'Emerald Green' },
              { color: '#8B5CF6', name: 'Royal Purple' },
              { color: '#EC4899', name: 'Ruby Pink' },
              { color: '#06B6D4', name: 'Ocean Cyan' },
              { color: '#0F172A', name: 'Slate Gray' }
            ].map((preset) => (
              <button
                key={preset.color}
                onClick={() => setAccentColor(preset.color)}
                className="group relative aspect-square rounded-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center shadow-sm cursor-pointer"
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              >
                {accentColor === preset.color && (
                  <div className="w-2 h-2 rounded-full bg-white shadow-xl animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 shadow-md rounded-xl flex items-center justify-center text-white transition-all transform hover:rotate-6" style={{ backgroundColor: accentColor }}>
                  <Check size={20} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Theme Preview</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Dynamic primary color updated live</p>
                </div>
              </div>
              <button 
                onClick={() => setAccentColor('#ff7a00')}
                className="px-4 py-2 bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
