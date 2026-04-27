import { motion } from 'framer-motion';
import { Clock, AlertCircle, ShoppingBag, Hash, CheckCircle } from 'lucide-react';
import { useKdsTimer } from '../hooks/useKdsTimer';
import { useTheme } from '../../user/context/ThemeContext';

export function KdsOrderCard({ order, onClick, onStatusChange }) {
  const maxPrepTimeEst = order.items.reduce((max, item) => Math.max(max, item.prepTimeEst || 0), 0);
  const { elapsed, totalDuration, formatTime, isDelayed, isNegative } = useKdsTimer(order.startTime, order.status, order.prepTime, order.readyTime, maxPrepTimeEst);
  const { isDarkMode } = useTheme();

  const getStatusInfo = (status) => {
    switch (status) {
      case 'new': 
      case 'pending':
      case 'confirmed':
        return { color: 'bg-blue-600', text: 'Incoming', border: 'border-blue-600/30' };
      case 'preparing': return { color: 'bg-orange-600', text: 'Preparing', border: 'border-orange-600/30' };
      case 'delayed': return { color: 'bg-red-700', text: 'Delayed', border: 'border-red-700/40' };
      case 'ready': 
      case 'completed':
      case 'served':
        return { color: 'bg-emerald-600', text: 'Ready', border: 'border-emerald-600/30' };
      default: return { color: 'bg-stone-600', text: status, border: 'border-stone-600/20' };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const effectiveStatusColor = isDelayed ? 'bg-red-700' : statusInfo.color;
  const isFinalized = ['ready', 'completed', 'served'].includes(order.status);

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={() => onClick(order)}
      className={`border rounded-2xl overflow-hidden cursor-pointer flex flex-col shadow-lg transition-all duration-200 ${
        isDarkMode 
          ? `bg-[#212325] ${statusInfo.border}` 
          : `bg-white border-stone-200 hover:border-stone-300 hover:shadow-xl`
      }`}
    >
      {/* Header — compact */}
      <div className={`${effectiveStatusColor} px-4 py-3 flex items-center justify-between overflow-hidden`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center text-white">
            <Hash size={14} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-white leading-none mb-0.5 truncate">
              #{order.orderNum}
            </h3>
            <p className="text-[10px] font-bold text-white/75 uppercase tracking-widest truncate">
              {order.source}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 ml-2">
          <span className="text-[10px] font-black text-white uppercase tracking-wide leading-none whitespace-nowrap">
            {order.table.startsWith('T') ? order.table : `T${order.table}`}
          </span>
        </div>
      </div>

      {/* Body — compact typography */}
      <div className="p-4 flex-1 space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4">
            <div className="relative shrink-0">
               <div className={`w-12 h-12 rounded-xl overflow-hidden border ${isDarkMode ? 'bg-stone-900 border-white/5' : 'bg-stone-100 border-stone-200'}`}>
                 {item.image ? (
                   <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-stone-500">
                     <ShoppingBag size={18} />
                   </div>
                 )}
               </div>
               <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] border shadow-sm ${
                 isDarkMode ? 'bg-black border-white/10 text-[#D4AF37]' : 'bg-white border-stone-200 text-[#ff7a00]'
               }`}>
                 {item.quantity}
               </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-bold leading-tight uppercase tracking-tight transition-colors truncate ${
                isDarkMode ? 'text-stone-100' : 'text-stone-800'
              }`}>{item.name}</h4>
              
              <div className="flex items-center gap-2 mt-1">
                {item.prepTimeEst && (
                  <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest bg-stone-500/10 px-1.5 py-0.5 rounded-md">
                     Est. {item.prepTimeEst}m
                  </span>
                )}
                {item.note && (
                  <div className="flex items-start gap-1.5 text-red-500">
                    <AlertCircle size={11} className="shrink-0" />
                    <p className="text-[10px] font-bold uppercase italic leading-tight truncate">{item.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer — compact */}
      <div className={`px-4 py-3 border-t flex flex-col gap-3 mt-auto transition-colors ${
        isDarkMode ? 'bg-black/30 border-white/6' : 'bg-stone-50 border-stone-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${effectiveStatusColor} animate-pulse`} />
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
              isDarkMode ? 'text-stone-400' : 'text-stone-500'
            }`}>
              {isDelayed ? 'TIME OVER' : statusInfo.text}
            </span>
          </div>
          <div className={`flex items-center gap-1.5 font-mono text-sm font-black transition-colors ${
            isDelayed ? 'text-red-400' : (isDarkMode ? 'text-[#D4AF37]' : 'text-[#fdba74]')
          }`}>
            <Clock size={13} />
            <span className="uppercase whitespace-nowrap">
              {isFinalized ? `Ready in ${Math.ceil(totalDuration / 60)} min` : formatTime}
            </span>
          </div>
        </div>

        {/* Quick Action Button */}
        {!isFinalized && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextStatus = ['pending', 'confirmed', 'new'].includes(order.status) ? 'Preparing' : 'Ready';
              onStatusChange(order.id, nextStatus);
            }}
            className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              ['pending', 'confirmed', 'new'].includes(order.status)
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
            }`}
          >
            {['pending', 'confirmed', 'new'].includes(order.status) ? 'Start Preparing' : 'Mark Ready'}
          </button>
        )}
      </div>
    </motion.div>
  );
}



