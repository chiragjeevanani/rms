import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PosLoginPage() {
  const [formData, setFormData] = useState({
    email: 'pos@rms.com',
    password: '123'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Background is handled by the container below
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('pos_access', data.token);
        localStorage.setItem('staff_info', JSON.stringify(data));
        toast.success(`Welcome, ${data.name}`);
        navigate('/pos/dashboard');
      } else {
        toast.error(`${data.message || 'Login Failed'}`);
      }
    } catch (err) {
      console.error('POS Login Error:', err);
      toast.error('Network Error: Communication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#0A0A0B] text-white flex items-center justify-center p-4 lg:p-8 selection:bg-brand-500 font-sans overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
        
        {/* Left Side: System Information & Branding */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="hidden lg:flex flex-col gap-10"
        >
          <div>
            <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-brand-500/20">
              <Zap size={32} className="text-charcoal-900" strokeWidth={2.5} />
            </div>
            <h1 className="text-6xl font-display font-black tracking-tighter uppercase leading-none mb-4">
              Staff <br />
              <span className="text-brand-500 italic text-7xl">Login</span>
            </h1>
            <p className="text-charcoal-400 font-medium text-lg max-w-md leading-relaxed">
              Authorized access only. Please enter your credentials to continue.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest">Status</p>
              <div className="flex items-center gap-2 text-emerald-500 font-bold">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Online
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest">Network</p>
              <p className="text-white font-bold italic font-display">KMS-992-SECURE</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest">Protocol</p>
              <p className="text-white font-bold font-display tracking-tight">HTTPS/TLS 1.3</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest">Hardware</p>
              <p className="text-white font-bold font-display tracking-tight">RTX-900 Terminal</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 w-fit">
            <Shield size={20} className="text-brand-500" />
            <span className="text-xs font-bold text-charcoal-300 uppercase tracking-widest">SECURE CONNECTION</span>
          </div>
        </motion.div>

        {/* Right Side: Login Interface */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-[#141416]/80 backdrop-blur-xl p-8 lg:p-12 rounded-[3.5rem] border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            {/* Glossy Overlay */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand-500/5 rotate-45 blur-3xl pointer-events-none" />

            <div className="text-center mb-10">
              <div className="lg:hidden w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield size={24} className="text-charcoal-900" />
              </div>
              <h2 className="text-2xl font-display font-black tracking-tight uppercase">Login</h2>
              <p className="text-[10px] font-black text-charcoal-500 uppercase tracking-[0.3em] mt-2">Credentials Required</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-charcoal-500 group-focus-within/input:text-brand-500 transition-colors" size={18} />
                    <input 
                      type="email" name="email" required
                      value={formData.email} onChange={handleInputChange}
                      placeholder="id@rms-portal.com"
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 transition-all font-bold text-white placeholder:text-charcoal-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group/input">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-charcoal-500 group-focus-within/input:text-brand-500 transition-colors" size={18} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" required
                      value={formData.password} onChange={handleInputChange}
                      placeholder="••••••••"
                      className={`w-full bg-[#0A0A0B] border border-white/5 rounded-2xl py-5 pl-14 pr-14 outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 transition-all font-bold text-white placeholder:text-charcoal-600 ${!showPassword ? 'tracking-widest' : ''}`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-brand-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className="w-full bg-brand-500 text-charcoal-900 py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-4 shadow-2xl shadow-brand-500/20 hover:bg-brand-400 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCcw size={18} className="animate-spin" />
                ) : (
                  <>Login <ArrowRight size={18} /></>
                ) }
              </motion.button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <p className="text-[9px] font-black text-charcoal-600 uppercase tracking-[0.2em] leading-relaxed">
                By accessing this portal, you agree to the <br /> 
                <span className="text-charcoal-400">Security & Operational Guidelines</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer System Branding for Mobile */}
      <div className="lg:hidden absolute bottom-8 left-0 w-full text-center">
        <p className="text-[9px] font-bold text-charcoal-600 uppercase tracking-[0.4em]">
           RMS-TERMINAL OPERATIONS &copy; 2026
        </p>
      </div>
    </div>
  );
}



