import { motion } from 'framer-motion';
import { Clock, AlertCircle, ShoppingBag, Hash } from 'lucide-react';
import { useKdsTimer } from '../hooks/useKdsTimer';
import { useTheme } from '../../user/context/ThemeContext';

export function KdsOrderCard({ order, onClick }) {
  const { formatTime, isDelayed } = useKdsTimer(order.startTime);
  const { isDarkMode } = useTheme();

  const getStatusInfo = (status) => {
    switch (status) {
      case 'new': return { color: 'bg-blue-600', text: 'New', border: 'border-blue-600/20' };
      case 'preparing': return { color: 'bg-[#5D4037]', text: 'Preparing', border: 'border-[#5D4037]/20' };
      case 'delayed': return { color: 'bg-red-700', text: 'Delayed', border: 'border-red-700/40' };
      case 'ready': return { color: 'bg-emerald-700', text: 'Ready', border: 'border-emerald-700/20' };
      default: return { color: 'bg-stone-600', text: status, border: 'border-stone-600/20' };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const effectiveStatusColor = isDelayed ? 'bg-red-700' : statusInfo.color;

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      onClick={() => onClick(order)}
      className={`border rounded-3xl overflow-hidden cursor-pointer flex flex-col h-full shadow-2xl transition-all duration-300 ${
        isDarkMode 
          ? `bg-[#1a1c1e] ${statusInfo.border}` 
          : `bg-white border-stone-200 hover:border-stone-300`
      }`}
    >
      {/* Header */}
      <div className={`${effectiveStatusColor} px-4 md:px-6 py-3 md:py-5 flex items-center gap-3 overflow-hidden`}>
         <div className="flex-shrink-0 w-9 h-9 md:w-12 md:h-12 bg-white/10 border border-white/5 rounded-xl flex items-center justify-center text-white backdrop-blur-sm">
            <Hash size={18} className="md:w-6 md:h-6" />
         </div>
         <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-2xl font-black text-white leading-none mb-1 truncate">
               #{order.orderNum}
            </h3>
            <p className="text-[9px] md:text-xs font-bold text-white/70 uppercase tracking-widest truncate">
               {order.source}
            </p>
         </div>
         <div className="flex-shrink-0 bg-white/20 px-3 md:px-4 py-1.5 md:py-2 rounded-full backdrop-blur-md border border-white/10 ml-1">
            <span className="text-[9px] md:text-[11px] font-black text-white uppercase tracking-wider leading-none whitespace-nowrap">
               {order.table.startsWith('T') ? order.table : `T${order.table}`}
            </span>
         </div>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 flex-1 space-y-5 md:space-y-7">
         {order.items.map((item) => (
            <div key={item.id} className="flex items-start gap-4 md:gap-6">
               <div className={`flex items-center justify-center w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl font-black text-xs md:text-base border transition-colors ${
                 isDarkMode ? 'bg-[#2a2c2e] text-[#D4AF37] border-white/5' : 'bg-stone-100 text-[#5D4037] border-stone-200'
               }`}>
                  {item.quantity}x
               </div>
               <div className="flex-1 min-w-0">
                  <h4 className={`text-lg md:text-2xl font-bold leading-tight uppercase tracking-tight transition-colors ${
                    isDarkMode ? 'text-stone-100' : 'text-stone-800'
                  }`}>{item.name}</h4>
                  {item.note && (
                    <div className="mt-1 md:mt-2 flex items-start gap-2 text-red-500">
                       <AlertCircle size={12} className="md:w-4 md:h-4 mt-0.5 shrink-0" />
                       <p className="text-[11px] md:text-xs font-bold uppercase italic leading-tight">{item.note}</p>
                    </div>
                  )}
               </div>
            </div>
         ))}
      </div>

      {/* Footer */}
      <div className={`px-6 md:px-8 py-4 md:py-6 border-t flex items-center justify-between mt-auto text-sm md:text-base transition-colors ${
        isDarkMode ? 'bg-black/40 border-white/5' : 'bg-stone-50 border-stone-100'
      }`}>
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${effectiveStatusColor} animate-pulse`} />
            <span className={`text-[10px] md:text-sm font-black uppercase tracking-widest transition-colors ${
              isDarkMode ? 'text-stone-400' : 'text-stone-500'
            }`}>
              {isDelayed ? 'Delayed' : statusInfo.text}
            </span>
         </div>
         <div className={`flex items-center gap-2 font-mono text-lg md:text-2xl font-black transition-colors ${
           isDelayed ? 'text-red-400' : (isDarkMode ? 'text-[#D4AF37]' : 'text-[#8D6E63]')
         }`}>
            <Clock size={16} className="md:w-5 md:h-5" />
            <span>{formatTime}</span>
         </div>
      </div>
    </motion.div>
  );
}
