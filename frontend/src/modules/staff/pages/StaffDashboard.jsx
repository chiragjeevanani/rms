import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  Map, 
  Clock, 
  Zap, 
  Users, 
  ChefHat, 
  Bell, 
  TrendingUp,
  PlusCircle,
  Coffee,
  ChevronRight
} from 'lucide-react';
import { StaffNavbar } from '../components/StaffNavbar';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../../pos/context/PosContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { tables, orders, loading } = usePos();
  const [attendanceStatus, setAttendanceStatus] = useState('Checking...');
  const [staff, setStaff] = useState(null);
  const [shiftStats, setShiftStats] = useState({ handled: 0, volume: 0 });
  const [snapshot, setSnapshot] = useState({ 
    availableTables: 0, 
    occupiedTables: 0, 
    reservedTables: 0, 
    pendingOrders: 0, 
    readyPickups: 0, 
    activeOrders: 0, 
    completedOrders: 0 
  });
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    const savedStaff = localStorage.getItem('staff_info');
    if (savedStaff && savedStaff !== "undefined") {
      try {
        const staffData = JSON.parse(savedStaff);
        setStaff(staffData);
        fetchAttendance(staffData._id || staffData.id);
        fetchShiftStats(staffData.name);
        fetchSnapshot();
      } catch (e) {
        console.error("Staff parsing error", e);
      }
    }
    
    // Auto-refresh snapshot every 30s
    const timer = setInterval(fetchSnapshot, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchSnapshot = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/stats/staff-snapshot`);
      const result = await res.json();
      if (result.success) setSnapshot(result.data);
    } catch (err) {
      console.error("Failed to fetch dashboard snapshot", err);
    }
  };

  const fetchShiftStats = async (name) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/stats/staff/${name}`);
      const result = await res.json();
      if (result.success) setShiftStats(result.data);
    } catch (err) {
      console.error("Failed to fetch shift stats", err);
    }
  };

  const fetchAttendance = async (staffId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/attendance/staff/${staffId}`);
      const history = await res.json();
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = (history || []).find(r => r.date === todayStr);
      
      if (todayRecord) {
        setAttendanceStatus(todayRecord.status === 'Present' || todayRecord.status === 'In' ? 'Present' : 'Not Present');
      } else {
        setAttendanceStatus('Not Present');
      }
    } catch (err) {
      setAttendanceStatus('Offline');
    }
  };

  const markPresent = async () => {
    if (attendanceStatus === 'Present') return;
    
    if (!window.confirm("Mark yourself as Present for today?")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/attendance/punch`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('staff_access')}`
        },
        body: JSON.stringify({ status: 'Present' })
      });
      const result = await res.json();
      if (result.success) {
        setAttendanceStatus('Present');
        toast.success(`Welcome! You are marked as Present`);
      }
    } catch (err) {
      toast.error("Failed to update attendance");
    }
  };

  const occupiedTables = (tables || []).filter(t => t.status?.toLowerCase() === 'occupied').length;
  const reservedTables = (tables || []).filter(t => t.status?.toLowerCase() === 'reserved').length;
  const readyOrdersCount = Object.values(orders || {}).filter(o => o.status?.toLowerCase() === 'ready').length;
  const activeOrdersCount = Object.values(orders || {}).length;
  const totalTablesCount = (tables || []).length || 1;

  // Performance Calculations
  const tableTurnover = Math.round((occupiedTables / totalTablesCount) * 100);
  const serviceSpeed = activeOrdersCount > 0 ? Math.round((readyOrdersCount / activeOrdersCount) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{today}</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shift Hub</h1>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/staff/profile')}
            className="w-12 h-12 rounded-2xl bg-white overflow-hidden flex items-center justify-center border-2 border-slate-100 shadow-sm"
          >
            {staff?.profileImage ? (
              <img src={staff.profileImage} className="w-full h-full object-cover" alt="profile" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-900 font-black text-sm uppercase">
                {staff?.name?.charAt(0) || <Users size={18} />}
              </div>
            )}
          </motion.button>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full bg-white shadow-xl shadow-slate-200/50 p-6 pb-32 space-y-8">
        {/* Quick Stats Grid */}
        <section>
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-[2rem] border border-slate-100" />
              ))
            ) : (
              <>
                {/* Row 1: Tables */}
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/staff/tables')}
                  className="p-5 rounded-[2rem] bg-slate-100 text-slate-900 border border-slate-200 shadow-sm flex flex-col gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200">
                    <Map size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Available</span>
                    <span className="text-3xl font-black">{snapshot.availableTables.toString().padStart(2, '0')}</span>
                  </div>
                </motion.div>

                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/staff/tables')}
                  className="p-5 rounded-[2rem] bg-slate-900 text-white shadow-xl shadow-slate-900/10 flex flex-col gap-4 relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Map size={20} className="text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Occupied</span>
                    <span className="text-3xl font-black">{snapshot.occupiedTables.toString().padStart(2, '0')}</span>
                  </div>
                  <div className="absolute top-4 right-4 text-emerald-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  </div>
                </motion.div>

                {/* Row 2: Orders Flow */}
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/staff/active-orders')}
                  className="p-5 rounded-[2rem] bg-amber-500 text-white shadow-xl shadow-amber-500/10 flex flex-col gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Clock size={20} className="text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Pending</span>
                    <span className="text-3xl font-black">{snapshot.pendingOrders.toString().padStart(2, '0')}</span>
                  </div>
                </motion.div>

                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/staff/active-orders')}
                  className="p-5 rounded-[2rem] bg-emerald-500 text-white shadow-xl shadow-emerald-500/10 flex flex-col gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <ChefHat size={20} className="text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Ready</span>
                    <span className="text-3xl font-black">{snapshot.readyPickups.toString().padStart(2, '0')}</span>
                  </div>
                </motion.div>

                {/* Row 3: Totals */}
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/staff/active-orders')}
                  className="p-5 rounded-[2rem] bg-purple-500 text-white shadow-xl shadow-purple-500/10 flex flex-col gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Zap size={20} className="text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">In Process</span>
                    <span className="text-3xl font-black">{snapshot.activeOrders.toString().padStart(2, '0')}</span>
                  </div>
                </motion.div>

                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/staff/active-orders')}
                  className="p-5 rounded-[2rem] bg-indigo-500 text-white shadow-xl shadow-indigo-500/10 flex flex-col gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Completed</span>
                    <span className="text-3xl font-black">{snapshot.completedOrders.toString().padStart(2, '0')}</span>
                  </div>
                </motion.div>

                {/* Row 4: Attendance (Full Width) */}
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={markPresent}
                  className={`col-span-2 p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between cursor-pointer transition-all ${
                    attendanceStatus === 'Present' 
                    ? 'bg-blue-600 text-white shadow-blue-600/20' 
                    : 'bg-white text-slate-400 border border-slate-100 shadow-sm hover:border-blue-200 transition-colors'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      attendanceStatus === 'Present' ? 'bg-white/10' : 'bg-blue-50 text-blue-500'
                    }`}>
                      <Users size={28} />
                    </div>
                    <div>
                      <h4 className={`text-lg font-black tracking-tight ${attendanceStatus === 'Present' ? 'text-white' : 'text-slate-900'}`}>
                        {attendanceStatus === 'Present' ? 'You are Present' : 'Mark as Present'}
                      </h4>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${attendanceStatus === 'Present' ? 'opacity-60' : 'text-slate-400'}`}>
                        {attendanceStatus === 'Present' ? 'Start of Day Confirmed' : 'Tap to start your shift'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                    attendanceStatus === 'Present' ? 'border-white/20 bg-white/5' : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}>
                    {attendanceStatus === 'Present' ? <ChevronRight size={20} /> : <PlusCircle size={20} />}
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 px-2">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => navigate('/staff/table/69cf6f128c8e06df8f5944a3')}
              className="flex items-center gap-3 p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all text-left group"
            >
              <PlusCircle size={24} className="text-slate-900 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-tight text-slate-900">Quick Serve Mode</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Jump to active tables</span>
              </div>
            </button>
          </div>
        </section>

        {/* My Shift Summary */}
        <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
             <TrendingUp size={120} />
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h3 className="text-xl font-black text-slate-900 tracking-tighter">My Contributor Stats</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Direct impact this shift</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
               <Zap size={24} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Orders Handled</span>
              <div className="flex items-end gap-2">
                 <span className="text-4xl font-black text-slate-900 tracking-tighter">
                   {shiftStats.handled.toString().padStart(2, '0')}
                 </span>
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 italic">Today</span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Sales Focus</span>
              <div className="flex items-end gap-2">
                 <span className="text-4xl font-black text-slate-900 tracking-tighter">
                   ₹{shiftStats.volume.toLocaleString()}
                 </span>
                 <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Total</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Shift Live</span>
             </div>
             <button onClick={() => navigate('/staff/tables')} className="text-[9px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1.5">
                View Tables <ChevronRight size={12} />
             </button>
          </div>
        </section>

        {/* Break Note */}
        <div className="p-6 rounded-3xl border-2 border-dashed border-slate-100 flex items-center gap-4 text-slate-400">
          <Coffee size={24} strokeWidth={1.5} />
          <p className="text-[11px] font-medium leading-relaxed uppercase tracking-tight italic">
            "Keep the energy high, it's a busy weekend ahead!"
          </p>
        </div>
      </main>

      <StaffNavbar activeTab="dashboard" />
    </div>
  );
}

