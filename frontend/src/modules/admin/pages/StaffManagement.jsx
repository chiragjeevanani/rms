
import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, 
  Search, Filter, MoreHorizontal, Edit3, 
  Trash2, Mail, Phone, MapPin, X, Save,
  AlertTriangle, Lock, Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { STAFF_USERS } from '../../staff/data/staffMockData';

const INITIAL_STAFF = STAFF_USERS.map(u => ({
  id: u.id,
  name: u.name,
  role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
  email: u.email,
  status: u.status === 'online' ? 'on-duty' : 'off-duty',
  phone: '98765' + Math.floor(Math.random() * 90000 + 10000)
}));

const MOCK_STAFF = [
  ...INITIAL_STAFF,
  { id: 101, name: 'Rahul Sharma', role: 'Kitchen Staff', email: 'rahul@rms.com', status: 'on-duty', phone: '9876543210' },
  { id: 102, name: 'Anita Verma', role: 'Manager', email: 'anita@rms.com', status: 'on-duty', phone: '9876543211' },
  { id: 103, name: 'Vikram Das', role: 'Chef', email: 'vikram@rms.com', status: 'on-duty', phone: '9876543214' },
];

export default function StaffManagement() {
  const [staff, setStaff] = useState(MOCK_STAFF);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Waiter',
    email: '',
    phone: '',
    status: 'on-duty'
  });

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData(member);
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        role: 'Waiter',
        email: '',
        phone: '',
        status: 'on-duty'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingMember) {
      setStaff(staff.map(s => s.id === editingMember.id ? { ...formData, id: s.id } : s));
    } else {
      setStaff([...staff, { ...formData, id: Date.now() }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('SECURITY PROTOCOL: Revoke all access permissions for this personnel?')) {
      setStaff(staff.filter(s => s.id !== id));
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar max-h-full">
       <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Personnel & Permissions</h1>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage staff accounts, roles, and access protocol</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="h-9 px-4 bg-slate-100 text-slate-400 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-100">Role Config</button>
           <button 
             onClick={() => handleOpenModal()}
             className="h-9 px-4 bg-slate-900 text-white rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
           >
              <UserPlus size={14} />
              Add Member
           </button>
        </div>
      </div>

      {/* Security Context Info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="bg-slate-900 p-6 rounded-sm text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
               <Lock size={48} />
            </div>
            <ShieldCheck size={24} className="text-emerald-400 mb-4" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Security</h3>
            <p className="text-xl font-black mt-1">LOCKED</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-2 whitespace-nowrap">All protocols synchronized</p>
         </div>
         <div className="bg-white p-6 border border-slate-100 rounded-sm shadow-sm flex flex-col justify-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Personnel</span>
            <div className="flex items-center gap-3 mt-1">
               <h3 className="text-2xl font-black text-slate-900">{staff.length}</h3>
               <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                 {staff.filter(s => s.status === 'on-duty').length} ACTIVE
               </span>
            </div>
         </div>
         <div className="bg-white p-6 border border-slate-100 rounded-sm shadow-sm flex flex-col justify-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Department Groups</span>
            <h3 className="text-2xl font-black text-slate-900 font-sans tracking-tighter mt-1">05 UNITS</h3>
         </div>
         <div className="bg-white p-6 border border-slate-100 rounded-sm shadow-sm flex flex-col justify-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Login Activity</span>
            <h3 className="text-2xl font-black text-slate-900 font-sans tracking-tighter mt-1">HIGH FLOW</h3>
         </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {staff.map(member => (
            <div key={member.id} className="bg-white border border-slate-100 rounded-sm p-6 shadow-sm hover:border-slate-300 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-slate-300 hover:text-slate-900"><MoreHorizontal size={18} /></button>
               </div>
               
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-sm flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                     <Users size={24} />
                  </div>
                  <div>
                     <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{member.name}</h4>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded-sm">{member.role}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'on-duty' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`} />
                     </div>
                  </div>
               </div>

               <div className="space-y-3 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-3 text-slate-400">
                     <Mail size={12} />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                     <Phone size={12} />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">+91 {member.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                     <Shield size={12} />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Limited Access Protocol</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2 mt-6">
                  <button 
                    onClick={() => handleOpenModal(member)}
                    className="py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                     <Edit3 size={12} />
                     Edit Profile
                  </button>
                  <button 
                    onClick={() => handleDelete(member.id)}
                    className="py-2 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-red-50 hover:text-red-600 transition-all border border-slate-100 flex items-center justify-center gap-2"
                  >
                     <Trash2 size={12} />
                     Suspend
                  </button>
               </div>
            </div>
         ))}
      </div>

      {/* Personnel Modal */}
       <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm shadow-2xl relative overflow-hidden flex flex-col"
            >
               <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-slate-900 text-white rounded-sm flex items-center justify-center">
                        <Users size={16} />
                     </div>
                     <div>
                        <h3 className="text-[13px] font-black uppercase tracking-tight text-slate-900">
                           {editingMember ? 'Update Personnel Registry' : 'Initialize Personnel Access'}
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Access Control Protocol v2.4.0</p>
                     </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={18} /></button>
               </div>

               <form onSubmit={handleSave} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Identity Name</label>
                        <input 
                           type="text" 
                           required
                           className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           placeholder="FULL LEGAL NAME"
                        />
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role Designation</label>
                        <select 
                           className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                           value={formData.role}
                           onChange={(e) => setFormData({...formData, role: e.target.value})}
                        >
                           <option>Manager</option>
                           <option>Chef</option>
                           <option>Cashier</option>
                           <option>Kitchen Staff</option>
                           <option>Waiter</option>
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Status</label>
                        <select 
                           className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                           value={formData.status}
                           onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                           <option value="on-duty">ACTIVE SERVICE</option>
                           <option value="off-duty">SUSPENDED / LEAVE</option>
                        </select>
                     </div>

                     <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Mail Endpoint</label>
                        <input 
                           type="email" 
                           required
                           className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                           value={formData.email}
                           onChange={(e) => setFormData({...formData, email: e.target.value})}
                           placeholder="USER@DOMAIN.COM"
                        />
                     </div>

                     <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Link Protocol</label>
                        <input 
                           type="text" 
                           required
                           className="w-full bg-slate-50 border border-slate-100 p-2 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-slate-900/10 rounded-sm"
                           value={formData.phone}
                           onChange={(e) => setFormData({...formData, phone: e.target.value})}
                           placeholder="98765 XXXXX"
                        />
                     </div>
                  </div>

                  <div className="pt-6 flex items-center gap-3">
                     <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm"
                     >Cancel</button>
                     <button 
                        type="submit"
                        className="flex-1 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                     >
                        <Save size={14} />
                        {editingMember ? 'Update Protocol' : 'Onboard Member'}
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
