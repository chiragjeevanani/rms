import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Monitor, 
  LogIn, 
  LogOut, 
  Edit2, 
  Trash2, 
  Save, 
  Shield,
  Users, 
  Zap, 
  X,
  UserCheck,
  UserX,
  History,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Lock,
  PlaneTakeoff,
  Coffee,
  Circle,
  MoreVertical,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import AdminModal from '../../components/ui/AdminModal';
import toast from 'react-hot-toast';
import BranchSelector from '../../components/BranchSelector';

export default function Attendance() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [staff, setStaff] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportScope, setReportScope] = useState('all'); // 'all' | 'staff'
  const [reportStaffId, setReportStaffId] = useState('');
  const [reportBranchId, setReportBranchId] = useState('all');
  const [reportTimeframe, setReportTimeframe] = useState('weekly'); // 'weekly' | 'monthly' | 'yearly' | 'all' | 'custom'
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'excel'

  const todayStr = new Date().toISOString().split('T')[0];
  const isSelectedDateToday = selectedDate === todayStr;

  useEffect(() => {
    fetchStaff();
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchAttendanceForDate();
  }, [selectedDate]);

  const fetchStaff = async () => {
    try {
      const [staffRes, branchRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/staff`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` } }),
        fetch((() => { const _rid = localStorage.getItem('admin_restaurantId'); return _rid ? `${import.meta.env.VITE_API_URL}/branches?restaurantId=${_rid}` : `${import.meta.env.VITE_API_URL}/branches`; })())
      ]);
      const staffData = await staffRes.json();
      const branchData = await branchRes.json();
      
      if (Array.isArray(staffData)) {
        setStaff(staffData.filter(s => s.status === 'Active'));
      }
      if (branchData.success) setBranches(branchData.data);
    } catch (err) {
      toast.error('Staff retrieval failure');
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/role`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
      });
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
       console.log(err);
    }
  };

  const fetchAttendanceForDate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/attendance/date/${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_access')}` }
      });
      const data = await res.json();
      setAttendanceRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Sync error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMark = async (staffId, status) => {
    if (!isSelectedDateToday) {
       return toast.error('Modifications restricted to current date');
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        },
        body: JSON.stringify({
          staffId,
          status,
          date: selectedDate,
          branchId: staff.find(s => s._id === staffId)?.branchId
        })
      });
      if (res.ok) {
        toast.success(`Marked as ${status}`);
        fetchAttendanceForDate();
      } else {
        const error = await res.json();
        toast.error(error.message);
      }
    } catch (err) {
      toast.error('Identity sync failure');
    }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const generatePDFDocument = async (records) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Clean White background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Accent top thin bar
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, pageWidth, 3, 'F');

    // Header Title (Slate-900 for light UI)
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RMS STAFF ATTENDANCE PULSE', 15, 15);

    // Accent Subtitle
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(8);
    doc.text('HIGH-FIDELITY ANALYTICAL REPORT', 15, 23);

    // Generated Date
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`GENERATED ON: ${new Date().toLocaleString()}`, 15, 31);
    
    let dateRangeLabel = '';
    if (reportTimeframe === 'weekly') dateRangeLabel = 'LAST 7 DAYS';
    else if (reportTimeframe === 'monthly') dateRangeLabel = 'LAST 30 DAYS';
    else if (reportTimeframe === 'yearly') dateRangeLabel = 'LAST 365 DAYS';
    else if (reportTimeframe === 'all') dateRangeLabel = 'ALL TIME';
    else dateRangeLabel = `${reportStartDate} TO ${reportEndDate}`;

    let branchLabel = 'ALL BRANCHES';
    if (reportBranchId !== 'all') {
      const selectedBranchObj = branches.find(b => b._id === reportBranchId);
      branchLabel = selectedBranchObj ? selectedBranchObj.branchName.toUpperCase() : 'SPECIFIC BRANCH';
    }
    
    doc.text(`TIMEFRAME: ${dateRangeLabel}`, 15, 37);

    // Premium Top-Right Highlight Badge for Branch
    const badgeWidth = 48;
    const badgeHeight = 11;
    const badgeX = pageWidth - 15 - badgeWidth;
    const badgeY = 8;

    // Light amber background fill and amber border
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(251, 191, 36); // amber-400
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');

    // Label inside badge (centered)
    doc.setTextColor(180, 83, 9); // amber-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('REPORT BRANCH LOCATION', badgeX + badgeWidth / 2, badgeY + 4, { align: 'center' });

    // Value inside badge (centered)
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(branchLabel, badgeX + badgeWidth / 2, badgeY + 8.5, { align: 'center' });

    // Calculate Summary Stats
    const totalRecords = records.length;
    const presentCount = records.filter(r => r.status === 'Present' || r.status === 'In').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    const leaveCount = records.filter(r => r.status === 'Leave').length;
    const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : '0.0';

    // Summary Cards container
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240); // slate-200 border
    doc.roundedRect(15, 55, pageWidth - 30, 26, 4, 4, 'FD');

    // Stats Labels (centered alignment to prevent right-edge overflow)
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL RECORDS', 33, 64, { align: 'center' });
    doc.text('PRESENT COUNT', 69, 64, { align: 'center' });
    doc.text('ABSENT COUNT', 105, 64, { align: 'center' });
    doc.text('ON LEAVE', 141, 64, { align: 'center' });
    doc.text('ATTENDANCE RATE', 177, 64, { align: 'center' });

    // Stats Values (centered alignment)
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFontSize(14);
    doc.text(totalRecords.toString(), 33, 73, { align: 'center' });
    
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text(presentCount.toString(), 69, 73, { align: 'center' });
    
    doc.setTextColor(239, 68, 68); // Red-500
    doc.text(absentCount.toString(), 105, 73, { align: 'center' });
    
    doc.setTextColor(59, 130, 246); // Blue-500
    doc.text(leaveCount.toString(), 141, 73, { align: 'center' });
    
    doc.setTextColor(245, 158, 11); // Amber-500
    doc.text(`${attendanceRate}%`, 177, 73, { align: 'center' });

    let startYForTable = 90;
    if (reportScope === 'staff' && records.length > 0) {
      const sample = records[0].staff;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, 85, pageWidth - 30, 14, 3, 3, 'FD');
      
      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFontSize(7);
      doc.text('PERSONNEL DISCOVERY IDENT', 23, 90);
      doc.text('ROLE CATEGORY', 93, 90);
      doc.text('ASSIGNED BRANCH', 143, 90);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text((sample?.name || 'N/A').toUpperCase(), 23, 95);
      doc.text((sample?.role?.name || 'OPERATIVE').toUpperCase(), 93, 95);
      
      const branchName = sample?.branchId?.branchName || records[0]?.branchId?.branchName || 'GLOBAL';
      doc.text(branchName.toUpperCase(), 143, 95);

      startYForTable = 105;
    }

    const tableHeaders = [
      'Date',
      'Name',
      'Role',
      'Branch',
      'Status',
      'Check-In',
      'Check-Out',
      'Hours Worked'
    ];

    const tableData = records.map(rec => {
      let checkInStr = '-';
      if (rec.checkIn) {
        checkInStr = new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      let checkOutStr = '-';
      if (rec.checkOut) {
        checkOutStr = new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      let hoursStr = '-';
      if (rec.checkIn && rec.checkOut) {
        const ms = new Date(rec.checkOut) - new Date(rec.checkIn);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        hoursStr = `${hours}h ${minutes}m`;
      }

      let statusText = rec.status || 'PENDING';
      if (statusText === 'In') statusText = 'PRESENT';
      else statusText = statusText.toUpperCase();

      const branch = rec.staff?.branchId?.branchName || rec.branchId?.branchName || 'Global';

      return [
        rec.date,
        rec.staff?.name || 'N/A',
        rec.staff?.role?.name || 'N/A',
        branch,
        statusText,
        checkInStr,
        checkOutStr,
        hoursStr
      ];
    });

    autoTable(doc, {
      startY: startYForTable,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        4: { fontStyle: 'bold' }
      },
      didParseCell: function(cellData) {
        if (cellData.column.index === 4 && cellData.cell.section === 'body') {
          const val = cellData.cell.raw;
          if (val === 'PRESENT') {
            cellData.cell.styles.textColor = [16, 185, 129];
          } else if (val === 'ABSENT') {
            cellData.cell.styles.textColor = [239, 68, 68];
          } else if (val === 'LEAVE') {
            cellData.cell.styles.textColor = [59, 130, 246];
          } else if (val === 'OUT') {
            cellData.cell.styles.textColor = [100, 116, 139];
          }
        }
      },
      margin: { left: 15, right: 15 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
      doc.text('CONFIDENTIAL - FOR INTERNAL ADMINISTRATION ONLY', 15, pageHeight - 10);
    }

    const filename = reportScope === 'staff' && records.length > 0 
      ? `attendance_report_${records[0].staff.name.replace(/\s+/g, '_').toLowerCase()}_${reportTimeframe}.pdf`
      : `attendance_report_all_staff_${reportTimeframe}.pdf`;
    doc.save(filename);
  };

  const generateExcelDocument = async (records) => {
    const { utils, writeFile } = await import('xlsx');

    let dateRangeLabel = '';
    if (reportTimeframe === 'weekly') dateRangeLabel = 'LAST 7 DAYS';
    else if (reportTimeframe === 'monthly') dateRangeLabel = 'LAST 30 DAYS';
    else if (reportTimeframe === 'yearly') dateRangeLabel = 'LAST 365 DAYS';
    else if (reportTimeframe === 'all') dateRangeLabel = 'ALL TIME';
    else dateRangeLabel = `${reportStartDate} TO ${reportEndDate}`;

    let branchLabel = 'ALL BRANCHES';
    if (reportBranchId !== 'all') {
      const selectedBranchObj = branches.find(b => b._id === reportBranchId);
      branchLabel = selectedBranchObj ? selectedBranchObj.branchName.toUpperCase() : 'SPECIFIC BRANCH';
    }

    const totalRecords = records.length;
    const presentCount = records.filter(r => r.status === 'Present' || r.status === 'In').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    const leaveCount = records.filter(r => r.status === 'Leave').length;
    const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : '0.0';

    const headerInfo = [
      ['RMS STAFF ATTENDANCE PULSE'],
      ['HIGH-FIDELITY ANALYTICAL REPORT'],
      [],
      ['REPORT METADATA'],
      ['GENERATED ON', new Date().toLocaleString()],
      ['TIMEFRAME', dateRangeLabel],
      ['BRANCH', branchLabel],
      [],
      ['SUMMARY STATISTICS'],
      ['TOTAL RECORDS', totalRecords],
      ['PRESENT COUNT', presentCount],
      ['ABSENT COUNT', absentCount],
      ['ON LEAVE', leaveCount],
      ['ATTENDANCE RATE', `${attendanceRate}%`],
      [],
    ];

    if (reportScope === 'staff' && records.length > 0) {
      const sample = records[0].staff;
      const branchName = sample?.branchId?.branchName || records[0]?.branchId?.branchName || 'GLOBAL';
      headerInfo.push(
        ['PERSONNEL INFORMATION'],
        ['NAME', (sample?.name || 'N/A').toUpperCase()],
        ['ROLE', (sample?.role?.name || 'OPERATIVE').toUpperCase()],
        ['ASSIGNED BRANCH', branchName.toUpperCase()],
        []
      );
    }

    const formattedData = records.map(rec => {
      let checkInStr = '-';
      if (rec.checkIn) {
        checkInStr = new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      let checkOutStr = '-';
      if (rec.checkOut) {
        checkOutStr = new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      let hoursStr = '-';
      if (rec.checkIn && rec.checkOut) {
        const ms = new Date(rec.checkOut) - new Date(rec.checkIn);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        hoursStr = `${hours}h ${minutes}m`;
      }

      let statusText = rec.status || 'PENDING';
      if (statusText === 'In') statusText = 'PRESENT';
      else statusText = statusText.toUpperCase();

      const branch = rec.staff?.branchId?.branchName || rec.branchId?.branchName || 'Global';

      return {
        'Date': rec.date,
        'Staff Name': rec.staff?.name || 'N/A',
        'Role': rec.staff?.role?.name || 'N/A',
        'Branch': branch,
        'Status': statusText,
        'Check-In': checkInStr,
        'Check-Out': checkOutStr,
        'Hours Worked': hoursStr
      };
    });

    const worksheet = utils.aoa_to_sheet(headerInfo);
    const dataStartRow = headerInfo.length + 1;
    utils.sheet_add_json(worksheet, formattedData, { origin: `A${dataStartRow}` });

    const range = utils.decode_range(worksheet['!ref']);
    const maxLens = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLen = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell_address = { c: C, r: R };
        const cell_ref = utils.encode_cell(cell_address);
        const cell = worksheet[cell_ref];
        if (cell && cell.v) {
          const valStr = String(cell.v);
          if (valStr.length > maxLen) {
            maxLen = valStr.length;
          }
        }
      }
      maxLens.push({ wch: Math.min(maxLen + 3, 40) });
    }
    worksheet['!cols'] = maxLens;

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Attendance Report");

    const filename = reportScope === 'staff' && records.length > 0 
      ? `attendance_report_${records[0].staff.name.replace(/\s+/g, '_').toLowerCase()}_${reportTimeframe}.xlsx`
      : `attendance_report_all_staff_${reportTimeframe}.xlsx`;
    
    writeFile(workbook, filename);
  };

  const handleExportReport = async () => {
    setIsGeneratingReport(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/attendance/report?rangeType=${reportTimeframe}`;
      if (reportScope === 'staff') {
        if (!reportStaffId) {
          toast.error('Please select a staff member');
          setIsGeneratingReport(false);
          return;
        }
        url += `&staffId=${reportStaffId}`;
      }
      if (reportBranchId !== 'all') {
        url += `&branchId=${reportBranchId}`;
      }
      if (reportTimeframe === 'custom') {
        if (!reportStartDate || !reportEndDate) {
          toast.error('Please select both start and end dates');
          setIsGeneratingReport(false);
          return;
        }
        url += `&startDate=${reportStartDate}&endDate=${reportEndDate}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access')}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve report data');
      }

      const data = await res.json();
      if (!data || data.length === 0) {
        toast.error('No attendance records found for this selection');
        setIsGeneratingReport(false);
        return;
      }

      if (exportFormat === 'excel') {
        await generateExcelDocument(data);
      } else {
        await generatePDFDocument(data);
      }
      setReportModalOpen(false);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Report generation failed');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'All' || (s.role && s.role.name === filterRole);
    const branchMatch = selectedBranchFilter === 'all' || (s.branchId?._id || s.branchId) === selectedBranchFilter;
    return matchesSearch && matchesRole && branchMatch;
  });

  const getStatus = (staffId) => {
    const record = attendanceRecords.find(r => r.staff?._id === staffId);
    if (!record) return 'PENDING';
    if (record.status === 'In') return 'PRESENT';
    return record.status.toUpperCase();
  };

  const getRecord = (staffId) => {
    return attendanceRecords.find(r => r.staff?._id === staffId);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-[1500px] mx-auto min-h-screen pb-40">
      
      {/* PERFECT BALANCED HEADER (Compact + High Readability) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
           <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg">
              <Zap size={20} strokeWidth={2.5} className="text-amber-400" />
           </div>
           <div>
              <h1 className="text-2xl font-[900] text-slate-900 tracking-tight uppercase leading-none">Attendance Pulse</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-80">Synchronized Personnel Tracking Hub</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-sm border border-slate-100">
              <button type="button" onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
              <button type="button" onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}><List size={16} /></button>
           </div>

           <div className="h-8 w-px bg-slate-100 hidden md:block" />

           <BranchSelector 
              branches={branches}
              selectedBranch={selectedBranchFilter}
              onSelect={setSelectedBranchFilter}
            />

            <button type="button" 
               onClick={() => {
                 setReportModalOpen(true);
                 setReportBranchId('all');
                 setReportScope('all');
                 if (staff.length > 0 && !reportStaffId) {
                   setReportStaffId(staff[0]._id);
                 }
               }} 
               className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all outline-none shrink-0"
            >
               <FileText size={14} className="text-amber-400" />
               Export Report
            </button>

            <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-100 min-w-[240px] justify-between">
               <button type="button" onClick={() => changeDate(-1)} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400"><ChevronLeft size={16} strokeWidth={3} /></button>
               <span className={`text-[11px] font-black uppercase tracking-widest tabular-nums ${isSelectedDateToday ? 'text-slate-900' : 'text-rose-500'}`}>
                 {new Date(selectedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
               </span>
               <button type="button" onClick={() => changeDate(1)} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400"><ChevronRight size={16} strokeWidth={3} /></button>
            </div>
        </div>
      </div>

      {/* Analytics (Compact) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Present Today', val: attendanceRecords.filter(r => r.status === 'Present' || r.status === 'In').length, color: 'text-emerald-500', icon: UserCheck, bg: 'bg-emerald-50/50' },
            { label: 'Units Absent', val: attendanceRecords.filter(r => r.status === 'Absent').length, color: 'text-rose-500', icon: UserX, bg: 'bg-rose-50/50' },
            { label: 'On Time Off', val: attendanceRecords.filter(r => r.status === 'Leave').length, color: 'text-blue-500', icon: PlaneTakeoff, bg: 'bg-blue-50/50' },
            { label: 'Pending Sync', val: staff.length - attendanceRecords.length, color: 'text-amber-500', icon: Clock, bg: 'bg-amber-50/50' },
            { label: 'Total Node Count', val: staff.length, color: 'text-slate-900', icon: Users, bg: 'bg-slate-50/50' }
          ].map((stat, i) => (
             <div key={i} className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 ${isLoading ? 'animate-pulse opacity-50' : ''}`}>
                <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center opacity-80`}>
                   <stat.icon size={16} strokeWidth={3} />
                </div>
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                   <p className={`text-lg font-black ${stat.color} leading-none tabular-nums`}>{isLoading ? '...' : stat.val}</p>
                </div>
             </div>
          ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text" 
              placeholder="QUERING PERSONNEL IDENTITY..."
              className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:border-slate-900 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-100 min-w-[280px]">
             {['All', 'Chef', 'Waiter', 'Manager'].map(role => (
                <button type="button" key={role} onClick={() => setFilterRole(role)} className={`flex-1 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filterRole === role ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>{role}</button>
             ))}
          </div>
      </div>

      {!isSelectedDateToday && (
         <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center gap-3 shadow-lg shadow-slate-900/10">
            <Lock size={14} className="text-amber-400" strokeWidth={3} />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80 italic">Temporal Security Protocol Active (ReadOnly)</p>
         </div>
      )}

      {/* Grid Design (Balanced Zoom) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
               Array(8).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4 animate-pulse">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                        <div className="space-y-2 flex-1">
                           <div className="h-3.5 bg-slate-100 rounded-full w-2/3" />
                           <div className="h-2.5 bg-slate-100 rounded-full w-1/3" />
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        <div className="h-14 bg-slate-50 rounded-xl" />
                        <div className="h-14 bg-slate-50 rounded-xl" />
                        <div className="h-14 bg-slate-50 rounded-xl" />
                     </div>
                  </div>
               ))
            ) : filteredStaff.length === 0 ? (
               <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 opacity-60 italic">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Zero Personnel Discovered in this sector</p>
               </div>
            ) : (
              filteredStaff.map((person) => {
                const status = getStatus(person._id);
                const isPresent = status === 'PRESENT';
                const isAbsent = status === 'ABSENT';
                const onLeave = status === 'LEAVE';

                return (
                  <m.div 
                    layout
                    key={person._id}
                    className={`bg-white rounded-[2rem] p-6 border shadow-sm relative overflow-hidden group transition-all duration-300 ${isPresent ? 'border-emerald-100' : isAbsent ? 'border-rose-100' : onLeave ? 'border-blue-100' : 'border-slate-100'}`}
                  >
                    <div className="flex items-start justify-between mb-8">
                       <div className="flex items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg transition-transform group-hover:scale-105 ${isPresent ? 'bg-emerald-500 shadow-emerald-50' : isAbsent ? 'bg-rose-500 shadow-rose-50' : onLeave ? 'bg-blue-600 shadow-blue-50' : 'bg-slate-900 shadow-slate-100'}`}>
                             {person.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5 truncate max-w-[120px]">{person.name}</h3>
                             <div className="flex items-center gap-1.5 opacity-60">
                                <Shield size={8} className="text-blue-500" />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{person.role?.name || 'Operative'}</p>
                             </div>
                             <div className="flex items-center gap-1.5 opacity-60 mt-0.5">
                                <MapPin size={8} className="text-amber-500" />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{person.branchId?.branchName || 'Global'}</p>
                             </div>
                          </div>
                       </div>
                       <div className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border ${isPresent ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isAbsent ? 'bg-rose-50 text-rose-600 border-rose-100' : onLeave ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-300 border-slate-50'}`}>
                          {status}
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                       <button type="button" 
                          disabled={!isSelectedDateToday}
                          onClick={() => handleMark(person._id, 'Present')}
                          className={`flex flex-col items-center gap-2 py-5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${isPresent ? 'bg-emerald-500 text-white shadow-md scale-[1.03]' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                       >
                          <UserCheck size={16} strokeWidth={3} /> {isPresent ? 'SELECTED' : 'PRESENT'}
                       </button>
                       <button type="button" 
                          disabled={!isSelectedDateToday}
                          onClick={() => handleMark(person._id, 'Absent')}
                          className={`flex flex-col items-center gap-2 py-5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${isAbsent ? 'bg-rose-500 text-white shadow-md scale-[1.03]' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                       >
                          <UserX size={16} strokeWidth={3} /> {isAbsent ? 'SELECTED' : 'ABSENT'}
                       </button>
                       <button type="button" 
                          disabled={!isSelectedDateToday}
                          onClick={() => handleMark(person._id, 'Leave')}
                          className={`flex flex-col items-center gap-2 py-5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${onLeave ? 'bg-blue-600 text-white shadow-md scale-[1.03]' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                       >
                          <PlaneTakeoff size={16} strokeWidth={3} /> {onLeave ? 'SELECTED' : 'LEAVE'}
                       </button>
                    </div>
                  </m.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                 <tr>
                    <th className="px-8 py-5">Personnel Nodes</th>
                    <th className="px-8 py-5 text-center">Current Mapping</th>
                    <th className="px-8 py-5 text-right">Rapid Controls</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                    Array(8).fill(0).map((_, i) => (
                       <tr key={i} className="animate-pulse opacity-50">
                          <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded w-1/3" /></td>
                          <td className="px-8 py-5 text-center"><div className="h-6 bg-slate-100 rounded w-1/4 mx-auto" /></td>
                          <td className="px-8 py-5 text-right"><div className="h-4 bg-slate-100 rounded w-32 ml-auto" /></td>
                       </tr>
                    ))
                 ) : (
                   filteredStaff.map((person) => {
                      const status = getStatus(person._id);
                      return (
                        <tr key={person._id} className="group hover:bg-slate-50/30 transition-all duration-300">
                           <td className="px-8 py-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-black shadow-md">{person.name.split(' ').map(n => n[0]).join('')}</div>
                                 <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{person.name}</p>
                              </div>
                           </td>
                           <td className="px-8 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest ${status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600' : status === 'ABSENT' ? 'bg-rose-50 text-rose-600' : status === 'LEAVE' ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-100 border border-slate-100'}`}>
                                 {status}
                              </span>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                 {isSelectedDateToday ? (
                                    <>
                                       <button type="button" onClick={() => handleMark(person._id, 'Present')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shadow-sm border border-emerald-100"><UserCheck size={14} /></button>
                                       <button type="button" onClick={() => handleMark(person._id, 'Absent')} className="p-2.5 bg-rose-50 text-rose-600 rounded-lg shadow-sm border border-rose-100"><UserX size={14} /></button>
                                       <button type="button" onClick={() => handleMark(person._id, 'Leave')} className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shadow-sm border border-blue-100"><PlaneTakeoff size={14} /></button>
                                    </>
                                 ) : (
                                    <Lock size={14} className="text-slate-100" />
                                 )}
                              </div>
                           </td>
                        </tr>
                      );
                   })
                 )}
              </tbody>
           </table>
        </div>
      )}

      {/* Report Generation Modal */}
      <AdminModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Attendance Reporting Engine"
        subtitle="Export high-fidelity analytical attendance documentation"
        maxWidth="max-w-md"
      >
        <div className="space-y-6 p-1 text-left">
          {/* Scope selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Report Scope</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                type="button"
                onClick={() => setReportScope('all')}
                className={`py-2 px-4 rounded-lg text-[9px] font-black uppercase transition-all ${
                  reportScope === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                All Staff
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportScope('staff');
                  const filtered = staff.filter(s => reportBranchId === 'all' || (s.branchId?._id || s.branchId) === reportBranchId);
                  if (filtered.length > 0) {
                    setReportStaffId(filtered[0]._id);
                  } else {
                    setReportStaffId('');
                  }
                }}
                className={`py-2 px-4 rounded-lg text-[9px] font-black uppercase transition-all ${
                  reportScope === 'staff' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Particular Staff
              </button>
            </div>
          </div>

          {/* Branch selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Branch</label>
            <select
              value={reportBranchId}
              onChange={(e) => {
                setReportBranchId(e.target.value);
                if (reportScope === 'staff') {
                  const filtered = staff.filter(s => e.target.value === 'all' || (s.branchId?._id || s.branchId) === e.target.value);
                  if (filtered.length > 0) {
                    setReportStaffId(filtered[0]._id);
                  } else {
                    setReportStaffId('');
                  }
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest focus:border-slate-900 outline-none transition-all"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.branchName}
                </option>
              ))}
            </select>
          </div>

          {/* Staff selection */}
          {reportScope === 'staff' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Staff Member</label>
              <select
                value={reportStaffId}
                onChange={(e) => setReportStaffId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest focus:border-slate-900 outline-none transition-all"
              >
                <option value="" disabled>Choose personnel…</option>
                {staff
                  .filter(s => reportBranchId === 'all' || (s.branchId?._id || s.branchId) === reportBranchId)
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.role?.name || 'Operative'})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Timeframe selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Timeframe</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'yearly', label: 'Yearly' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom Range' }
              ].map((timeframe) => (
                <button
                  key={timeframe.id}
                  type="button"
                  onClick={() => setReportTimeframe(timeframe.id)}
                  className={`py-2.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                    reportTimeframe === timeframe.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                      : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                  } ${timeframe.id === 'custom' ? 'col-span-2' : ''}`}
                >
                  {timeframe.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date inputs */}
          {reportTimeframe === 'custom' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Start Date</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-[10px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">End Date</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-[10px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-all"
                />
              </div>
            </div>
          )}

          {/* Export Format selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Export Format</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`py-2 px-4 rounded-lg text-[9px] font-black uppercase transition-all ${
                  exportFormat === 'pdf' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                PDF Document
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('excel')}
                className={`py-2 px-4 rounded-lg text-[9px] font-black uppercase transition-all ${
                  exportFormat === 'excel' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Excel Sheet
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="flex-1 py-3.5 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all text-slate-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isGeneratingReport}
              onClick={handleExportReport}
              className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingReport ? (
                <>
                  <Clock className="animate-spin" size={12} />
                  Generating...
                </>
              ) : exportFormat === 'excel' ? (
                <>
                  <FileSpreadsheet size={12} className="text-emerald-400" />
                  Download Excel
                </>
              ) : (
                <>
                  <FileText size={12} className="text-amber-400" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}



