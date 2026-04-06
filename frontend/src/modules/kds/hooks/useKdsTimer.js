import { useState, useEffect } from 'react';

export function useKdsTimer(startTime, orderStatus, prepTime, readyTime, estimatedMinutes) {
  const [elapsed, setElapsed] = useState(0); 
  const [totalDuration, setTotalDuration] = useState(0);
  const [isNegative, setIsNegative] = useState(false);

  useEffect(() => {
    // 1. New Orders (Static/Paused state)
    if (orderStatus === 'new') {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const ingestDuration = Math.floor((now - start) / 1000);
      
      setTotalDuration(ingestDuration);
      
      if (estimatedMinutes) {
        setElapsed(estimatedMinutes * 60); // Show full estimate, no countdown yet
      } else {
        setElapsed(0); // Standard increment timer starts at 0
      }
      setIsNegative(false);
      return;
    }

    // 2. Finalized Duration (Locked state)
    if (['ready', 'completed', 'served'].includes(orderStatus)) {
      const start = new Date(prepTime || startTime).getTime();
      const end = new Date(readyTime || Date.now()).getTime();
      const actualSeconds = Math.floor((end - start) / 1000);
      
      setTotalDuration(actualSeconds);
      
      if (estimatedMinutes) {
        const estSecs = estimatedMinutes * 60;
        const remaining = estSecs - actualSeconds;
        setElapsed(Math.abs(remaining));
        setIsNegative(remaining < 0);
      } else {
        setElapsed(actualSeconds);
        setIsNegative(false);
      }
      return;
    }

    // 3. Active Tracking logic (Preparing stage)
    const baseTime = (orderStatus === 'preparing' && prepTime) ? prepTime : startTime;
    const start = new Date(baseTime).getTime();
    
    const update = () => {
      const now = Date.now();
      const actualSeconds = Math.floor((now - start) / 1000);
      setTotalDuration(actualSeconds);
      
      if (estimatedMinutes) {
        const estSecs = estimatedMinutes * 60;
        const remaining = estSecs - actualSeconds;
        setElapsed(Math.abs(remaining));
        setIsNegative(remaining < 0);
      } else {
        setElapsed(actualSeconds);
        setIsNegative(false);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);

  }, [startTime, orderStatus, prepTime, readyTime, estimatedMinutes]);

  const formatTime = (seconds) => {
    if (estimatedMinutes && isNegative && !['new', 'ready', 'completed', 'served'].includes(orderStatus)) {
      return "TIME OVER";
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDelayed = estimatedMinutes ? isNegative : totalDuration > 600;

  return { 
    elapsed, 
    totalDuration, 
    formatTime: formatTime(elapsed), 
    isDelayed, 
    isNegative 
  };
}
