import React from 'react';
import KdsOrderQueueTemplate from '../components/KdsOrderQueueTemplate';

export default function CancelledOrders() {
  return (
    <KdsOrderQueueTemplate 
      title="Cancelled Orders" 
      statusFilter={['cancelled', 'void']} 
      emptyMessage="No cancelled orders"
      accentColor="red"
    />
  );
}
