import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Users, Clock, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function OccupiedTables() {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOccupiedTables();
    // Refresh every 30 seconds as a fallback, though socket handles real-time
    const interval = setInterval(fetchOccupiedTables, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOccupiedTables = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/table`);
      const data = await res.json();
      // Filter only occupied or reserved
      setTables(data.filter(t => t.status === 'Occupied' || t.status === 'Reserved'));
    } catch (err) {
      toast.error('Failed to sync floor data');
    } finally {
      setIsLoading(false);
    }
  };

  const clearTable = async (tableId, tableName) => {
    if (!window.confirm(`Are you sure you want to clear ${tableName} and make it available?`)) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/table/${tableId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ status: 'Available' })
      });

      if (res.ok) {
        toast.success(`${tableName} is now Available`);
        fetchOccupiedTables();
      }
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const filteredTables = tables.filter(t => 
    t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.tableCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA] overflow-hidden admin-layout">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
            <ShieldCheck size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">Live Floor Monitor</h1>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Real-time Node Status</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Quick search..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active</p>
            <p className="text-sm font-black text-amber-500">{tables.length}</p>
          </div>
          
          <button onClick={fetchOccupiedTables} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Bird's Eye View Grid */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar bg-slate-50/30">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-32 bg-white animate-pulse rounded-2xl border border-slate-100" />)}
          </div>
        ) : tables.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <AlertCircle size={48} className="text-slate-300 mb-4" />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Active Tables</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 content-start">
            <AnimatePresence mode="popLayout">
              {filteredTables.map((table) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={table._id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all group relative overflow-hidden ${
                    table.status === 'Reserved' 
                    ? 'bg-blue-50/80 border-blue-100 hover:border-blue-300' 
                    : 'bg-white border-slate-100 hover:border-amber-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter border ${
                      table.status === 'Reserved' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {table.status}
                    </div>
                    <span className="text-[7px] font-bold text-slate-400 uppercase truncate max-w-[40px]">{table.area}</span>
                  </div>

                  <div className="mb-3">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight truncate leading-tight">{table.tableName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Users size={10} className="text-slate-400" />
                      <span className="text-[8px] font-black text-slate-400">{table.capacity}P</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => clearTable(table._id, table.tableName)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <LogOut size={10} />
                    Clear
                  </button>

                  {/* Tiny background indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full opacity-10 ${table.status === 'Reserved' ? 'bg-blue-900' : 'bg-amber-900'}`} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
