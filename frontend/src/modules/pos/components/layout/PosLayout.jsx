import { usePos } from '../../context/PosContext';
import { Outlet } from 'react-router-dom';
import PosSidebar from '../navigation/PosSidebar';

export default function PosLayout() {
  const { isSidebarOpen, closeSidebar } = usePos();

  return (
    <div className="flex h-screen bg-[#F4F4F7] overflow-hidden relative">
      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      <PosSidebar isOpen={isSidebarOpen} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
