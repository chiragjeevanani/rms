const Integration = require('../Models/Integration');
const Order = require('../Models/Order');

// Helper to parse order ID - preserves alphanumeric strings for mock mode
const parseOrderId = (id) => {
  if (!id) return id;
  const num = Number(id);
  return isNaN(num) ? id : num;
};

// Helper to generate a unique order number (same pattern as orderController.js)
const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Order.countDocuments({ createdAt: { $gte: new Date().setHours(0,0,0,0) } });
  return `ORD-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
};

// Generic Wera HTTP helper
const callWeraApi = async (endpoint, platform, branchId, method, payload) => {
  const integration = await Integration.findOne({ branchId, platform: platform.toUpperCase() });
  if (!integration) {
    throw new Error(`Integration settings not found for platform: ${platform} at branch: ${branchId}`);
  }

  const baseUrl = integration.baseUrl || 'https://pos.werafoods.com';
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Wera-Api-Key': integration.apiKey || '',
    'Accept': 'application/json'
  };

  const response = await fetch(url, {
    method,
    headers,
    body: method !== 'GET' ? JSON.stringify(payload) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Wera API Request Failed: Status ${response.status} - ${errorText}`);
  }

  return await response.json();
};

// Get credentials
exports.getSettings = async (req, res) => {
  try {
    const { branchId, platform } = req.params;
    const settings = await Integration.findOne({ branchId, platform: platform.toUpperCase() });
    res.json({ 
      success: true, 
      data: settings || { 
        apiKey: '', 
        merchantId: '', 
        outletId: '', 
        baseUrl: 'https://pos.werafoods.com', 
        isConnected: false 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Save credentials
exports.saveSettings = async (req, res) => {
  try {
    const { branchId } = req.params;
    const updateData = req.body;

    // Automatically map Wera ID (outletId) to merchantId as well
    if (updateData.outletId) {
      updateData.merchantId = updateData.outletId;
    }

    // Save for both SWIGGY and ZOMATO to keep them in sync
    const swiggyIntegration = await Integration.findOneAndUpdate(
      { branchId, platform: 'SWIGGY' },
      { ...updateData, branchId, platform: 'SWIGGY' },
      { upsert: true, new: true }
    );

    await Integration.findOneAndUpdate(
      { branchId, platform: 'ZOMATO' },
      { ...updateData, branchId, platform: 'ZOMATO' },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Wera integration credentials updated', data: swiggyIntegration });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Test Connection (mock endpoint matching Integrations page)
exports.testConnection = async (req, res) => {
  try {
    const { branchId } = req.params;
    const settings = await Integration.findOne({ branchId, platform: 'SWIGGY' });

    if (!settings || !settings.apiKey) {
      return res.status(400).json({ success: false, message: 'Settings not found. Please save credentials first.' });
    }

    // Mark both platforms as connected
    await Integration.updateMany(
      { branchId, platform: { $in: ['SWIGGY', 'ZOMATO'] } },
      { isConnected: true }
    );

    res.json({ success: true, connected: true, message: 'Connected to Wera successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Unified Webhook from Wera
exports.orderWebhook = async (req, res) => {
  const io = req.app.get('socketio');
  try {
    const body = req.body;
    console.log('Incoming Wera Webhook Payload:', JSON.stringify(body, null, 2));

    // 1. Zomato Complaint Webhook
    if (body.event === 'order_complaint') {
      const weraOrderId = body.data?.order_id || body.data?.wera_order_id;
      const order = await Order.findOne({ weraOrderId });
      if (!order) {
        return res.status(404).json({ success: false, message: `Order not found for Wera ID: ${weraOrderId}` });
      }

      order.complaints.push({
        id: body.data?.id || `comp-${Date.now()}`,
        event: body.event,
        data: body.data,
        status: 'pending'
      });
      await order.save();
      if (io) io.emit('statusUpdated', order);

      return res.json({ status: 200, message: 'Complaint registered successfully' });
    }

    // 2. Cancel/Reject Webhook
    if (body.action === 'Reject') {
      const order = await Order.findOne({ weraOrderId: body.order_id });
      if (!order) {
        return res.status(404).json({ success: false, message: `Order not found for Wera ID: ${body.order_id}` });
      }

      order.status = 'cancelled';
      order.closedAt = new Date();
      await order.save();
      if (io) io.emit('statusUpdated', order);

      return res.json({ status: 200, message: 'Order marked as cancelled in RMS' });
    }

    // 3. Auto Accept Webhook
    if (body.action === 'auto-accept') {
      const order = await Order.findOne({ weraOrderId: body.order_id });
      if (!order) {
        return res.status(404).json({ success: false, message: `Order not found for Wera ID: ${body.order_id}` });
      }

      order.status = 'preparing';
      order.prepStartedAt = new Date();
      await order.save();
      if (io) io.emit('statusUpdated', order);

      return res.json({ status: 200, message: 'Order auto-accepted in RMS' });
    }

    // 4. Push Rider Status Webhook
    if (body.rider_status) {
      const order = await Order.findOne({ weraOrderId: body.order_id });
      if (!order) {
        return res.status(404).json({ success: false, message: `Order not found for Wera ID: ${body.order_id}` });
      }

      order.riderDetails = {
        name: body.rider_name || order.riderDetails?.name,
        phone: body.rider_number || order.riderDetails?.phone,
        status: body.rider_status,
        timeToArrive: body.time_to_arrive || order.riderDetails?.timeToArrive || 0
      };

      if (body.rider_status === 'pickedup') {
        order.status = 'picked_up';
      } else if (body.rider_status === 'delivered') {
        order.status = 'delivered';
      }

      await order.save();
      if (io) io.emit('statusUpdated', order);

      return res.json({ status: 200, message: 'Rider status updated in RMS' });
    }

    // 5. Order Placement Webhook
    if (body.order_id && body.order_items) {
      const settings = await Integration.findOne({ outletId: body.restaurant_id });
      if (!settings) {
        return res.status(404).json({ success: false, message: `Outlet mapping failed for Restaurant ID: ${body.restaurant_id}` });
      }

      // Map items & modifiers
      const items = body.order_items.map(item => {
        const modifiers = [];
        if (item.variants && item.variants.length > 0) {
          item.variants.forEach(v => {
            modifiers.push({ group: 'Size', value: v.size_name });
          });
        }
        if (item.addons && item.addons.length > 0) {
          item.addons.forEach(a => {
            modifiers.push({ group: 'Addon', value: a.name });
          });
        }
        return {
          name: item.item_name,
          quantity: item.item_quantity,
          price: item.item_unit_price || (item.subtotal / item.item_quantity) || 0,
          modifiers: modifiers
        };
      });

      const orderNumber = await generateOrderNumber();
      const orderSource = (body.order_from || 'SWIGGY').toUpperCase();

      const newOrder = new Order({
        orderNumber,
        tableName: `Delivery - ${body.order_from || 'Online'}`,
        customer: {
          name: body.customer_details?.name || 'Online Customer',
          mobile: body.customer_details?.phone_number || '0000000000',
          email: body.customer_details?.email || '',
          address: body.customer_details?.address || '',
          locality: body.customer_details?.delivery_area || ''
        },
        items,
        subTotal: body.net_amount || 0,
        tax: (body.cgst || 0) + (body.sgst || 0),
        discount: {
          amount: body.discount || 0,
          type: 'fixed',
          reason: 'Online Platform Campaign'
        },
        deliveryCharge: body.delivery_charge || 0,
        containerCharge: body.order_packaging || 0,
        grandTotal: body.gross_amount || 0,
        source: orderSource,
        weraOrderId: body.order_id.toString(),
        externalOrderId: body.external_order_id ? body.external_order_id.toString() : '',
        otp: body.order_otp ? body.order_otp.toString() : '',
        password: body.password ? body.password.toString() : '',
        isTrainOrder: !!body.is_train_order,
        instructions: body.order_instructions || '',
        status: 'pending',
        orderType: 'Delivery',
        branchId: settings.branchId
      });

      await newOrder.save();
      console.log(`🛎️ New ${orderSource} Order ${body.order_id} stored under Branch: ${settings.branchId}`);

      if (io) io.emit('orderCreated', newOrder);

      return res.status(200).json({
        status: 200,
        message: 'Order received by RMS',
        order_id: newOrder.orderNumber
      });
    }

    return res.status(400).json({ success: false, message: 'Unrecognized webhook format' });

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Outgoing Actions
exports.acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { preparationTime } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const result = await callWeraApi(
      '/pos/v2/order/accept',
      order.source,
      order.branchId,
      'POST',
      {
        merchant_id: await getMerchantId(order.branchId, order.source),
        order_id: parseOrderId(order.weraOrderId),
        preparation_time: Number(preparationTime)
      }
    );

    if (result.code === 1) {
      order.status = 'preparing';
      order.prepStartedAt = new Date();
      await order.save();
      
      const io = req.app.get('socketio');
      if (io) io.emit('statusUpdated', order);

      return res.json({ success: true, data: order });
    }

    res.status(400).json({ success: false, message: result.msg || 'Could not accept order at Wera' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rejectionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const result = await callWeraApi(
      '/pos/v2/order/reject',
      order.source,
      order.branchId,
      'POST',
      {
        merchant_id: await getMerchantId(order.branchId, order.source),
        order_id: parseOrderId(order.weraOrderId),
        rejection_id: Number(rejectionId)
      }
    );

    if (result.code === 1) {
      order.status = 'cancelled';
      order.closedAt = new Date();
      await order.save();

      const io = req.app.get('socketio');
      if (io) io.emit('statusUpdated', order);

      return res.json({ success: true, data: order });
    }

    res.status(400).json({ success: false, message: result.msg || 'Could not reject order at Wera' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.foodReady = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const result = await callWeraApi(
      '/pos/v2/order/food-ready',
      order.source,
      order.branchId,
      'POST',
      {
        merchant_id: await getMerchantId(order.branchId, order.source),
        order_id: parseOrderId(order.weraOrderId)
      }
    );

    if (result.code === 1) {
      order.status = 'ready';
      order.readyAt = new Date();
      await order.save();

      const io = req.app.get('socketio');
      if (io) io.emit('statusUpdated', order);

      return res.json({ success: true, data: order });
    }

    res.status(400).json({ success: false, message: result.msg || 'Could not ready order at Wera' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.orderPickedup = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const result = await callWeraApi(
      '/pos/v2/order/pickedup',
      order.source,
      order.branchId,
      'POST',
      {
        merchant_id: await getMerchantId(order.branchId, order.source),
        order_id: parseOrderId(order.weraOrderId),
        rider_name: order.riderDetails?.name || 'Rider',
        rider_number: order.riderDetails?.phone || '0000000000'
      }
    );

    if (result.code === 1) {
      order.status = 'picked_up';
      await order.save();

      const io = req.app.get('socketio');
      if (io) io.emit('statusUpdated', order);

      return res.json({ success: true, data: order });
    }

    res.status(400).json({ success: false, message: result.msg || 'Could not pick up order at Wera' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.callSupport = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { remark } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const result = await callWeraApi(
      '/pos/v2/order/callsupport',
      order.source,
      order.branchId,
      'POST',
      {
        merchant_id: await getMerchantId(order.branchId, order.source),
        order_id: parseOrderId(order.weraOrderId),
        remark
      }
    );

    res.json({ success: result.code === 1, message: result.msg, details: result.details });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDeliveryAgent = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const result = await callWeraApi(
      '/pos/v2/order/getde',
      order.source,
      order.branchId,
      'POST',
      {
        merchant_id: await getMerchantId(order.branchId, order.source),
        order_id: parseOrderId(order.weraOrderId)
      }
    );

    if (result.code === 1 && result.details) {
      order.riderDetails = {
        name: result.details.rider_name,
        phone: result.details.rider_number,
        status: result.details.rider_status,
        timeToArrive: result.details.time_to_arrive
      };

      if (result.details.rider_status === 'pickedup') {
        order.status = 'picked_up';
      } else if (result.details.rider_status === 'delivered') {
        order.status = 'delivered';
      }

      await order.save();
      const io = req.app.get('socketio');
      if (io) io.emit('statusUpdated', order);
    }

    res.json({ success: result.code === 1, message: result.msg, details: result.details || order.riderDetails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCustomerNumber = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const result = await callWeraApi(
      '/pos/v2/order/getcustomernumber',
      order.source,
      order.branchId,
      'POST',
      {
        merchant_id: await getMerchantId(order.branchId, order.source),
        order_id: parseOrderId(order.weraOrderId)
      }
    );

    res.json({ success: result.code === 1, message: result.msg, details: result.details });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Zomato Complaints Handlers
exports.acceptComplaint = async (req, res) => {
  try {
    const { orderId, complaintId } = req.params;
    const { refundAmount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const result = await callWeraApi(
      '/pos/v2/complaint/accept',
      order.source,
      order.branchId,
      'POST',
      {
        merchant_id: await getMerchantId(order.branchId, order.source),
        id: complaintId,
        refund_amount: Number(refundAmount)
      }
    );

    if (result.code === 1 || result.status === 200) {
      const complaint = order.complaints.find(c => c.id === complaintId);
      if (complaint) {
        complaint.status = 'accepted';
        complaint.refundAmount = Number(refundAmount);
      }
      await order.save();

      const io = req.app.get('socketio');
      if (io) io.emit('statusUpdated', order);

      return res.json({ success: true, message: 'Complaint accepted' });
    }

    res.status(400).json({ success: false, message: result.msg || 'Failed to accept complaint at Wera' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectComplaint = async (req, res) => {
  try {
    const { orderId, complaintId } = req.params;
    const { rejectionId, otherReason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const result = await callWeraApi(
      '/pos/v2/complaint/reject',
      order.source,
      order.branchId,
      'POST',
      {
        merchant_id: await getMerchantId(order.branchId, order.source),
        id: complaintId,
        rejection_id: rejectionId,
        other_reason: otherReason
      }
    );

    if (result.code === 1 || result.status === 200) {
      const complaint = order.complaints.find(c => c.id === complaintId);
      if (complaint) {
        complaint.status = 'rejected';
        complaint.rejectionReason = otherReason || rejectionId;
      }
      await order.save();

      const io = req.app.get('socketio');
      if (io) io.emit('statusUpdated', order);

      return res.json({ success: true, message: 'Complaint rejected' });
    }

    res.status(400).json({ success: false, message: result.msg || 'Failed to reject complaint at Wera' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Internal mapping helper
async function getMerchantId(branchId, platform) {
  const integration = await Integration.findOne({ branchId, platform: platform.toUpperCase() });
  if (!integration) throw new Error(`Active integration settings not found for ${platform}`);
  return integration.merchantId;
}
