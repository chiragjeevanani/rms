import { Routes, Route, Navigate } from 'react-router-dom';
import KdsDashboard from '../pages/KdsDashboard';

export default function KdsRoutes() {
  return (
    <Routes>
      <Route path="/" element={<KdsDashboard />} />
      <Route path="/dashboard" element={<KdsDashboard />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
