import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, Sparkles, Mail, Key, RefreshCcw, CheckCircle2, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffLogin() {
  const [view, setView] = useState('login'); // login, forgot, verify, reset
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  
  useEffect(() => {
    document.body.style.backgroundColor = '#0A0A0B';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.overflow = '';
    };
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('staff_access', data.token);
        localStorage.setItem('staff_info', JSON.stringify(data));
        toast.success(`Welcome back, ${data.name}`);
        navigate('/staff/dashboard');
      } else {
        toast.error(data.message || 'Invalid Credentials');
      }
    } catch (err) {
      toast.error('Network Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('OTP sent to your email');
        setView('verify');
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error('Network Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('OTP verified');
        setView('reset');
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch (err) {
      toast.error('Network Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          otp: formData.otp, 
          newPassword: formData.newPassword 
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Password updated successfully');
        setView('login');
        setFormData({ ...formData, password: '', otp: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message || 'Reset failed');
      }
    } catch (err) {
      toast.error('Network Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center">
        
        {/* Animated Branding */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-900/20"
          >
            <ShieldCheck size={44} className="text-amber-400" />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">RMS Staff</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 ml-1">Secure Operations Link</p>
        </div>

        <motion.div
          layout
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[3.5rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.06)] border border-slate-100 w-full"
        >
          <AnimatePresence mode="wait">
            {/* LOGIN VIEW */}
            {view === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLogin} className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Authorized Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                      <input 
                        type="email" name="email" required
                        value={formData.email} onChange={handleInputChange}
                        placeholder="staff@rms-portal.com"
                        className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-14 pr-6 outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secret Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        name="password" required
                        value={formData.password} onChange={handleInputChange}
                        placeholder="••••••••"
                        className={`w-full bg-slate-50 border-none rounded-2xl py-5 pl-14 pr-14 outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-slate-900 ${!showPassword ? 'tracking-widest' : ''}`}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                      >
                         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isLoading ? <RefreshCcw size={18} className="animate-spin" /> : <>Access Dashboard <ArrowRight size={18} /></>}
                </motion.button>

                <div className="pt-4 text-center">
                   <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Forgot Access Password?</button>
                </div>
              </motion.form>
            )}

            {/* FORGOT VIEW */}
            {view === 'forgot' && (
              <motion.form 
                key="forgot"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                onSubmit={handleRequestOTP} className="space-y-8"
              >
                <div className="space-y-2">
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Account Recovery</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">Enter your registered mail to receive a 6-digit verification code.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Registered Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                      <input 
                        type="email" name="email" required
                        value={formData.email} onChange={handleInputChange}
                        placeholder="your@mail.com"
                        className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-14 pr-6 outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setView('login')} className="flex-1 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all">Cancel</button>
                  <button 
                    disabled={isLoading}
                    className="flex-[2] bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCcw size={18} className="animate-spin" /> : <>Request OTP <ArrowRight size={18} /></>}
                  </button>
                </div>
              </motion.form>
            )}

            {/* VERIFY VIEW */}
            {view === 'verify' && (
              <motion.form 
                key="verify"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                onSubmit={handleVerifyOTP} className="space-y-8"
              >
                <div className="space-y-2">
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Identity Verification</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">Enter the 6-digit code sent to your email.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-center w-full block text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 pb-2">Verification Code</label>
                    <input 
                      type="text" name="otp" required maxLength={6}
                      value={formData.otp} onChange={handleInputChange}
                      placeholder="000000"
                      className="w-full text-center bg-slate-50 border-none rounded-2xl py-6 text-3xl font-black tracking-[0.5em] outline-none focus:ring-4 focus:ring-amber-500/10 transition-all text-slate-900 shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setView('forgot')} className="flex-1 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all">Resend</button>
                  <button 
                    disabled={isLoading}
                    className="flex-[2] bg-amber-400 text-slate-900 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-amber-400/20 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCcw size={18} className="animate-spin" /> : <>Verify Code <ArrowRight size={18} /></>}
                  </button>
                </div>
              </motion.form>
            )}

            {/* RESET VIEW */}
            {view === 'reset' && (
              <motion.form 
                key="reset"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                onSubmit={handleResetPassword} className="space-y-8"
              >
                <div className="space-y-2">
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Set New Password</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">Verification complete. Choose a unique operational password.</p>
                </div>

                <div className="space-y-5 pt-4">
                   <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                        <div className="relative group">
                           <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                           <input 
                            type="password" name="newPassword" required
                            value={formData.newPassword} onChange={handleInputChange}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-14 pr-6 outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-slate-900 tracking-widest"
                           />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Identity Password</label>
                        <div className="relative group">
                           <ShieldAlert className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                           <input 
                            type="password" name="confirmPassword" required
                            value={formData.confirmPassword} onChange={handleInputChange}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-14 pr-6 outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-slate-900 tracking-widest"
                           />
                        </div>
                      </div>
                   </div>
                </div>

                <button 
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCcw size={18} className="animate-spin" /> : <>Finalize Update <CheckCircle2 size={18} /></>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12 flex items-center gap-3 opacity-30">
           <div className="w-12 h-[1px] bg-slate-900" />
           <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em]">Terminal Verified</p>
           <div className="w-12 h-[1px] bg-slate-900" />
        </div>
      </div>
    </div>
  );
}
