import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, CheckCircle2, AlertCircle, ChevronRight, Zap, Target } from 'lucide-react';
import { StaffNavbar } from '../components/StaffNavbar';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Attendance() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const staffData = JSON.parse(localStorage.getItem('staff_info'));
  const staffId = staffData?._id;

  useEffect(() => {
    if (!staffId) return navigate('/staff/login');
    fetchAttendance();
  }, [staffId]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/attendance/staff/${staffId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('staff_access')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAttendance(data);
      }
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePunch = async (newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/attendance/punch`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('staff_access')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Successfully Punched ${newStatus}`);
        fetchAttendance();
      } else {
        toast.error(result.message || "Action failed");
      }
    } catch (err) {
      toast.error('Connection error');
    }
  };

  const calculateStats = () => {
    const present = attendance.filter(a => a.status === 'Present' || a.status === 'In').length;
    const leave = attendance.filter(a => a.status === 'Leave').length;
    const absent = attendance.filter(a => a.status === 'Absent').length;
    return { present, leave, absent, total: attendance.length };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col pb-32">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-6 py-8 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 text-white rounded-2xl group shadow-lg active:scale-95 transition-all">
            <ArrowLeft size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 uppercase leading-none">Attendance Log</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Shift History</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full p-6 space-y-8 animate-in fade-in duration-700">
        
        {/* Today's Punch Card */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/20">
           {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayLog = attendance.find(a => a.date === todayStr);
              const isPunchedIn = todayLog?.status === 'In';
              const isPunchedOut = todayLog?.status === 'Out';

              return (
                 <div className="flex flex-col items-center text-center gap-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-900 border-4 border-white shadow-xl">
                       <Clock size={32} className={isPunchedIn ? 'text-emerald-500 animate-pulse' : 'text-slate-300'} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase italic">Daily Log</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {isPunchedOut ? 'Shift Completed' : isPunchedIn || todayLog?.status === 'Present' ? `Verified at ${new Date(todayLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not Marked Today'}
                       </p>
                    </div>

                    {!isPunchedOut && todayLog?.status !== 'Present' ? (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePunch(isPunchedIn ? 'Out' : 'Present')}
                        className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all ${
                          isPunchedIn 
                          ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600' 
                          : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                        }`}
                      >
                         {isPunchedIn ? 'Punch Out' : 'Mark Present'}
                      </motion.button>
                    ) : (
                      <div className="w-full py-5 rounded-[1.5rem] bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest italic border border-slate-200">
                         Attendance Recorded
                      </div>
                    )}
                 </div>
              );
           })()}
        </section>
        
        {/* Stats Summary */}
        <section className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl transition-all duration-700" />
           <div className="grid grid-cols-2 gap-10 relative z-10">
              <div className="space-y-1">
                 <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Present Days</span>
                 </div>
                 <span className="text-4xl font-black italic tracking-tighter text-white tabular-nums">{stats.present}/{stats.total || 0}</span>
                 <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 pt-2 flex items-center gap-1.5"><CheckCircle2 size={10} /> Verified</p>
              </div>
              <div className="space-y-1 border-l border-slate-800 pl-8">
                 <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Leaves Taken</span>
                 </div>
                 <span className="text-4xl font-black italic tracking-tighter text-blue-400 tabular-nums">{stats.leave}</span>
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 pt-2">Authorized</p>
              </div>
           </div>
        </section>

        {/* History List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Daily Logs</h2>
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{attendance.length} Total</span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
               Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-24 bg-white rounded-3xl border border-slate-100 animate-pulse" />
               ))
            ) : attendance.length === 0 ? (
               <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                  <Calendar size={48} className="text-slate-100 mb-4" />
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic opacity-60">No records found</p>
               </div>
            ) : (
              attendance.map((log, idx) => {
                 const isPositive = log.status === 'Present' || log.status === 'In';
                 const isLeave = log.status === 'Leave';
                 const date = new Date(log.date);
                 
                 return (
                  <motion.div 
                    layout
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-6 rounded-[2rem] border border-slate-100 bg-white flex items-center justify-between shadow-sm hover:shadow-xl transition-all duration-500 group"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black transition-all duration-700 group-hover:scale-110 ${
                        isPositive ? 'bg-emerald-50 text-emerald-600' : isLeave ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        <span className="text-[9px] uppercase tracking-tighter opacity-70">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-xl leading-none">{date.getDate()}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none mb-2 uppercase">{date.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                        <div className="flex items-center gap-2 opacity-50">
                          <Clock size={12} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                       <div className="flex flex-col items-end">
                          <span className={`text-[10px] font-black italic tracking-tighter uppercase ${isPositive ? 'text-emerald-500' : isLeave ? 'text-blue-500' : 'text-rose-500'}`}>{log.status}</span>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {isPositive ? <CheckCircle2 size={12} className="text-emerald-400" /> : isLeave ? <Zap size={12} className="text-blue-400" /> : <AlertCircle size={12} className="text-rose-300" />}
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Logged</span>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <StaffNavbar activeTab="profile" />
    </div>
  );
}
