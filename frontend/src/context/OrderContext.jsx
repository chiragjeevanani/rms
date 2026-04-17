import React, { createContext, useContext, useState, useEffect } from 'react';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all orders on mount
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`);
      if (response.ok) {
        const result = await response.json();
        setOrders(result.data.map(o => ({
          id: o._id, 
          status: (o.status || 'new').toLowerCase(), 
          table: o.tableName || 'N/A',
          source: o.source || o.orderType || 'POS',
          startTime: o.createdAt, 
          prepTime: o.prepStartedAt,
          readyTime: o.readyAt,
          total: o.grandTotal, 
          items: (o.items || []).map(i => ({ 
            ...i, 
            id: i._id,
            price: i.price,
            image: i.image || (i.itemId?.image ? i.itemId.image : ''),
            name: i.name || i.itemId?.name || 'Unknown Item',
            prepTimeEst: i.itemId?.preparationTime
          })), 
          orderNum: (o.orderNumber || '').split('-').pop() 
        })));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); 
    return () => clearInterval(interval);
  }, []);

  const createOrder = async (orderData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (response.ok) {
        fetchOrders(); 
        return await response.json();
      }
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  const getOrderById = async (orderId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`);
      if (response.ok) {
        const result = await response.json();
        const order = result.data.find(o => o._id === orderId);
         if (order) {
            return {
              id: order._id,
              status: (order.status || 'new').toLowerCase(), 
              table: order.tableName || 'N/A',
              source: order.source || order.orderType || 'POS',
              startTime: order.createdAt,
              prepTime: order.prepStartedAt,
              readyTime: order.readyAt,
              total: order.grandTotal,
              items: (order.items || []).map(i => ({ 
                ...i, 
                id: i._id,
                price: i.price,
                image: i.image || (i.itemId?.image ? i.itemId.image : ''),
                name: i.name || i.itemId?.name || 'Unknown Item',
                prepTimeEst: i.itemId?.preparationTime
              })), 
              orderNum: (order.orderNumber || '').split('-').pop()
            };
         }
      }
    } catch (error) {
       console.error('Failed to find order:', error);
    }
    return null;
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await fetchOrders(); 
      }
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const cancelOrder = (orderId) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  const updateItemStatus = async (orderId, itemId, status) => {
     setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item => 
          item.id === itemId ? { ...item, status } : item
        );
        return { ...order, items: updatedItems };
      }
      return order;
    }));
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      isLoading,
      fetchOrders,
      getOrderById,
      createOrder, 
      updateOrderStatus, 
      updateItemStatus,
      cancelOrder
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};



