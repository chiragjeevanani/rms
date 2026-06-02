import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, MapPin, Mail, Phone, Hash, Filter, Info, Shield, ChevronDown } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function BranchManagement() {
  const { admins, accentColor, socket } = useOutletContext();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch all branches
  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/branches`);
      const data = await res.json();
      if (data.success) {
        setBranches(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch branches');
      }
    } catch (err) {
      toast.error('Network Error fetching branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Listen to socket updates to refresh if nodes change
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchBranches();
    };
    window.addEventListener('superadmin_admins_updated', handleUpdate);
    return () => {
      window.removeEventListener('superadmin_admins_updated', handleUpdate);
    };
  }, [socket]);

  // Calculations based on selection
  const selectedAdminInfo = selectedAdmin !== 'all' ? (admins && admins.find(a => a.email === selectedAdmin)) : null;
  const currentBranches = selectedAdmin === 'all' 
    ? branches 
    : branches.filter(b => b.adminEmail === selectedAdmin);

  const totalBranchesCount = currentBranches.length;
  const activeBranchesCount = currentBranches.filter(b => b.status === 'active').length;
  const inactiveBranchesCount = currentBranches.filter(b => b.status === 'inactive').length;

  const totalBranchesSubtext = selectedAdminInfo 
    ? `${totalBranchesCount} / ${selectedAdminInfo.branchLimit || 5} Allocation Limit` 
    : "Across All VPS Nodes";

  const activeBranchesSubtext = selectedAdminInfo
    ? "Active branches for this admin"
    : "Live & Processing Orders";

  const inactiveBranchesSubtext = selectedAdminInfo
    ? "Inactive branches for this admin"
    : "Suspended/Closed";

  // Filter & Search Logic
  const filteredBranches = branches.filter(branch => {
    const matchesSearch = 
      (branch.branchName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (branch.branchCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (branch.city || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesAdmin = selectedAdmin === 'all' || branch.adminEmail === selectedAdmin;

    return matchesSearch && matchesAdmin;
  });

  const getStatusStyle = (status) => {
    switch((status || '').toLowerCase()) {
      case 'inactive': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-450 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Top Metric Cards Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Branches Registered</p>
            <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{totalBranchesCount}</h4>
            <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded mt-2 inline-block">
              {totalBranchesSubtext}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg group-hover:rotate-6 duration-300">
            <Building2 size={22} />
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Branches</p>
            <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {activeBranchesCount}
            </h4>
            <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
              {activeBranchesSubtext}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:rotate-6 duration-300">
            <Building2 size={22} />
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Inactive Branches</p>
            <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {inactiveBranchesCount}
            </h4>
            <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded mt-2 inline-block">
              {inactiveBranchesSubtext}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg group-hover:rotate-6 duration-300">
            <Building2 size={22} />
          </div>
        </div>
      </div>

      {/* ── Main content view card ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        {/* Header bar with Search, Admin Filter, and Refresh */}
        <div className="px-8 py-6 bg-white border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row flex-1 items-center gap-3 w-full">
            {/* Search Input */}
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search branches by name, code or city..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-xs font-black uppercase tracking-wider text-slate-800 outline-none focus:bg-white transition-all placeholder:text-slate-300"
              />
            </div>

            <div className="h-8 w-px bg-slate-100 hidden sm:block mx-1" />

            {/* Custom Admin Filter Dropdown */}
            <div ref={dropdownRef} className="relative w-full sm:w-64">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-700 outline-none cursor-pointer shadow-sm hover:border-slate-300 focus:bg-white transition-all flex items-center justify-between min-h-[42px]"
              >
                <span className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-450" />
                  <span className="text-left font-black leading-none">
                    {selectedAdmin === 'all' 
                      ? 'ALL RESTAURANTS' 
                      : (() => {
                          const admin = admins && admins.find(a => a.email === selectedAdmin);
                          const name = admin 
                            ? (admin.name ? admin.name.replace('Admin - ', '') : (admin.restaurantName || admin.email))
                            : selectedAdmin;
                          return name.toUpperCase();
                        })()}
                  </span>
                </span>
                <ChevronDown size={13} className={`stroke-[2.5] text-slate-450 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-xl shadow-xl z-20 py-1.5 overflow-hidden max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAdmin('all');
                      setIsDropdownOpen(false);
                    }}
                    style={selectedAdmin === 'all' ? { backgroundColor: `${accentColor}12`, color: accentColor } : {}}
                    className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors duration-150 ${
                      selectedAdmin === 'all' 
                        ? 'font-extrabold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    ALL RESTAURANTS
                  </button>
                  {admins && admins.map(admin => {
                    const name = admin.name ? admin.name.replace('Admin - ', '') : (admin.restaurantName || admin.email);
                    const isSelected = selectedAdmin === admin.email;
                    return (
                      <button
                        key={admin.email}
                        type="button"
                        onClick={() => {
                          setSelectedAdmin(admin.email);
                          setIsDropdownOpen(false);
                        }}
                        style={isSelected ? { backgroundColor: `${accentColor}12`, color: accentColor } : {}}
                        className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-150 flex flex-col justify-start items-start gap-0.5 ${
                          isSelected 
                            ? 'font-extrabold' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <span className="font-black leading-none">{name.toUpperCase()}</span>
                        <span className={`text-[8px] font-bold tracking-normal lowercase leading-none mt-0.5 ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>{admin.email}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Branch List Table */}
        <div className="p-6">
          <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Branch Details</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Parent Restaurant</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Address</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">GST Number</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  /* Skeleton Loader rows */
                  [...Array(5)].map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-200" />
                          <div className="space-y-2 flex-1">
                            <div className="h-3 bg-slate-200 rounded w-28" />
                            <div className="h-2 bg-slate-200 rounded w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-24" />
                          <div className="h-2 bg-slate-200 rounded w-32" />
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          <div className="h-2.5 bg-slate-200 rounded w-28" />
                          <div className="h-2 bg-slate-200 rounded w-24" />
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-36" />
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="h-3 bg-slate-200 rounded w-20 mx-auto" />
                      </td>
                      <td className="px-8 py-5">
                        <div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredBranches.length > 0 ? (
                  filteredBranches.map(branch => (
                    <tr key={branch._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Branch Name & Code */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div 
                            style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                          >
                            {branch.branchName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-wide leading-none">{branch.branchName}</p>
                            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider block">
                              Code: {branch.branchCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Parent Restaurant */}
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-xs font-black text-slate-700 uppercase leading-none">{branch.adminName}</p>
                          <span className="text-[9px] font-bold text-slate-400 mt-1 block">
                            {branch.adminEmail}
                          </span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                            <Mail size={12} className="text-slate-450" />
                            <span>{branch.branchEmail}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                            <Phone size={12} className="text-slate-450" />
                            <span>{branch.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-8 py-5">
                        <div className="flex items-start gap-1.5 text-[10px] font-bold text-slate-500">
                          <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">
                            {branch.address}{branch.city ? `, ${branch.city}` : ''}{branch.state ? `, ${branch.state}` : ''}{branch.pincode ? ` - ${branch.pincode}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* GST Number */}
                      <td className="px-8 py-5 text-center">
                        <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {branch.gstNumber || 'N/A'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-8 py-5 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(branch.status)}`}>
                          {branch.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Building2 size={36} className="text-slate-300 animate-bounce" />
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">No Registered Branches Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
