import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Monitor, 
  LogIn, 
  LogOut, 
  Edit2, 
  Trash2, 
  Save, 
  Shield,
  Users, 
  Zap, 
  X,
  UserCheck,
  UserX,
  History,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Lock,
  PlaneTakeoff,
  Coffee,
  Circle,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';
import BranchSelector from '../../components/BranchSelector';

export default function Attendance() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [staff, setStaff] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const isSelectedDateToday = selectedDate === todayStr;

  useEffect(() => {
    fetchStaff();
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchAttendanceForDate();
  }, [selectedDate]);

  const fetchStaff = async () => {
    try {
      const [staffRes, branchRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/staff`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/branches`)
      ]);
      const staffData = await staffRes.json();
      const branchData = await branchRes.json();
      
      if (Array.isArray(staffData)) {
        setStaff(staffData.filter(s => s.status === 'Active'));
      }
      if (branchData.success) setBranches(branchData.data);
    } catch (err) {
      toast.error('Staff retrieval failure');
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/role`);
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
       console.log(err);
    }
  };

  const fetchAttendanceForDate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/attendance/date/${selectedDate}`);
      const data = await res.json();
      setAttendanceRecords(data);
    } catch (err) {
      toast.error('Sync error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMark = async (staffId, status) => {
    if (!isSelectedDateToday) {
       return toast.error('Modifications restricted to current date');
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({
          staffId,
          status,
          date: selectedDate,
          branchId: staff.find(s => s._id === staffId)?.branchId
        })
      });
      if (res.ok) {
        toast.success(`Marked as ${status}`);
        fetchAttendanceForDate();
      } else {
        const error = await res.json();
        toast.error(error.message);
      }
    } catch (err) {
      toast.error('Identity sync failure');
    }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'All' || (s.role && s.role.name === filterRole);
    const branchMatch = selectedBranchFilter === 'all' || (s.branchId?._id || s.branchId) === selectedBranchFilter;
    return matchesSearch && matchesRole && branchMatch;
  });

  const getStatus = (staffId) => {
    const record = attendanceRecords.find(r => r.staff?._id === staffId);
    if (!record) return 'PENDING';
    if (record.status === 'In') return 'PRESENT';
    return record.status.toUpperCase();
  };

  const getRecord = (staffId) => {
    return attendanceRecords.find(r => r.staff?._id === staffId);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-[1500px] mx-auto min-h-screen pb-40">
      
      {/* PERFECT BALANCED HEADER (Compact + High Readability) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
           <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg">
              <Zap size={20} strokeWidth={2.5} className="text-amber-400" />
           </div>
           <div>
              <h1 className="text-2xl font-[900] text-slate-900 tracking-tight uppercase leading-none">Attendance Pulse</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-80">Synchronized Personnel Tracking Hub</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-sm border border-slate-100">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}><List size={16} /></button>
           </div>

           <div className="h-8 w-px bg-slate-100 hidden md:block" />

           <BranchSelector 
              branches={branches}
              selectedBranch={selectedBranchFilter}
              onSelect={setSelectedBranchFilter}
            />

           <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-100 min-w-[240px] justify-between">
              <button onClick={() => changeDate(-1)} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400"><ChevronLeft size={16} strokeWidth={3} /></button>
              <span className={`text-[11px] font-black uppercase tracking-widest tabular-nums ${isSelectedDateToday ? 'text-slate-900' : 'text-rose-500'}`}>
                {new Date(selectedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <button onClick={() => changeDate(1)} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400"><ChevronRight size={16} strokeWidth={3} /></button>
           </div>
        </div>
      </div>

      {/* Analytics (Compact) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Present Today', val: attendanceRecords.filter(r => r.status === 'Present' || r.status === 'In').length, color: 'text-emerald-500', icon: UserCheck, bg: 'bg-emerald-50/50' },
            { label: 'Units Absent', val: attendanceRecords.filter(r => r.status === 'Absent').length, color: 'text-rose-500', icon: UserX, bg: 'bg-rose-50/50' },
            { label: 'On Time Off', val: attendanceRecords.filter(r => r.status === 'Leave').length, color: 'text-blue-500', icon: PlaneTakeoff, bg: 'bg-blue-50/50' },
            { label: 'Pending Sync', val: staff.length - attendanceRecords.length, color: 'text-amber-500', icon: Clock, bg: 'bg-amber-50/50' },
            { label: 'Total Node Count', val: staff.length, color: 'text-slate-900', icon: Users, bg: 'bg-slate-50/50' }
          ].map((stat, i) => (
             <div key={i} className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 ${isLoading ? 'animate-pulse opacity-50' : ''}`}>
                <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center opacity-80`}>
                   <stat.icon size={16} strokeWidth={3} />
                </div>
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                   <p className={`text-lg font-black ${stat.color} leading-none tabular-nums`}>{isLoading ? '...' : stat.val}</p>
                </div>
             </div>
          ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text" 
              placeholder="QUERING PERSONNEL IDENTITY..."
              className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:border-slate-900 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-100 min-w-[280px]">
             {['All', 'Chef', 'Waiter', 'Manager'].map(role => (
                <button key={role} onClick={() => setFilterRole(role)} className={`flex-1 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filterRole === role ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>{role}</button>
             ))}
          </div>
      </div>

      {!isSelectedDateToday && (
         <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center gap-3 shadow-lg shadow-slate-900/10">
            <Lock size={14} className="text-amber-400" strokeWidth={3} />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80 italic">Temporal Security Protocol Active (ReadOnly)</p>
         </div>
      )}

      {/* Grid Design (Balanced Zoom) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
               Array(8).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4 animate-pulse">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                        <div className="space-y-2 flex-1">
                           <div className="h-3.5 bg-slate-100 rounded-full w-2/3" />
                           <div className="h-2.5 bg-slate-100 rounded-full w-1/3" />
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        <div className="h-14 bg-slate-50 rounded-xl" />
                        <div className="h-14 bg-slate-50 rounded-xl" />
                        <div className="h-14 bg-slate-50 rounded-xl" />
                     </div>
                  </div>
               ))
            ) : filteredStaff.length === 0 ? (
               <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 opacity-60 italic">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Zero Personnel Discovered in this sector</p>
               </div>
            ) : (
              filteredStaff.map((person) => {
                const status = getStatus(person._id);
                const isPresent = status === 'PRESENT';
                const isAbsent = status === 'ABSENT';
                const onLeave = status === 'LEAVE';

                return (
                  <motion.div 
                    layout
                    key={person._id}
                    className={`bg-white rounded-[2rem] p-6 border shadow-sm relative overflow-hidden group transition-all duration-300 ${isPresent ? 'border-emerald-100' : isAbsent ? 'border-rose-100' : onLeave ? 'border-blue-100' : 'border-slate-100'}`}
                  >
                    <div className="flex items-start justify-between mb-8">
                       <div className="flex items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg transition-transform group-hover:scale-105 ${isPresent ? 'bg-emerald-500 shadow-emerald-50' : isAbsent ? 'bg-rose-500 shadow-rose-50' : onLeave ? 'bg-blue-600 shadow-blue-50' : 'bg-slate-900 shadow-slate-100'}`}>
                             {person.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5 truncate max-w-[120px]">{person.name}</h3>
                             <div className="flex items-center gap-1.5 opacity-60">
                                <Shield size={8} className="text-blue-500" />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{person.role?.name || 'Operative'}</p>
                             </div>
                             <div className="flex items-center gap-1.5 opacity-60 mt-0.5">
                                <MapPin size={8} className="text-amber-500" />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{person.branchId?.branchName || 'Global'}</p>
                             </div>
                          </div>
                       </div>
                       <div className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border ${isPresent ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isAbsent ? 'bg-rose-50 text-rose-600 border-rose-100' : onLeave ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-300 border-slate-50'}`}>
                          {status}
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                       <button 
                          disabled={!isSelectedDateToday}
                          onClick={() => handleMark(person._id, 'Present')}
                          className={`flex flex-col items-center gap-2 py-5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${isPresent ? 'bg-emerald-500 text-white shadow-md scale-[1.03]' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                       >
                          <UserCheck size={16} strokeWidth={3} /> {isPresent ? 'SELECTED' : 'PRESENT'}
                       </button>
                       <button 
                          disabled={!isSelectedDateToday}
                          onClick={() => handleMark(person._id, 'Absent')}
                          className={`flex flex-col items-center gap-2 py-5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${isAbsent ? 'bg-rose-500 text-white shadow-md scale-[1.03]' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                       >
                          <UserX size={16} strokeWidth={3} /> {isAbsent ? 'SELECTED' : 'ABSENT'}
                       </button>
                       <button 
                          disabled={!isSelectedDateToday}
                          onClick={() => handleMark(person._id, 'Leave')}
                          className={`flex flex-col items-center gap-2 py-5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${onLeave ? 'bg-blue-600 text-white shadow-md scale-[1.03]' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                       >
                          <PlaneTakeoff size={16} strokeWidth={3} /> {onLeave ? 'SELECTED' : 'LEAVE'}
                       </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                 <tr>
                    <th className="px-8 py-5">Personnel Nodes</th>
                    <th className="px-8 py-5 text-center">Current Mapping</th>
                    <th className="px-8 py-5 text-right">Rapid Controls</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                    Array(8).fill(0).map((_, i) => (
                       <tr key={i} className="animate-pulse opacity-50">
                          <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded w-1/3" /></td>
                          <td className="px-8 py-5 text-center"><div className="h-6 bg-slate-100 rounded w-1/4 mx-auto" /></td>
                          <td className="px-8 py-5 text-right"><div className="h-4 bg-slate-100 rounded w-32 ml-auto" /></td>
                       </tr>
                    ))
                 ) : (
                   filteredStaff.map((person) => {
                      const status = getStatus(person._id);
                      return (
                        <tr key={person._id} className="group hover:bg-slate-50/30 transition-all duration-300">
                           <td className="px-8 py-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-black shadow-md">{person.name.split(' ').map(n => n[0]).join('')}</div>
                                 <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{person.name}</p>
                              </div>
                           </td>
                           <td className="px-8 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest ${status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600' : status === 'ABSENT' ? 'bg-rose-50 text-rose-600' : status === 'LEAVE' ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-100 border border-slate-100'}`}>
                                 {status}
                              </span>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                 {isSelectedDateToday ? (
                                    <>
                                       <button onClick={() => handleMark(person._id, 'Present')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shadow-sm border border-emerald-100"><UserCheck size={14} /></button>
                                       <button onClick={() => handleMark(person._id, 'Absent')} className="p-2.5 bg-rose-50 text-rose-600 rounded-lg shadow-sm border border-rose-100"><UserX size={14} /></button>
                                       <button onClick={() => handleMark(person._id, 'Leave')} className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shadow-sm border border-blue-100"><PlaneTakeoff size={14} /></button>
                                    </>
                                 ) : (
                                    <Lock size={14} className="text-slate-100" />
                                 )}
                              </div>
                           </td>
                        </tr>
                      );
                   })
                 )}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
}



