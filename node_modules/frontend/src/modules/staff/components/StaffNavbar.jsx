import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, ClipboardList, Bell, User, LogOut, Settings } from 'lucide-react';

export function StaffNavbar({ activeTab }) {
  const navigate = useNavigate();

  const tabs = [
    { id: 'tables', icon: LayoutGrid, label: 'Tables', path: '/staff/dashboard' },
    { id: 'orders', icon: ClipboardList, label: 'KDS', path: '/staff/active-orders' },
    { id: 'notifications', icon: Bell, label: 'Alerts', path: '/staff/alerts' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <nav className="bg-white/95 backdrop-blur-3xl border border-slate-200 px-4 py-3 rounded-[2rem] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-1.5 flex-1 pr-4 border-r border-slate-100">
           {tabs.map((tab) => {
             const isActive = activeTab === tab.id;
             return (
               <motion.button
                 key={tab.id}
                 whileTap={{ scale: 0.9 }}
                 onClick={() => navigate(tab.path)}
                 className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                   isActive ? 'bg-slate-900 text-white shadow-lg' : 'bg-transparent text-slate-400 hover:text-slate-600'
                 }`}
               >
                 <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                 {isActive && <span className="font-bold text-[11px] tracking-tight">{tab.label}</span>}
               </motion.button>
             );
           })}
        </div>

        <div className="flex items-center gap-3 pl-4">
          <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-200">
            <Settings size={18} />
          </button>
          <button 
            onClick={() => navigate('/staff/login')}
            className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>
    </div>
  );
}
