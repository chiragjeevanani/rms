import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Camera, Save, Loader2, Lock, 
  ShieldCheck, ShieldAlert, Key, Eye, EyeOff, Package 
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AccountSettings() {
  // Profile State
  const [admin, setAdmin] = useState({ name: '', email: '', profileImg: '', restaurantName: '', mobileNumber: '', address: '' });
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  // Security State
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/profile`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAdmin({
          name: data.name || '',
          email: data.email || '',
          profileImg: data.profileImg || '',
          restaurantName: data.restaurantName || '',
          mobileNumber: data.mobileNumber || '',
          address: data.address || ''
        });
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to fetch profile');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImg', file);

    setIsUploading(true);
    const toastId = toast.loading('Uploading to Cloudinary...');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setAdmin({ ...admin, profileImg: data.imageUrl });
        toast.success('Image uploaded successfully!', { id: toastId });
      } else {
        toast.error(data.message || 'Upload failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to upload image', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ 
          name: admin.name, 
          profileImg: admin.profileImg,
          restaurantName: admin.restaurantName,
          mobileNumber: admin.mobileNumber,
          address: admin.address
        })
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
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    setIsChangingPass(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ oldPassword: passwords.oldPassword, newPassword: passwords.newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPass(false);
    }
  };

  if (isProfileLoading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <Loader2 className="animate-spin text-amber-600" size={40} />
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-8">
         <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-stone-800">Account Settings</h1>
            <p className="text-stone-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic">Update your profile information and security password</p>
         </div>
         <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-sm">
            <div className="text-right">
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">Status</p>
               <p className="text-[11px] font-black text-green-600 uppercase mt-1">Logged In</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Profile Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-stone-200"
        >
          <div className="bg-[#2C2C2C] px-8 py-8 text-white relative flex items-center justify-between">
            <div>
               <h2 className="text-xl font-black uppercase tracking-widest leading-tight">Profile Details</h2>
               <p className="text-amber-400 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Personal Info</p>
            </div>
            <User size={24} className="text-white/20" />
          </div>

          <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
            <div className="flex flex-col items-center gap-4">
               <div className="relative group">
                  <div className="w-36 h-36 rounded-full border-4 border-stone-100 bg-stone-50 flex items-center justify-center overflow-hidden shadow-2xl relative z-10 transition-transform group-hover:scale-[1.02]">
                     {admin.profileImg ? (
                       <img src={admin.profileImg} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <User size={72} className="text-stone-200" />
                     )}
                     {isUploading && (
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                          <Loader2 className="animate-spin text-white" size={32} />
                       </div>
                     )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    type="button"
                    disabled={isUploading}
                    className="absolute bottom-1 right-1 z-20 p-3 bg-[#FFC107] text-stone-900 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-white disabled:opacity-50"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Camera size={20} />
                  </button>
               </div>
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic">Profile Picture</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="text" 
                    value={admin.name}
                    onChange={(e) => setAdmin({...admin, name: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Restaurant Name</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="text" 
                    value={admin.restaurantName}
                    onChange={(e) => setAdmin({...admin, restaurantName: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800"
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 opacity-70">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Email Address</label>
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

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Mobile Number</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="text" 
                    value={admin.mobileNumber}
                    onChange={(e) => setAdmin({...admin, mobileNumber: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800"
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Restaurant Address</label>
              <div className="relative">
                <div className="absolute left-4 top-4 text-stone-400">
                   <Mail size={18} />
                </div>
                <textarea 
                  value={admin.address}
                  onChange={(e) => setAdmin({...admin, address: e.target.value})}
                  rows={3}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800 resize-none"
                  placeholder="Enter restaurant address"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSavingProfile}
              className="w-full bg-[#2C2C2C] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
            >
              {isSavingProfile ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
            </button>
          </form>
        </motion.div>

        {/* Security Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-stone-200"
        >
          <div className="bg-[#2C2C2C] px-8 py-8 text-white relative flex items-center justify-between">
            <div>
               <h2 className="text-xl font-black uppercase tracking-widest leading-tight">Security</h2>
               <p className="text-amber-400 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Change Password</p>
            </div>
            <Lock size={24} className="text-white/20" />
          </div>

          <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
            <div className="flex items-center gap-4 bg-stone-50 p-6 rounded-3xl border border-stone-200">
               <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-500/20">
                  <ShieldAlert size={24} />
               </div>
               <div>
                  <p className="text-xs font-black text-stone-800 uppercase tracking-tight">Important Notice</p>
                  <p className="text-[10px] font-medium text-stone-500 mt-0.5">Please use a strong password to keep your account safe.</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input 
                      type={showPass.old ? "text" : "password"} 
                      value={passwords.oldPassword}
                      onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                      placeholder="Enter your current password"
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800"
                      required
                    />
                    <button type="button" onClick={() => setShowPass({...showPass, old: !showPass.old})} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-500">
                      {showPass.old ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-1">New Password</label>
                     <div className="relative">
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                       <input 
                         type={showPass.new ? "text" : "password"} 
                         value={passwords.newPassword}
                         onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                         placeholder="Enter new password"
                         className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800"
                         required
                       />
                       <button type="button" onClick={() => setShowPass({...showPass, new: !showPass.new})} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-500">
                         {showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-1">Confirm New Password</label>
                     <div className="relative">
                       <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                       <input 
                         type={showPass.confirm ? "text" : "password"} 
                         value={passwords.confirmPassword}
                         onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                         placeholder="Repeat new password"
                         className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-stone-800"
                         required
                       />
                       <button type="button" onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-500">
                         {showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isChangingPass}
                className="w-full bg-amber-500 text-stone-900 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
              >
                {isChangingPass ? <Loader2 className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> Update Password</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
