import { Outlet } from 'react-router-dom';
import { useOrders } from '../../../../context/OrderContext';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MoreVertical, X, Plus, Minus, LayoutGrid, ShoppingCart, Users, Wallet, SlidersHorizontal, TrendingUp, Monitor, Clock, Settings, RefreshCw, Power, ArrowLeft, ChevronRight, Shield, Table, Zap } from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { useNavigate } from 'react-router-dom';
import { playClickSound } from '../../utils/sounds';
import QuickOrderModal from '../QuickOrderModal';

export default function PosLayout() {
  const { orders, updateOrderStatus } = useOrders();
  const { 
    isSidebarOpen, closeSidebar, user,
    isQuickOrderModalOpen, setIsQuickOrderModalOpen,
    handleStartQuickOrder, tables 
  } = usePos();
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
  const [expandedMenus, setExpandedMenus] = useState([]);

  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label) 
        : [...prev, label]
    );
  };

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
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full bg-[var(--primary-color)] flex flex-col border-r border-white/10 z-[101] overflow-hidden shrink-0 relative shadow-2xl text-white"
          >
            <div className="px-5 py-5 flex items-center justify-between border-b border-black/10 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/20 shadow-inner">
                  <Monitor size={16} className="text-white" />
                </div>
                <h2 className="text-xs font-black text-white uppercase tracking-widest">
                  POS <span className="text-white/70">Navigator</span>
                </h2>
              </div>
              <button 
                onClick={closeSidebar} 
                className="p-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-white/80 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar py-4 relative z-10">
                <DrawerItem
                  onClick={() => { navigate('/pos/dashboard'); }}
                  icon={<LayoutGrid size={18} />} label="Dashboard"
                  active={window.location.pathname === '/pos/dashboard'}
                />
                
                <DrawerItem
                  onClick={() => { navigate('/pos/tables'); }}
                  icon={<Globe size={18} />} label="Tables"
                  active={window.location.pathname.includes('/pos/tables')}
                />

                <div>
                  <DrawerItem
                    onClick={() => toggleSubmenu('Orders')}
                    icon={<ShoppingCart size={18} />} label="Orders"
                    active={window.location.pathname.includes('/pos/orders')}
                    isExpandable
                    isExpanded={expandedMenus.includes('Orders')}
                  />
                  <AnimatePresence>
                    {expandedMenus.includes('Orders') && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <DrawerSubItem 
                          label="Dine-In Orders" 
                          onClick={() => navigate('/pos/orders/active?type=Dine-In')} 
                          active={window.location.pathname.includes('/pos/orders') && window.location.search.includes('type=Dine-In')} 
                        />
                        <DrawerSubItem 
                          label="Quick Service" 
                          onClick={() => navigate('/pos/orders/active?type=Takeaway')} 
                          active={window.location.pathname.includes('/pos/orders') && window.location.search.includes('type=Takeaway')} 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <DrawerItem
                  onClick={() => { navigate('/pos/billing'); }}
                  icon={<Wallet size={18} />} label="Invoice & Billing"
                  active={window.location.pathname.includes('/pos/billing')}
                />
                
                <DrawerItem
                  onClick={() => { navigate('/pos/security'); }}
                  icon={<Shield size={18} />} label="Security"
                  active={window.location.pathname.includes('/pos/security')}
                />

                <DrawerItem onClick={() => { localStorage.removeItem('pos_access'); navigate('/pos/login'); }} icon={<Power size={18} />} label="Logout" color="text-red-200 group-hover:text-red-100" hoverBg="hover:bg-red-500/20" />
            </div>

            <div className="p-5 border-t border-black/10 bg-black/10 space-y-2 relative z-10">
                <div className="flex justify-between text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  <span>Ref: RMS-POS</span>
                  <span className="text-white/80">v2.4.1</span>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shadow-inner">
                    <Users size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/50 font-black uppercase tracking-wider leading-tight">
                      {user?.role || 'Operator'} • {user?.branchId?.branchName || user?.branchId?.name || 'Main Branch'}
                    </p>
                    <p className="text-xs text-white font-bold tracking-wide">
                      {user?.name || 'Main Biller'}
                    </p>
                  </div>
                </div>
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

      <QuickOrderModal 
        isOpen={isQuickOrderModalOpen}
        onClose={() => setIsQuickOrderModalOpen(false)}
        tables={tables}
        onStartOrder={handleStartQuickOrder}
      />
    </div>
  );
}

// Helper Components
function DrawerItem({ icon, label, active, color, hoverBg, onClick, isExpandable, isExpanded }) {
  return (
    <div
      onClick={() => { playClickSound(); onClick(); }}
      className={`mx-3 my-1 px-4 py-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-300 group ${
        active 
        ? 'bg-black/20 shadow-inner' 
        : hoverBg || 'hover:bg-black/10'
      }`}
    >
      <div className={`flex items-center gap-3 ${color || (active ? 'text-white' : 'text-white/70 group-hover:text-white')}`}>
        {icon}
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
      </div>
      {isExpandable ? (
        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
          <ChevronRight size={14} className={`transition-transform duration-300 ${active ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`} />
        </motion.div>
      ) : (
        <ChevronRight size={14} className={`transition-transform duration-300 ${active ? 'text-white' : 'text-white/40 group-hover:text-white/70 group-hover:translate-x-1'}`} />
      )}
    </div>
  );
}

function DrawerSubItem({ label, onClick, active }) {
  return (
    <div
      onClick={() => { playClickSound(); onClick(); }}
      className={`pl-12 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all flex items-center gap-3 group ${
        active 
        ? 'text-white bg-black/10' 
        : 'text-white/60 hover:text-white hover:bg-black/10'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full transition-all ${
        active 
        ? 'bg-white scale-125 shadow-sm' 
        : 'bg-white/40 group-hover:bg-white/80'
      }`} />
      {label}
    </div>
  );
}



