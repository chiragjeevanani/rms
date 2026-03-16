import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Lock, ArrowRight, HardDrive, Cpu, Wifi } from 'lucide-react';

export default function KdsLoginPage() {
  const [stationId, setStationId] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem('kds_access', 'mock_kds_token');
      setIsLoading(false);
      navigate('/kds/dashboard');
    }, 1500);
  };

  const stations = [
    { id: 'ST-01', name: 'Main Kitchen' },
    { id: 'ST-02', name: 'Bar & Grill' },
    { id: 'ST-03', name: 'Dessert Station' },
  ];

  return (
    <div className="min-h-screen bg-charcoal-900 text-white flex flex-col items-center justify-center p-6 selection:bg-brand-500 selection:text-charcoal-900 font-sans">
      <div className="w-full max-w-md">
        <header className="text-center mb-10">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-20 h-20 bg-charcoal-800 rounded-3xl mx-auto mb-6 flex items-center justify-center border border-white/5 shadow-2xl"
          >
            <ChefHat size={40} className="text-brand-500" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-3xl font-display font-black tracking-tight uppercase">Kitchen Systems</h1>
          <p className="text-charcoal-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Operator Authentication Required</p>
        </header>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-charcoal-800 rounded-[2.5rem] p-10 border border-white/5 shadow-2xl"
        >
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-charcoal-400 ml-1">Select Station</label>
              <div className="grid grid-cols-1 gap-2">
                {stations.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStationId(s.id)}
                    className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                      stationId === s.id 
                      ? 'bg-brand-500 border-brand-500 text-charcoal-900 shadow-lg shadow-brand-500/20' 
                      : 'bg-charcoal-900/50 border-white/5 text-charcoal-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-widest">{s.name}</span>
                    <span className={`text-[9px] font-bold ${stationId === s.id ? 'text-charcoal-900/60' : 'text-charcoal-600'}`}>{s.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-charcoal-400 ml-1">Operator PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-500" size={18} />
                <input 
                  type="password" 
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full bg-charcoal-900 border border-white/5 rounded-2xl py-5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold tracking-[1em] text-center text-white"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || !stationId}
              className="w-full bg-brand-500 text-charcoal-900 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale transition-all duration-500"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-charcoal-900/30 border-t-charcoal-900 rounded-full animate-spin" />
              ) : (
                <>Initialize Terminal <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <footer className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between opacity-40">
            <div className="flex items-center gap-2">
              <Cpu size={12} className="text-brand-500" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Node: RMS-KDS-04</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi size={12} className="text-emerald-500" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Sync: 0.4ms</span>
            </div>
          </footer>
        </motion.div>

        <p className="text-center mt-12 text-[10px] font-bold text-charcoal-600 uppercase tracking-[0.3em]">
          Internal Systems &copy; 2026
        </p>
      </div>
    </div>
  );
}
