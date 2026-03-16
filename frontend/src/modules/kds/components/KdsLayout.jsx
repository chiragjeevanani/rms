import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../user/context/ThemeContext';
import KdsSidebar from '../components/KdsSidebar';

export default function KdsLayout() {
  const { isDarkMode } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <KdsSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 transition-all duration-300 flex flex-col h-screen overflow-hidden ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Outlet />
      </main>
    </div>
  );
}

