
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, Phone, 
  Search, Plus, Filter, CheckCircle2,
  XCircle, ArrowRight, User, Menu
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePos } from '../../context/PosContext';
import PosTopNavbar from '../../components/PosTopNavbar';

export default function Reservations() {
  const [activeView, setActiveView] = useState('upcoming');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    guests: 2,
    dateTime: '',
    tableId: '',
    notes: ''
  });

  const { 
    reservations, tables, orders,
    fetchReservations, createReservation, updateReservationStatus,
    toggleSidebar 
  } = usePos();

  useEffect(() => {
    fetchReservations();
  }, []);

  const filteredReservations = reservations.filter(res => 
    res.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.mobile.includes(searchQuery)
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    const table = tables.find(t => t._id === formData.tableId);
    const success = await createReservation({
      ...formData,
      tableName: table?.tableName
    });
    if (success) {
      setIsModalOpen(false);
      setFormData({ customerName: '', mobile: '', guests: 2, dateTime: '', tableId: '', notes: '' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] animate-in fade-in duration-500 font-sans select-none">
      <PosTopNavbar />
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
          
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">Restaurant Reservations</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00] animate-pulse" />
                 Guest Bookings & Table Assignments
              </p>
            </div>
          </div>
          <div className="flex bg-slate-50 p-1 border border-slate-100 rounded">
            <button 
              onClick={() => setActiveView('upcoming')}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${activeView === 'upcoming' ? 'bg-[#ff7a00] text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
            >
              List View
            </button>
            <button 
              onClick={() => setActiveView('calendar')}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${activeView === 'calendar' ? 'bg-[#ff7a00] text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Calendar View
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH RESERVATIONS BY NAME OR CONTACT ID..."
              className="w-full bg-slate-50 border border-slate-100 rounded py-2.5 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-[#ff7a00] focus:bg-white transition-all underline decoration-transparent"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-6 bg-[#F57C00] text-white rounded text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center gap-2 outline-none"
          >
            <Plus size={14} />
            Register Booking
          </button>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">ACTIVE BOOKINGS</span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReservations.map(res => {
                  const order = orders[res.tableName];
                  return (
                    <motion.div 
                      key={res._id}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-blue-300 transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#ff7a00] group-hover:text-white transition-all">
                            <User size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{res.customerName}</h4>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{res.mobile}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${
                          res.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          res.status === 'Seated' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {res.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 border-t border-slate-50 pt-4">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-slate-400">
                               <Clock size={10} />
                               <span className="text-[8px] font-black uppercase tracking-widest leading-none">Arrival</span>
                            </div>
                            <span className="text-[11px] font-black text-slate-900 leading-none">
                               {new Date(res.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                         <div className="flex flex-col gap-1 border-x border-slate-50 px-3">
                            <div className="flex items-center gap-1.5 text-slate-400">
                               <Users size={10} />
                               <span className="text-[8px] font-black uppercase tracking-widest leading-none">Guests</span>
                            </div>
                            <span className="text-[11px] font-black text-slate-900 leading-none">{res.guests} PAX</span>
                         </div>
                         <div className="flex flex-col gap-1 pl-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-slate-400">
                               <span className="text-[8px] font-black uppercase tracking-widest leading-none">Table</span>
                            </div>
                            <span className="text-[11px] font-black text-[#ff7a00] leading-none">{res.tableName || 'TBD'}</span>
                         </div>
                      </div>

                      {/* Order Details if Seated */}
                      {res.status === 'Seated' && order && (
                        <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black text-blue-600 uppercase">Running Order</span>
                              <span className="text-[10px] font-bold text-slate-900">₹{order.grandTotal}</span>
                           </div>
                           <div className="text-[8px] font-bold text-slate-500 italic">
                              Items: {order.items?.length || 0} | Started: {new Date(order.createdAt).toLocaleTimeString()}
                           </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                         {res.status === 'Confirmed' && (
                            <button 
                              onClick={() => updateReservationStatus(res._id, 'Seated')}
                              className="flex-1 py-1.5 bg-[#ff7a00] text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                               <CheckCircle2 size={10} /> Check-In (Seated)
                            </button>
                         )}
                         {res.status === 'Pending' && (
                            <button 
                              onClick={() => updateReservationStatus(res._id, 'Confirmed')}
                              className="flex-1 py-1.5 bg-emerald-500 text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                            >
                               Confirm
                            </button>
                         )}
                         <button 
                           onClick={() => updateReservationStatus(res._id, 'Cancelled')}
                           className="flex-1 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded text-[8px] font-black uppercase tracking-widest hover:text-rose-600 transition-all flex items-center justify-center gap-2"
                         >
                            <XCircle size={10} />
                            No Show
                         </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
          </div>
        </div>
      </div>

      {/* Register Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
           <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-sm font-black uppercase tracking-widest">New Reservation</h2>
                 <button onClick={() => setIsModalOpen(false)}><XCircle size={20} className="text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Customer Name</label>
                    <input required type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-[#ff7a00]" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase">Mobile</label>
                       <input required type="text" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs font-bold outline-none" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase">Guests</label>
                       <input required type="number" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs font-bold outline-none" />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Date & Time</label>
                    <input required type="datetime-local" value={formData.dateTime} onChange={e => setFormData({...formData, dateTime: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs font-bold outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Assign Table</label>
                    <select required value={formData.tableId} onChange={e => setFormData({...formData, tableId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs font-bold outline-none">
                       <option value="">Select Table</option>
                       {tables.filter(t => t.status === 'Available').map(t => (
                         <option key={t._id} value={t._id}>{t.tableName} ({t.area})</option>
                       ))}
                    </select>
                 </div>
                 <button type="submit" className="w-full py-4 bg-[#ff7a00] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#ff7a00]/20 mt-4">Confirm Booking</button>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
}



