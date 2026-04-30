import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Info, Clock, Printer, Car, Search, X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PosTopNavbar from '../../components/PosTopNavbar';
import { usePos } from '../../context/PosContext';
import { printKOTReceipt } from '../../utils/printKOT';

// ── Business logic status colors ───────────────────────────────────────────
const S = {
  // Grey → Available / Settled
  blank:    { bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280' },
  available:{ bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280' },
  paid:     { bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280' },
  settled:  { bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280' },

  // Blue → Order Started (Pending KOT)
  pending:  { bg: '#3B82F6', border: '#2563EB', text: '#FFFFFF' },
  occupied: { bg: '#3B82F6', border: '#2563EB', text: '#FFFFFF' },

  // Yellow → KOT Sent (Running) - Vibrant Amber/Orange with White text
  running:     { bg: '#F59E0B', border: '#D97706', text: '#FFFFFF' },
  'running-kot': { bg: '#F59E0B', border: '#D97706', text: '#FFFFFF' },
  preparing:   { bg: '#F59E0B', border: '#D97706', text: '#FFFFFF' },
  ready:       { bg: '#10B981', border: '#059669', text: '#FFFFFF' },

  // Green → Bill Generated - Vibrant Lime Green with White text
  printed:  { bg: '#84CC16', border: '#65A30D', text: '#FFFFFF' },
  billed:   { bg: '#84CC16', border: '#65A30D', text: '#FFFFFF' },
  ready:    { bg: '#84CC16', border: '#65A30D', text: '#FFFFFF' },

  // Blue-Light → Reserved (Legacy/Optional)
  reserved: { bg: '#60A5FA', border: '#2563EB', text: '#FFFFFF' },
};

const getS = (order, table) => {
  if (table && (table.status === 'Reserved' || table.isReserved)) return S.reserved;
  if (!order) return S.available;
  const st = (order.status || '').toLowerCase();

  // 1. Settled (Grey)
  if (st === 'completed') return S.paid;

  // 2. Printed/Ready (Green)
  if (order.isBilled || st === 'billed' || st === 'printed' || st === 'ready') return S.ready;

  // 3. KOT Sent / Running (Yellow)
  if (st === 'preparing') return S.running;

  // 4. Order Started / Pending (Blue)
  if (st === 'pending') return S.pending;

  return S.available;
};

const elapsed = (t) => {
  if (!t) return '';
  const m = Math.floor((Date.now() - new Date(t)) / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60}m`;
};

// ── Mock sections (used when backend doesn't provide structured table data) ──
const MOCK = {
  'AC': ['AC1','AC2','AC3','AC4','AC5','AC6','AC8','AC2','AC6','AC17','AC18','AC17','AC3','AC3','AC3','AC29','PAI9'],
  'GARDEN': ['AN6','AC2','AC2','A23','AC3','AC2','PAIN8','AC6','AC6','AC17','AC18','G27','G29','G229','G29'],
  'NON-AC': ['NA11','NC2','NC3','NC3','NAC3','NAC3','NAC7','NAC3','NAC3','NA17','NAC3','G226','G226'],
};

export default function TableView() {
  const navigate = useNavigate();
  const { orders, tables, carOrders, addCarOrder, clearCarOrder, fetchActiveTableOrders: sync, setIsQuickOrderModalOpen } = usePos();
  const [carSearch, setCarSearch] = useState('');
  const [showAddCar, setShowAddCar] = useState(false);
  const [newCarNum, setNewCarNum] = useState('');

  // Build section data from backend or fallback to mock
  const buildSections = () => {
    if (tables && tables.length > 0) {
      const bySection = {};
      tables.forEach(t => {
        const sec = (t.section || t.area || 'General').toUpperCase();
        if (!bySection[sec]) bySection[sec] = [];
        bySection[sec].push(t);
      });
      return bySection;
    }
    return MOCK;
  };

  const sections = buildSections();

  return (
    <div className="flex flex-col" style={{ height: '100%', background: '#fff' }}>
      <PosTopNavbar />

      {/* ── Sub-Header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontWeight: 900, fontSize: 14, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          TABLE VIEW
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => sync()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <RefreshCw size={16} color="#6B7280" />
          </button>
         
        </div>
      </div>

      {/* ── Legend / Filter Bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '8px 20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
     
        
        <div className="flex bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
           <div className="px-6 py-2.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest cursor-default">
              Dine In
           </div>
           <button 
             onClick={() => navigate('/pos/order/Takeaway')}
             className="px-6 py-2.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
           >
              Takeaway
           </button>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Legend dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LegendDot color="#F3F4F6" border="#D1D5DB" label="AVAILABLE" />
          <LegendDot color="#3B82F6" label="RESERVED" />
          <LegendDot color="#FEF9C3" border="#EAB308" label="RUNNING" />
          <LegendDot color="#DCFCE7" border="#22C55E" label="BILLED" />
        </div>
      </div>

      {/* ── Main Scrollable Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff', padding: '16px 20px 24px' }}>
        {Object.entries(sections).map(([sectionName, tableArr]) => (
          <div key={sectionName} style={{ marginBottom: 24 }}>
            {/* Section label */}
            <p style={{ fontWeight: 700, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, marginTop: 0 }}>
              {sectionName}
            </p>
            {/* Table grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 85px)', gap: 8 }}>
              {tableArr.map((tableId, idx) => {
                const id = typeof tableId === 'string' ? tableId : (tableId.tableName || tableId.name || tableId.id);
                const tableObj = typeof tableId === 'object' ? tableId : null;
                const order = orders[id];
                const cfg = getS(order, tableObj);
                const total = order?.total || order?.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;

                return (
                  <motion.div
                    key={`${id}-${idx}`}
                    whileHover={{ scale: 1.05, zIndex: 5 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(`/pos/order/${id}`)}
                    style={{
                      height: 62,
                      background: cfg.bg,
                      border: `1.5px solid ${cfg.border}`,
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      userSelect: 'none',
                    }}
                  >
                    {order ? (
                      <>
                        <span style={{ fontSize: 7, fontWeight: 700, color: cfg.text, opacity: 0.8, position: 'absolute', top: 4 }}>
                          <Clock size={6} style={{ display: 'inline', marginRight: 1 }} />{elapsed(order.sessionStartTime || order.startTime)}
                        </span>
                        <span style={{ fontWeight: 900, fontSize: 12, color: cfg.text, letterSpacing: '-0.02em' }}>{id}</span>
                        <span style={{ fontWeight: 700, fontSize: 10, color: cfg.text, marginTop: 1 }}>₹{total}</span>
                      </>
                    ) : (
                      <span style={{ fontWeight: 800, fontSize: 12, color: cfg.text, letterSpacing: '-0.01em' }}>{id}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Car Service */}
        {Object.keys(carOrders).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Car size={12} /> Car Service
              </p>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 85px)', gap: 8 }}>
              {Object.values(carOrders)
                .filter(c => !carSearch || c.carNumber.toLowerCase().includes(carSearch.toLowerCase()))
                .map(car => (
                  <motion.div
                    key={car.carNumber}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    style={{ height: 62, background: S.running.bg, border: `1.5px solid ${S.running.border}`, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>🚗 {car.carNumber.slice(-4)}</span>
                    <button onClick={(e) => { e.stopPropagation(); clearCarOrder(car.carNumber); }}
                      style={{ position: 'absolute', top: 3, right: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <X size={10} color="rgba(255,255,255,0.7)" />
                    </button>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>


      {/* Add Car Modal */}
      <AnimatePresence>
        {showAddCar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowAddCar(false)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 12, padding: 24, width: 280, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: '#111' }}>New Car Order</h3>
                <button onClick={() => setShowAddCar(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} color="#9CA3AF" /></button>
              </div>
              <input
                type="text" autoFocus
                placeholder="Car Number e.g. MP09 AB 1234"
                value={newCarNum}
                onChange={e => setNewCarNum(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter' && newCarNum.trim()) { addCarOrder(newCarNum); setNewCarNum(''); setShowAddCar(false); } }}
                style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', outline: 'none', marginBottom: 14, boxSizing: 'border-box', background: '#F9FAFB' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowAddCar(false)}
                  style={{ flex: 1, padding: '10px 0', border: '1.5px solid #E5E7EB', borderRadius: 8, fontWeight: 800, fontSize: 11, textTransform: 'uppercase', background: '#fff', cursor: 'pointer', color: '#6B7280' }}>
                  Cancel
                </button>
                <button
                  onClick={() => { if (!newCarNum.trim()) return; addCarOrder(newCarNum); setNewCarNum(''); setShowAddCar(false); }}
                  style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 11, textTransform: 'uppercase', background: '#F57C00', color: '#fff', cursor: 'pointer' }}>
                  🚗 Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function LegendDot({ color, border, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, border: border ? `1px solid ${border}` : 'none' }} />
      <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.04em' }}>{label}</span>
    </div>
  );
}



