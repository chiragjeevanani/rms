import React from 'react';
import { motion } from 'framer-motion';

export default function Skeleton({ className, circle = false }) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${circle ? 'rounded-full' : 'rounded-2xl'} ${className}`}>
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />
    </div>
  );
}



