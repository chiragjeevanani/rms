import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Grid, ChevronLeft, ChevronRight, CheckCircle2, Square, Circle, RectangleVertical as Rect, AlertTriangle, Hash, RefreshCw, QrCode, StickyNote, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from '../components/ui/AdminModal';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import CryptoJS from 'crypto-js';

const TABLE_SECRET = 'RMS_SECURE_DYNAMIC_PROTOCOL_2026';

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [selectedQrTable, setSelectedQrTable] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [formData, setFormData] = useState({
    tableName: '',
    tableCode: '',
    capacity: '',
    area: 'AC Hall',
    floor: 'Ground Floor',
    shape: 'Square',
    status: 'Available',
    notes: ''
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/table`);
      const data = await res.json();
      setTables(data);
    } catch (err) {
      toast.error('Failed to fetch table layout');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/table/${tableToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });
      if (res.ok) {
        toast.success('Table removed');
        fetchTables();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const generateNewCode = () => {
    const code = `TBL-${Math.floor(Math.random() * 9000) + 1000}`;
    setFormData({ ...formData, tableCode: code });
  };

  const toggleStatus = async (e, table) => {
    e.stopPropagation();
    const newStatus = table.status === 'Damaged' ? 'Available' : 'Damaged';
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/table/${table._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Table is now ${newStatus === 'Available' ? 'Available' : 'under repair'}`);
        fetchTables();
      }
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const handleOpenModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        tableName: table.tableName,
        tableCode: table.tableCode,
        capacity: table.capacity,
        area: table.area,
        floor: table.floor || 'Ground Floor',
        shape: table.shape || 'Square',
        status: table.status === 'Damaged' ? 'Not Available' : 'Available',
        notes: table.notes || ''
      });
    } else {
      setEditingTable(null);
      setFormData({ 
        tableName: '', 
        tableCode: `TBL-${Math.floor(Math.random() * 9000) + 1000}`,
        capacity: '', 
        area: 'AC Hall', 
        floor: 'Ground Floor', 
        shape: 'Square', 
        status: 'Available', 
        notes: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingTable 
      ? `${import.meta.env.VITE_API_URL}/table/${editingTable._id}`
      : `${import.meta.env.VITE_API_URL}/table`;
    const method = editingTable ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({
           ...formData,
           status: formData.status === 'Not Available' ? 'Damaged' : 'Available'
        })
      });

      if (res.ok) {
        toast.success(editingTable ? 'Updated' : 'Created');
        fetchTables();
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("TableQRCode");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${selectedQrTable.tableCode}-QR.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Protocol URL Copied');
  };

  const getEncryptedUrl = (code) => {
    const cipher = CryptoJS.AES.encrypt(code, TABLE_SECRET).toString();
    return `${window.location.origin}/menu?t=${encodeURIComponent(cipher)}`;
  };

  const filteredTables = tables.filter(t => 
    t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.tableCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTables.length / itemsPerPage);
  const currentItems = filteredTables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Available': return 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100';
      case 'Damaged': return 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  const getShapeIcon = (shape) => {
    switch(shape) {
      case 'Round': return <Circle size={14} />;
      case 'Rectangle': return <Rect size={14} />;
      default: return <Square size={14} />;
    }
  };

  return (
    <div className="p-8 space-y-10 max-w-[1400px] mx-auto min-h-screen pb-40">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
                 <Grid size={22} strokeWidth={2.5} className="text-amber-400" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-tighter italic">Table Management</h1>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Restaurant ka layout aur table codes manage karein</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="h-14 px-8 bg-[#2C2C2C] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white group-hover:text-slate-900 transition-colors">
            <Plus size={16} strokeWidth={3} />
          </div>
          Add New Table
        </button>
      </div>

      {/* Modern Search */}
      <div className="bg-white/40 backdrop-blur-md sticky top-0 z-10 py-4 -mx-4 px-4 border-b border-transparent">
        <div className="relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by code or name..."
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Layout Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[1, 2, 3].map(i => (
             <div key={i} className="bg-white rounded-[3rem] h-64 animate-pulse border border-slate-100 shadow-sm" />
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {currentItems.map((table) => (
             <motion.div 
               layout
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               key={table._id} 
               className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden"
             >
                <div className="mb-6">
                   <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                         <span className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm shrink-0">
                            {getShapeIcon(table.shape)}
                         </span>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{table.floor}</span>
                      </div>
                      <button 
                         onClick={(e) => toggleStatus(e, table)}
                         className={`px-3 py-1.5 rounded-xl border font-black text-[8px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 shadow-sm ${getStatusStyle(table.status)}`}
                      >
                         {table.status === 'Damaged' ? <AlertTriangle size={8} /> : <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />}
                         {table.status === 'Damaged' ? 'Not Available' : 'Available'}
                      </button>
                   </div>
                   
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">
                      {table.tableName}
                   </h3>
                   <div className="flex items-center gap-2 text-slate-400">
                      <Hash size={10} className="text-amber-500 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-widest leading-none">{table.tableCode}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className="bg-slate-50/50 py-3 px-4 rounded-2xl border border-slate-50 text-center">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Capacity</p>
                      <p className="font-black text-slate-900 text-[11px] tracking-tight">{table.capacity} SEATER</p>
                   </div>
                   <div className="bg-slate-50/50 py-3 px-4 rounded-2xl border border-slate-50 text-center">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Area</p>
                      <p className="font-black text-slate-900 text-[9px] truncate uppercase">{table.area}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                   <div className="flex gap-2">
                     <button onClick={() => handleOpenModal(table)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <Edit2 size={14} strokeWidth={2.5} />
                     </button>
                     <button onClick={() => { setTableToDelete(table); setIsDeleteModalOpen(true); }} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                        <Trash2 size={14} strokeWidth={2.5} />
                     </button>
                     <button 
                        onClick={() => setSelectedQrTable(table)}
                        className="p-3 bg-slate-900 text-amber-400 rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                     >
                        <QrCode size={14} strokeWidth={2.5} />
                     </button>
                   </div>
                   <div className="flex items-center gap-2 bg-slate-50 text-slate-400 border border-slate-100 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                      <CheckCircle2 size={10} className="text-emerald-400" /> SYSTEM SYNC
                   </div>
                </div>
                
                {/* Visual Floor Decor */}
                <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-slate-100 rounded-full group-hover:scale-[3] transition-all duration-700 opacity-30" />
             </motion.div>
           ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredTables.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-2 pt-10">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(d => d - 1)} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm disabled:opacity-30"><ChevronLeft size={18}/></button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(d => d + 1)} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm disabled:opacity-30"><ChevronRight size={18}/></button>
        </div>
      )}

      {/* QR Modal */}
      <AdminModal
        isOpen={!!selectedQrTable}
        onClose={() => setSelectedQrTable(null)}
        title="Table QR Protocol"
        subtitle={`Unique scannable access for ${selectedQrTable?.tableName}`}
      >
        <div className="flex flex-col items-center p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
           <div className="p-6 bg-white rounded-3xl shadow-2xl border-4 border-slate-900 mb-8 overflow-hidden">
              {selectedQrTable && (
                <QRCode 
                  id="TableQRCode"
                  value={getEncryptedUrl(selectedQrTable.tableCode)}
                  size={256}
                  level="H"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              )}
           </div>
           
           <div className="text-center mb-6 w-full px-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                 <Hash size={12} className="text-amber-500" />
                 <span className="text-base font-black text-slate-900 tracking-tight uppercase">{selectedQrTable?.tableCode}</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white border border-slate-100 p-2 rounded-xl group/url cursor-pointer hover:border-slate-300 transition-colors" onClick={() => copyToClipboard(getEncryptedUrl(selectedQrTable?.tableCode))}>
                <p className="text-[10px] font-bold text-slate-400 tracking-tight truncate max-w-[200px]">
                   {getEncryptedUrl(selectedQrTable?.tableCode)}
                </p>
                <div className="p-1.5 bg-slate-50 rounded-lg group-hover/url:bg-slate-900 group-hover/url:text-white transition-all text-slate-400">
                   <Copy size={10} />
                </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={downloadQR}
                className="py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                Download PNG
              </button>
              <button 
                onClick={() => setSelectedQrTable(null)}
                className="py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                Close
              </button>
           </div>
        </div>
      </AdminModal>

      {/* Form Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? 'Table Configuration' : 'Floor Plan Onboarding'}
        onSubmit={handleSave}
      >
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-amber-500 flex items-center gap-2">
                   <Hash size={10} /> Table Code
                </label>
                <div className="relative group">
                   <input 
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-black rounded-2xl outline-none focus:border-amber-500 tracking-widest pr-12 transition-all shadow-inner uppercase"
                    value={formData.tableCode}
                    onChange={(e) => setFormData({...formData, tableCode: e.target.value.toUpperCase()})}
                    placeholder="TBL-000"
                  />
                  <button type="button" onClick={generateNewCode} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-500"><RefreshCw size={14} /></button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold rounded-2xl outline-none focus:border-slate-900 transition-all shadow-inner uppercase"
                  value={formData.tableName}
                  onChange={(e) => setFormData({...formData, tableName: e.target.value.toUpperCase()})}
                  placeholder="e.g. TABLE A1"
                />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacity</label>
                <input type="number" required className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold rounded-2xl outline-none" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} placeholder="Seats"/>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Area</label>
                <select className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-bold rounded-2xl outline-none" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})}>
                  <option value="AC Hall">Main AC Hall</option>
                  <option value="Outdoor">Outdoor Deck</option>
                  <option value="Roof Top">Roof Top</option>
                </select>
              </div>
           </div>
           
           <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Apply Changes</button>
        </div>
      </AdminModal>

      {/* Delete Modal */}
      <AdminModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Decommission Table"
        variant="danger"
      >
        <div className="space-y-6">
           <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 text-center">
              <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Confirm permanent removal of node {tableToDelete?.tableCode}</p>
           </div>
           <button onClick={confirmDelete} className="w-full py-4 bg-rose-500 text-white font-black text-[10px] uppercase rounded-xl shadow-lg">Confirm Delete</button>
        </div>
      </AdminModal>
    </div>
  );
}



