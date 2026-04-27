import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'occupied'
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'occupied') {
      setActiveTab('occupied');
    } else {
      setActiveTab('all');
    }
  }, [searchParams]);

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

  const filteredTables = tables.filter(t => {
    const matchesSearch = t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.tableCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'occupied') {
      return matchesSearch && (t.status === 'Occupied' || t.status === 'Reserved');
    }
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredTables.length / itemsPerPage);
  const currentItems = filteredTables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Available': return 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100';
      case 'Occupied': return 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100';
      case 'Reserved': return 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100';
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
    <div className="h-screen flex flex-col bg-[#F8F9FA] overflow-hidden admin-layout">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
            <Grid size={20} strokeWidth={2.5} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none italic">Table Management</h1>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Floor Plan Control</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search nodes..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={async () => {
              const status = window.confirm("Reset all tables to Available?") ? "Available" : (window.confirm("Set all tables to Occupied?") ? "Occupied" : null);
              if (!status) return;
              try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/table/bulk-status`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` },
                  body: JSON.stringify({ status })
                });
                if (res.ok) { toast.success(`All tables are now ${status}`); fetchTables(); }
              } catch (err) { toast.error('Bulk update failed'); }
            }}
            className="h-10 px-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
          >
            <RefreshCw size={12} strokeWidth={3} />
            Bulk
          </button>

          <button 
            onClick={() => handleOpenModal()}
            className="h-10 px-5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
          >
            <Plus size={14} strokeWidth={3} />
            New Node
          </button>
        </div>
      </div>

      {/* High Density Layout Grid */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar bg-slate-50/30">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
             {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-slate-100 shadow-sm" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 content-start">
             {filteredTables.map((table) => (
               <motion.div 
                 layout
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 key={table._id} 
                 className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between h-44"
               >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                       <span className="p-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm shrink-0">
                          {getShapeIcon(table.shape)}
                       </span>
                       <button 
                          onClick={(e) => toggleStatus(e, table)}
                          className={`px-2 py-0.5 rounded-lg border font-black text-[7px] uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 shadow-sm ${getStatusStyle(table.status)}`}
                       >
                          {table.status === 'Damaged' ? <AlertTriangle size={8} /> : <div className={`w-1 h-1 rounded-full animate-pulse ${table.status === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'}`} />}
                          {table.status === 'Damaged' ? 'N/A' : table.status}
                       </button>
                    </div>
                    
                    <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-tight truncate">
                       {table.tableName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                       <Hash size={10} className="text-amber-500 shrink-0" />
                       <span className="text-[8px] font-black uppercase tracking-widest leading-none">{table.tableCode}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-50 gap-2">
                     <div className="flex gap-1.5">
                       <button onClick={() => handleOpenModal(table)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                          <Edit2 size={12} strokeWidth={2.5} />
                       </button>
                       <button onClick={() => { setTableToDelete(table); setIsDeleteModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                          <Trash2 size={12} strokeWidth={2.5} />
                       </button>
                       <button 
                          onClick={() => setSelectedQrTable(table)}
                          className="p-2 bg-slate-900 text-amber-400 rounded-lg hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                       >
                          <QrCode size={12} strokeWidth={2.5} />
                       </button>
                     </div>
                  </div>
                  
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-50 rounded-full group-hover:scale-[2.5] transition-all duration-700 opacity-20" />
               </motion.div>
             ))}
          </div>
        )}
      </div>

      {/* Modals */}
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



