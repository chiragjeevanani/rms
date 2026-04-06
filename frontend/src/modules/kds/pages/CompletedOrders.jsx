import React from 'react';
import KdsOrderQueueTemplate from '../components/KdsOrderQueueTemplate';

export default function CompletedOrders() {
  return (
    <KdsOrderQueueTemplate 
      title="Completed Orders" 
      statusFilter={['ready', 'served', 'completed']} 
      emptyMessage="No completed orders today"
      accentColor="emerald"
    />
  );
}
