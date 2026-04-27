import { Outlet } from 'react-router-dom';
import { useOrders } from '../../../../context/OrderContext';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MoreVertical, X, Plus, Minus, LayoutGrid, ShoppingCart, Users, Wallet, SlidersHorizontal, TrendingUp, Monitor, Clock, Settings, RefreshCw, Power, ArrowLeft, ChevronRight } from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { useNavigate } from 'react-router-dom';
import { playClickSound } from '../../utils/sounds';

export default function PosLayout() {
  const { orders, updateOrderStatus } = useOrders();
  const { isSidebarOpen, closeSidebar, user } = usePos();
  const navigate = useNavigate();
  
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
    <div className="flex h-screen bg-white overflow-hidden relative">
      {/* Sidebar - Now persistent and pushes content */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full bg-[var(--primary-color)] flex flex-col border-r border-white/5 z-[101] overflow-hidden shrink-0"
          >
            <div className="px-4 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">POS Navigator</h2>
              <button onClick={closeSidebar} className="p-1 text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                <p className="px-4 pt-3 pb-1 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Operations</p>
                <DrawerItem
                  onClick={() => { closeSidebar(); navigate('/pos/dashboard'); }}
                  icon={<LayoutGrid size={18} />} label="Dashboard"
                  active={window.location.pathname === '/pos/dashboard'}
                />
                <DrawerItem
                  onClick={() => { closeSidebar(); navigate('/pos/tables'); }}
                  icon={<Globe size={18} />} label="Tables"
                  active={window.location.pathname.includes('/pos/tables')}
                />
                <div className="bg-black/10">
                  <DrawerSubItem label="Table View" onClick={() => { closeSidebar(); navigate('/pos/tables'); }} />
                  <DrawerSubItem label="Table List" onClick={() => { closeSidebar(); navigate('/pos/tables/list'); }} />
                  <DrawerSubItem label="Reservations" onClick={() => { closeSidebar(); navigate('/pos/tables/reservations'); }} />
                </div>

                <DrawerItem
                  onClick={() => { closeSidebar(); navigate('/pos/orders/active'); }}
                  icon={<ShoppingCart size={18} />} label="Active Orders"
                />
                <div className="bg-black/10">
                  <DrawerSubItem label="Active Orders" onClick={() => { closeSidebar(); navigate('/pos/orders/active'); }} />
                  <DrawerSubItem label="Completed Orders" onClick={() => { closeSidebar(); navigate('/pos/orders/completed'); }} />
                  <DrawerSubItem label="Cancelled Orders" onClick={() => { closeSidebar(); navigate('/pos/orders/cancelled'); }} />
                </div>

                <DrawerItem
                  onClick={() => { closeSidebar(); navigate('/pos/billing'); }}
                  icon={<Wallet size={18} />} label="Billing"
                />
                <div className="bg-black/10">
                  <DrawerSubItem label="Generate Invoice" onClick={() => { closeSidebar(); navigate('/pos/billing/generate'); }} />
                  <DrawerSubItem label="Payment History" onClick={() => { closeSidebar(); navigate('/pos/billing/history'); }} />
                  <DrawerSubItem label="Cash Register" onClick={() => { closeSidebar(); navigate('/pos/billing/register'); }} />
                </div>

                <p className="px-4 pt-4 pb-1 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] border-t border-white/5 mt-2">Management</p>
                <DrawerItem onClick={() => { closeSidebar(); navigate('/pos/menu'); }} icon={<Settings size={18} />} label="Menu Settings" />
                <DrawerItem onClick={() => { closeSidebar(); navigate('/pos/operations'); }} icon={<SlidersHorizontal size={18} />} label="Operational Control" />
                <DrawerItem onClick={() => { closeSidebar(); localStorage.removeItem('pos_access'); navigate('/pos/login'); }} icon={<Power size={18} />} label="Logout Terminal" color="text-rose-400" />
            </div>

            <div className="p-4 border-t border-white/5 bg-black/10 space-y-1">
                <div className="flex justify-between text-[9px] text-white/30 font-bold uppercase tracking-wider">
                  <span>Ref: RMS-POS</span><span>v2.4.1</span>
                </div>
                <p className="text-[10px] text-white/60 font-black text-center pt-1 uppercase">
                  Station: {user?.name || 'Main Biller'}
                </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <motion.main 
        layout
        className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white"
      >
        {/* Incoming Orders Panel */}
        <AnimatePresence>
          {incomingOrders.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-100 border-b border-gray-300 overflow-hidden shrink-0 shadow-inner z-50"
            >
              <div className="p-4 flex gap-4 overflow-x-auto no-scrollbar scroll-smooth">
                {incomingOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-lg shadow-xl border border-gray-300 w-[340px] shrink-0"
                  >
                    <div className="bg-[#ff7a00] p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <Globe size={14} />
                        <span className="text-xs font-black tracking-tight uppercase">
                          {order.source || 'Home Website'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#F57C00] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          {order.type || 'Delivery'}
                        </span>
                        <button 
                          onClick={() => setDismissedOrders(prev => [...prev, order.id])}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white">
                       <span className="text-[10px] font-bold text-gray-500">{order.id.slice(-8)}</span>
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-gray-900 uppercase">
                            {new Date(order.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] font-black text-gray-900">₹ {order.total}</span>
                       </div>
                    </div>

                    <div className="p-4 bg-gray-50/50">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-bold text-gray-400 shrink-0">{item.quantity}x</span>
                            <span className="text-[11px] font-bold text-gray-700 truncate">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 flex items-center justify-between bg-white border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        <button 
                          onClick={() => handleRejectOrder(order.id)}
                          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 rounded transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                      <button 
                        onClick={() => handleAcceptOrder(order)}
                        className="px-6 py-2 bg-[#F57C00] text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg active:scale-95 transition-all"
                      >
                        Accept
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </motion.main>

      {/* Accept Order Modal */}
      <AnimatePresence>
        {acceptingOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                <button onClick={handleConfirmAccept} className="bg-[#ff7a00] text-white px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Save</button>
                <button onClick={handleConfirmAccept} className="bg-[#ff7a00] text-white px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Save & Print</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function DrawerItem({ icon, label, active, color, onClick }) {
  return (
    <div
      onClick={() => { playClickSound(); onClick(); }}
      className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all hover:bg-white/5 ${active ? 'bg-black/20' : ''}`}
    >
      <div className={`flex items-center gap-3 ${color || (active ? 'text-white' : 'text-white/40')}`}>
        {icon}
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight size={14} className="text-white/10" />
    </div>
  );
}

function DrawerSubItem({ label, onClick }) {
  return (
    <div
      onClick={() => { playClickSound(); onClick(); }}
      className="pl-12 pr-4 py-2 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/5 cursor-pointer transition-all flex items-center gap-2"
    >
      <span className="w-1 h-1 rounded-full bg-white/20" />
      {label}
    </div>
  );
}



