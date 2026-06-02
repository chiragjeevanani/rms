import React, { useState, useEffect } from 'react';
import { Search, Plus, Zap, CheckCircle2, Edit3, Trash2, X, ToggleLeft, ToggleRight, Mail, Loader, ChevronLeft, ChevronRight, Hash, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminManagement() {
  const { 
    accentColor,
    toggleApi,
    fetchData: syncGlobalData, // kept to sync context if needed
    socket
  } = useOutletContext();

  // Local Paginated States
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(5);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '', email: '', phone: '', branchLimit: 5, status: 'Active', thirdPartyIntegration: false,
    dbUrl: '', appType: 'Admin', adminId: '', apiUrl: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(null); // stores email being resent

  // Fetch paginated global admins
  const fetchPaginatedAdmins = () => {
    if (socket) {
      setIsLoading(true);
      socket.emit('request_global_admins', {
        page: currentPage,
        limit,
        search,
        status: statusFilter
      });
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleResponse = (result) => {
      if (result.success) {
        setAdmins(result.data);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
          setTotalCount(result.pagination.totalCount || 0);
        }
      }
      setIsLoading(false);
    };

    socket.on('response_global_admins', handleResponse);

    return () => {
      socket.off('response_global_admins', handleResponse);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    fetchPaginatedAdmins();
  }, [socket, currentPage, search, statusFilter]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchPaginatedAdmins();
    };
    window.addEventListener('superadmin_admins_updated', handleUpdate);
    return () => {
      window.removeEventListener('superadmin_admins_updated', handleUpdate);
    };
  }, [socket, currentPage, search, statusFilter]);

  // Reset page on search/filter changes
  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // Status toggle handler
  const handleStatusToggle = async (admin) => {
    const nextStatus = (admin.status || '').toLowerCase() === 'inactive' ? 'active' : 'inactive';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/restaurants/${admin.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Node status changed to ${nextStatus}`);
        fetchPaginatedAdmins();
        syncGlobalData();
      } else {
        toast.error(data.message || 'Status update failed');
      }
    } catch (err) {
      toast.error('Network Error');
    }
  };

  // Open Edit modal pre-filled
  const openEditModal = (admin) => {
    setEditAdminEmail(admin.email);
    setEditFormData({
      name: admin.name ? admin.name.replace('Admin - ', '') : '',
      email: admin.email,
      phone: admin.mobileNumber || '',
      branchLimit: admin.branchLimit ?? 0,
      status: admin.status ? (admin.status.charAt(0).toUpperCase() + admin.status.slice(1)) : 'Inactive',
      thirdPartyIntegration: admin.thirdPartyIntegration || false,
      dbUrl: admin.dbUrl || '',
      appType: admin.appType || 'Admin',
      adminId: admin.adminId || '',
      apiUrl: admin.apiUrl || ''
    });
    setIsEditModalOpen(true);
  };

  // Edit form submit handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/restaurants/${editAdminEmail}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          mobileNumber: editFormData.phone,
          branchLimit: editFormData.branchLimit,
          status: editFormData.status,
          thirdPartyIntegration: editFormData.thirdPartyIntegration,
          dbUrl: editFormData.dbUrl,
          apiUrl: editFormData.apiUrl,
          appType: editFormData.appType,
          adminId: editFormData.adminId
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Node Admin Updated Successfully');
        setIsEditModalOpen(false);
        fetchPaginatedAdmins();
        syncGlobalData();
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete node handler
  const handleDelete = async (email) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to terminate and delete node [${email}]?\nThis action is irreversible and will delete all local and central credentials.`)) {
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/restaurants/${email}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Node Terminated and Deleted');
        fetchPaginatedAdmins();
        syncGlobalData();
      } else {
        toast.error(data.message || 'Deletion failed');
      }
    } catch (err) {
      toast.error('Network Error');
    }
  };

  // Resend credentials handler
  const handleResendCredentials = async (admin) => {
    if (!window.confirm(`Re-send login credentials to ${admin.email}?\nThis will generate a NEW password and email it.`)) return;
    setResendingEmail(admin.email);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/restaurants/${admin.email}/resend-credentials`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Credentials dispatched to ${admin.email}`);
      } else {
        toast.error(data.message || 'Failed to resend credentials');
      }
    } catch (err) {
      toast.error('Network Error');
    } finally {
      setResendingEmail(null);
    }
  };

  const getStatusStyle = (status) => {
    switch((status || '').toLowerCase()) {
      case 'inactive': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  const { setIsCreateModalOpen } = useOutletContext();

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
      {/* Header bar with Search, Filter dropdown, and Create button */}
      <div className="px-8 py-6 bg-white border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-1 items-center gap-3 w-full">
          {/* Search Inputs */}
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH GLOBAL NODE ADMINS..." 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-xs font-black uppercase tracking-wider text-slate-800 outline-none focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="h-8 w-px bg-slate-100 hidden sm:block mx-1" />

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 w-full sm:w-48 shadow-sm">
            <Hash size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase tracking-wider text-slate-700 outline-none w-full cursor-pointer"
            >
              <option value="all">ALL NODES</option>
              <option value="active">ACTIVE</option>
              <option value="inactive">INACTIVE</option>
            </select>
          </div>
        </div>

     
      </div>

      {/* Admin List Table */}
      <div className="p-6">
        <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200">
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Deployment / Admin</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Deployment Details</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Database URL</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Branch Allocation</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">API Protocol</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Node Status</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-slate-200" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 bg-slate-200 rounded w-28" />
                          <div className="h-2 bg-slate-200 rounded w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-2 animate-pulse">
                        <div className="h-3 bg-slate-200 rounded w-36" />
                        <div className="h-2 bg-slate-200 rounded w-24" />
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1.5 flex flex-col items-center animate-pulse">
                        <div className="h-3 bg-slate-200 rounded w-8" />
                        <div className="h-2 bg-slate-200 rounded w-12" />
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="h-8 bg-slate-200 rounded-xl w-20 mx-auto animate-pulse" />
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="h-6 bg-slate-200 rounded-full w-20 mx-auto animate-pulse" />
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-xl bg-slate-200" />
                        <div className="w-8 h-8 rounded-xl bg-slate-200" />
                        <div className="w-8 h-8 rounded-xl bg-slate-200" />
                        <div className="w-8 h-8 rounded-xl bg-slate-200" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center text-slate-300 italic text-[11px]">No node admins provisioned matching the filters.</td>
                </tr>
              ) : (
                admins.map(admin => (
                    <tr key={admin._id} className="hover:bg-slate-50/30 transition-all duration-200">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div 
                            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
                            className="w-10 h-10 rounded-xl text-white font-black text-[9px] flex flex-col items-center justify-center shadow-sm"
                          >
                            <span className="opacity-75 font-black uppercase tracking-tighter">{admin.appType || 'ADMIN'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{admin.name ? admin.name.replace('Admin - ', '') : 'N/A'}</span>
                            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">{admin.adminId || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-extrabold text-slate-800 tracking-wider">{admin.email}</span>
                          <span className="text-[9px] font-bold text-slate-400 tracking-wide mt-0.5">{admin.mobileNumber || 'NO PHONE'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span 
                            title={admin.dbUrl}
                            className="text-[10px] font-mono bg-slate-50 px-2 py-1 border border-slate-100 rounded-md text-slate-500 max-w-[180px] inline-block truncate hover:text-slate-850 transition-colors"
                          >
                            DB: {admin.dbUrl || 'N/A'}
                          </span>
                          {admin.apiUrl && (
                            <span 
                              title={admin.apiUrl}
                              className="text-[9px] font-mono bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded-md text-amber-600 max-w-[180px] inline-block truncate"
                            >
                              API: {admin.apiUrl}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Branch limit / Allocation progress display */}
                      <td className="px-8 py-5">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[12px] font-black text-slate-700">{admin.branchCount || 0} / {admin.branchLimit || 5}</span>
                          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Branches Used</span>
                        </div>
                      </td>

                      <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => toggleApi(admin.email)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all border shadow-sm cursor-pointer ${admin.thirdPartyIntegration ? 'text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-655 hover:bg-slate-100'}`}
                          style={admin.thirdPartyIntegration ? { color: accentColor, borderColor: `${accentColor}44`, backgroundColor: `${accentColor}0f` } : {}}
                        >
                          <Zap size={13} className="stroke-[2.5]" />
                          <span className="text-[8px] font-black uppercase tracking-wider">{admin.thirdPartyIntegration ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${getStatusStyle(admin.status)}`}>
                          {(admin.status || '').toLowerCase() === 'inactive' ? (
                            'Inactive'
                          ) : (
                            <>
                              <CheckCircle2 size={10} className="stroke-[3]" /> Active
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex justify-center gap-3">
                          {/* Resend Credentials */}
                          <button 
                            onClick={() => handleResendCredentials(admin)}
                            disabled={resendingEmail === admin.email}
                            title="Resend Credentials"
                            className="p-2 border border-sky-100 hover:bg-sky-50 hover:border-sky-300 rounded-xl text-sky-500 hover:text-sky-600 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {resendingEmail === admin.email 
                              ? <Loader size={16} className="animate-spin" />
                              : <Mail size={16} />}
                          </button>

                          {/* Status Toggle */}
                          <button 
                            onClick={() => handleStatusToggle(admin)}
                            title="Toggle Active Status"
                            className="p-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all shadow-sm cursor-pointer"
                          >
                            {(admin.status || '').toLowerCase() === 'inactive' ? (
                              <ToggleLeft size={16} />
                            ) : (
                              <ToggleRight size={16} style={{ color: accentColor }} />
                            )}
                          </button>
                          
                          {/* Edit Node */}
                          <button 
                            onClick={() => openEditModal(admin)}
                            title="Edit Admin Node"
                            className="p-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all shadow-sm cursor-pointer"
                          >
                            <Edit3 size={16} />
                          </button>

                          {/* Delete Node */}
                          <button 
                            onClick={() => handleDelete(admin.email)}
                            title="Delete Node"
                            className="p-2 border border-rose-100 hover:bg-rose-50 hover:border-rose-300 rounded-xl text-rose-500 hover:text-rose-600 transition-all shadow-sm cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>

        {/* Backend-Driven Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between p-6 bg-slate-50/50 border border-slate-200 rounded-[2rem] mt-8 shadow-inner">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span> ({totalCount} Administrators)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2.5 bg-white text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl border border-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                    currentPage === i + 1 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                      : 'bg-white text-slate-400 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2.5 bg-white text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl border border-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Admin Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 bg-slate-950 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white">Edit Admin Node</h3>
                  <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mt-1">Calibrate administrator properties</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Display Name</label>
                    <input 
                      type="text" 
                      required 
                      value={editFormData.name} 
                      onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-300" 
                      placeholder="e.g. Royal Kitchen Admin" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={editFormData.email} 
                      onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-300"
                      placeholder="email@rms.com" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                    <input 
                      type="text" 
                      value={editFormData.phone} 
                      onChange={e => setEditFormData({...editFormData, phone: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-300" 
                      placeholder="+91 9988776655" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Calibration</label>
                    <select 
                      value={editFormData.status} 
                      onChange={e => setEditFormData({...editFormData, status: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-505 focus:outline-none transition-all"
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* MongoDB Connection URL */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">MongoDB Connection URL</label>
                  <input 
                    type="text" 
                    required 
                    value={editFormData.dbUrl || ''} 
                    onChange={e => setEditFormData({...editFormData, dbUrl: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-350" 
                    placeholder="mongodb+srv://username:password@cluster.mongodb.net/dbname" 
                  />
                </div>

                {/* API Sync URL */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">API Synchronization URL (VPS Sync API)</label>
                  <input 
                    type="text" 
                    value={editFormData.apiUrl || ''} 
                    onChange={e => setEditFormData({...editFormData, apiUrl: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-350" 
                    placeholder="e.g. http://123.456.78.90:3000 or https://restaurant.com" 
                  />
                </div>

                {/* App Type & Deployment ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">App Type Calibration</label>
                    <select 
                      value={editFormData.appType || 'Admin'} 
                      onChange={e => setEditFormData({...editFormData, appType: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-505 focus:outline-none transition-all"
                    >
                      <option value="Admin">Admin Portal</option>
                      <option value="POS">POS System</option>
                      <option value="KDS">KDS Screen</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Deployment ID</label>
                    <input 
                      type="text" 
                      required 
                      value={editFormData.adminId || ''} 
                      onChange={e => setEditFormData({...editFormData, adminId: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all placeholder:text-slate-350" 
                      placeholder="e.g. DEP-ROYAL01" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch Creation Limit</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      value={editFormData.branchLimit} 
                      onChange={e => setEditFormData({...editFormData, branchLimit: parseInt(e.target.value) || 1})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EF4444]/50 transition-all" 
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div className="space-y-2 flex flex-col justify-center">
                    <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 mt-4">
                      <span className="text-[9px] font-bold text-amber-600 uppercase leading-normal">
                        Editing the email address will automatically sync credentials centrally.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={actionLoading} 
                    type="submit" 
                    style={{ backgroundColor: accentColor }}
                    className="px-8 py-3 text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-[10px] transition-all hover:brightness-95 active:scale-[0.98] cursor-pointer"
                  >
                    {actionLoading ? 'Saving...' : 'Update Admin'}
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
