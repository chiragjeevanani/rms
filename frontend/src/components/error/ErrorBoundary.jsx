import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home, MessageCircle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 font-sans text-white">
          <div className="max-w-2xl w-full">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#141416] rounded-[3rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 text-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                  <AlertTriangle size={48} className="text-red-500" />
                </div>

                <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">
                  System <span className="text-red-500">Crash</span>
                </h1>
                
                <p className="text-slate-400 font-medium text-lg mb-8 leading-relaxed">
                  We've encountered a critical runtime error. The operational signal has been interrupted.
                </p>

                <div className="bg-black/40 rounded-2xl p-6 mb-10 border border-white/5 text-left font-mono text-sm overflow-x-auto">
                  <p className="text-red-400 font-bold mb-2">Error Log:</p>
                  <p className="text-slate-300 break-words">
                    {this.state.error?.toString() || 'Unknown runtime exception'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-3 bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                  >
                    <RefreshCcw size={18} />
                    Reboot System
                  </button>
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="flex items-center justify-center gap-3 bg-white/5 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <Home size={18} />
                    Return Home
                  </button>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-center gap-2 opacity-30">
                  <MessageCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Auto-Reporting Active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
