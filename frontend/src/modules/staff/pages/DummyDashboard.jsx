import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  ShoppingBag, 
  IndianRupee, 
  Map, 
  Users,
  Compass,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StaffNavbar } from '../components/StaffNavbar';

export default function DummyDashboard() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col pb-32 font-sans text-slate-800">
      {/* Top Header */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{today}</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <LayoutGrid size={24} className="text-slate-900" /> Static Hub
            </h1>
          </div>
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg mx-auto w-full p-6 space-y-8 animate-in fade-in duration-700">
        
        {/* Welcome Banner */}
        <section className="relative overflow-hidden bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-900/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative z-10 space-y-3">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Demo Mode
            </span>
            <h2 className="text-3xl font-black tracking-tight mt-2 leading-none uppercase">
              Welcome to Dashboard
            </h2>
            <p className="text-slate-400 text-[11px] font-medium leading-relaxed uppercase tracking-wider">
              Static Mockup Environment. No API connections or dynamic endpoints are being initialized.
            </p>
          </div>
        </section>

        {/* Static Metrics Grid */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Performance Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            
            {/* Sales Card */}
            <div className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <IndianRupee size={20} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Est. Sales</span>
                <span className="text-2xl font-black text-slate-900">₹12,450</span>
              </div>
            </div>

            {/* Orders Card */}
            <div className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <ShoppingBag size={20} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Orders</span>
                <span className="text-2xl font-black text-slate-900">38 Completed</span>
              </div>
            </div>

            {/* Tables Card */}
            <div className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Map size={20} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Occupancy</span>
                <span className="text-2xl font-black text-slate-900">08 / 12 Active</span>
              </div>
            </div>

            {/* Staff Card */}
            <div className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Users size={20} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Team Logged</span>
                <span className="text-2xl font-black text-slate-900">05 Waiters</span>
              </div>
            </div>

          </div>
        </section>

        {/* Action Panel */}
        <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center border border-slate-100">
            <Compass size={28} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Navigation Portal</h4>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
              Press buttons below to move to main panels.
            </p>
          </div>
        </section>

      </main>

      <StaffNavbar activeTab="dashboard" />
    </div>
  );
}
