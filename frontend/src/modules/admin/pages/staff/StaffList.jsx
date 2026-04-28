import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Shield, Edit2, Trash2, Mail, LayoutGrid, List, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';
import BranchSelector from '../../components/BranchSelector';

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [filterStatus, setFilterStatus] = useState('All');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: 'Active',
    branchId: '',
    pin: '1234'
  });

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);

  const fetchData = async () => {
    try {
      const [staffRes, branchRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/staff`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/branches`)
      ]);
      const staffData = await staffRes.json();
      const branchData = await branchRes.json();
      
      setStaff(Array.isArray(staffData) ? staffData : []);
      setBranches(branchData.success ? branchData.data : []);
    } catch (err) {
      toast.error('Personnel fetch failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
     try {
       const res = await fetch(`${import.meta.env.VITE_API_URL}/role`);
       const data = await res.json();
       setRoles(Array.isArray(data) ? data.filter(r => r.status === 'Published') : []);
     } catch (err) {
       console.error(err);
     }
  };

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingStaff(member);
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role?._id || '',
        status: member.status || 'Active',
        branchId: member.branchId || '',
        pin: member.pin || '1234'
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        email: '',
        role: '',
        status: 'Active',
        branchId: selectedBranchFilter !== 'all' ? selectedBranchFilter : '',
        pin: '1234'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.branchId) return toast.error('Branch selection required');
    if (!formData.name || !formData.email || !formData.role) {
      return toast.error('Required data missing');
    }
    
    const url = editingStaff 
      ? `${import.meta.env.VITE_API_URL}/staff/${editingStaff._id}`
      : `${import.meta.env.VITE_API_URL}/staff`;
    
    const method = editingStaff ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(editingStaff ? 'Profile recalibrated' : 'Personnel enrolled');
        fetchData();
        setIsModalOpen(false);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Operation failed');
      }
    } catch (err) {
      toast.error('Network failure');
    }
  };

  const handleDeleteClick = (member) => {
    setStaffToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/${staffToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
      });
      if (res.ok) {
        toast.success('Personnel record terminated');
        fetchData();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Termination failed');
    }
  };

  const toggleStatus = async (member) => {
    const newStatus = member.status === 'Active' ? 'Inactive' : 'Active';
    try { 
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/${member._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Unit set to ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Sync error');
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || member.status === filterStatus;
    const matchesBranch = selectedBranchFilter === 'all' || 
                         (member.branchId?._id ? member.branchId._id === selectedBranchFilter : member.branchId === selectedBranchFilter);
    return matchesSearch && matchesStatus && matchesBranch;
  });

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-[1500px] mx-auto min-h-screen pb-40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
              <Users size={18} strokeWidth={2.5} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Personnel Registry</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Management of operational identities and credentials</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
           <BranchSelector branches={branches} selectedBranch={selectedBranchFilter} onSelect={setSelectedBranchFilter} />
           <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-sm border border-slate-100">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}><List size={16} /></button>
           </div>
           <button onClick={() => handleOpenModal()} className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/10 hover:scale-105 transition-all">
              <Plus size={14} strokeWidth={3} /> Enroll Staff
            </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="QUERING PERSONNEL IDENTITY..."
              className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:border-slate-900 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-100 min-w-[240px]">
            {['All', 'Active', 'Inactive'].map((status) => (
              <button key={status} onClick={() => setFilterStatus(status)} className={`flex-1 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}>{status}</button>
            ))}
          </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {Array(8).fill(0).map((_, i) => (
             <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm animate-pulse space-y-4">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
             </div>
           ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
           <Users size={48} className="mx-auto text-slate-100 mb-4" />
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Zero personnel nodes discovered</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredStaff.map((member) => (
              <motion.div layout key={member._id} className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all group relative flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg ${member.status === 'Active' ? 'bg-slate-900' : 'bg-slate-400'}`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest ${member.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {member.status}
                  </div>
                </div>
                  <div className="flex flex-col gap-1.5 mb-6">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{member.name}</h2>
                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <Shield size={10} className="text-blue-500" /> {member.role?.name || 'Unit'}
                    </div>
                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <MapPin size={10} className="text-amber-500" /> {member.branchId?.branchName || 'Global'}
                    </div>
                  </div>
                <div className="pt-4 border-t border-slate-50 flex items-center gap-1.5 mt-auto">
                  <button onClick={() => handleOpenModal(member)} className="flex-1 h-9 bg-slate-50 text-slate-600 text-[8px] font-black uppercase rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                     <Edit2 size={10} /> Edit
                  </button>
                  <button onClick={() => handleDeleteClick(member)} className="w-9 h-9 flex items-center justify-center bg-slate-50 text-rose-500 rounded-xl hover:bg-rose-50 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/30 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Personnel Registry</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredStaff.map((member) => (
                   <tr key={member._id} className="group hover:bg-slate-50/20">
                      <td className="px-6 py-3 font-black text-slate-900">{member.name}</td>
                      <td className="px-6 py-3 text-[10px]">{member.role?.name || 'N/A'}</td>
                      <td className="px-6 py-3 text-[10px]">{member.branchId?.branchName || 'Global'}</td>
                      <td className="px-6 py-3 text-[10px]">{member.status}</td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => handleOpenModal(member)} className="text-slate-400 hover:text-slate-900 mr-2"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteClick(member)} className="text-rose-400 hover:text-rose-600"><Trash2 size={14} /></button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'Recalibrate Unit Profile' : 'Identity Enrollment'}
        subtitle="Operational credential synchronization"
        onSubmit={handleSave}
      >
        <div className="space-y-4">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                <input type="text" required className="w-full bg-slate-50 border border-slate-100 p-3.5 text-[10px] font-bold outline-none focus:border-slate-900 rounded-xl transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="NOMINAL IDENTITY" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Network Access ID (Email)</label>
                <input type="email" required className="w-full bg-slate-50 border border-slate-100 p-3.5 text-[10px] font-bold outline-none focus:border-slate-900 rounded-xl transition-all lowercase" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="access@portal.com" />
              </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch Allocation</label>
             <select 
               className="w-full bg-slate-50 border border-slate-100 p-3.5 text-[10px] font-bold outline-none focus:border-slate-900 rounded-xl transition-all appearance-none"
               value={formData.branchId}
               required
               onChange={(e) => setFormData({...formData, branchId: e.target.value})}
             >
               <option value="">Select Target Branch</option>
               {branches.map(b => <option key={b._id} value={b._id}>{b.branchName}</option>)}
             </select>
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation Registry</label>
             <select 
               className="w-full bg-slate-50 border border-slate-100 p-3.5 text-[10px] font-bold outline-none focus:border-slate-900 rounded-xl transition-all appearance-none"
               value={formData.role}
               onChange={(e) => setFormData({...formData, role: e.target.value})}
               required
               disabled={!formData.branchId}
             >
               <option value="">{formData.branchId ? 'SELECT DESIGNATION' : 'SELECT BRANCH FIRST'}</option>
               {roles
                 .filter(r => !r.branchId || r.branchId === formData.branchId)
                 .map(role => (
                 <option key={role._id} value={role._id}>{role.name}</option>
               ))}
             </select>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Access PIN</label>
                <input type="text" maxLength={4} className="w-full bg-slate-50 border border-slate-100 p-3.5 text-[10px] font-bold outline-none focus:border-slate-900 rounded-xl transition-all" value={formData.pin} onChange={(e) => setFormData({...formData, pin: e.target.value})} placeholder="1234" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Pulse State</label>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100 h-[46px]">
                  {['Active', 'Inactive'].map(s => (
                    <button 
                      key={s} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, status: s })} 
                      className={`flex-1 rounded-lg text-[8px] font-black uppercase transition-all ${formData.status === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
           </div>
        </div>
      </AdminModal>

      <AdminModal
        isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Registry Removal" subtitle="Final confirmation for deletion" variant="danger"
      >
        <div className="space-y-4">
           <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
               <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-relaxed text-center">Terminate registry for: <span className="underline">{staffToDelete?.name}</span>? This is irreversible.</p>
           </div>
           <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-xl">Abort</button>
              <button onClick={confirmDelete} className="flex-[2] py-4 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-200">Validate</button>
           </div>
        </div>
      </AdminModal>
    </div>
  );
}



