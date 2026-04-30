const Order = require('../Models/Order');
const Table = require('../Models/Table');
const mongoose = require('mongoose');
const { sendToTopic } = require('../Utils/firebaseAdmin');

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
      source,
      branchId,
      customer
    } = req.body;
    
    // Check if an active order exists for this table
    let order = await Order.findOne({ 
      tableName, 
      status: { $nin: ['completed', 'cancelled'] } 
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
      if (customer !== undefined) order.customer = customer;
      
      await order.save();
      
      // Notify KDS via Socket
      if (io) io.emit('statusUpdated', order);
      
      // Notify KDS via Firebase
      const bId = branchId || order.branchId;
      if (bId) {
        sendToTopic(`kds_${bId}`, "New KOT Received", `New items added for ${tableName} (Order #${order.orderNumber}).`, { orderId: order._id.toString() });
      }

      // Update table status if dine-in
      if (order.orderType === 'Dine-In') {
        const terminatingStatuses = ['paid', 'cancelled'];
        const currentStatus = order.status ? order.status.toLowerCase() : '';
        
        if (terminatingStatuses.includes(currentStatus)) {
          await Table.findOneAndUpdate({ tableName }, { status: 'Available', isAvailable: true });
        } else {
          await Table.findOneAndUpdate({ tableName }, { status: 'Occupied', isAvailable: false });
        }
        if (io) io.emit('tableStatusChanged');
      }

      return res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
    }

    // New Order creation
    const orderNumber = await generateOrderNumber();
    const table = await Table.findOne({ $or: [{ tableName }, { tableCode: tableName }] });

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
      status: status?.toLowerCase() || 'pending',
      source: source || 'POS Terminal',
      customer,
      branchId: branchId || table?.branchId
    });

    await newOrder.save();

    if (io) io.emit('orderCreated', newOrder);

    // Notify KDS via Firebase
    if (newOrder.branchId) {
      sendToTopic(`kds_${newOrder.branchId}`, "New KOT Received", `New order for ${tableName} (Order #${orderNumber}).`, { orderId: newOrder._id.toString() });
    }

    // Update table status if dine-in
    if (orderType === 'Dine-In') {
       const terminatingStatuses = ['paid', 'cancelled'];
       const currentStatus = newOrder.status ? newOrder.status.toLowerCase() : '';

       if (terminatingStatuses.includes(currentStatus)) {
         await Table.findOneAndUpdate({ tableName }, { status: 'Available', isAvailable: true });
       } else {
         await Table.findOneAndUpdate(
           { tableName }, 
           { status: 'Occupied', isAvailable: false }
         );
       }
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
    const filter = { status: { $nin: ['paid', 'cancelled'] } };
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
    const filter = { status: 'completed' };
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
    const filter = { status: 'cancelled' };
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
    const { payments, status = 'completed' } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.body.customer) {
      order.customer = {
        ...order.customer,
        ...req.body.customer
      };
    }
    
    order.payments = payments || [];
    order.status = 'paid';
    order.isBilled = true;
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
    const updateData = { status: status?.toLowerCase() };
    
    if (status.toLowerCase() === 'preparing') updateData.prepStartedAt = new Date();
    if (status.toLowerCase() === 'ready') updateData.readyAt = new Date();
    if (status.toLowerCase() === 'completed') updateData.closedAt = new Date();
    if (status.toLowerCase() === 'billed' || status.toLowerCase() === 'printed') {
      updateData.isBilled = true;
      // Keep previous status or default to ready
      delete updateData.status; 
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Free the table if status is Paid/Cancelled/Void
    const terminatingStatuses = ['paid', 'cancelled'];
    const currentStatus = status ? status.toLowerCase() : '';
    if (terminatingStatuses.includes(currentStatus)) {
        if (order.tableName) {
            await Table.findOneAndUpdate(
                { tableName: order.tableName }, 
                { status: 'Available', isAvailable: true }
            );
            console.log(`Table ${order.tableName} released due to order status: ${status}`);
        }
    }

    const io = req.app.get('socketio');
    if (io) {
        io.emit('statusUpdated', order);
        io.emit('tableStatusChanged');
    }

    // Notify POS via Firebase if status is Ready
    if (status.toLowerCase() === 'ready' && order.branchId) {
      sendToTopic(`pos_${order.branchId}`, "Order Ready", `Order #${order.orderNumber} is now ready for service.`, { orderId: order._id.toString() });
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
    let filter = {};
    if (req.query.branchId && req.query.branchId !== 'undefined' && req.query.branchId !== '[object Object]') {
      if (mongoose.Types.ObjectId.isValid(req.query.branchId)) {
        filter = { branchId: new mongoose.Types.ObjectId(req.query.branchId) };
      } else {
        return res.status(400).json({ success: false, message: 'Invalid Branch ID format' });
      }
    }
    
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
      ? { $match: { branchId: filter.branchId } } 
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
    
    const parseDate = (dateStr) => {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const startDateObj = parseDate(startDate);
    const endDateObj = parseDate(endDate) ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date();
    
    let dateFilter = {};
    if (startDateObj) {
      dateFilter = { 
        $or: [
          { closedAt: { $gte: startDateObj, $lte: endDateObj } },
          { updatedAt: { $gte: startDateObj, $lte: endDateObj }, closedAt: { $exists: false } }
        ]
      };
    }

    const filter = { 
      status: { $in: ['paid', 'Paid'] },
      ...(branchId && branchId !== 'all' ? { branchId: new mongoose.Types.ObjectId(branchId) } : {}),
      ...dateFilter
    };

    const todayStart = new Date(); 
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const metricsMatch = branchId && branchId !== 'all' ? { branchId: new mongoose.Types.ObjectId(branchId) } : {};

    // 1. Core Metrics
    const metricsResult = await Order.aggregate([
      { $match: { status: { $in: ['paid', 'Paid'] }, ...metricsMatch } },
      { $facet: {
        allTime: [
          { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, totalOrders: { $sum: 1 } } }
        ],
        today: [
          { $match: { 
              $or: [
                { closedAt: { $gte: todayStart, $lte: todayEnd } },
                { updatedAt: { $gte: todayStart, $lte: todayEnd }, closedAt: { $exists: false } }
              ]
            } 
          },
          { $group: { _id: null, todayRevenue: { $sum: '$grandTotal' }, todayOrders: { $sum: 1 } } }
        ],
        filtered: [
          { $match: dateFilter },
          { $group: { _id: null, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }
        ],
        orderTypes: [
          { $match: dateFilter },
          { $group: { _id: "$orderType", revenue: { $sum: "$grandTotal" }, orders: { $sum: 1 } } }
        ]
      }}
    ]);

    const metrics = {
      totalRevenue: metricsResult[0].allTime[0]?.totalRevenue || 0,
      totalOrders: metricsResult[0].allTime[0]?.totalOrders || 0,
      todayRevenue: metricsResult[0].today[0]?.todayRevenue || 0,
      todayOrders: metricsResult[0].today[0]?.todayOrders || 0,
      filteredRevenue: metricsResult[0].filtered[0]?.revenue || 0,
      filteredOrders: metricsResult[0].filtered[0]?.orders || 0,
      orderTypes: metricsResult[0].orderTypes || []
    };

    // 2. Trends
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendStart = startDateObj || sevenDaysAgo;
    const trendEnd = endDateObj;
    
    const dailyTrends = await Order.aggregate([
      { $match: { 
          status: { $in: ['paid', 'Paid'] }, 
          ...metricsMatch,
          $or: [
            { closedAt: { $gte: trendStart, $lte: trendEnd } },
            { updatedAt: { $gte: trendStart, $lte: trendEnd }, closedAt: { $exists: false } }
          ]
        } 
      },
      { $project: {
          grandTotal: 1,
          date: { $ifNull: ["$closedAt", "$updatedAt"] }
        }
      },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
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
    const { branchId } = req.query;
    const filter = branchId && branchId !== 'undefined' ? { branchId: new mongoose.Types.ObjectId(branchId) } : {};
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [availableCount, reservedCount, pendingCount, preparingCount, readyCount, completedCount, cancelledCount, todayOrders] = await Promise.all([
      Table.countDocuments({ ...filter, status: 'Available' }),
      Table.countDocuments({ ...filter, status: 'Reserved' }),
      Order.countDocuments({ ...filter, status: { $in: ['pending', 'Pending'] } }),
      Order.countDocuments({ ...filter, status: { $in: ['preparing', 'Preparing'] } }),
      Order.countDocuments({ ...filter, status: { $in: ['ready', 'Ready'] } }),
      Order.countDocuments({ 
        ...filter, 
        status: { $in: ['completed', 'Completed', 'paid', 'Paid'] }, 
        updatedAt: { $gte: todayStart, $lte: todayEnd } 
      }),
      Order.countDocuments({ 
        ...filter, 
        status: { $in: ['cancelled', 'Cancelled'] }, 
        updatedAt: { $gte: todayStart, $lte: todayEnd } 
      }),
      Order.find({ 
        ...filter, 
        status: { $in: ['completed', 'Completed', 'paid', 'Paid'] }, 
        updatedAt: { $gte: todayStart, $lte: todayEnd } 
      })
    ]);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    // 5. Hourly Trends for Today
    const hourlyRevenue = await Order.aggregate([
      { 
        $match: { 
          ...filter, 
          status: { $in: ['completed', 'Completed', 'paid', 'Paid'] }, 
          updatedAt: { $gte: todayStart, $lte: todayEnd } 
        } 
      },
      {
        $group: {
          _id: { $hour: "$updatedAt" },
          sales: { $sum: "$grandTotal" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format hourly data for the chart (0-23 hours)
    const hourlyTrends = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourlyRevenue.find(h => h._id === i);
      const ampm = i >= 12 ? 'PM' : 'AM';
      const hour12 = i % 12 || 12;
      return {
        name: `${hour12} ${ampm}`,
        sales: hourData ? hourData.sales : 0,
        hour: i
      };
    }).filter(h => h.hour >= 8 && h.hour <= 23); // Only show business hours 8 AM - 11 PM

    res.json({
      success: true,
      data: {
        availableTables: availableCount,
        reservedTables: reservedCount,
        pendingOrders: pendingCount,
        preparingOrders: preparingCount,
        readyOrders: readyCount,
        completedToday: completedCount,
        cancelledToday: cancelledCount,
        todayRevenue,
        hourlyTrends
      }
    });
  } catch (error) {
    console.error('Staff Snapshot Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update specific item quantity
const updateItemQuantity = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { quantity } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const item = order.items.find(i => i._id.toString() === itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found in order' });

    item.quantity = Math.max(1, quantity);
    
    // Re-calculate totals
    order.subTotal = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    order.tax = Math.round(order.subTotal * 0.05);
    order.grandTotal = order.subTotal + order.tax + (order.serviceCharge || 0) + (order.deliveryCharge || 0) + (order.containerCharge || 0) - (order.discount?.amount || 0);
    
    await order.save();

    const io = req.app.get('socketio');
    if (io) io.emit('statusUpdated', order);

    res.json({ success: true, message: 'Quantity Updated', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const registerToken = async (req, res) => {
  try {
    const { token, topic } = req.body;
    if (!token || !topic) return res.status(400).json({ success: false, message: 'Token and Topic are required' });

    const admin = require('firebase-admin');
    await admin.messaging().subscribeToTopic(token, topic);
    
    console.log(`Token registered to topic: ${topic}`);
    res.json({ success: true, message: `Successfully subscribed to ${topic}` });
  } catch (error) {
    console.error('Registration Error:', error);
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
  updateItemQuantity,
  getKitchenAnalytics,
  getSalesAnalytics,
  getStaffDailyStats,
  getStaffDashboardSnapshot,
  registerToken
};
