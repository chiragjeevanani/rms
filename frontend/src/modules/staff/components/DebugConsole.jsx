import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Wifi,
  Trash2,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Bug,
  Filter,
  Play,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

export default function DebugConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'network'
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [networkLogs, setNetworkLogs] = useState([]);
  
  // Search & Filter state
  const [searchText, setSearchText] = useState('');
  const [logFilter, setLogFilter] = useState({
    log: true,
    info: true,
    warn: true,
    error: true,
  });
  const [netFilter, setNetFilter] = useState({
    success: true, // 2xx, 3xx
    error: true,   // 4xx, 5xx, FAILED
  });

  // Expanded item tracking
  const [expandedItems, setExpandedItems] = useState({}); // id -> boolean
  const [copiedId, setCopiedId] = useState(null);
  
  // Auto-scroll config
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef(null);

  // Sync with window storage
  useEffect(() => {
    setConsoleLogs([...(window.__debug_console_logs || [])]);
    setNetworkLogs([...(window.__debug_network_logs || [])]);

    const handleConsoleLog = (e) => {
      setConsoleLogs((prev) => {
        const next = [...prev, e.detail];
        if (next.length > 300) next.shift();
        return next;
      });
    };

    const handleNetworkLog = (e) => {
      setNetworkLogs((prev) => {
        const next = [...prev, e.detail];
        if (next.length > 300) next.shift();
        return next;
      });
    };

    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener('debug-new-console-log', handleConsoleLog);
    window.addEventListener('debug-new-network-log', handleNetworkLog);
    window.addEventListener('debug-toggle-panel', handleToggle);

    return () => {
      window.removeEventListener('debug-new-console-log', handleConsoleLog);
      window.removeEventListener('debug-new-network-log', handleNetworkLog);
      window.removeEventListener('debug-toggle-panel', handleToggle);
    };
  }, []);

  // Auto Scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleLogs, networkLogs, activeTab, isOpen, autoScroll]);

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearLogs = () => {
    if (activeTab === 'console') {
      window.__debug_console_logs = [];
      setConsoleLogs([]);
    } else {
      window.__debug_network_logs = [];
      setNetworkLogs([]);
    }
    setExpandedItems({});
  };

  const toggleLogFilter = (type) => {
    setLogFilter(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleNetFilter = (type) => {
    setNetFilter(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Filters calculations
  const filteredConsoleLogs = consoleLogs.filter(log => {
    if (!logFilter[log.type]) return false;
    if (searchText) {
      return log.message.toLowerCase().includes(searchText.toLowerCase()) || 
             log.type.toLowerCase().includes(searchText.toLowerCase());
    }
    return true;
  });

  const filteredNetworkLogs = networkLogs.filter(net => {
    const isError = net.isError || net.status === 'FAILED' || (typeof net.status === 'number' && net.status >= 400);
    if (isError && !netFilter.error) return false;
    if (!isError && !netFilter.success) return false;

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const urlMatch = net.url.toLowerCase().includes(searchLower);
      const methodMatch = net.method.toLowerCase().includes(searchLower);
      const statusMatch = String(net.status).toLowerCase().includes(searchLower);
      return urlMatch || methodMatch || statusMatch;
    }
    return true;
  });

  // Helper to extract path from full URL
  const getUrlPath = (urlStr) => {
    try {
      if (urlStr.startsWith('http') || urlStr.startsWith('//')) {
        const url = new URL(urlStr, window.location.origin);
        return url.pathname + url.search;
      }
      return urlStr;
    } catch (e) {
      return urlStr;
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 flex items-center justify-center shadow-2xl cursor-pointer hover:bg-slate-800 transition-colors"
          title="Open Debug Console"
        >
          <Bug size={22} className={isOpen ? "rotate-45" : ""} />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs flex justify-end"
            onClick={() => setIsOpen(false)}
          >
            {/* Slide-out Terminal Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-lg h-full bg-slate-950 text-slate-100 flex flex-col shadow-2xl border-l border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-cyan-400" />
                  <span className="font-bold text-sm tracking-tight uppercase text-slate-200">
                    Developer Terminal
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={clearLogs}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    title={`Clear ${activeTab === 'console' ? 'Console Logs' : 'Network Requests'}`}
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Tabs navigation */}
              <div className="flex border-b border-slate-800 bg-slate-900/50">
                <button
                  onClick={() => { setActiveTab('console'); setSearchText(''); }}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeTab === 'console'
                      ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal size={14} />
                  Console ({consoleLogs.length})
                </button>
                <button
                  onClick={() => { setActiveTab('network'); setSearchText(''); }}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeTab === 'network'
                      ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Wifi size={14} />
                  Network ({networkLogs.length})
                </button>
              </div>

              {/* Filter controls */}
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col gap-2.5">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={`Filter by ${activeTab === 'console' ? 'message / level' : 'URL / status / method'}...`}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
                  />
                </div>

                {/* Sub filters */}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter size={10} className="text-slate-500" />
                    {activeTab === 'console' ? (
                      <>
                        <button
                          onClick={() => toggleLogFilter('log')}
                          className={`px-2 py-0.5 rounded-sm font-semibold transition-colors cursor-pointer ${
                            logFilter.log ? 'bg-slate-800 text-slate-200' : 'bg-slate-950 text-slate-600'
                          }`}
                        >
                          log
                        </button>
                        <button
                          onClick={() => toggleLogFilter('info')}
                          className={`px-2 py-0.5 rounded-sm font-semibold transition-colors cursor-pointer ${
                            logFilter.info ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-950 text-slate-600'
                          }`}
                        >
                          info
                        </button>
                        <button
                          onClick={() => toggleLogFilter('warn')}
                          className={`px-2 py-0.5 rounded-sm font-semibold transition-colors cursor-pointer ${
                            logFilter.warn ? 'bg-amber-950 text-amber-400' : 'bg-slate-950 text-slate-600'
                          }`}
                        >
                          warn
                        </button>
                        <button
                          onClick={() => toggleLogFilter('error')}
                          className={`px-2 py-0.5 rounded-sm font-semibold transition-colors cursor-pointer ${
                            logFilter.error ? 'bg-red-950/65 text-red-400' : 'bg-slate-950 text-slate-600'
                          }`}
                        >
                          error
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleNetFilter('success')}
                          className={`px-2 py-0.5 rounded-sm font-semibold transition-colors cursor-pointer ${
                            netFilter.success ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-950 text-slate-600'
                          }`}
                        >
                          Success (2xx/3xx)
                        </button>
                        <button
                          onClick={() => toggleNetFilter('error')}
                          className={`px-2 py-0.5 rounded-sm font-semibold transition-colors cursor-pointer ${
                            netFilter.error ? 'bg-red-950 text-red-400' : 'bg-slate-950 text-slate-600'
                          }`}
                        >
                          Error/Failed
                        </button>
                      </>
                    )}
                  </div>

                  <label className="flex items-center gap-1.5 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="accent-cyan-500 rounded-sm"
                    />
                    <span>Auto-scroll</span>
                  </label>
                </div>
              </div>

              {/* Console / Network Logs Body */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[11px] bg-slate-950/80 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-800"
              >
                {activeTab === 'console' ? (
                  /* Console List */
                  filteredConsoleLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-xs italic">
                      No matching console logs found.
                    </div>
                  ) : (
                    filteredConsoleLogs.map((log) => {
                      let typeColor = 'text-slate-400';
                      let bgColor = 'bg-transparent';
                      let icon = null;

                      if (log.type === 'error') {
                        typeColor = 'text-red-400';
                        bgColor = 'bg-red-950/20 border-l border-red-500';
                      } else if (log.type === 'warn') {
                        typeColor = 'text-amber-400';
                        bgColor = 'bg-amber-950/15 border-l border-amber-500';
                      } else if (log.type === 'info') {
                        typeColor = 'text-cyan-400';
                        bgColor = 'bg-cyan-950/10 border-l border-cyan-500';
                      }

                      const isExpanded = expandedItems[log.id];

                      return (
                        <div
                          key={log.id}
                          className={`p-1.5 rounded-sm transition-colors border-b border-slate-900/50 flex flex-col gap-1 ${bgColor} hover:bg-slate-900/40`}
                        >
                          <div
                            onClick={() => toggleExpand(log.id)}
                            className="flex items-start gap-1.5 cursor-pointer"
                          >
                            <span className="text-slate-600 shrink-0 select-none">
                              [{log.timestamp}]
                            </span>
                            <span className={`font-black shrink-0 ${typeColor}`}>
                              {log.type.toUpperCase()}:
                            </span>
                            <span className="text-slate-300 break-all line-clamp-3">
                              {isExpanded ? log.message : log.message.substring(0, 150) + (log.message.length > 150 ? '...' : '')}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="mt-1.5 p-2 bg-slate-900 rounded-sm border border-slate-800 relative group overflow-x-auto max-w-full">
                              <pre className="text-slate-300 whitespace-pre-wrap break-all leading-normal">
                                {log.message}
                              </pre>
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => copyToClipboard(log.id, log.message)}
                                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-sm cursor-pointer"
                                  title="Copy content"
                                >
                                  {copiedId === log.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )
                ) : (
                  /* Network List */
                  filteredNetworkLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-xs italic">
                      No matching network requests found.
                    </div>
                  ) : (
                    filteredNetworkLogs.map((net) => {
                      const isError = net.isError || net.status === 'FAILED' || (typeof net.status === 'number' && net.status >= 400);
                      const isExpanded = expandedItems[net.id];

                      let statusColor = 'bg-emerald-950 text-emerald-400 border-emerald-800';
                      if (isError) {
                        statusColor = 'bg-red-950 text-red-400 border-red-900';
                      } else if (typeof net.status === 'string' && net.status === 'PENDING') {
                        statusColor = 'bg-amber-950 text-amber-400 border-amber-800';
                      }

                      let methodColor = 'text-cyan-400 bg-cyan-950 border-cyan-900';
                      if (net.method === 'POST') methodColor = 'text-purple-400 bg-purple-950 border-purple-900';
                      if (net.method === 'PUT') methodColor = 'text-yellow-400 bg-yellow-950 border-yellow-900';
                      if (net.method === 'DELETE') methodColor = 'text-red-400 bg-red-950 border-red-900';

                      return (
                        <div
                          key={net.id}
                          className={`border border-slate-900 rounded-lg overflow-hidden ${
                            isExpanded ? 'bg-slate-900/60' : 'bg-slate-950 hover:bg-slate-900/30'
                          }`}
                        >
                          <div
                            onClick={() => toggleExpand(net.id)}
                            className="p-2 flex items-center justify-between gap-2 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-black border uppercase shrink-0 ${methodColor}`}>
                                {net.method}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold border shrink-0 ${statusColor}`}>
                                {net.status}
                              </span>
                              <span className="text-slate-300 font-medium truncate text-xs">
                                {getUrlPath(net.url)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-slate-500 text-[10px]">{net.duration}ms</span>
                              {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-3 border-t border-slate-900 space-y-3 bg-slate-950 text-xs">
                              {/* Full Request URL */}
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                  Full Request URL
                                </span>
                                <div className="flex items-center gap-1.5 text-cyan-400 hover:underline cursor-pointer select-all break-all">
                                  <span>{net.url}</span>
                                  <a href={net.url} target="_blank" rel="noreferrer">
                                    <ExternalLink size={10} />
                                  </a>
                                </div>
                              </div>

                              {/* Time & Duration info */}
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                                <div>
                                  <span className="font-bold text-slate-500 uppercase block">Timestamp</span>
                                  <span>{net.timestamp}</span>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-500 uppercase block">Response Time</span>
                                  <span className="text-amber-400 font-bold">{net.duration} ms</span>
                                </div>
                              </div>

                              {/* Request Body Payload */}
                              {net.requestBody && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      Request Parameters (JSON/Form)
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(`${net.id}-req`, safeStringify(net.requestBody, 2))}
                                      className="p-1 hover:bg-slate-900 rounded-sm text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[9px]"
                                    >
                                      {copiedId === `${net.id}-req` ? (
                                        <>
                                          <Check size={10} className="text-emerald-400" />
                                          Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={10} />
                                          Copy
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <pre className="p-2 bg-slate-900 border border-slate-800 rounded-sm text-[10px] text-purple-300 overflow-x-auto whitespace-pre-wrap max-h-40 break-all select-text font-mono">
                                    {safeStringify(net.requestBody, 2)}
                                  </pre>
                                </div>
                              )}

                              {/* Response Payload */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Response Data
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(`${net.id}-res`, typeof net.responseBody === 'object' ? safeStringify(net.responseBody, 2) : String(net.responseBody))}
                                    className="p-1 hover:bg-slate-900 rounded-sm text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[9px]"
                                  >
                                    {copiedId === `${net.id}-res` ? (
                                      <>
                                        <Check size={10} className="text-emerald-400" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={10} />
                                        Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-2 bg-slate-900 border border-slate-800 rounded-sm text-[10px] text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-56 break-all select-text font-mono">
                                  {typeof net.responseBody === 'object'
                                    ? safeStringify(net.responseBody, 2)
                                    : String(net.responseBody)
                                  }
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
