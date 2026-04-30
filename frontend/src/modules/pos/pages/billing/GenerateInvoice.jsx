
import React, { useState, useEffect } from 'react';
import { 
  Receipt, Search, Printer, FileText, 
  Table as TableIcon, RefreshCw, X, Menu,
  Zap, BadgeCheck, Download, ExternalLink,
  MapPin, Phone, Hash, CreditCard, Banknote, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { usePos } from '../../context/PosContext';
import { jsPDF } from "jspdf";

export default function GenerateInvoice() {
  const { toggleSidebar } = usePos();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchInfo, setBranchInfo] = useState(null);

  const fetchCompletedOrders = async () => {
    try {
      const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
      const bId = typeof staffInfo.branchId === 'object' ? staffInfo.branchId?._id : staffInfo.branchId;
      const branchQuery = bId ? `?branchId=${bId}` : '';
      
      // Fetch only COMPLETED orders as per user request
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/completed${branchQuery}`);
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (err) {
      toast.error('Failed to sync completed orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchInfo = async () => {
    try {
      const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
      const bId = typeof staffInfo.branchId === 'object' ? staffInfo.branchId?._id : staffInfo.branchId;
      if (!bId) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/branches`);
      const result = await response.json();
      if (result.success) {
        const currentBranch = result.data.find(b => b._id === bId);
        if (currentBranch) setBranchInfo(currentBranch);
      }
    } catch (err) {
      console.error('Branch info fetch failed');
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
    fetchBranchInfo();
  }, []);

  const generatePDF = (order) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 150 + (order.items.length * 5)] // Dynamic height based on items
    });

    const centerX = 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(branchInfo?.branchName || 'RESTAURANT', centerX, 10, { align: 'center' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(branchInfo?.address || 'Branch Address', centerX, 14, { align: 'center' });
    doc.text(`Phone: ${branchInfo?.phone || ''}`, centerX, 17, { align: 'center' });
    if (branchInfo?.gstNumber) doc.text(`GSTIN: ${branchInfo.gstNumber}`, centerX, 20, { align: 'center' });
    
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, 23, 75, 23);
    
    doc.setFontSize(8);
    doc.text(`Bill No: ${order.orderNumber}`, 5, 27);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 5, 31);
    doc.text(`Table: ${order.tableName}`, 5, 35);
    doc.text(`Type: ${order.orderType}`, 45, 35);
    
    doc.line(5, 38, 75, 38);
    doc.setFont("helvetica", "bold");
    doc.text('Item', 5, 42);
    doc.text('Qty', 45, 42, { align: 'center' });
    doc.text('Amount', 75, 42, { align: 'right' });
    doc.line(5, 44, 75, 44);

    doc.setFont("helvetica", "normal");
    let y = 48;
    order.items.forEach(item => {
      const name = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name;
      doc.text(name, 5, y);
      doc.text(item.quantity.toString(), 45, y, { align: 'center' });
      doc.text((item.price * item.quantity).toFixed(2), 75, y, { align: 'right' });
      y += 5;
    });

    doc.line(5, y, 75, y);
    y += 5;
    doc.text('Subtotal:', 45, y);
    doc.text(order.subTotal.toFixed(2), 75, y, { align: 'right' });
    y += 4;
    if (order.tax > 0) {
      doc.text('GST (5%):', 45, y);
      doc.text(order.tax.toFixed(2), 75, y, { align: 'right' });
      y += 4;
    }
    if (order.discount?.amount > 0) {
      doc.text('Discount:', 45, y);
      doc.text(`-${order.discount.amount.toFixed(2)}`, 75, y, { align: 'right' });
      y += 4;
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text('GRAND TOTAL:', 40, y + 2, { align: 'right' });
    doc.text(`Rs. ${order.grandTotal.toFixed(2)}`, 75, y + 2, { align: 'right' });
    
    y += 12;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text('Thank you! Visit again.', centerX, y, { align: 'center' });

    doc.save(`Bill_${order.orderNumber}.pdf`);
    toast.success('PDF Generated');
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders.filter(o => 
    o.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] animate-in fade-in duration-500 overflow-hidden font-sans select-none relative">
      
      {/* Hidden Print Layer */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-slate-900" id="printable-receipt">
         {selectedOrder && (
            <div className="max-w-[80mm] mx-auto font-mono text-[10px]">
               <div className="text-center mb-4 border-b border-dashed pb-4">
                  <h1 className="text-base font-black uppercase">{branchInfo?.branchName || 'RESTAURANT'}</h1>
                  <p className="text-[8px] mt-1">{branchInfo?.address}</p>
                  <p className="text-[8px] mt-0.5">Ph: {branchInfo?.phone}</p>
                  {branchInfo?.gstNumber && <p className="text-[8px] font-bold">GST: {branchInfo.gstNumber}</p>}
               </div>
               <div className="flex justify-between mb-1">
                  <span>Bill: {selectedOrder.orderNumber}</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
               </div>
               <div className="flex justify-between mb-4">
                  <span>Table: {selectedOrder.tableName}</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
               </div>
               <div className="border-y border-dashed py-2 mb-4">
                  <div className="flex font-bold mb-1">
                     <span className="flex-1">Item</span>
                     <span className="w-8 text-center">Qty</span>
                     <span className="w-16 text-right">Amt</span>
                  </div>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex py-0.5">
                       <span className="flex-1 uppercase">{item.name}</span>
                       <span className="w-8 text-center">{item.quantity}</span>
                       <span className="w-16 text-right">{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
               </div>
               <div className="space-y-1 text-right mb-6">
                  <div className="flex justify-between"><span>Subtotal:</span><span>₹{selectedOrder.subTotal.toFixed(2)}</span></div>
                  {selectedOrder.tax > 0 && <div className="flex justify-between"><span>GST (5%):</span><span>₹{selectedOrder.tax.toFixed(2)}</span></div>}
                  <div className="flex justify-between font-bold text-sm border-t border-slate-900 pt-1 mt-1 uppercase"><span>Total:</span><span>₹{selectedOrder.grandTotal.toFixed(2)}</span></div>
               </div>
               <p className="text-center italic opacity-60 text-[8px] tracking-widest mt-10 uppercase">Thank you! Visit again</p>
            </div>
         )}
      </div>

      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-5">
          <button onClick={toggleSidebar} className="p-2.5 bg-[#ff7a00] text-white rounded-xl shadow-lg shadow-[#ff7a00]/20 hover:bg-slate-800 transition-all">
             <Menu size={18} />
          </button>
          <div className="space-y-0.5">
             <h1 className="text-xl font-black text-slate-900 tracking-tight">Settled Invoices</h1>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Review & Print Past Transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center gap-2 shadow-sm">
              <BadgeCheck size={14} className="fill-blue-600 stroke-none" />
              <span className="text-[10px] font-black uppercase tracking-widest">Completed: {orders.length}</span>
           </div>
           <button onClick={fetchCompletedOrders} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
              <RefreshCw size={18} />
           </button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto no-scrollbar print:hidden">
         <div className="max-w-6xl mx-auto space-y-8">
            <div className="relative group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff7a00] transition-colors" size={18} />
               <input 
                 type="text" 
                 placeholder="Search by table or bill number..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-14 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ff7a00]/10 focus:border-[#ff7a00] transition-all shadow-sm"
               />
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Bill Details</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Payment</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {loading ? (
                        <tr>
                           <td colSpan="5" className="px-8 py-20 text-center">
                              <div className="w-10 h-10 border-4 border-[#ff7a00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                              <span className="text-[10px] font-black uppercase text-slate-400">Loading history...</span>
                           </td>
                        </tr>
                     ) : filteredOrders.length === 0 ? (
                        <tr>
                           <td colSpan="5" className="px-8 py-20 text-center opacity-30">
                              <Receipt size={48} className="mx-auto mb-4 text-slate-300" />
                              <p className="text-[10px] font-black uppercase text-slate-400">No settled bills found</p>
                           </td>
                        </tr>
                     ) : (
                        filteredOrders.map(order => (
                          <tr key={order._id} className="group hover:bg-slate-50/80 transition-all">
                             <td className="px-8 py-6">
                                <span className="text-sm font-black text-slate-900">#{order.orderNumber.split('-').pop()}</span>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#ff7a00] group-hover:text-white group-hover:border-[#ff7a00] transition-all">
                                      <TableIcon size={18} />
                                   </div>
                                   <span className="text-sm font-black text-slate-700 uppercase">{order.tableName}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-center">
                                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border ${
                                   order.payments?.[0]?.method === 'UPI' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                   order.payments?.[0]?.method === 'Cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                   'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                   {order.payments?.[0]?.method || 'Paid'}
                                </span>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <span className="text-xl font-black text-slate-950 italic">₹{order.grandTotal.toFixed(2)}</span>
                             </td>
                             <td className="px-8 py-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setTimeout(handlePrint, 100); }}
                                     className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-900 rounded-xl hover:bg-slate-950 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                                   >
                                      <Printer size={14} /> Print
                                   </button>
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); generatePDF(order); }}
                                     className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                                   >
                                      <Download size={14} /> PDF
                                   </button>
                                </div>
                             </td>
                          </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </main>

      {/* View Details Modal */}
      <AnimatePresence>
         {selectedOrder && !window.matchMedia('print').matches && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 print:hidden">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedOrder(null)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                >
                   <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-[#ff7a00] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#ff7a00]/20">
                            <FileText size={24} />
                         </div>
                         <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase">Invoice Details</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">#{selectedOrder.orderNumber}</p>
                         </div>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center">
                         <X size={20} />
                      </button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-8">
                      <div className="text-center py-6 border-b-2 border-dashed border-slate-100">
                         <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">₹{selectedOrder.grandTotal.toFixed(2)}</h3>
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                            <BadgeCheck size={14} /> Payment Settled via {selectedOrder.payments?.[0]?.method || 'Cash'}
                         </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="mb-1 opacity-50">Table</p>
                            <span className="text-slate-900 font-black">{selectedOrder.tableName}</span>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="mb-1 opacity-50">Date & Time</p>
                            <span className="text-slate-900 font-black">{new Date(selectedOrder.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest pl-1">Ordered Items</p>
                         <div className="space-y-2">
                            {selectedOrder.items.map((item, idx) => (
                               <div key={idx} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                  <div>
                                     <p className="text-[11px] font-black text-slate-900 uppercase">{item.name}</p>
                                     <p className="text-[9px] font-bold text-slate-400">{item.quantity} x ₹{item.price}</p>
                                  </div>
                                  <span className="text-sm font-black text-[#ff7a00]">₹{item.price * item.quantity}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
                      <button onClick={handlePrint} className="h-14 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all flex items-center justify-center gap-2">
                         <Printer size={18} /> Print
                      </button>
                      <button onClick={() => generatePDF(selectedOrder)} className="h-14 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2">
                         <Download size={18} /> PDF
                      </button>
                   </div>
                </motion.div>
            </div>
         )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 10px;
          }
        }
      `}} />
    </div>
  );
}
