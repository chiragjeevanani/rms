import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, ChefHat, Pizza } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      {/* Background Subtle Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="relative">
        {/* Main Animated Cloche/Plate Icon */}
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ 
             scale: [0.8, 1.1, 1],
             opacity: 1
           }}
           transition={{ duration: 0.5, ease: "easeOut" }}
           className="relative z-10"
        >
           <div className="w-24 h-24 bg-[#2C2C2C] rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 relative overflow-hidden">
              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ChefHat size={40} className="text-amber-400" />
              </motion.div>
              
              {/* Shine effect */}
              <motion.div 
                animate={{ x: [-100, 200] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12" 
              />
           </div>
        </motion.div>

        {/* Orbiting Items */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0 -m-4 border-2 border-dashed border-slate-100 rounded-full"
        >
           <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-xl shadow-lg border border-slate-50">
              <Pizza size={16} className="text-amber-500" />
           </motion.div>
        </motion.div>
      </div>

      {/* Loading Text */}
      <div className="mt-12 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-black text-slate-900 uppercase tracking-[0.3em]"
        >
          RMS <span className="text-amber-500">Kitchen</span>
        </motion.h2>
        
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1, 
                delay: i * 0.2 
              }}
              className="w-1.5 h-1.5 bg-slate-900 rounded-full"
            />
          ))}
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6"
        >
          Serving Excellence Since 2026
        </motion.p>
      </div>
    </div>
  );
}
