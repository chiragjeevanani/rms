import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, MapPin, Mail, Phone, 
  Clock, ShieldCheck, User, Hash, Calendar,
  Edit3, Trash2, TrendingUp, Users, ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function BranchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ categories: 0, items: 0, combos: 0, modifiers: 0 });

  useEffect(() => {
    fetchBranchDetails();
  }, [id]);

  const fetchBranchDetails = async () => {
    try {
      // 1. Fetch Branch Info
      const branchRes = await fetch(`${import.meta.env.VITE_API_URL}/branches`);
      const branchResult = await branchRes.json();
      if (branchResult.success) {
        const found = branchResult.data.find(b => b._id === id);
        if (found) {
          setBranch(found);
          
          // 2. Fetch Stats for this branch
          // Note: In production, create a single stats endpoint. 
          // For now, we fetch from existing endpoints or simulate based on seeded data
          const [cats, items, combos, mods] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/category`).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL}/item`).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL}/combo`).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL}/modifier`).then(r => r.json()),
          ]);

          setStats({
            categories: cats.data?.filter(c => c.branchId === id).length || 0,
            items: items.data?.filter(i => i.branchId === id).length || 0,
            combos: combos.data?.filter(c => c.branchId === id).length || 0,
            modifiers: mods.data?.filter(m => m.branchId === id).length || 0,
          });
        } else {
          toast.error('Branch not found');
          navigate('/admin/branches');
        }
      }
    } catch (error) {
      toast.error('Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!branch) return null;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#F8FAFC] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/branches')}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{branch.branchName}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Branch Profile & Operational Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-6 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all">
            <Edit3 size={16} />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Status Bar at top of card */}
        <div className={`px-8 py-3 flex items-center justify-between border-b border-slate-50 ${
          branch.status === 'active' ? 'bg-emerald-50/30' : 'bg-rose-50/30'
        }`}>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Status:</p>
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              branch.status === 'active' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {branch.status}
            </span>
          </div>
          <div className={`w-2 h-2 rounded-full ${branch.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        </div>

        <div className="p-8 space-y-12">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <InfoItem icon={<Hash />} label="Branch Code" value={branch.branchCode} />
            <InfoItem icon={<User />} label="Branch Manager" value={branch.managerName || 'Not Assigned'} />
            <InfoItem icon={<Mail />} label="Communication Email" value={branch.branchEmail} />
            <InfoItem icon={<Phone />} label="Primary Contact" value={branch.phone} />
            <InfoItem icon={<ShieldCheck />} label="GST Number" value={branch.gstNumber || 'N/A'} />
            <InfoItem icon={<Clock />} label="Operational Hours" value={`${branch.openingTime} - ${branch.closingTime}`} />
          </div>

          {/* Address Section */}
          <div className="pt-8 border-t border-slate-50">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Physical Mapping</p>
                <p className="text-base font-bold text-slate-700 leading-relaxed">{branch.address}</p>
                <p className="text-[12px] font-black text-slate-400 uppercase mt-1 tracking-widest">
                  {branch.city}, {branch.state} - {branch.pincode}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Stats inside the same card */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-8 border-t border-slate-50">
            <StatsCard icon={<TrendingUp />} label="Categories" value={stats.categories} color="indigo" />
            <StatsCard icon={<ShoppingBag />} label="Menu Items" value={stats.items} color="emerald" />
            <StatsCard icon={<Users />} label="Combos" value={stats.combos} color="amber" />
            <StatsCard icon={<ShieldCheck />} label="Modifiers" value={stats.modifiers} color="indigo" />
            <StatsCard icon={<Users />} label="Staff" value="0" color="emerald" />
            <StatsCard icon={<TrendingUp />} label="Revenue" value="₹0" color="amber" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[13px] font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function StatsCard({ icon, label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center mb-4 border transition-all group-hover:scale-110`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function TimelineItem({ label, date, active }) {
  return (
    <div className="flex items-start gap-3 relative pb-6 last:pb-0">
      <div className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-slate-50 last:hidden" />
      <div className={`w-4 h-4 rounded-full border-2 ${active ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'} z-10`} />
      <div className="-mt-1">
        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{label}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{date}</p>
      </div>
    </div>
  );
}
