import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  CheckSquare, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  LayoutGrid,
  List,
  ChevronRight,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';

export default function Roles() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Published'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/role`);
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      toast.error('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        status: role.status || 'Published'
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        status: 'Published'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Role name is required');
    
    const url = editingRole 
      ? `${import.meta.env.VITE_API_URL}/role/${editingRole._id}`
      : `${import.meta.env.VITE_API_URL}/role`;
    
    const method = editingRole ? 'PUT' : 'POST';

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
        toast.success(editingRole ? 'Role updated' : 'Role created');
        fetchData();
        setIsModalOpen(false);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Operation failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/role/${roleToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      if (res.ok) {
        toast.success('Role permanentely removed');
        fetchData();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const toggleStatus = async (role) => {
    const newStatus = role.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/role/${role._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ ...role, status: newStatus })
      });
      if (res.ok) {
        toast.success(`Role set to ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || role.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto min-h-screen pb-40">
      {/* Header section with View Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
                 <Shield size={22} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-[900] text-slate-900 tracking-tight uppercase tracking-tighter">Operational Roles</h1>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Define permissions & organizational hierarchies</p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* View Toggle Controller */}
           <div className="flex items-center gap-1 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <List size={18} />
              </button>
           </div>

           <button 
             onClick={() => handleOpenModal()}
             className="h-14 px-8 bg-[#2C2C2C] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all group lg:min-w-[220px] justify-center"
           >
             <Plus size={16} strokeWidth={3} />
             Create New Role
           </button>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="bg-white/40 backdrop-blur-md sticky top-0 z-10 py-4 -mx-4 px-4 border-b border-transparent">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter specialized roles..."
              className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-1 p-1 bg-white rounded-2xl shadow-sm self-stretch md:self-auto min-w-[300px] border border-slate-100">
            {['All', 'Published', 'Draft'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-1 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-[#2C2C2C] text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roles Presentation Layer */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="bg-white h-48 rounded-[3rem] animate-pulse border border-slate-100" />
           ))}
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-[3.5rem] border-2 border-dashed border-slate-200">
           <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Zero organizational nodes discovered</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredRoles.map((role) => (
              <motion.div 
                layout
                key={role._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-100 p-8 rounded-[3.5rem] shadow-xl hover:shadow-2xl transition-all group relative flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3.5 bg-slate-50 text-slate-900 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                    <Shield size={20} strokeWidth={3} />
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${role.status === 'Published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    {role.status}
                  </div>
                </div>

                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-3 leading-tight">{role.name}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] line-clamp-4 leading-relaxed italic mb-6">
                  {role.description || 'No strategic description assigned to this unit.'}
                </p>

                <div className="pt-8 border-t border-slate-50 flex items-center gap-2 mt-auto">
                  <button 
                    onClick={() => handleOpenModal(role)}
                    className="flex-1 h-12 bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                  >
                     <Edit2 size={12} /> Optimization
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(role)}
                    className="p-3 bg-slate-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-slate-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-[3.5rem] shadow-xl border border-slate-100 overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation Node</th>
                    <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Detail</th>
                    <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry State</th>
                    <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredRoles.map((role) => (
                   <tr key={role._id} className="group hover:bg-slate-50/20 transition-all">
                      <td className="px-10 py-6">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-amber-400 shadow-xl">
                               <Shield size={18} strokeWidth={3} />
                            </div>
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{role.name}</span>
                         </div>
                      </td>
                      <td className="px-10 py-6">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate max-w-[400px] italic">
                            {role.description || 'No operational signal defined'}
                         </p>
                      </td>
                      <td className="px-10 py-6">
                         <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all
                            ${role.status === 'Published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                            {role.status}
                         </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button onClick={() => handleOpenModal(role)} className="p-3 bg-white text-slate-900 rounded-xl hover:bg-slate-900 hover:text-white shadow-sm border border-slate-100 transition-all"><Edit2 size={14} /></button>
                            <button onClick={() => handleDeleteClick(role)} className="p-3 bg-white text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white shadow-sm border border-slate-100 transition-all"><Trash2 size={14} /></button>
                         </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Persistence Modals */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? 'Update Role' : 'New Role'}
        subtitle="Operational architecture modification"
        onSubmit={handleSave}
      >
        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Designation Name</label>
              <input 
                type="text" required
                className="w-full bg-slate-50 border border-slate-100 p-5 text-[11px] font-bold outline-none rounded-3xl"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Brief</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 p-5 text-[10px] font-bold outline-none rounded-3xl h-32 resize-none"
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
           </div>
        </div>
      </AdminModal>

      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Protocol"
        subtitle="Confirm role termination"
        variant="danger"
      >
        <div className="space-y-6">
           <div className="p-8 bg-rose-50 rounded-[3rem] border border-rose-100">
               <p className="text-xs font-black text-rose-600 uppercase tracking-widest leading-relaxed">Warning: You are about to terminate the <span className="underline">"{roleToDelete?.name}"</span> role matrix. This is irreversible.</p>
           </div>
           <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-3xl font-black text-[10px] uppercase">Abort</button>
              <button onClick={confirmDelete} className="flex-[2] py-5 bg-rose-500 text-white rounded-3xl font-black text-[10px] uppercase shadow-xl shadow-rose-200">Validate</button>
           </div>
        </div>
      </AdminModal>
    </div>
  );
}



