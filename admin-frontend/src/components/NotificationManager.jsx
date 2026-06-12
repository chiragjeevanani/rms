import { useEffect } from 'react';

export default function NotificationManager({ role, branchId }) {
  useEffect(() => {
    if (!branchId) return;
    // Placeholder for notification subscriptions or socket registration.
    // This component is intentionally lightweight until a full implementation is added.
  }, [role, branchId]);

  return null;
}
