import { Routes, Route } from 'react-router-dom';
import PosDashboard from '../pages/PosDashboard';

export default function PosRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PosDashboard />} />
    </Routes>
  );
}
