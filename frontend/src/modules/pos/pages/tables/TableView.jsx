import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Wifi, Clock, Printer, Trash2, CalendarCheck, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PosTopNavbar from '../../components/PosTopNavbar';
import { usePos } from '../../context/PosContext';
import { printKOTReceipt } from '../../utils/printKOT';

export default function TableView() {
  const navigate = useNavigate();
  const { orders, tables, fetchActiveTableOrders, loading, clearTable, toggleSidebar } = usePos();

  const handleTableClick = (tableName) => {
    navigate(`/pos/order/${tableName}`);
  };

  const handlePrintKOT = (e, order) => {
    e.stopPropagation();
    printKOTReceipt(order, { name: order.tableName });
  };

  const handleClearTable = (e, tableName) => {
    e.stopPropagation();
    if (window.confirm(`Settle ${tableName} and clear session?`)) {
      // clearTable(tableName); // Ensure this is implemented in context or call settlement
    }
  };

  const getElapsedTime = (startTime) => {
    if (!startTime) return '0 Min';
    const diff = Math.floor((new Date() - new Date(startTime)) / 60000);
    return `${diff} Min`;
  };

  // Group real tables by area, but filter out Reserved ones for main display
  const mainTables = tables.filter(t => t.status !== 'Reserved');
  const reservedTables = tables.filter(t => t.status === 'Reserved');

  const areas = [...new Set(mainTables.map(t => t.area))];

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans text-slate-800">
      <PosTopNavbar />

      {/* Modern Sub-Header */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-6">
           <button 
             onClick={toggleSidebar}
             className="p-4 bg-slate-900 border border-slate-900 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
           >
              <Plus size={20} className="text-white rotate-45" />
           </button>
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20 rotate-3">
                 <MapPin size={24} />
              </div>
              <div>
                 <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Table Management</h1>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Global Table Layout Sync
                 </p>
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchActiveTableOrders}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 group"
            title="Refresh All"
          >
            <RefreshCw size={20} className={`text-slate-600 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
          </button>
          <div className="h-10 w-px bg-slate-200 mx-2" />
          <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[11px] font-black hover:opacity-90 transition-all uppercase shadow-xl shadow-slate-900/10 active:scale-95">
             Direct Delivery
          </button>
          <button className="bg-[#5D4037] text-white px-8 py-4 rounded-2xl text-[11px] font-black hover:opacity-90 transition-all flex items-center gap-2 uppercase shadow-xl shadow-stone-900/20 active:scale-95">
            <Plus size={18} /> New Table
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-16 no-scrollbar">
        {/* Main Area Groupings */}
        {areas.map((area) => (
          <div key={area}>
            <div className="flex items-center gap-5 mb-8">
               <h2 className="text-slate-400 font-black text-[11px] uppercase tracking-[0.4em] whitespace-nowrap">
                 {area} Section
               </h2>
               <div className="h-[1px] bg-slate-200 flex-1" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8">
              {mainTables.filter(t => t.area === area).map((table) => {
                const order = orders[table.tableName];
                const isOccupied = table.status === 'Occupied' || !!order;
                
                return (
                  <motion.div
                    key={table._id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTableClick(table.tableName)}
                    className={`aspect-square rounded-[2.5rem] flex flex-col items-center justify-center relative transition-all duration-300 border-2 cursor-pointer p-8 shadow-sm group ${
                      isOccupied 
                        ? 'bg-white border-slate-900 shadow-[0_15px_40px_rgba(0,0,0,0.06)]' 
                        : 'bg-white border-transparent hover:border-slate-300 hover:shadow-lg'
                    }`}
                  >
                    {isOccupied ? (
                      <>
                        <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-amber-400 animate-pulse border-4 border-white shadow-lg" />
                        
                        <div className="flex flex-col items-center text-center">
                          <span className="text-3xl font-black text-slate-900 tracking-tighter mb-1">
                            {table.tableName}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full mb-6">
                            {order?.orderNumber?.split('-').pop() || 'ACTIVE'}
                          </span>
                          <span className="font-black text-2xl text-slate-900 tracking-tighter">
                             ₹{order?.grandTotal?.toFixed(0) || 0}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                           <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-lg shadow-slate-900/10">
                              <Clock size={12} className="text-amber-400" />
                              <span className="text-[9px] font-black uppercase tracking-tight">{getElapsedTime(order?.createdAt)}</span>
                           </div>
                        </div>

                        {/* Hover Quick Actions */}
                        <div className="absolute inset-x-0 bottom-6 px-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex justify-center gap-3">
                           <button onClick={(e) => handlePrintKOT(e, order)} className="flex-1 py-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center" title="Print KOT"><Printer size={14} /></button>
                           <button onClick={(e) => handleClearTable(e, table.tableName)} className="flex-1 py-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center" title="Clear/Settle"><Trash2 size={14} /></button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                           <Plus size={24} />
                        </div>
                        <span className="font-black text-lg text-slate-900 tracking-tighter uppercase mb-1">
                          {table.tableName}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Available</span>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Dedicated Reserved Tables Section - At Bottom */}
        {reservedTables.length > 0 && (
          <div className="pt-16 border-t-4 border-dashed border-slate-200">
             <div className="flex items-center gap-5 mb-10">
                <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-xl shadow-amber-500/20">
                   <CalendarCheck size={28} />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Reserved Tables</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{reservedTables.length} Active Reservations Pending</p>
                </div>
                <div className="h-[1px] bg-slate-200 flex-1" />
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8">
                {reservedTables.map((table) => (
                  <motion.div
                    key={table._id}
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#FFF9EA] border-2 border-amber-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative shadow-xl shadow-amber-200/10 cursor-not-allowed group overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 bg-amber-500 text-white rounded-bl-3xl">
                       <CalendarCheck size={18} strokeWidth={2.5} />
                    </div>
                    
                    <span className="text-4xl font-black text-amber-900 tracking-tighter mb-2">
                       {table.tableName}
                    </span>
                    <span className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em] mb-4">Reserved</span>
                    
                    <div className="w-full h-1 bg-amber-200 rounded-full mb-6 opacity-40" />
                    
                    <div className="space-y-1 text-center">
                       <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest italic">{table.capacity} Capacity</p>
                       <p className="text-[8px] font-bold text-amber-600/80 uppercase tracking-widest">{table.area}</p>
                    </div>

                    <button className="absolute inset-0 bg-amber-600/0 hover:bg-amber-600/5 transition-all flex items-center justify-center">
                       <span className="opacity-0 group-hover:opacity-100 bg-white text-amber-600 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg transition-opacity border border-amber-100">Details</span>
                    </button>
                  </motion.div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <footer className="bg-white border-t border-slate-200 px-10 py-6 flex items-center justify-between">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-200 shadow-sm" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-slate-900 shadow-lg shadow-slate-900/20" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Occupied</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[7px] text-white">R</div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reserved</span>
            </div>
         </div>
         <div className="flex items-center gap-4 bg-[#F8FAF9] px-6 py-3 rounded-2xl border border-slate-100">
            <Wifi size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Terminal Synced v4.2.1</span>
         </div>
      </footer>
    </div>
  );
}
