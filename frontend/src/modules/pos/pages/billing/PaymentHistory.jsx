import React, { useState, useEffect } from 'react';
import { 
  Search, CreditCard, Banknote, Smartphone,
  ExternalLink, Calendar, Calculator,
  RefreshCw, FileSpreadsheet, Eye, Menu, Zap, Table as TableIcon,
  FileText, Printer, ArrowDown, BadgeCheck, X,
  ArrowRight, Download, Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { usePos } from '../../context/PosContext';

export default function PaymentHistory() {
  const { toggleSidebar } = usePos();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/completed`);
      const result = await response.json();
      if (result.success) {
        setPayments(result.data);
      }
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePrintPDF = () => {
    window.print();
  };

  const printSingleReceipt = (p) => {
    setSelectedReceipt(p);
    setTimeout(() => {
       window.print();
       setSelectedReceipt(null);
    }, 100);
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = filterMethod === 'All' || p.payments?.[0]?.method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const totalRevenue = filteredPayments.reduce((acc, p) => acc + p.grandTotal, 0);
  const upiFlow = filteredPayments.filter(p => p.payments?.[0]?.method === 'UPI').reduce((acc, p) => acc + p.grandTotal, 0);
  const cashFlow = filteredPayments.filter(p => p.payments?.[0]?.method === 'Cash').reduce((acc, p) => acc + p.grandTotal, 0);

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB] animate-in fade-in duration-700 overflow-hidden font-sans select-none relative">
      
      {/* Print Overlay for Audit Report OR Professional Bill */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 text-slate-900" id="printable-area">
         {selectedReceipt ? (
            <div className="max-w-[80mm] mx-auto p-4 border border-slate-200">
               {/* Proper Bill Header */}
               <div className="text-center mb-6">
                  <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">PREMIUM RMS</h1>
                  <p className="text-[10px] font-bold mt-2 opacity-70">123 Culinary Boulevard, Food Capital</p>
                  <p className="text-[10px] font-bold opacity-70">Contact: +91 98765 43210</p>
                  <div className="border-b-2 border-slate-900 my-4"></div>
                  <h2 className="text-[12px] font-black uppercase tracking-[0.4em]">TAX INVOICE</h2>
               </div>

               {/* Bill Info */}
               <div className="space-y-1 mb-6 text-[11px] font-bold uppercase">
                  <div className="flex justify-between"><span>Bill No:</span><span>#{selectedReceipt.orderNumber.split('-').pop()}</span></div>
                  <div className="flex justify-between"><span>Date:</span><span>{new Date(selectedReceipt.createdAt).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span>Time:</span><span>{new Date(selectedReceipt.createdAt).toLocaleTimeString()}</span></div>
                  <div className="flex justify-between"><span>Table:</span><span>{selectedReceipt.tableName}</span></div>
                  <div className="flex justify-between"><span>Guest:</span><span>{selectedReceipt.customer?.name || 'Walk-in'}</span></div>
               </div>

               {/* Items Table */}
               <div className="border-t border-b border-slate-900 py-4 mb-4">
                  <div className="flex font-black text-[10px] mb-2 border-b border-slate-100 pb-2">
                     <span className="flex-1 uppercase">Item</span>
                     <span className="w-10 text-center uppercase">Qty</span>
                     <span className="w-20 text-right uppercase">Amount</span>
                  </div>
                  <div className="space-y-2">
                     {selectedReceipt.items.map((item, i) => (
                       <div key={i} className="flex text-[11px] font-bold">
                          <span className="flex-1 uppercase">{item.name}</span>
                          <span className="w-10 text-center">{item.quantity}</span>
                          <span className="w-20 text-right">₹{item.price * item.quantity}</span>
                       </div>
                     ))}
                  </div>
               </div>

               {/* Totals */}
               <div className="space-y-1 text-right mb-10 text-[11px] font-bold uppercase">
                  <div className="flex justify-between"><span>Subtotal:</span><span>₹{selectedReceipt.subTotal}</span></div>
                  <div className="flex justify-between"><span>Tax (5%):</span><span>₹{selectedReceipt.tax}</span></div>
                  <div className="flex justify-between font-black text-xl border-t border-slate-900 mt-2 pt-2">
                     <span>Grand Total:</span>
                     <span>₹{selectedReceipt.grandTotal}</span>
                  </div>
                  <p className="text-[9px] lowercase italic mt-1">(Inclusive of all taxes)</p>
               </div>

               {/* Footer */}
               <div className="text-center pt-6 border-t border-dotted border-slate-300">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 italic">Thank you for visiting!</p>
                  <p className="text-[8px] font-bold opacity-40 uppercase tracking-[0.2em]">Please visit us again soon.</p>
               </div>
            </div>
         ) : (
            <div className="p-10">
               <div className="text-center mb-10 border-b-2 border-slate-900 pb-8">
                  <h1 className="text-2xl font-bold uppercase tracking-widest italic">Financial Audit Report</h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{new Date().toLocaleDateString()} • Premium RMS Archive</p>
               </div>
               <div className="grid grid-cols-3 gap-6 mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</p><p className="text-xl font-bold">₹{totalRevenue}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UPI</p><p className="text-xl font-bold">₹{upiFlow}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cash</p><p className="text-xl font-bold">₹{cashFlow}</p></div>
               </div>
               <table className="w-full text-left text-[10px] font-bold">
                  <thead><tr className="border-b-2 border-slate-900 uppercase"><th>ID</th><th>TABLE</th><th>GUEST</th><th>METHOD</th><th className="text-right">TOTAL</th></tr></thead>
                  <tbody>
                     {filteredPayments.map(p => (
                        <tr key={p._id} className="border-b border-slate-100"><td className="py-2">#{p.orderNumber.split('-').pop()}</td><td>{p.tableName}</td><td>{p.customer?.name || '-'}</td><td>{p.payments[0]?.method}</td><td className="text-right font-black">₹{p.grandTotal}</td></tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      <header className="px-8 py-5 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-5">
          <button onClick={toggleSidebar} className="p-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all active:scale-95">
             <Menu size={18} />
          </button>
          <div className="space-y-0.5">
             <h1 className="text-xl font-bold text-slate-900 italic leading-none">Financial Archive</h1>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vault Record Synchronization</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={handlePrintPDF}
             className="h-11 px-6 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
           >
              <Printer size={16} />
              Save Audit Report
           </button>
           <button onClick={fetchHistory} className="p-2.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all active:rotate-180 duration-700">
              <RefreshCw size={18} />
           </button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto no-scrollbar scroll-smooth">
         <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { label: 'UPI FLOW', value: `₹${upiFlow}`, color: 'text-blue-600', bg: 'bg-blue-50', icon: Smartphone },
                 { label: 'CASH HOLD', value: `₹${cashFlow}`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Banknote },
                 { label: 'TOTAL SETTLED', value: `₹${totalRevenue}`, color: 'text-slate-950', bg: 'bg-slate-100', icon: Calculator },
               ].map((stat, idx) => (
                 <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                       <h3 className={`text-xl font-bold tracking-tight italic ${stat.color}`}>{stat.value}</h3>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                        <stat.icon size={20} />
                    </div>
                 </div>
               ))}
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
               <div className="relative flex-1 w-full max-w-sm group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search order, table or guest..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-12 pr-6 text-sm font-semibold outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                  />
               </div>
               <div className="flex gap-2 p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                  {['All', 'Cash', 'UPI', 'Card'].map(m => (
                     <button 
                       key={m}
                       onClick={() => setFilterMethod(m)}
                       className={`px-5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                         filterMethod === m ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                       }`}
                     >
                        {m}
                     </button>
                  ))}
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guest</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Settlement</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Value</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {loading ? (
                        <tr>
                           <td colSpan="6" className="px-8 py-40 text-center text-slate-300">
                              <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Synchronizing Vault...</span>
                           </td>
                        </tr>
                     ) : filteredPayments.length === 0 ? (
                        <tr>
                           <td colSpan="6" className="px-8 py-40 text-center text-slate-300 italic opacity-50">
                              <FileText size={48} strokeWidth={1} className="mx-auto mb-6" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">No verified transaction logs found</p>
                           </td>
                        </tr>
                     ) : (
                        filteredPayments.map(p => (
                          <tr key={p._id} className="hover:bg-slate-50/70 transition-all cursor-default">
                             <td className="px-8 py-5">
                                <span className="text-[12px] font-bold text-slate-900 uppercase">#{p.orderNumber.split('-').pop()}</span>
                                <p className="text-[8px] font-bold text-slate-400 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                             </td>
                             <td className="px-8 py-5">
                                <span className="text-[12px] font-bold text-slate-700 uppercase italic tracking-tighter">{p.tableName}</span>
                             </td>
                             <td className="px-8 py-5">
                                <span className="text-[11px] font-bold text-slate-900 uppercase block">{p.customer?.name || 'Walk-in'}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{p.customer?.mobile || 'No contact'}</span>
                             </td>
                             <td className="px-8 py-5 text-center">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-bold ${
                                   p.payments?.[0]?.method === 'UPI' ? 'bg-blue-50/50 border-blue-100 text-blue-600' : 
                                   p.payments?.[0]?.method === 'Cash' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600' : 
                                   'bg-amber-50/50 border-amber-100 text-amber-600'
                                }`}>
                                   {p.payments?.[0]?.method === 'UPI' ? <Smartphone size={12} /> : 
                                    p.payments?.[0]?.method === 'Cash' ? <Banknote size={12} /> : 
                                    <CreditCard size={12} />}
                                   <span className="uppercase tracking-widest">{p.payments?.[0]?.method || 'Cash'}</span>
                                </div>
                             </td>
                             <td className="px-8 py-5 text-right font-bold text-slate-950 text-base italic tracking-tighter">
                                ₹{p.grandTotal}
                             </td>
                             <td className="px-8 py-5 text-right">
                                <button 
                                  onClick={() => printSingleReceipt(p)}
                                  className="p-2.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
                                  title="Download Original Receipt"
                                >
                                   <Receipt size={16} />
                                </button>
                             </td>
                          </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </main>
    </div>
  );
}
