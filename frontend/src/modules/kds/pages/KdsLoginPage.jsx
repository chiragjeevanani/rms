import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Lock, ArrowRight, HardDrive, Cpu, Wifi, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function KdsLoginPage() {
  const [email, setEmail] = useState('kitchen@gmail.com');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    document.body.style.backgroundColor = '#0A0A0B';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.overflow = '';
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('kds_access', data.token);
        localStorage.setItem('staff_info', JSON.stringify(data));
        navigate('/kds/dashboard');
      } else {
        const errorData = await response.json();
        toast.error(`TERMINAL ERROR: ${errorData.message || 'Access Denied'}`);
      }
    } catch (error) {
      console.error('KDS Auth Error:', error);
      toast.error('SYSTEM ERROR: Authentication Sync Failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="h-screen bg-[#1a1c1e] text-white flex items-center justify-center p-4 lg:p-12 selection:bg-[#D4AF37] font-sans overflow-hidden relative"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff7a00]/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
        
        {/* Left Side: Kitchen System Information & Diagnostics */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="hidden lg:flex flex-col gap-10"
        >
          <div>
            <div className="w-16 h-16 bg-[#ff7a00] rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-[#ff7a00]/20">
              <ChefHat size={32} className="text-[#D4AF37]" strokeWidth={2.5} />
            </div>
            <h1 className="text-6xl font-display font-black tracking-tighter uppercase leading-none mb-4">
              Kitchen <br />
              <span className="text-[#D4AF37] italic">Systems</span>
            </h1>
            <p className="text-stone-400 font-medium text-lg max-w-md leading-relaxed">
              Kitchen Display System & Order Orchestration Terminal. Authenticate using system credentials to begin production.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest">System Load</p>
              <div className="flex items-center gap-2 text-brand-500 font-bold">
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                Normal / 24%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest">Active Node</p>
              <p className="text-white font-bold italic font-display">KITCHEN_GATEWAY_01</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest">Sync Status</p>
              <div className="flex items-center gap-2 text-emerald-500 font-bold">
                <Wifi size={12} />
                Live / 0.4ms
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest">Hardware</p>
              <p className="text-white font-bold font-display tracking-tight">KDS-V4 PRO</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 w-fit">
            <HardDrive size={20} className="text-brand-500" />
            <span className="text-xs font-bold text-charcoal-300 uppercase tracking-widest">Session Persistence Enabled</span>
          </div>
        </motion.div>

        {/* Right Side: Login Interface */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-[#2a2c2e] p-8 lg:p-10 rounded-[3rem] border border-white/5 shadow-2xl relative">
            {/* Mobile-only header */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-10 h-10 bg-[#ff7a00] rounded-xl mx-auto mb-3 flex items-center justify-center">
                <ChefHat size={20} className="text-[#D4AF37]" />
              </div>
              <h2 className="text-2xl font-display font-black tracking-tight uppercase">KDS Terminal</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 lg:space-y-8">
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Operator Email</label>
                <div className="relative">
                  <ChefHat className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kitchen@system.com"
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold text-white text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-charcoal-500">Access Keycode</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-600" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-5 pl-12 pr-12 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold text-white text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600 hover:text-[#D4AF37] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D4AF37] text-[#ff7a00] py-6 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#D4AF37]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale transition-all duration-500 overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#ff7a00]/30 border-t-[#ff7a00] rounded-full animate-spin" />
                  ) : (
                    <>Initialize Terminal <ArrowRight size={16} /></>
                  )}
                </span>
              </button>
            </form>

            <footer className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-30">
              <div className="flex items-center gap-2">
                <Cpu size={10} className="text-[#D4AF37]" />
                <span className="text-[8px] font-black uppercase tracking-tighter">Terminal ID: KMS-992</span>
              </div>
              <p className="text-[8px] font-bold text-stone-600 uppercase tracking-widest">
                Kitchen Ops Hub &copy; 2026
              </p>
            </footer>
          </div>
        </motion.div>
      </div>

      {/* Mobile Footer Decor */}
      <div className="lg:hidden absolute bottom-8 left-0 w-full text-center">
        <p className="text-[9px] font-bold text-charcoal-700 uppercase tracking-[0.4em]">
           RMS-KDS GATEWAY v4.2.0
        </p>
      </div>
    </div>
  );
}




