import React, { useState, useEffect } from 'react';

export default function DebugOverlay() {
  const [errors, setErrors] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleError = (event) => {
      const errorMsg = event.error?.message || event.message || 'Unknown Error';
      const stack = event.error?.stack || '';
      setErrors(prev => [...prev, { message: errorMsg, stack, time: new Date().toLocaleTimeString() }]);
      setIsVisible(true);
    };

    const handleRejection = (event) => {
      setErrors(prev => [...prev, { message: `Promise Rejection: ${event.reason}`, time: new Date().toLocaleTimeString() }]);
      setIsVisible(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (!isVisible || errors.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[99999] bg-red-600 text-white p-4 rounded-2xl shadow-2xl max-h-[40vh] overflow-y-auto font-mono text-[10px]">
      <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-2">
        <span className="font-bold uppercase tracking-widest">⚠️ App Errors ({errors.length})</span>
        <button onClick={() => setIsVisible(false)} className="bg-white/20 px-2 py-1 rounded-md text-[8px]">CLOSE</button>
      </div>
      {errors.map((err, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 px-1 rounded">{err.time}</span>
            <span className="font-bold break-all">{err.message}</span>
          </div>
          {err.stack && (
            <pre className="text-[8px] opacity-60 overflow-x-auto whitespace-pre-wrap">
              {err.stack.split('\n').slice(0, 3).join('\n')}
            </pre>
          )}
        </div>
      ))}
      <button 
        onClick={() => setErrors([])} 
        className="w-full mt-2 bg-white text-red-600 font-bold py-1 rounded-lg uppercase"
      >
        Clear All
      </button>
    </div>
  );
}
