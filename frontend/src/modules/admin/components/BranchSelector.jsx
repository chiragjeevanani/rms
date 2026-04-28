import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BranchSelector = ({ branches, selectedBranch, onSelect, showAll = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedBranchData = branches.find(b => b._id === selectedBranch);
  const label = selectedBranch === 'all' ? 'All Branches' : (selectedBranchData?.branchName || 'Select Branch');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all active:scale-95 group"
      >
        <div className="p-1.5 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-amber-500 transition-colors">
          <Building2 size={14} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 min-w-[120px] text-left">
          {label}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 w-full min-w-[200px] bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-[100] overflow-hidden p-2"
          >
            <div className="max-h-[240px] overflow-y-auto thin-scrollbar">
              {showAll && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect('all');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedBranch === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  All Branches
                  {selectedBranch === 'all' && <Check size={12} />}
                </button>
              )}
              {branches.map((branch) => (
                <button
                  key={branch._id}
                  type="button"
                  onClick={() => {
                    onSelect(branch._id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-1 ${selectedBranch === branch._id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="truncate">{branch.branchName}</span>
                  {selectedBranch === branch._id && <Check size={12} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BranchSelector;
