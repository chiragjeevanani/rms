import React, { useState } from 'react';
import { 
  Table, Search, Filter, Plus, 
  MoreVertical, Edit2, Trash2, Users,
  Monitor, Layout, CheckCircle2, Clock, MapPin, RefreshCw, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../../context/PosContext';

export default function TableList() {
  const navigate = useNavigate();
  const { tables, loading, fetchActiveTableOrders, toggleSidebar } = usePos();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTables = tables.filter(t => 
    t.status === 'Available' && 
    (t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.area.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] animate-in fade-in duration-500 overflow-hidden font-sans select-none">
      <header className="px-10 py-8 bg-white border-b border-slate-200 shrink-0 shadow-sm relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
             <button 
               onClick={toggleSidebar}
               className="p-4 bg-slate-900 border border-slate-900 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
             >
                <Layout size={20} className="text-white" />
             </button>
             <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic leading-none">Available Tables</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   {filteredTables.length} Open Nodes Ready For Seating
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={fetchActiveTableOrders}
               className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 group"
             >
               <RefreshCw size={20} className={`text-slate-600 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
             </button>
          </div>
        </div>

        <div className="max-w-4xl relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH VACANT TABLES OR AREAS..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-16 pr-8 text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 p-10 overflow-y-auto no-scrollbar scroll-smooth">
        {filteredTables.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-40 opacity-40">
             <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-dashed border-slate-200">
                <Table size={40} className="text-slate-300" />
             </div>
             <p className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">No Available Tables</p>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">All tables are currently occupied or reserved</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Table Node</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Floor Area</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Guest Capacity</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Node Status</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Quick Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-sans">
                   {filteredTables.map(table => (
                      <tr key={table._id} className="transition-all">
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-5">
                               <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/5">
                                  <Table size={20} />
                               </div>
                               <span className="text-lg font-black text-slate-900 tracking-tighter italic uppercase">{table.tableName}</span>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg italic">{table.area}</span>
                         </td>
                         <td className="px-10 py-6 text-center">
                            <div className="inline-flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                               <Users size={12} />
                               {table.capacity} Seating
                            </div>
                         </td>
                         <td className="px-10 py-6 text-center">
                            <div className="inline-flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest px-4 py-1.5 bg-emerald-50/50 border border-emerald-100 rounded-full">
                               <Zap size={11} className="fill-emerald-600 stroke-none" />
                               Available
                            </div>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest opacity-20 cursor-not-allowed">
                               Monitor Only
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}
