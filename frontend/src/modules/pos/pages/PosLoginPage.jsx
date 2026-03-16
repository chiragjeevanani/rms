import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calculator, Delete, ArrowRight, UserCheck, Shield, Zap } from 'lucide-react';

export default function PosLoginPage() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleNumberClick = (num) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (pin.length !== 4) return;

    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem('pos_access', 'mock_pos_token');
      setIsLoading(false);
      navigate('/pos/dashboard');
    }, 1500);
  };

  // Keyboard support
  const handleKeyDown = (e) => {
    if (/[0-9]/.test(e.key)) handleNumberClick(e.key);
    if (e.key === 'Backspace') handleDelete();
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div 
      className="min-h-screen bg-charcoal-900 text-white flex flex-col items-center justify-center p-6 selection:bg-brand-500 font-sans"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="w-full max-w-sm">
        <header className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-brand-500 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-brand-500/20"
          >
            <Calculator size={36} className="text-charcoal-900" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-3xl font-display font-black tracking-tighter uppercase italic italic">Terminal Login</h1>
          <div className="flex items-center justify-center gap-2 mt-3 opacity-40">
            <Shield size={12} />
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">Secure POS Access v4.2</p>
          </div>
        </header>

        <main className="space-y-10">
          {/* PIN Indicators */}
          <div className="flex justify-center gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  pin.length >= i ? 'bg-brand-500 border-brand-500 scale-125 shadow-lg shadow-brand-500/50' : 'border-white/10'
                }`}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNumberClick(num.toString())}
                className="h-20 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center text-2xl font-black hover:bg-white/10 transition-colors"
              >
                {num}
              </motion.button>
            ))}
            <div />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNumberClick('0')}
              className="h-20 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center text-2xl font-black hover:bg-white/10 transition-colors"
            >
              0
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              className="h-20 flex items-center justify-center text-charcoal-500 hover:text-white transition-colors"
            >
              <Delete size={28} />
            </motion.button>
          </div>

          <button 
            onClick={handleLogin}
            disabled={isLoading || pin.length !== 4}
            className="w-full bg-brand-500 text-charcoal-900 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale transition-all duration-500"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-charcoal-900/30 border-t-charcoal-900 rounded-full animate-spin" />
            ) : (
              <>Authorize Terminal <ArrowRight size={16} /></>
            )}
          </button>
        </main>

        <footer className="mt-12 flex flex-col items-center gap-6">
           <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/5">
              <Zap size={14} className="text-brand-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-charcoal-400">Station Active: Main Desk</span>
           </div>
           <p className="text-[9px] font-bold text-charcoal-600 uppercase tracking-[0.3em]">
             Authorized Personnel Only
           </p>
        </footer>
      </div>
    </div>
  );
}
