import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Wifi, ArrowRightLeft, Info, Clock, Eye, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import PosTopNavbar from '../../components/PosTopNavbar';
import { TABLE_SECTIONS, TABLE_STATUS_COLORS } from '../../data/tablesMockData';
import { usePos } from '../../context/PosContext';
import { printKOTReceipt } from '../../utils/printKOT';

export default function TableView() {
  const navigate = useNavigate();
  const { orders } = usePos();

  const handleTableClick = (table) => {
    navigate(`/pos/order/${table.id}`);
  };

  const handlePrintKOT = (e, order, tableName) => {
    e.stopPropagation();
    printKOTReceipt(order, { name: tableName });
  };

  const getElapsedTime = (startTime) => {
    if (!startTime) return '0 Min';
    const diff = Math.floor((new Date() - new Date(startTime)) / 60000);
    return `${diff} Min`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <PosTopNavbar />

      {/* Sub-Header */}
      <div className="bg-white px-4 py-1.5 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-700 uppercase tracking-tight">Table View</h1>
        
        <div className="flex items-center gap-1.5">
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw size={18} className="text-gray-500" />
          </button>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <button className="bg-[#5D4037] text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#4E342E] transition-colors uppercase shadow-sm active:scale-95">
            Delivery
          </button>
          <button className="bg-[#5D4037] text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#4E342E] transition-colors uppercase shadow-sm active:scale-95">
            Pick Up
          </button>
          <button className="bg-[#5D4037] text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#4E342E] transition-colors flex items-center gap-1 uppercase shadow-sm active:scale-95">
            <Plus size={14} /> Add Table
          </button>
        </div>
      </div>

      {/* Filter / Legend Bar */}
      <div className="bg-white px-4 py-2 border-b border-gray-100 flex flex-wrap items-center gap-4">
        <button className="bg-stone-50 text-[#5D4037] border border-stone-100 px-2.5 py-1.2 rounded-md text-[10px] font-black hover:bg-stone-100 transition-colors flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
          <Plus size={12} strokeWidth={3} /> Contactless
        </button>

        <button className="border border-gray-200 text-gray-500 px-2.5 py-1.2 rounded-md text-[10px] font-bold hover:bg-gray-50 transition-colors flex items-center gap-1.5 uppercase tracking-wider">
          <Info size={12} className="text-[#5D4037]" /> 
          Reconnect Bridge
        </button>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5 bg-gray-50 py-1 px-3 rounded-full border border-gray-100">
             <div className="w-2.5 h-2.5 rounded-full bg-white border border-gray-200 shadow-sm" />
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Move KOT</span>
          </div>

          <div className="flex items-center gap-3 ml-2 border-l border-gray-100 pl-4">
            {[
              { label: 'BLANK', color: '#9e9e9e' },
              { label: 'RUNNING', color: '#2196f3' },
              { label: 'PRINTED', color: '#4caf50' },
              { label: 'PAID', color: '#ff9800' },
              { label: 'RUNNING KOT', color: '#fdd835' }, // Updated label for consistency
            ].map((config, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: config.color }} 
                />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Tables Grid */}
      <div className="flex-1 overflow-y-auto p-2 md:p-3 flex flex-col gap-4 bg-white">
        {TABLE_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-1.5">
            <h2 className="text-[#5D4037] font-black text-[9px] uppercase tracking-[0.2em] px-1 opacity-70">
              {section.label}
            </h2>
            
            <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 2xl:grid-cols-16 gap-1 md:gap-1.5">
              {section.tables.map((table) => {
                const order = orders[table.id];
                const statusConfig = TABLE_STATUS_COLORS[order?.status || table.status] || TABLE_STATUS_COLORS.blank;
                const isRunningKOT = !!order;
                
                // Calculate cumulative total for the table
                const tableTotal = isRunningKOT 
                   ? order.kots?.reduce((sum, kot) => sum + (kot.total || 0), 0) || 0
                   : 0;

                return (
                  <motion.div
                    key={table.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTableClick(table)}
                    className={`aspect-square rounded flex flex-col items-center justify-center relative transition-all duration-200 border shadow-none cursor-pointer overflow-hidden`}
                    style={{
                      borderStyle: statusConfig.borderStyle,
                      borderColor: statusConfig.borderColor,
                      borderWidth: '1px',
                      backgroundColor: statusConfig.color
                    }}
                  >
                    {isRunningKOT ? (
                      <>
                        <div className="absolute top-0 left-0 right-0 bg-[#FDD835] py-1 text-[10px] font-black text-gray-700 text-center">
                          {getElapsedTime(order.sessionStartTime)}
                        </div>
                        <div className="flex flex-col items-center mt-3">
                          <span className="font-black text-[12px] tracking-tight" style={{ color: statusConfig.textColor }}>
                            {table.name}
                          </span>
                          <span className="font-black text-[11px] mt-0.5 tracking-tight" style={{ color: statusConfig.textColor }}>
                             ₹ {tableTotal.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 opacity-90 relative z-10">
                           <button 
                             onClick={(e) => handlePrintKOT(e, order, table.name)}
                             className="p-1 bg-white border border-gray-300 rounded-md shadow-sm text-[#5D4037] hover:brightness-95 active:scale-95 transition-all outline-none"
                           >
                              <Printer size={12} strokeWidth={2.5} />
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); navigate(`/pos/order/${table.id}`); }}
                             className="p-1 bg-white border border-gray-300 rounded-md shadow-sm text-gray-500 hover:brightness-95 active:scale-95 transition-all outline-none"
                           >
                              <Eye size={12} strokeWidth={2.5} />
                           </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-black text-[10px] tracking-tighter" style={{ color: statusConfig.textColor }}>
                          {table.name}
                        </span>
                        {table.status !== 'blank' && (
                          <div 
                            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: statusConfig.dot }}
                          />
                        )}
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
