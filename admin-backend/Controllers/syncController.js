const Order = require('../Models/Order');
const Table = require('../Models/Table');
const mongoose = require('mongoose');

const syncQueueItems = async (req, res) => {
  const { actionType, payload } = req.body;
  const io = req.app.get('socketio');

  try {
    if (actionType === 'CREATE_ORDER') {
      // 1. Duplicate Prevention: Check if order already exists in MongoDB
      let order = await Order.findOne({ orderNumber: payload.orderNumber });

      if (order) {
        // Last-Update-Wins conflict resolution
        const localUpdatedAt = new Date(payload.updatedAt);
        const serverUpdatedAt = new Date(order.updatedAt);

        if (localUpdatedAt > serverUpdatedAt) {
          console.log(`[SyncServer] Order ${payload.orderNumber} already exists. Applying client updates (newer timestamp).`);
          
          order.items = payload.items;
          order.subTotal = payload.subTotal;
          order.tax = payload.tax;
          order.discount = payload.discount;
          order.grandTotal = payload.grandTotal;
          order.orderType = payload.orderType;
          order.waiterName = payload.waiterName;
          order.status = payload.status;
          order.customer = payload.customer;
          order.payments = payload.payments;
          order.isBilled = payload.isBilled;
          
          if (payload.status === 'paid' || payload.isBilled) {
            order.closedAt = payload.updatedAt;
          }
          
          await order.save();
          
          if (io) io.emit('statusUpdated', order);
        } else {
          console.log(`[SyncServer] Order ${payload.orderNumber} already exists with newer/equal server timestamp. Skipping sync.`);
        }
      } else {
        // 2. New Order Creation
        console.log(`[SyncServer] Creating new order ${payload.orderNumber} in MongoDB from sync queue.`);
        
        let tableId = undefined;
        if (payload.tableName) {
          const tbl = await Table.findOne({ tableName: payload.tableName });
          if (tbl) tableId = tbl._id;
        }

        const newOrder = new Order({
          orderNumber: payload.orderNumber,
          tableName: payload.tableName,
          tableId: tableId,
          items: payload.items,
          subTotal: payload.subTotal,
          tax: payload.tax,
          discount: payload.discount,
          grandTotal: payload.grandTotal,
          orderType: payload.orderType,
          waiterName: payload.waiterName,
          status: payload.status,
          customer: payload.customer,
          payments: payload.payments,
          isBilled: payload.isBilled,
          branchId: payload.branchId && mongoose.Types.ObjectId.isValid(payload.branchId) ? new mongoose.Types.ObjectId(payload.branchId) : undefined,
          createdAt: payload.createdAt,
          updatedAt: payload.updatedAt
        });

        await newOrder.save();
        
        if (io) io.emit('orderCreated', newOrder);

        // Set table occupied/available status
        if (payload.orderType === 'Dine-In' && payload.tableName) {
          const terminatingStatuses = ['paid', 'cancelled'];
          const currentStatus = payload.status ? payload.status.toLowerCase() : '';
          
          if (terminatingStatuses.includes(currentStatus)) {
            await Table.findOneAndUpdate({ tableName: payload.tableName }, { status: 'Available', isAvailable: true });
          } else {
            await Table.findOneAndUpdate({ tableName: payload.tableName }, { status: 'Occupied', isAvailable: false });
          }
          if (io) io.emit('tableStatusChanged');
        }
      }
    } else if (actionType === 'UPDATE_ORDER') {
      // 3. Update Order
      const { orderNumber, updates } = payload;
      console.log(`[SyncServer] Updating order ${orderNumber} in MongoDB from sync queue.`);
      
      const order = await Order.findOne({ orderNumber });
      if (!order) {
        return res.status(404).json({ success: false, message: `Order ${orderNumber} not found for updates` });
      }

      if (updates.status) order.status = updates.status;
      if (updates.isBilled !== undefined) order.isBilled = updates.isBilled;
      if (updates.payments) order.payments = updates.payments;
      
      if (updates.status === 'paid' || updates.isBilled) {
        order.closedAt = new Date();
      }

      await order.save();
      
      if (io) {
        io.emit('statusUpdated', order);
        
        // Release table if paid/cancelled
        const terminatingStatuses = ['paid', 'cancelled'];
        const currentStatus = order.status ? order.status.toLowerCase() : '';
        if (terminatingStatuses.includes(currentStatus) && order.tableName) {
          await Table.findOneAndUpdate({ tableName: order.tableName }, { status: 'Available', isAvailable: true });
          io.emit('tableStatusChanged');
        }
      }
    } else {
      return res.status(400).json({ success: false, message: `Unknown actionType: ${actionType}` });
    }

    res.status(200).json({ success: true, message: 'Sync cycle ingested successfully.' });
  } catch (error) {
    console.error('[SyncServer] Synchronization failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { syncQueueItems };
