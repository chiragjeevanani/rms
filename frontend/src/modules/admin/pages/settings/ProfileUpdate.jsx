import React, { useState, useEffect } from 'react';
import { User, Mail, Camera, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ProfileUpdate() {
  const [admin, setAdmin] = useState({ name: '', email: '', profileImg: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setAdmin(data);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ name: admin.name, profileImg: admin.profileImg })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-amber-600" /></div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200"
      >
        <div className="bg-[#2C2C2C] px-8 py-10 text-white relative">
          <h2 className="text-2xl font-black uppercase tracking-widest">Update Profile</h2>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 text-amber-400">Account Management</p>
        </div>

        <form onSubmit={handleUpdate} className="p-8 space-y-8">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center gap-4 py-4">
             <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-stone-100 bg-stone-50 flex items-center justify-center overflow-hidden shadow-inner">
                   {admin.profileImg ? (
                     <img src={admin.profileImg} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <User size={64} className="text-stone-300" />
                   )}
                </div>
                <button 
                  type="button"
                  className="absolute bottom-0 right-0 p-2.5 bg-[#FFC107] text-stone-900 rounded-full shadow-lg hover:scale-110 transition-all border-4 border-white"
                  onClick={() => {
                    const url = prompt("Enter Image URL (Demo purposes):", admin.profileImg);
                    if (url !== null) setAdmin({...admin, profileImg: url});
                  }}
                >
                  <Camera size={18} />
                </button>
             </div>
             <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic">Admin Avatar</p>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1 leading-none">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="text" 
                  value={admin.name}
                  onChange={(e) => setAdmin({...admin, name: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1 leading-none">Email Address (Read-only)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="email" 
                  value={admin.email}
                  readOnly
                  className="w-full bg-stone-100 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none font-bold text-stone-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#2C2C2C] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 active:scale-[0.98]"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Profile Changes</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}



