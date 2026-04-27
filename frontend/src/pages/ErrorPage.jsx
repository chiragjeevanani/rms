import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Ghost, Home, ArrowLeft, Terminal } from 'lucide-react';

export default function ErrorPage({ code = "404", message = "Page Not Found" }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 font-sans text-white">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Ghost size={120} className="text-white/10" strokeWidth={1} />
            </motion.div>
            <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-black tracking-tighter opacity-20">
              {code}
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
            Lost in <span className="text-brand-500 italic">Space</span>
          </h2>
          <p className="text-slate-400 font-medium mb-12">
            {message}. The requested operation could not be resolved by the system.
          </p>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white text-black py-6 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 shadow-2xl"
            >
              <Home size={18} />
              Return to Base
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-white/5 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
              Previous Link
            </button>
          </div>
        </motion.div>

        <div className="mt-20 flex items-center justify-center gap-4 opacity-20">
          <div className="h-[1px] w-12 bg-white" />
          <Terminal size={16} />
          <div className="h-[1px] w-12 bg-white" />
        </div>
      </div>
    </div>
  );
}
