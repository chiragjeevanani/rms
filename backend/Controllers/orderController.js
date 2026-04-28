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
    
    // Check if an active order exists for this table
    let order = await Order.findOne({ 
      tableName, 
      status: { $nin: ['Paid', 'Cancelled', 'Void'] } 
    });

    const io = req.app.get('socketio');

    if (order) {
      // Update existing order
      // Merge items if they are provided
      if (items && items.length > 0) {
        order.items = [...order.items, ...items];
      }
      
      // Update financials if provided
      if (subTotal !== undefined) order.subTotal = subTotal;
      if (tax !== undefined) order.tax = tax;
      if (discount !== undefined) order.discount = discount;
      if (serviceCharge !== undefined) order.serviceCharge = serviceCharge;
      if (deliveryCharge !== undefined) order.deliveryCharge = deliveryCharge;
      if (containerCharge !== undefined) order.containerCharge = containerCharge;
      if (grandTotal !== undefined) order.grandTotal = grandTotal;
      if (orderType !== undefined) order.orderType = orderType;
      if (waiterName !== undefined) order.waiterName = waiterName;
      if (status !== undefined) order.status = status;
      
      await order.save();
      if (io) io.emit('statusUpdated', order); // Notify KDS and others
      
      // Update table status if dine-in
      if (order.orderType === 'Dine-In') {
        await Table.findOneAndUpdate({ tableName }, { status: 'Occupied', isAvailable: false });
        if (io) io.emit('tableStatusChanged');
      }

      return res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
    }

    // New Order creation
    const orderNumber = await generateOrderNumber();
    const table = await Table.findOne({ tableName });

    const newOrder = new Order({
      orderNumber,
      tableName,
      tableId: table?._id,
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
    const filter = req.query.branchId ? { branchId: req.query.branchId } : {};
    const orders = await Order.find(filter)
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
    const filter = { status: { $nin: ['Paid', 'Cancelled', 'Void'] } };
    if (req.query.branchId) filter.branchId = req.query.branchId;
    const orders = await Order.find(filter)
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
    const filter = { status: 'Paid' };
    if (req.query.branchId) filter.branchId = req.query.branchId;
    const orders = await Order.find(filter)
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
    const filter = { status: { $in: ['cancelled', 'Void'] } };
    if (req.query.branchId) filter.branchId = req.query.branchId;
    const orders = await Order.find(filter)
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
         { status: 'Dirty', isAvailable: false }
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
    if (status.toLowerCase() === 'paid') updateData.closedAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Free the table if status is Paid/Cancelled/Void
    const terminatingStatuses = ['paid', 'cancelled', 'void'];
    if (terminatingStatuses.includes(status.toLowerCase())) {
        if (order.tableName) {
            await Table.findOneAndUpdate(
                { tableName: order.tableName }, 
                { status: 'Dirty', isAvailable: false }
            );
            console.log(`Table ${order.tableName} released due to order status: ${status}`);
        }
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
    const filter = req.query.branchId ? { branchId: req.query.branchId } : {};
    
    const counts = {
      total: await Order.countDocuments(filter),
      new: await Order.countDocuments({ ...filter, status: 'Pending' }),
      preparing: await Order.countDocuments({ ...filter, status: 'Preparing' }),
      completed: await Order.countDocuments({ ...filter, status: { $in: ['Ready', 'Served', 'Paid'] } })
    };

    // 1. Weekly Trends (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrends = await Order.aggregate([
      { $match: { ...filter, createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill gaps for trends
    const trends = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyTrends.find(t => t._id === dateStr);
      trends.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        orders: match ? match.orders : 0
      });
    }

    // 2. Category Distribution (Top Items)
    const matchStage = Object.keys(filter).length > 0 
      ? { $match: { branchId: new require('mongoose').Types.ObjectId(req.query.branchId) } } 
      : { $match: {} };
      
    const categories = await Order.aggregate([
      matchStage,
      { $unwind: "$items" },
      { $group: { 
          _id: "$items.name", 
          value: { $sum: "$items.quantity" } 
        } 
      },
      { $sort: { value: -1 } },
      { $limit: 5 }
    ]).then(items => items.map(p => ({ name: p._id, value: p.value })));

    res.json({ success: true, data: { counts, trends, categories } });
  } catch (error) {
    console.error('Kitchen analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    
    let filter = { status: 'Paid' };
    if (startDate && endDate) {
      filter.closedAt = { 
        $gte: new Date(startDate), 
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) 
      };
    }
    if (branchId && branchId !== 'all') {
      filter.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const todayStart = new Date(); 
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const metricsMatch = branchId && branchId !== 'all' ? { branchId: new mongoose.Types.ObjectId(branchId) } : {};

    // 1. Core Metrics
    const metricsResult = await Order.aggregate([
      { $match: { status: 'Paid', ...metricsMatch } },
      { $facet: {
        allTime: [
          { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, totalOrders: { $sum: 1 } } }
        ],
        today: [
          { $match: { closedAt: { $gte: todayStart } } },
          { $group: { _id: null, todayRevenue: { $sum: '$grandTotal' }, todayOrders: { $sum: 1 } } }
        ],
        filtered: [
          { $match: filter.closedAt ? { closedAt: filter.closedAt } : {} },
          { $group: { _id: null, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }
        ]
      }}
    ]);

    const metrics = {
      totalRevenue: metricsResult[0].allTime[0]?.totalRevenue || 0,
      totalOrders: metricsResult[0].allTime[0]?.totalOrders || 0,
      todayRevenue: metricsResult[0].today[0]?.todayRevenue || 0,
      todayOrders: metricsResult[0].today[0]?.todayOrders || 0,
      filteredRevenue: metricsResult[0].filtered[0]?.revenue || 0,
      filteredOrders: metricsResult[0].filtered[0]?.orders || 0
    };

    // 2. Trends
    const trendStart = startDate ? new Date(startDate) : sevenDaysAgo;
    const trendEnd = endDate ? new Date(endDate) : new Date();
    
    const dailyTrends = await Order.aggregate([
      { $match: { 
          status: 'Paid', 
          ...metricsMatch,
          closedAt: { $gte: trendStart, $lte: new Date(new Date(trendEnd).setHours(23, 59, 59, 999)) } 
        } 
      },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$closedAt" } },
          revenue: { $sum: "$grandTotal" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill gaps in trends
    const trends = [];
    let curr = new Date(trendStart);
    while (curr <= trendEnd) {
      const dateStr = curr.toISOString().split('T')[0];
      const match = dailyTrends.find(t => t._id === dateStr);
      trends.push({
        date: dateStr,
        name: curr.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: match ? match.revenue : 0,
        orders: match ? match.orders : 0
      });
      curr.setDate(curr.getDate() + 1);
    }

    // 3. Top Products
    const topProducts = await Order.aggregate([
      { $match: filter },
      { $unwind: "$items" },
      { $group: { 
          _id: "$items.name", 
          volume: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        } 
      },
      { $sort: { volume: -1 } },
      { $limit: 10 }
    ]).then(items => items.map(p => ({
      name: p._id,
      volume: p.volume,
      revenue: p.revenue
    })));

    // 4. Performance Metrics
    const performanceStats = await Order.aggregate([
      { $match: { ...metricsMatch, readyAt: { $exists: true }, createdAt: { $exists: true } } },
      { $group: {
          _id: null,
          avgPrepTime: { $avg: { $subtract: ["$readyAt", "$createdAt"] } }
        }
      }
    ]);

    const Item = require('../Models/Item');
    // For simplicity, keep quality score global as it's product-based
    const itemsWithReviews = await Item.aggregate([
      { $unwind: "$reviews" },
      { $group: { _id: null, avgRating: { $avg: "$reviews.rating" } } }
    ]);

    const efficiency = {
      avgPrepTime: performanceStats.length > 0 ? Math.round(performanceStats[0].avgPrepTime / 60000) : 12,
      qualityScore: itemsWithReviews.length > 0 ? (itemsWithReviews[0].avgRating * 20).toFixed(1) : 95.0
    };

    res.json({
      success: true,
      data: {
        metrics,
        trends,
        topProducts,
        efficiency
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

    const filter = {
      waiterName: staffName,
      createdAt: { $gte: startOfDay }
    };
    if (req.query.branchId) filter.branchId = req.query.branchId;

    const orders = await Order.find(filter);

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
    const filter = req.query.branchId ? { branchId: req.query.branchId } : {};
    const [availableCount, occupiedCount, reservedCount, pendingCount, readyCount, activeCount, completedCount] = await Promise.all([
      Table.countDocuments({ ...filter, status: 'Available' }),
      Table.countDocuments({ ...filter, status: 'Occupied' }),
      Table.countDocuments({ ...filter, status: 'Reserved' }),
      Order.countDocuments({ ...filter, status: 'Pending' }),
      Order.countDocuments({ ...filter, status: 'Ready' }),
      Order.countDocuments({ ...filter, status: { $nin: ['Paid', 'Cancelled', 'Void'] } }),
      Order.countDocuments({ ...filter, status: 'Paid', createdAt: { $gte: new Date().setHours(0,0,0,0) } })
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
