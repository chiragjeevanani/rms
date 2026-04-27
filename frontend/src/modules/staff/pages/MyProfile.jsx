import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCircle, 
  LogOut, 
  Shield, 
  ChevronRight, 
  Edit2, 
  Camera, 
  Save, 
  X, 
  CheckCircle2,
  AlertCircle,
  Key,
  Trash2,
  Lock,
  Loader2,
  Upload,
  Eye,
  EyeOff,
  Mail
} from 'lucide-react';
import { StaffNavbar } from '../components/StaffNavbar';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function MyProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  
  const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
  const staffId = staffInfo?._id;
  const token = localStorage.getItem('staff_access');

  const [formData, setFormData] = useState({
    name: '',
    profileImage: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!staffId) {
      navigate('/staff/login');
      return;
    }
    fetchProfile();
    fetchAttendance();
  }, [staffId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/${staffId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setFormData({ name: data.name, profileImage: data.profileImage || '' });
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/attendance/staff/${staffId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAttendanceHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('profileImg', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      const data = await res.json();
      if (res.ok) {
        const imageUrl = data.imageUrl;
        setFormData(prev => ({ ...prev, profileImage: imageUrl }));
        
        // Auto-save the image to profile immediately
        await fetch(`${import.meta.env.VITE_API_URL}/staff/${staffId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ...formData, profileImage: imageUrl })
        });

        toast.success('Image uploaded and synced');
        fetchProfile();
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('Network error during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/${staffId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Profile updated');
        setIsEditMode(false);
        fetchProfile();
      }
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/change-password/${staffId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });
      if (res.ok) {
        toast.success('Password changed successfully');
        setIsPasswordModalOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await res.json();
        toast.error(err.message);
      }
    } catch (err) {
      toast.error('Change password failed');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/staff/profile/${staffId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Account deleted');
        localStorage.removeItem('staff_access');
        navigate('/staff/login');
      }
    } catch (err) {
      toast.error('Delete account failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_access');
    navigate('/staff/login');
  };

  if (isLoading) {
    return (
       <div className="min-h-screen bg-white flex items-center justify-center p-10">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="p-4 bg-slate-900 rounded-2xl shadow-xl">
             <Loader2 className="text-white" size={32} strokeWidth={3} />
          </motion.div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col pb-32">
      <header className="bg-white px-8 pt-16 pb-12 border-b border-slate-100 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-slate-900/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[3.5rem] bg-slate-900 flex items-center justify-center text-white mb-6 shadow-2xl shadow-slate-900/20 overflow-hidden border-4 border-white transition-all duration-700 group-hover:scale-105">
               {formData.profileImage ? (
                  <img src={formData.profileImage} alt={formData.name} className="w-full h-full object-cover" />
               ) : (
                  <UserCircle size={64} strokeWidth={1} />
               )}
               {isUploading && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                     <Loader2 className="text-white animate-spin" size={24} />
                  </div>
               )}
            </div>
            <button 
               onClick={() => fileInputRef.current?.click()} 
               className="absolute bottom-6 -right-1 p-3 bg-slate-900 text-white rounded-2xl shadow-lg border-2 border-white hover:scale-110 active:scale-95 transition-all"
            >
               <Camera size={16} strokeWidth={2.5} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1 uppercase">{formData.name}</h1>
          <p className="text-[10px] font-bold text-slate-400 italic mb-4 lowercase tracking-tight flex items-center gap-2 justify-center">
             <Mail size={10} className="text-slate-300" />
             {profile.email}
          </p>
          <div className="flex items-center gap-2.5 px-4 py-1.5 bg-slate-100 rounded-2xl border border-slate-200/50">
            <Shield size={12} className="text-slate-600" strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{profile.role?.name || 'Staff Member'}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <div onClick={() => setIsEditMode(true)} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center gap-3 cursor-pointer hover:shadow-xl transition-all group">
            <Edit2 size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-base font-black text-slate-900">Edit Profile</span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Personal Info</p>
            </div>
          </div>
          <div onClick={() => setIsPasswordModalOpen(true)} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center gap-3 cursor-pointer hover:shadow-xl transition-all group">
            <Key size={24} className="text-amber-500 group-hover:rotate-12 transition-transform" />
            <div>
               <span className="text-base font-black text-slate-900">Security</span>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Change Password</p>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-[900] text-slate-500 uppercase tracking-[0.4em]">Recent Attendance</h2>
              <button onClick={() => navigate('/staff/attendance')} className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">View All <ChevronRight size={12} /></button>
           </div>
           
           <div className="space-y-3">
              {attendanceHistory.slice(0, 3).map((log, i) => (
                <div key={i} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                   <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black ${log.status === 'Present' || log.status === 'In' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                         <span className="text-[8px] uppercase tracking-tighter">{new Date(log.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                         <span className="text-lg leading-none">{new Date(log.date).getDate()}</span>
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{log.status} Today</span>
                      </div>
                   </div>
                   {log.status === 'Present' || log.status === 'In' ? <CheckCircle2 size={18} className="text-emerald-500" strokeWidth={3} /> : <AlertCircle size={18} className="text-rose-300" strokeWidth={3} />}
                </div>
              ))}
           </div>
        </section>

        {/* Settings & Session */}
        <section className="pt-10 space-y-4">
           <div className="flex flex-col gap-3">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout} 
                className="w-full py-5.5 bg-white text-slate-800 border border-slate-200 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
              >
                <LogOut size={16} strokeWidth={2.5} /> Logout System
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDeleteModalOpen(true)} 
                className="w-full py-5.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
              >
                <Trash2 size={16} strokeWidth={2.5} /> Delete Account
              </motion.button>
           </div>
           
           <div className="flex flex-col items-center gap-2 pt-6 opacity-20">
              <div className="w-12 h-[1px] bg-slate-900" />
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-900 text-center">
                Endpoint Secured: {staffId?.slice(-8)}
              </p>
           </div>
        </section>
      </main>

      {/* MODALS */}
      <AnimatePresence>
         {/* Edit Profile Modal */}
         {isEditMode && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-white rounded-[4rem] p-12 shadow-2xl relative border-t-8 border-slate-900">
               <button onClick={() => setIsEditMode(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-10">Update Profile</h3>
               <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Full Name</label>
                     <input type="text" className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 font-black text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/5 transition-all text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="pt-4">
                     <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all">
                        <Save size={18} /> Save Changes
                     </button>
                  </div>
               </form>
            </motion.div>
         </div>
         )}

         {/* Change Password Modal */}
         {isPasswordModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-white rounded-[4rem] p-12 shadow-2xl relative border-t-8 border-amber-400">
               <button onClick={() => setIsPasswordModalOpen(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X size={24} /></button>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-10">Security Settings</h3>
               <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Current Password</label>
                        <div className="relative group">
                           <input 
                              type={showCurrent ? 'text' : 'password'} 
                              required 
                              className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-8 pr-14 font-black text-slate-900 outline-none tracking-widest italic" 
                              value={passwordData.currentPassword} 
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                           />
                           <button 
                              type="button"
                              onClick={() => setShowCurrent(!showCurrent)}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
                           >
                              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                           </button>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">New Password</label>
                        <div className="relative group">
                           <input 
                              type={showNew ? 'text' : 'password'} 
                              required 
                              className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-8 pr-14 font-black text-slate-900 outline-none tracking-widest italic" 
                              value={passwordData.newPassword} 
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
                           />
                           <button 
                              type="button"
                              onClick={() => setShowNew(!showNew)}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
                           >
                              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                           </button>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Confirm New Password</label>
                        <div className="relative group">
                           <input 
                              type={showConfirm ? 'text' : 'password'} 
                              required 
                              className="w-full bg-slate-50 border-none rounded-2xl py-4.5 pl-8 pr-14 font-black text-slate-900 outline-none tracking-widest italic" 
                              value={passwordData.confirmPassword} 
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                           />
                           <button 
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
                           >
                              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                           </button>
                        </div>
                     </div>
                  </div>
                  <div className="pt-4">
                     <button type="submit" className="w-full bg-amber-400 text-slate-900 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-amber-400/20 flex items-center justify-center gap-4 active:scale-95 transition-all">
                        <Lock size={18} strokeWidth={2.5} /> Update Password
                     </button>
                  </div>
               </form>
            </motion.div>
         </div>
         )}

         {/* Delete Account Modal */}
         {isDeleteModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-rose-900/40 backdrop-blur-xl">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="w-full max-w-sm bg-white rounded-[4rem] p-12 shadow-2xl relative border-2 border-rose-100">
               <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                     <Trash2 size={40} />
                  </div>
                  <h3 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter">Delete Account?</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-relaxed">This action is permanent and your staff profile will be removed from the system.</p>
                  <div className="flex gap-4 pt-6">
                     <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-5 rounded-2xl bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cancel</button>
                     <button onClick={handleDeleteAccount} className="flex-[2] py-5 rounded-2xl bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-500/30">Confirm Delete</button>
                  </div>
               </div>
            </motion.div>
         </div>
         )}
      </AnimatePresence>

      <StaffNavbar activeTab="profile" />
    </div>
  );
}



