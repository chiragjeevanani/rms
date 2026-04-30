import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, RefreshCw, LayoutGrid, Clock, 
  Printer, ChevronRight, Filter, MoreVertical,
  Timer, AlertCircle, Utensils, Zap, Car, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../../context/PosContext';
import { TABLE_STATUS_COLORS } from '../../data/tableStatusColors';
import { printBillReceipt } from '../../utils/printBill';
import PosTopNavbar from '../../components/PosTopNavbar';

export default function TableList() {
  const navigate = useNavigate();
  const { tables, orders, loading, fetchActiveTableOrders, updateTableStatus, addTable, setIsQuickOrderModalOpen } = usePos();
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [newTableData, setNewTableData] = useState({
    tableName: '',
    tableCode: '',
    capacity: 4,
    area: 'AC Hall'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArea, setActiveArea] = useState('All');

  // Car Service derived from global orders
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);
  const [newCarNumber, setNewCarNumber] = useState('');

  const areas = useMemo(() => ['All', ...new Set(tables.map(t => t.area))], [tables]);

  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchesSearch = t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.area.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArea = activeArea === 'All' || t.area === activeArea;
      return matchesSearch && matchesArea;
    });
  }, [tables, searchQuery, activeArea]);

  const getTableStatus = (table) => {
    const order = orders[table.tableName];
    if (order) {
       const st = (order.status || '').toLowerCase();
       if (st === 'completed') return 'paid'; // Grey (Settled)
       if (order.isBilled || st === 'billed' || st === 'printed') return 'printed'; // Green (Billed)
       if (st === 'pending') return 'Occupied'; // Blue (Order Started)
       return 'running-kot'; // Yellow (KOT Sent/Running)
    }
    return table.status === 'Available' ? 'blank' : table.status; // Grey (Blank)
  };

  const calculateElapsedTime = (startTime) => {
    if (!startTime) return '0m';
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 60000);
    return `${diff}m`;
  };

  const activeCarOrders = useMemo(() => {
    return Object.values(orders).filter(o => o.orderType === 'Takeaway' || o.orderType === 'Delivery' || o.tableName.startsWith('CAR-') || (o.tableName && !tables.find(t => t.tableName === o.tableName)));
    // Actually, let's just look for orders where tableName is not in the tables list
  }, [orders, tables]);

  const handleAddCar = async () => {
    if (!newCarNumber.trim()) return;
    const carName = newCarNumber.toUpperCase().startsWith('CAR-') ? newCarNumber.toUpperCase() : `CAR-${newCarNumber.toUpperCase()}`;
    
    // Create an empty order for this car
    const success = await placeKOT(carName, [], { subTotal: 0, tax: 0, grandTotal: 0 }, { name: 'POS' });
    if (success) {
      setNewCarNumber('');
      setIsAddCarModalOpen(false);
      navigate(`/pos/order/${carName}`);
    }
  };

  const handleAddTableSubmit = async (e) => {
    e.preventDefault();
    const success = await addTable(newTableData);
    if (success) {
      setIsAddTableModalOpen(false);
      setNewTableData({ tableName: '', tableCode: '', capacity: 4, area: 'AC Hall' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F4F4F7] overflow-hidden font-sans select-none animate-in fade-in duration-300">
      <PosTopNavbar />
      {/* 1. Sub-Header Toolbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 shrink-0 flex items-center justify-between gap-6 z-20 shadow-sm">
        <div className="flex items-center gap-6">
           <button 
             onClick={() => navigate('/pos/tables')}
             className="p-2 text-gray-400 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
           >
              <LayoutGrid size={20} />
           </button>
           <h1 className="text-sm font-black uppercase tracking-widest text-gray-900 italic">Global Floor Management</h1>
           
           {/* Status Legend */}
           <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
              {Object.entries(TABLE_STATUS_COLORS).filter(([k]) => ['blank', 'running-kot', 'printed', 'paid'].includes(k)).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.dot || cfg.color }} />
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{key.replace('-', ' ')}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder="Search Tables/Zone..."
                className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-[var(--primary-color)] focus:bg-white outline-none w-48 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
            <button 
              onClick={() => {
                const nextId = tables.length + 1;
                setNewTableData(prev => ({ 
                  ...prev, 
                  tableName: `TABLE ${nextId}`, 
                  tableCode: `T-${nextId.toString().padStart(3, '0')}` 
                }));
                setIsAddTableModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
            >
               <Plus size={14} />
               Add Table
            </button>
            <button 
              onClick={() => setIsQuickOrderModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-[var(--primary-color)] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg"
            >
               <Plus size={14} />
               New Order
            </button>
           <button 
             onClick={fetchActiveTableOrders}
             className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
           >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </header>

      {/* 2. Area Filter Tabs */}
      <div className="bg-white px-6 py-2 border-b border-gray-200 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
        {areas.map(area => (
          <button 
            key={area}
            onClick={() => setActiveArea(area)}
            className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeArea === area 
                ? 'bg-[var(--primary-color)] text-white shadow-md shadow-[var(--primary-color)]/20' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {area}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4">
           <div className="flex items-center gap-3 border-r border-gray-200 pr-4">
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-200" /> <span className="text-[9px] font-black uppercase text-gray-400">Available</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> <span className="text-[9px] font-black uppercase text-gray-400">Reserved</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-300" /> <span className="text-[9px] font-black uppercase text-gray-400">Running</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-400" /> <span className="text-[9px] font-black uppercase text-gray-400">Billed</span></div>
           </div>
           <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
              <span>Total: {tables.length}</span>
              <span className="text-emerald-500">Free: {tables.filter(t => getTableStatus(t) === 'blank').length}</span>
           </div>
        </div>
      </div>

      {/* 3. Main Grid */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-8 bg-[#F8F9FB]">
        {/* Sections grouped by Area */}
        {areas.filter(a => a !== 'All' && (activeArea === 'All' || a === activeArea)).map(area => (
          <div key={area} className="space-y-4">
            <div className="flex items-center gap-3">
               <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{area} Zone</h2>
               <div className="h-px bg-gray-200 flex-1" />
            </div>

            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-16 gap-3">
              {filteredTables.filter(t => t.area === area).map(table => {
                const status = getTableStatus(table);
                const order = orders[table.tableName];
                const cfg = TABLE_STATUS_COLORS[status] || TABLE_STATUS_COLORS.blank;

                return (
                  <motion.div
                    key={table._id}
                    layoutId={table._id}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (status === 'Dirty') {
                        updateTableStatus(table._id, 'Available');
                        return;
                      }
                      if (status === 'Damaged') {
                         toast.error('Table is under repair');
                         return;
                      }
                      navigate(`/pos/order/${table.tableName}`);
                    }}
                    className="aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative cursor-pointer group shadow-sm transition-all"
                    style={{ 
                      backgroundColor: cfg.color, 
                      borderColor: cfg.borderColor,
                      borderStyle: cfg.borderStyle
                    }}
                  >
                    {/* Table Name */}
                    <span className="text-[14px] font-black text-slate-800" style={{ color: cfg.textColor }}>
                      {table.tableName}
                    </span>

                    {/* Dirty Overlay */}
                    {status === 'Dirty' && (
                      <div className="absolute inset-0 bg-rose-500/10 flex flex-col items-center justify-center rounded-xl">
                        <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded-full mb-1">Needs Cleaning</span>
                        <div className="p-1.5 bg-white text-rose-500 rounded-lg shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-all">
                           <RefreshCw size={12} strokeWidth={3} />
                        </div>
                      </div>
                    )}

                    {/* Meta info for occupied tables */}
                    {order && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-inherit rounded-xl">
                        <div className="absolute top-1 right-1 bg-white/60 px-1 rounded text-[8px] font-black text-slate-700">
                           {calculateElapsedTime(order.startTime || order.createdAt)}
                        </div>
                        <span className="text-[14px] font-bold text-slate-800" style={{ color: cfg.textColor }}>{table.tableName}</span>
                        <span className="text-[10px] font-black mt-0.5" style={{ color: cfg.textColor }}>₹{order.grandTotal || order.total || 0}</span>
                        
                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex flex-col p-1 gap-1 transition-opacity">
                           <button 
                             onClick={(e) => { 
                               e.stopPropagation(); 
                               const billingDetails = {
                                 subTotal: order.subTotal || order.total || 0,
                                 tax: order.tax || 0,
                                 discount: order.discount?.amount || 0,
                                 total: order.grandTotal || order.total || 0,
                                 orderType: order.orderType || 'Dine In',
                                 billerName: 'Staff'
                               };
                               printBillReceipt({ items: order.items || [], waiter: { name: order.waiterName || 'Staff' } }, { name: table.tableName }, billingDetails);
                             }} 
                             className="flex-1 bg-white/90 rounded text-[8px] font-black text-slate-700 hover:bg-white flex items-center justify-center gap-1"
                           >
                              <Printer size={10} /> PRINT
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); navigate(`/pos/order/${table.tableName}`); }}
                             className="flex-1 py-1.5 bg-[var(--primary-color)] text-white rounded text-[8px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-[var(--primary-color)]/10 transition-all flex items-center justify-center gap-1.5"
                           >
                              <Zap size={10} /> BILLING
                           </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 4. Car Service Section (UI Only) */}
        {(activeArea === 'All' || activeArea === 'Car Service') && (
          <div className="space-y-4 pb-10">
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                  <Car size={14} /> Car Service
               </div>
               <div className="h-px bg-gray-200 flex-1" />
               <button 
                onClick={() => setIsAddCarModalOpen(true)}
                className="p-1 px-3 bg-[var(--primary-color)] text-white text-[9px] font-black uppercase rounded shadow-lg shadow-[var(--primary-color)]/10 active:scale-95"
               >
                 + Add Car
               </button>
            </div>

            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-16 gap-3">
               {activeCarOrders.map(order => (
                 <motion.div
                   key={order._id}
                   whileHover={{ scale: 1.05 }}
                   onClick={() => navigate(`/pos/order/${order.tableName}`)}
                   className="aspect-square rounded-xl border-2 border-[var(--primary-color)]/20 bg-white flex flex-col items-center justify-center relative shadow-sm cursor-pointer group"
                 >
                    <div className="absolute top-1 right-1 bg-white/60 px-1 rounded text-[8px] font-black">
                       {calculateElapsedTime(order.createdAt)}
                    </div>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter text-center px-1">
                       {order.tableName}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--primary-color)] mt-1">₹{order.grandTotal}</span>

                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex flex-col p-1 gap-1 transition-opacity">
                        <button className="flex-1 bg-white/90 rounded text-[8px] font-black text-slate-700 hover:bg-white">VIEW</button>
                    </div>
                 </motion.div>
               ))}
               {activeCarOrders.length === 0 && (
                 <div className="col-span-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center opacity-30">
                    <Car size={24} className="text-gray-400 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">No active car orders</span>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <footer className="px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-gray-400 uppercase">System Sync: Live</span>
             </div>
          </div>
          <span className="text-[9px] font-black text-gray-300 uppercase italic">RMS Operational Cockpit v2.4</span>
      </footer>

      {/* Add Table Modal */}
      <AnimatePresence>
        {isAddTableModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddTableModalOpen(false)} className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 w-96 z-[101] border border-gray-100"
            >
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 mb-6 flex items-center gap-2 italic">
                  <LayoutGrid size={18} className="text-[var(--primary-color)]" /> Floor Plan Extension
               </h3>
               <form onSubmit={handleAddTableSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Table Name</label>
                       <input 
                         required
                         type="text" 
                         value={newTableData.tableName}
                         onChange={(e) => setNewTableData({...newTableData, tableName: e.target.value.toUpperCase()})}
                         placeholder="T-1"
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-black focus:border-[var(--primary-color)] focus:bg-white outline-none transition-all uppercase"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Table Code</label>
                       <input 
                         required
                         type="text" 
                         value={newTableData.tableCode}
                         onChange={(e) => setNewTableData({...newTableData, tableCode: e.target.value.toUpperCase()})}
                         placeholder="TB001"
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-black focus:border-[var(--primary-color)] focus:bg-white outline-none transition-all uppercase"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Capacity</label>
                       <input 
                         required
                         type="number" 
                         value={newTableData.capacity}
                         onChange={(e) => setNewTableData({...newTableData, capacity: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-black focus:border-[var(--primary-color)] focus:bg-white outline-none transition-all"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Area Zone</label>
                       <select 
                         value={newTableData.area}
                         onChange={(e) => setNewTableData({...newTableData, area: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-black focus:border-[var(--primary-color)] focus:bg-white outline-none transition-all"
                       >
                          <option value="AC Hall">AC Hall</option>
                          <option value="Outdoor">Outdoor</option>
                          <option value="Terrace">Terrace</option>
                          <option value="Lounge">Lounge</option>
                       </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                     <button type="button" onClick={() => setIsAddTableModalOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 bg-gray-50 rounded-xl transition-all">Cancel</button>
                     <button type="submit" className="flex-1 py-3 bg-[var(--primary-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[var(--primary-color)]/20 active:scale-95 transition-all">Add Table</button>
                  </div>
               </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Car Modal */}
      <AnimatePresence>
        {isAddCarModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddCarModalOpen(false)} className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-80 z-[101] border border-gray-100"
            >
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 mb-6 flex items-center gap-2">
                  <Car size={18} className="text-[var(--primary-color)]" /> Car Registry
               </h3>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Car Number Plate</label>
                     <input 
                       autoFocus
                       type="text" 
                       value={newCarNumber}
                       onChange={(e) => setNewCarNumber(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAddCar()}
                       placeholder="DL 4C AB 1234"
                       className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 text-sm font-black placeholder:text-gray-300 focus:border-[var(--primary-color)] focus:bg-white outline-none transition-all uppercase"
                     />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button onClick={() => setIsAddCarModalOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 bg-gray-50 rounded-xl transition-all">Cancel</button>
                     <button onClick={handleAddCar} className="flex-1 py-3 bg-[var(--primary-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[var(--primary-color)]/20 active:scale-95 transition-all">Create Session</button>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}




