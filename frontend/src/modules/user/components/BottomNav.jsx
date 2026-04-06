import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: UtensilsCrossed, label: 'Menu', path: '/menu' },
  ];

  return (
    <></>
  );
}
