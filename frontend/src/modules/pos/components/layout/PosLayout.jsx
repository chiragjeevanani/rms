import { usePos } from '../../context/PosContext';
import { Outlet } from 'react-router-dom';
import PosSidebar from '../navigation/PosSidebar';
import { useOrders } from '../../../../context/OrderContext';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MoreVertical, X, Plus, Minus } from 'lucide-react';

export default function PosLayout() {
  const { isSidebarOpen, closeSidebar } = usePos();
  const { orders, updateOrderStatus } = useOrders();
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const [dismissedOrders, setDismissedOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_dismissed_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }); 

  useEffect(() => {
    localStorage.setItem('pos_dismissed_orders', JSON.stringify(dismissedOrders));
  }, [dismissedOrders]);

  const [deliveryTime, setDeliveryTime] = useState(30);
  const [prepTime, setPrepTime] = useState(0);

  const incomingOrders = useMemo(() => 
    orders.filter(o => 
      (o.status === 'pending' || o.status === 'new') && 
      (!o.source || o.source.toLowerCase() !== 'pos terminal') &&
      !dismissedOrders.includes(o.id)
    ),
    [orders, dismissedOrders]
  );

  const handleAcceptOrder = (order) => {
    setAcceptingOrder(order);
    setDeliveryTime(order.type?.toLowerCase() === 'delivery' ? 30 : 0);
    setPrepTime(15); // Default prep time
  };

  const handleConfirmAccept = () => {
    if (acceptingOrder) {
      updateOrderStatus(acceptingOrder.id, 'preparing');
      setAcceptingOrder(null);
    }
  };

  const handleRejectOrder = (orderId) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  return (
    <div className="flex h-screen bg-[#F4F4F7] overflow-hidden relative">
      <PosSidebar isOpen={isSidebarOpen} />
      
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Floating Incoming Orders Panel - Bottom Right */}
        <div className="fixed bottom-8 right-8 z-[150] flex flex-col gap-4 pointer-events-none">
          <AnimatePresence>
            {incomingOrders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ x: 100, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 100, opacity: 0, scale: 0.8 }}
                className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 w-[360px] pointer-events-auto overflow-hidden ring-1 ring-black/5"
              >
                {/* Header: Clean Teal with Type Badge */}
                <div className="bg-[#0D6B78] p-4 flex items-center justify-between relative">
                  <div className="flex items-center gap-2.5 text-white">
                    <Globe size={16} className="opacity-80" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                      {order.source || 'Online Order'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                      {order.type || 'Delivery'}
                    </span>
                    <button 
                      onClick={() => setDismissedOrders(prev => [...prev, order.id])}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Body: ID & Items Summary */}
                <div className="p-5">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{order.id.slice(-8)}</span>
                      <div className="flex items-center gap-3">
                         <span className="text-[11px] font-black text-slate-900 uppercase">
                           {new Date(order.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                         <span className="text-sm font-black text-slate-900 italic">₹{order.total}</span>
                      </div>
                   </div>

                   <div className="space-y-1.5 mb-6">
                     {order.items.map((item, idx) => (
                       <div key={idx} className="flex items-center gap-2">
                         <span className="text-[11px] font-black text-slate-400">{item.quantity}x</span>
                         <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate">{item.name}</span>
                       </div>
                     ))}
                   </div>

                   {/* Simplified Actions */}
                   <div className="flex gap-2">
                     <button 
                       onClick={() => handleRejectOrder(order.id)}
                       className="flex-1 py-3.5 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={() => handleAcceptOrder(order)}
                       className="flex-[2] py-3.5 bg-[#BE123C] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-900/20 active:scale-95 transition-all"
                     >
                       Confirm Order
                     </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Content Area - This will push down structurally */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
      {/* Accept Order Configuration Modal */}
      <AnimatePresence>
        {acceptingOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
              onClick={() => setAcceptingOrder(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl w-[600px] z-[201] overflow-hidden border border-gray-200"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">
                  {acceptingOrder.source || 'Home Website'} - {acceptingOrder.id}
                </h3>
                <button onClick={() => setAcceptingOrder(null)} className="text-gray-400 hover:text-gray-900">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {acceptingOrder.type?.toLowerCase() === 'delivery' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Minimum Delivery Time <span className="text-gray-400 font-normal">(Minutes)</span>:</span>
                    <div className="flex items-center gap-2">
                       <button onClick={() => setDeliveryTime(Math.max(0, deliveryTime - 5))} className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:bg-gray-50"><Minus size={16} /></button>
                       <div className="w-24 h-10 border border-gray-200 rounded flex items-center justify-center font-bold text-gray-700">
                         {deliveryTime}
                       </div>
                       <button onClick={() => setDeliveryTime(deliveryTime + 5)} className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:bg-gray-50"><Plus size={16} /></button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Preparation Time <span className="text-gray-400 font-normal">(Minutes)</span>:</span>
                  <div className="flex items-center gap-2">
                     <button onClick={() => setPrepTime(Math.max(0, prepTime - 5))} className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:bg-gray-50"><Minus size={16} /></button>
                     <div className="w-24 h-10 border border-gray-200 rounded flex items-center justify-center font-bold text-gray-700">
                       {prepTime}
                     </div>
                     <button onClick={() => setPrepTime(prepTime + 5)} className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:bg-gray-50"><Plus size={16} /></button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex flex-wrap items-center justify-center gap-3">
                <button onClick={handleConfirmAccept} className="bg-[#BE123C] text-white px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-900/10 active:scale-95 transition-all">
                  Save
                </button>
                <button onClick={handleConfirmAccept} className="bg-[#BE123C] text-white px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-900/10 active:scale-95 transition-all">
                  Save & Print
                </button>
                <button onClick={handleConfirmAccept} className="bg-[#BE123C] text-white px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-900/10 active:scale-95 transition-all">
                  Save & EBill
                </button>
                <button onClick={handleConfirmAccept} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all">
                  KOT
                </button>
                <button onClick={handleConfirmAccept} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all">
                  KOT & PRINT
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
