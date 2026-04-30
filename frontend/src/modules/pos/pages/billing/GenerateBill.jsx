
import React, { useState, useEffect } from 'react';
import { 
  Receipt, Search, Filter, CreditCard, 
  Banknote, Smartphone, Printer, Send,
  Table, Clock, ChevronRight, AlertCircle,
  Calculator, User, MapPin, Phone, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function GenerateBill() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const fetchInitialData = async () => {
    try {
      const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
      const bId = typeof staffInfo.branchId === 'object' ? staffInfo.branchId?._id : staffInfo.branchId;
      
      if (!bId) {
        toast.error('Branch information missing');
        setLoading(false);
        return;
      }

      // Fetch active orders for this branch
      const ordersRes = await fetch(`${import.meta.env.VITE_API_URL}/orders/active?branchId=${bId}`);
      const ordersData = await ordersRes.json();
      
      // Fetch branch details
      const branchesRes = await fetch(`${import.meta.env.VITE_API_URL}/branches`);
      const branchesData = await branchesRes.json();
      const currentBranch = branchesData.data.find(b => b._id === bId);

      if (ordersData.success) setActiveOrders(ordersData.data);
      if (currentBranch) setBranchInfo(currentBranch);

    } catch (err) {
      console.error('Error fetching billing data:', err);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSettleOrder = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${selectedOrder._id}/settle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: [{
            method: paymentMethod,
            amount: selectedOrder.grandTotal
          }],
          status: 'completed'
        })
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Order settled successfully');
        setSelectedOrder(null);
        fetchInitialData();
      }
    } catch (err) {
      toast.error('Failed to settle order');
    } finally {
      setIsProcessing(false);
    }
  };

  const printBill = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] animate-in fade-in duration-500 overflow-hidden font-sans">
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0 print:hidden">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">Guest Billing & Checkout</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Generate Invoices & Process Customer Payments</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 shadow-sm">
            <Calculator size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Pricing Matrix v1.0</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Pending Tables List */}
        <div className="w-1/2 border-r border-slate-200 overflow-y-auto p-8 no-scrollbar bg-white/50 print:hidden">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Pending Bill Requests</h2>
          {loading ? (
             <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-lg" />)}
             </div>
          ) : activeOrders.length === 0 ? (
             <div className="py-20 text-center opacity-20">
                <Receipt size={48} className="mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">No pending bills</p>
             </div>
          ) : (
            <div className="space-y-4">
               {activeOrders.map(order => (
                 <motion.button
                   key={order._id}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => setSelectedOrder(order)}
                   className={`w-full text-left p-6 rounded-2xl border transition-all relative overflow-hidden group ${
                     selectedOrder?._id === order._id ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white border-slate-200 hover:border-blue-600'
                   }`}
                 >
                   <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                           selectedOrder?._id === order._id ? 'bg-white/10 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'
                         }`}>
                            <Table size={24} />
                         </div>
                         <div>
                            <h3 className={`text-base font-black uppercase tracking-tight ${selectedOrder?._id === order._id ? 'text-white' : 'text-slate-900'}`}>{order.tableName}</h3>
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedOrder?._id === order._id ? 'text-white/60' : 'text-slate-400'}`}>{order.items.length} ITEMS • {order.orderType}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selectedOrder?._id === order._id ? 'text-white/60' : 'text-slate-400'}`}>Total Due</p>
                         <span className={`text-lg font-black tracking-tighter ${selectedOrder?._id === order._id ? 'text-white' : 'text-slate-950'}`}>₹{order.grandTotal.toFixed(2)}</span>
                      </div>
                   </div>
                   {selectedOrder?._id === order._id && <div className="absolute top-2 right-2 p-1 bg-white/20 rounded-full"><ChevronRight size={14} /></div>}
                 </motion.button>
               ))}
            </div>
          )}
        </div>

        {/* Right: Bill Preview & Actions */}
        <div className="flex-1 overflow-y-auto p-12 no-scrollbar bg-[#F8F9FA] print:p-0 print:bg-white">
          <AnimatePresence mode="wait">
            {!selectedOrder ? (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="h-full flex flex-col items-center justify-center text-slate-300 print:hidden"
               >
                  <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center mb-6">
                     <Receipt size={32} strokeWidth={1} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]">Select a table for billing</h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-2">Pick an active table from the left to view the invoice</p>
               </motion.div>
            ) : (
               <motion.div 
                 key={selectedOrder._id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="max-w-md mx-auto space-y-8"
               >
                  {/* Bill Format */}
                  <div id="printable-bill" className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xl shadow-slate-900/5 relative print:shadow-none print:border-none print:p-4">
                     <div className="absolute top-0 right-0 p-4 opacity-5 print:hidden">
                        <Receipt size={120} strokeWidth={1} />
                     </div>
                     
                     {/* Branch Header */}
                     <div className="text-center mb-8 border-b-2 border-dashed border-slate-100 pb-6">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-slate-950 mb-1">{branchInfo?.branchName || 'RESTAURANT'}</h2>
                        <div className="flex flex-col gap-1 items-center">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                              <MapPin size={10} /> {branchInfo?.address}, {branchInfo?.city}
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                              <Phone size={10} /> {branchInfo?.phone}
                           </div>
                           {branchInfo?.gstNumber && (
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 uppercase mt-1">
                                 <Hash size={10} /> GSTIN: {branchInfo.gstNumber}
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Order Details */}
                     <div className="grid grid-cols-2 gap-4 mb-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="space-y-1.5">
                           <div className="flex justify-between">
                              <span>Bill No:</span>
                              <span className="text-slate-900 font-black">{selectedOrder.orderNumber}</span>
                           </div>
                           <div className="flex justify-between">
                              <span>Table:</span>
                              <span className="text-slate-900 font-black">{selectedOrder.tableName}</span>
                           </div>
                        </div>
                        <div className="space-y-1.5 text-right">
                           <div className="flex justify-between">
                              <span className="ml-auto pr-2">Date:</span>
                              <span className="text-slate-900 font-black">{new Date().toLocaleDateString()}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="ml-auto pr-2">Time:</span>
                              <span className="text-slate-900 font-black">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </div>
                     </div>

                     {/* Items Table */}
                     <div className="mb-8">
                        <div className="grid grid-cols-12 gap-2 border-y border-slate-100 py-2 mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                           <div className="col-span-6">Item Description</div>
                           <div className="col-span-2 text-center">Qty</div>
                           <div className="col-span-2 text-right">Rate</div>
                           <div className="col-span-2 text-right">Amt</div>
                        </div>
                        <div className="space-y-3">
                           {selectedOrder.items.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                                 <div className="col-span-6 truncate">{item.name}</div>
                                 <div className="col-span-2 text-center">{item.quantity}</div>
                                 <div className="col-span-2 text-right">{item.price}</div>
                                 <div className="col-span-2 text-right">{(item.price * item.quantity).toFixed(2)}</div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Financials */}
                     <div className="space-y-2 border-t-2 border-dashed border-slate-100 pt-6 mb-8">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase">
                           <span>Subtotal</span>
                           <span className="tabular-nums">₹{selectedOrder.subTotal.toFixed(2)}</span>
                        </div>
                        {selectedOrder.tax > 0 && (
                           <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase">
                              <span>CGST/SGST (5%)</span>
                              <span className="tabular-nums">₹{selectedOrder.tax.toFixed(2)}</span>
                           </div>
                        )}
                        {selectedOrder.discount?.amount > 0 && (
                           <div className="flex justify-between text-[11px] font-bold text-rose-600 uppercase">
                              <span>Discount</span>
                              <span className="tabular-nums">-₹{selectedOrder.discount.amount.toFixed(2)}</span>
                           </div>
                        )}
                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                           <span className="text-base font-extrabold text-slate-900 uppercase tracking-tighter">Grand Total</span>
                           <span className="text-2xl font-black text-blue-600 tracking-tighter tabular-nums">₹{selectedOrder.grandTotal.toFixed(2)}</span>
                        </div>
                     </div>

                     <div className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] pt-4 border-t border-slate-50">
                        Thank you for dining with us!
                     </div>
                  </div>

                  {/* Payment Actions */}
                  <div className="space-y-6 print:hidden">
                     <div className="grid grid-cols-3 gap-2">
                        {[
                           { id: 'Cash', icon: Banknote, color: 'text-emerald-500' },
                           { id: 'Card', icon: CreditCard, color: 'text-amber-500' },
                           { id: 'UPI', icon: Smartphone, color: 'text-blue-500' }
                        ].map(method => (
                           <button 
                             key={method.id}
                             onClick={() => setPaymentMethod(method.id)}
                             className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all group ${
                               paymentMethod === method.id ? 'bg-white border-blue-600 shadow-lg ring-2 ring-blue-50' : 'bg-white border-slate-200 hover:border-slate-300'
                             }`}
                           >
                              <method.icon size={20} className={paymentMethod === method.id ? method.color : 'text-slate-300 group-hover:text-slate-400'} />
                              <span className={`text-[9px] font-black uppercase tracking-widest ${paymentMethod === method.id ? 'text-slate-900' : 'text-slate-400'}`}>{method.id} Payment</span>
                           </button>
                        ))}
                     </div>

                     <div className="flex gap-4">
                        <button 
                          onClick={printBill}
                          className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 hover:bg-slate-50 transition-all outline-none"
                        >
                           <Printer size={18} />
                           Print Bill
                        </button>
                        <button 
                          onClick={handleSettleOrder}
                          disabled={isProcessing}
                          className="flex-1 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all outline-none active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                           {isProcessing ? (
                              <Clock size={18} className="animate-spin" />
                           ) : (
                              <Send size={18} />
                           )}
                           Finalize & Close
                        </button>
                     </div>

                     <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                        <AlertCircle size={18} className="text-amber-600 shrink-0" />
                        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest leading-relaxed">
                           Note: Completing the settlement will mark the table as 'Dirty' and the order as 'Paid'.
                        </p>
                     </div>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-bill, #printable-bill * {
            visibility: visible;
          }
          #printable-bill {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}} />
    </div>
  );
}
