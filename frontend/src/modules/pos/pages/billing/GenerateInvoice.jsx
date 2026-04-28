import React, { useState, useEffect, useRef } from 'react';
import { 
  Receipt, User, Phone, Mail, 
  CreditCard, Banknote, Smartphone, Printer, 
  Table as TableIcon, Clock, ChevronRight, 
  AlertCircle, FileText, BadgeCheck, Utensils, Zap,
  Menu, Search, RefreshCw, X, ArrowRight,
  ShieldCheck, Wallet, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { usePos } from '../../context/PosContext';

export default function GenerateInvoice() {
  const { toggleSidebar } = usePos();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customer, setCustomer] = useState({ name: '', mobile: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [storeInfo, setStoreInfo] = useState({ restaurantName: 'PREMIUM RMS', mobileNumber: '', address: '' });

  const fetchReadyOrders = async () => {
    try {
      const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
      const branchQuery = staffInfo.branchId ? `?branchId=${staffInfo.branchId}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/active${branchQuery}`);
      const result = await response.json();
      if (result.success) {
        setOrders(result.data.filter(o => o.status.toLowerCase() === 'ready'));
      }
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/public-info`);
      const data = await response.json();
      if (response.ok) setStoreInfo(data);
    } catch (err) {
      console.error('Store info sync failed');
    }
  };

  useEffect(() => {
    fetchReadyOrders();
    fetchStoreInfo();
    const intv = setInterval(fetchReadyOrders, 20000);
    return () => clearInterval(intv);
  }, []);

  const handleSettle = async () => {
    if (!selectedOrder) return;
    if (!customer.name || !customer.mobile) {
       return toast.error('Guest details required');
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${selectedOrder._id}/settle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          payments: [{ method: paymentMethod, amount: selectedOrder.grandTotal }],
          status: 'Paid'
        })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Settled for ${selectedOrder.tableName}`);
        fetchReadyOrders();
        setSelectedOrder(null);
        setCustomer({ name: '', mobile: '', email: '' });
      }
    } catch (err) {
      toast.error('Settlement failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders.filter(o => 
    o.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB] animate-in fade-in duration-700 overflow-hidden font-sans select-none relative">
      
      {/* Hidden Print Receipt Layer */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 text-slate-900" id="printable-receipt">
         <div className="max-w-[80mm] mx-auto text-center font-mono border-b border-slate-200 pb-5 mb-5 uppercase tracking-tighter">
            <h1 className="text-lg font-bold">{storeInfo.restaurantName}</h1>
            {storeInfo.address && <p className="text-[8px] mt-1 line-clamp-2">{storeInfo.address}</p>}
            {storeInfo.mobileNumber && <p className="text-[8px] mt-0.5">TEL: {storeInfo.mobileNumber}</p>}
         </div>
         {selectedOrder && (
            <div className="text-[10px] font-mono">
               <div className="flex justify-between mb-4 border-b border-dotted pb-2">
                  <span>BILL: {selectedOrder.orderNumber.split('-').pop()}</span>
                  <span>{new Date().toLocaleTimeString()}</span>
               </div>
               <div className="mb-4">
                  <p>TABLE: {selectedOrder.tableName}</p>
                  <p>GUEST: {customer.name || 'GUEST'}</p>
               </div>
               <div className="border-b border-dotted mb-4 pb-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex py-0.5">
                       <span className="flex-1 uppercase">{item.name}</span>
                       <span className="w-8">{item.quantity}</span>
                       <span className="w-16 text-right">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
               </div>
               <div className="space-y-1 text-right mb-6 font-bold">
                  <div className="flex justify-between font-normal"><span>SUBTOTAL:</span><span>₹{selectedOrder.subTotal}</span></div>
                  <div className="flex justify-between font-normal"><span>TAX:</span><span>₹{selectedOrder.tax}</span></div>
                  <div className="flex justify-between border-t border-slate-200 mt-2 pt-1 text-base"><span>TOTAL:</span><span>₹{selectedOrder.grandTotal}</span></div>
               </div>
               <p className="text-center italic opacity-50 mt-10 tracking-widest text-[8px]">Thank you for visiting {storeInfo.restaurantName}!</p>
            </div>
         )}
      </div>

      <header className="px-8 py-5 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-5">
          <button onClick={toggleSidebar} className="p-2.5 bg-[#ff7a00] text-white rounded-lg hover:bg-slate-800 transition-all active:scale-95">
             <Menu size={18} />
          </button>
          <div className="space-y-0.5">
             <h1 className="text-xl font-bold text-slate-900 leading-none">Checkout Central</h1>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Awaiting Final Settlement</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 flex items-center gap-2">
              <Zap size={14} className="fill-emerald-600 stroke-none" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Ready: {orders.length}</span>
           </div>
           <button onClick={fetchReadyOrders} className="p-2.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all active:rotate-180 duration-700">
              <RefreshCw size={18} />
           </button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto no-scrollbar scroll-smooth">
         <div className="max-w-6xl mx-auto space-y-8">
            {/* Search bar */}
            <div className="flex items-center justify-between gap-6">
               <div className="relative flex-1 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by table, order or guest..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-14 pr-6 text-sm font-semibold outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                  />
               </div>
            </div>

            {/* List Table Container */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Ref</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Table</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Items</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Net Payable</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {loading ? (
                        <tr>
                           <td colSpan="5" className="px-8 py-20 text-center">
                              <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing...</span>
                           </td>
                        </tr>
                     ) : filteredOrders.length === 0 ? (
                        <tr>
                           <td colSpan="5" className="px-8 py-20 text-center opacity-30 italic">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">The billing queue is currently clear.</p>
                           </td>
                        </tr>
                     ) : (
                        filteredOrders.map(order => (
                          <motion.tr 
                            layout
                            key={order._id} 
                            onClick={() => setSelectedOrder(order)}
                            className="cursor-pointer group transition-all hover:bg-slate-50/50"
                          >
                             <td className="px-8 py-5">
                                <span className="text-[12px] font-bold text-slate-900 uppercase">#{order.orderNumber.split('-').pop()}</span>
                                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1 leading-none italic">Main Floor</p>
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#ff7a00] group-hover:text-white transition-all">
                                      <TableIcon size={14} />
                                   </div>
                                   <span className="text-[12px] font-bold text-slate-700 uppercase">{order.tableName}</span>
                                </div>
                             </td>
                             <td className="px-8 py-5 text-center">
                                <span className="text-[10px] font-bold uppercase text-slate-600 bg-slate-100 px-3 py-1 rounded-lg group-hover:bg-white transition-all border border-slate-200/50">{order.items.length} Items</span>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <span className="text-xl font-bold text-[#ff7a00] tracking-tighter block leading-none">₹{order.grandTotal}</span>
                             </td>
                             <td className="px-8 py-5 text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all text-[9px] font-bold uppercase tracking-widest">
                                   <BadgeCheck size={14} /> Checkout
                                </div>
                             </td>
                          </motion.tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </main>

      {/* Settlement Overly / Modal */}
      <AnimatePresence>
         {selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden select-none">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedOrder(null)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 20 }}
                  className="w-full max-w-4xl bg-white rounded-3xl shadow-3xl relative overflow-hidden flex flex-col max-h-[85vh] border border-slate-200"
                >
                   {/* Modal Header */}
                   <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-[#ff7a00] text-white rounded-xl">
                            <Receipt size={20} />
                         </div>
                         <div>
                            <h2 className="text-sm font-bold text-slate-900 leading-none">Generate Final Bill</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Order: {selectedOrder.orderNumber}</p>
                         </div>
                      </div>
                      <button 
                         onClick={() => setSelectedOrder(null)}
                         className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all active:scale-90"
                      >
                         <X size={20} />
                      </button>
                   </div>

                   <div className="flex-1 overflow-hidden flex">
                      {/* Left: Financial Breakdown */}
                      <div className="flex-1 overflow-y-auto p-10 border-r border-slate-100 bg-white no-scrollbar">
                         <div className="flex justify-between items-end mb-10">
                            <div>
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Serving Location</p>
                               <h3 className="text-2xl font-bold text-slate-900 uppercase italic">{selectedOrder.tableName}</h3>
                            </div>
                            <div className="text-right">
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Due</p>
                               <p className="text-4xl font-black text-[#ff7a00] tracking-tighter leading-none italic">₹{selectedOrder.grandTotal}</p>
                            </div>
                         </div>

                         {/* Customer Form */}
                         <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2.5">
                               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Guest Name</label>
                               <div className="relative group">
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                  <input 
                                    type="text"
                                    placeholder="Enter Guest Name"
                                    value={customer.name}
                                    onChange={(e) => setCustomer({...customer, name: e.target.value})}
                                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl pl-11 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#ff7a00] transition-all"
                                  />
                               </div>
                            </div>
                            <div className="space-y-2.5">
                               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Mobile No.</label>
                               <div className="relative group">
                                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                  <input 
                                    type="tel"
                                    placeholder="Enter Mobile No."
                                    value={customer.mobile}
                                    onChange={(e) => setCustomer({...customer, mobile: e.target.value})}
                                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl pl-11 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#ff7a00] transition-all"
                                  />
                               </div>
                            </div>
                         </div>
                         <div className="space-y-2.5 mb-10">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address (Optional)</label>
                            <div className="relative group">
                               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                               <input 
                                 type="email"
                                 placeholder="Enter Email Address"
                                 value={customer.email}
                                 onChange={(e) => setCustomer({...customer, email: e.target.value})}
                                 className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl pl-11 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#ff7a00] transition-all font-sans"
                               />
                            </div>
                         </div>

                         {/* Itemized List */}
                         <div className="space-y-4">
                            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-4">Item breakdown</h4>
                            {selectedOrder.items.map((item, idx) => (
                               <div key={idx} className="flex justify-between items-center py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-100">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-300">
                                        <Utensils size={16} />
                                     </div>
                                     <div>
                                        <p className="text-[11px] font-bold uppercase tracking-tight text-slate-900 leading-none mb-1">{item.name}</p>
                                        <p className="text-[8px] font-bold text-slate-400">{item.quantity} QTY @ ₹{item.price}</p>
                                     </div>
                                  </div>
                                  <span className="text-sm font-bold text-[#ff7a00]">₹{item.price * item.quantity}</span>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Right: Payment Channels & Finalize */}
                      <div className="w-[320px] bg-slate-50 p-10 shrink-0 flex flex-col justify-between border-l border-slate-100">
                         <div className="space-y-8">
                            <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Settlement Mode</p>
                               <div className="space-y-4">
                                  {[
                                     { id: 'Cash', icon: Banknote, color: 'text-emerald-500' },
                                     { id: 'Card', icon: CreditCard, color: 'text-amber-500' },
                                     { id: 'UPI', icon: Smartphone, color: 'text-[#ff7a00]' }
                                  ].map(mode => (
                                     <button
                                       key={mode.id}
                                       onClick={() => setPaymentMethod(mode.id)}
                                       className={`w-full h-16 rounded-2xl border flex items-center px-6 gap-4 transition-all ${
                                          paymentMethod === mode.id ? 'bg-[#ff7a00] border-[#ff7a00] text-white shadow-xl shadow-[#ff7a00]/10' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900'
                                       }`}
                                     >
                                        <div className={`p-2.5 rounded-lg ${paymentMethod === mode.id ? 'bg-white/10 text-white' : mode.color} transition-all`}>
                                           <mode.icon size={22} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{mode.id}</span>
                                     </button>
                                  ))}
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl mb-2">
                               <ShieldCheck size={18} className="text-blue-600 shrink-0" />
                               <p className="text-[8px] font-bold text-blue-700 uppercase tracking-widest leading-relaxed">Bill will be marked as 'Paid' and table cleared.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                               <button 
                                 onClick={handlePrint}
                                 className="h-12 bg-white border border-slate-900 text-slate-900 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all flex items-center justify-center gap-2"
                               >
                                  <Printer size={16} />
                                  Receipt
                               </button>
                               <button 
                                 onClick={handleSettle}
                                 disabled={isProcessing}
                                 className="h-12 bg-[#ff7a00] text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-[#ff7a00]/10 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                               >
                                  {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <><Wallet size={16} /> Settle</>}
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}



