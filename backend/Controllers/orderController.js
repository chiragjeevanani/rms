const Order = require('../Models/Order');
const Table = require('../Models/Table');

// 1. Create a dynamic order number helper
const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Order.countDocuments({ createdAt: { $gte: new Date().setHours(0,0,0,0) } });
  return `ORD-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
};

// 2. Create Order / Add KOT to existing Order
const createOrder = async (req, res) => {
  try {
    const { 
      tableName, 
      items, 
      subTotal, 
      tax, 
      discount, 
      serviceCharge, 
      deliveryCharge, 
      containerCharge, 
      grandTotal,
      orderType, 
      waiterName,
      status,
      source 
    } = req.body;
    
    // Check if an active order (Not Paid/Cancelled) exists for this table
    let order = await Order.findOne({ tableName, status: { $nin: ['Paid', 'Cancelled', 'Void'] } });

    if (order) {
      // It's a new KOT for existing order
      // Append items, update totals
      order.items = [...order.items, ...items];
      order.subTotal = subTotal;
      order.tax = tax;
      order.grandTotal = grandTotal;
      if (status) order.status = status;
      // In case they were updated
      if (discount) order.discount = discount;
      if (serviceCharge) order.serviceCharge = serviceCharge;
      
      await order.save();
      
      const io = req.app.get('socketio');
      if (io) io.emit('kotAdded', order);
      
      return res.json({ success: true, message: 'Order created', data: order });
    }

    // New Order creation
    const orderNumber = await generateOrderNumber();
    
    // Find table to get its ID
    const table = await Table.findOne({ tableName });

    const newOrder = new Order({
      orderNumber,
      tableName,
      tableId: table?._id, // Link table ID
      items,
      subTotal,
      tax,
      discount,
      serviceCharge,
      deliveryCharge,
      containerCharge,
      grandTotal,
      orderType,
      waiterName,
      status: status || 'Pending',
      source: source || 'POS Terminal'
    });

    await newOrder.save();

    const io = req.app.get('socketio');
    if (io) io.emit('orderCreated', newOrder);

    // Update table status if dine-in
    if (orderType === 'Dine-In') {
       await Table.findOneAndUpdate(
         { tableName }, 
         { status: 'Occupied', isAvailable: false }
       );
       if (io) io.emit('tableStatusChanged');
    }

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.itemId')
      .populate('items.comboId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getActiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $nin: ['Paid', 'Cancelled', 'Void'] } })
      .populate('items.itemId')
      .populate('items.comboId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getCompletedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Paid' })
      .populate('items.itemId')
      .populate('items.comboId')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getCancelledOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ['cancelled', 'Void'] } })
      .populate('items.itemId')
      .populate('items.comboId')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Settle Bill / Payment
const settleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payments, status = 'Paid' } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.body.customer) {
      order.customer = {
        ...order.customer,
        ...req.body.customer
      };
    }
    
    order.payments = payments || [];
    order.status = status;
    order.closedAt = new Date();
    
    await order.save();
    
    // Free the table
    if (order.tableName) {
       await Table.findOneAndUpdate(
         { tableName: order.tableName }, 
         { status: 'Available', isAvailable: true }
       );
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('orderPaid', order);
      io.emit('tableStatusChanged');
    }

    res.json({ success: true, message: 'Order Settled Successfully', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    
    if (status === 'Preparing') updateData.prepStartedAt = new Date();
    if (status === 'Ready') updateData.readyAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Free the table if status is Paid/Cancelled/Void
    const terminatingStatuses = ['paid', 'cancelled', 'void'];
    if (terminatingStatuses.includes(status.toLowerCase()) && order.tableName) {
        await Table.findOneAndUpdate(
            { tableName: order.tableName }, 
            { status: 'Available', isAvailable: true }
        );
        console.log(`Table ${order.tableName} released due to order status: ${status}`);
    }

    const io = req.app.get('socketio');
    if (io) {
        io.emit('statusUpdated', order);
        io.emit('tableStatusChanged');
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Void specific item from order
const voidItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Remove the item
    order.items = order.items.filter(item => item._id.toString() !== itemId);
    
    // Re-calculate totals
    order.subTotal = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    order.tax = Math.round(order.subTotal * 0.05);
    order.grandTotal = order.subTotal + order.tax + (order.serviceCharge || 0) + (order.deliveryCharge || 0) + (order.containerCharge || 0) - (order.discount?.amount || 0);
    
    await order.save();

    const io = req.app.get('socketio');
    if (io) io.emit('itemVoided', order);

    res.json({ success: true, message: 'Item Voided', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getKitchenAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const counts = {
      total: await Order.countDocuments(),
      new: await Order.countDocuments({ status: 'Pending' }),
      preparing: await Order.countDocuments({ status: 'Preparing' }),
      completed: await Order.countDocuments({ status: { $in: ['Ready', 'Served', 'Paid'] } })
    };

    res.json({ success: true, data: { counts } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSalesAnalytics = async (req, res) => {
  try {
    const todayStart = new Date(); 
    todayStart.setHours(0, 0, 0, 0);
    
    // 1. Revenue Metrics
    const allTimeRevenue = await Order.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    const todayRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: todayStart }, status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    // 2. Hourly Sales for Chart
    const hourlySales = await Order.aggregate([
      { $match: { createdAt: { $gte: todayStart }, status: 'Paid' } },
      { $group: { 
          _id: { $hour: "$createdAt" }, 
          revenue: { $sum: "$grandTotal" } 
        } 
      },
      { $sort: { "_id": 1 } }
    ]);

    // 3. Table Occupancy
    const totalTables = await Table.countDocuments();
    const occupiedTables = await Table.countDocuments({ status: 'Occupied' });

    // 4. Top Selling Items Today
    const topItems = await Order.aggregate([
      { $match: { createdAt: { $gte: todayStart }, status: 'Paid' } },
      { $unwind: "$items" },
      { $group: { 
          _id: "$items.name", 
          count: { $sum: "$items.quantity" } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    res.json({
      success: true,
      data: {
        metrics: {
          totalRevenue: allTimeRevenue.length > 0 ? allTimeRevenue[0].total : 0,
          todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
          occupancy: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0
        },
        hourlySales: hourlySales.map(item => ({
          time: `${item._id}:00`,
          revenue: item.revenue
        })),
        topItems: topItems.map(item => ({
          name: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStaffDailyStats = async (req, res) => {
  try {
    const { staffName } = req.params;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      waiterName: staffName,
      createdAt: { $gte: startOfDay }
    });

    const metrics = {
      handled: orders.length,
      volume: orders.reduce((acc, o) => acc + (o.grandTotal || 0), 0)
    };

    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStaffDashboardSnapshot = async (req, res) => {
  try {
    const [availableCount, occupiedCount, reservedCount, pendingCount, readyCount, activeCount, completedCount] = await Promise.all([
      Table.countDocuments({ status: 'Available' }),
      Table.countDocuments({ status: 'Occupied' }),
      Table.countDocuments({ status: 'Reserved' }),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Ready' }),
      Order.countDocuments({ status: { $nin: ['Paid', 'Cancelled', 'Void'] } }),
      Order.countDocuments({ status: 'Paid', createdAt: { $gte: new Date().setHours(0,0,0,0) } })
    ]);

    res.json({
      success: true,
      data: {
        availableTables: availableCount,
        occupiedTables: occupiedCount,
        reservedTables: reservedCount,
        pendingOrders: pendingCount,
        readyPickups: readyCount,
        activeOrders: activeCount,
        completedOrders: completedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getActiveOrders,
  getCompletedOrders,
  getCancelledOrders,
  settleOrder,
  updateOrderStatus,
  voidItem,
  getKitchenAnalytics,
  getSalesAnalytics,
  getStaffDailyStats,
  getStaffDashboardSnapshot
};
