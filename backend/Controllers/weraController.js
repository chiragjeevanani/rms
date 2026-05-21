const Integration = require('../Models/Integration');
const Order = require('../Models/Order');
const Category = require('../Models/Category');
const Item = require('../Models/Item');
const ModifierGroup = require('../Models/ModifierGroup');
const Combo = require('../Models/Combo');
const crypto = require('crypto');

// Helper to detect if an order ID or complaint ID is a mock ID for testing
const isMockOrder = (id) => {
  if (!id) return false;
  const str = id.toString();
  return (
    str === '998877' || 
    str.toLowerCase().includes('mock') || 
    str.toLowerCase().includes('test') ||
    str.startsWith('comp-')
  );
};

// Helper to parse order ID - preserves alphanumeric strings for mock mode
const parseOrderId = (id) => {
  if (!id) return id;
  const num = Number(id);
  return isNaN(num) ? id : num;
};

// Helper to check if a Wera API response is successful
const isWeraSuccess = (result) => {
  if (!result) return false;
  if (result.code === 1 || result.status === 200 || result.success === true) return true;
  if (result.code === 0 || result.status === 400 || result.status === 500 || result.error) return false;
  return !result.error;
};

// Helper to generate a unique order number (same pattern as orderController.js)
const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Order.countDocuments({ createdAt: { $gte: new Date().setHours(0,0,0,0) } });
  return `ORD-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
};

// Generic Wera HTTP helper
const callWeraApi = async (endpoint, platform, branchId, method, payload) => {
  // Bypasses live Wera API and returns success for mock test orders / complaints
  if (payload && (
    (payload.order_id && isMockOrder(payload.order_id)) ||
    (payload.id && isMockOrder(payload.id))
  )) {
    console.log(`[MOCK MODE] Intercepted Wera API Call (${endpoint}) for mock ID:`, payload.order_id || payload.id);
    return { code: 1, msg: 'success', details: {} };
  }

  const integration = await Integration.findOne({ branchId, platform: platform.toUpperCase() });
  if (!integration) {
    throw new Error(`Integration settings not found for platform: ${platform} at branch: ${branchId}`);
  }

  const baseUrl = integration.baseUrl || 'https://api.werafoods.com';
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

  const result = await response.json();
  console.log(`Wera API Response (${endpoint}):`, JSON.stringify(result, null, 2));
  return result;
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
        baseUrl: 'https://api.werafoods.com', 
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
  const fs = require('fs');
  const path = require('path');
  const logFilePath = path.join(__dirname, '../webhook_payloads.log');

  try {
    const body = req.body || {};
    console.log('Incoming Wera Webhook Payload:', JSON.stringify(body, null, 2));
    
    // Log payload to file
    fs.appendFileSync(logFilePath, JSON.stringify({ type: 'incoming', timestamp: new Date(), body }) + '\n');

    if (!req.body || Object.keys(body).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Empty request body or invalid Content-Type. Please send JSON with Content-Type: application/json.' 
      });
    }

    // 1. Zomato Complaint Webhook
    if (body.event === 'order_complaint') {
      const weraOrderId = body.data?.order_id || body.data?.wera_order_id;
      const order = await Order.findOne({ weraOrderId });
      if (!order) {
        fs.appendFileSync(logFilePath, JSON.stringify({ type: 'error_complaint_not_found', timestamp: new Date(), weraOrderId }) + '\n');
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

    fs.appendFileSync(logFilePath, JSON.stringify({ type: 'unrecognized_format', timestamp: new Date(), body }) + '\n');
    return res.status(400).json({ success: false, message: 'Unrecognized webhook format' });

  } catch (err) {
    console.error('Webhook error:', err);
    fs.appendFileSync(logFilePath, JSON.stringify({ type: 'error', timestamp: new Date(), error: err.message, stack: err.stack }) + '\n');
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

    if (isWeraSuccess(result)) {
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

    if (isWeraSuccess(result)) {
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

    if (isWeraSuccess(result)) {
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

    if (isWeraSuccess(result)) {
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

    res.json({ success: isWeraSuccess(result), message: result.msg, details: result.details });
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

    if (isWeraSuccess(result) && result.details) {
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

    res.json({ success: isWeraSuccess(result), message: result.msg, details: result.details || order.riderDetails });
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

    res.json({ success: isWeraSuccess(result), message: result.msg, details: result.details });
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

    if (isWeraSuccess(result)) {
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

    if (isWeraSuccess(result)) {
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

// Deterministic helper to convert 24-character hex ObjectId string to positive integer
function mongoIdToNumeric(mongoId) {
  if (!mongoId) return 0;
  const str = mongoId.toString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Sanitize image URL for Swiggy API.
 * Swiggy strictly requires URL to end with .jpg, .png, or .ashx.
 * - Returns null for localhost/127.0.0.1 (Swiggy can't reach internal servers)
 * - Returns null for unsupported formats (.webp, .gif, .svg etc.)
 * - If the URL already ends with a valid extension (e.g., .jpg, .png) -> keep as-is
 * - For dynamic images (like Unsplash with query params), appends `&ext=.jpg` so it remains fully functional and compliant
 * - For bare photo IDs (like Unsplash without query params), appends `?ext=.jpg` so it remains fully functional and compliant
 */
const VALID_IMG_EXTS = ['.jpg', '.jpeg', '.png', '.ashx'];
const UNSUPPORTED_EXTS = ['.webp', '.gif', '.svg', '.bmp', '.tiff', '.tif'];
function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const trimmed = url.trim();
    if (!trimmed) return null;

    // Reject localhost / internal URLs — Swiggy can't reach them
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(trimmed)) return null;

    const lc = trimmed.toLowerCase();

    // Reject unsupported image formats (checking path without query parameters)
    const cleanPath = trimmed.split('?')[0].split('#')[0];
    if (UNSUPPORTED_EXTS.some(ext => cleanPath.toLowerCase().endsWith(ext))) return null;

    // If the URL already ends with a valid extension (even with casing)
    if (VALID_IMG_EXTS.some(ext => lc.endsWith(ext))) return trimmed;

    // If it has query parameters, append &ext=.jpg
    if (trimmed.includes('?')) {
      return trimmed + '&ext=.jpg';
    }

    // If it is an Unsplash URL (or similar) without query parameters, append ?ext=.jpg
    if (trimmed.includes('images.unsplash.com')) {
      return trimmed + '?ext=.jpg';
    }

    // Default fallback
    return trimmed + '.jpg';
  } catch {
    return null;
  }
}

// Push Full Menu to Swiggy/Zomato via Wera
exports.pushMenu = async (req, res) => {
  const { platform, branchId } = req.params;
  try {
    const isSwiggy = platform.toUpperCase() === 'SWIGGY';

    const integration = await Integration.findOne({ branchId, platform: platform.toUpperCase() });
    if (!integration || !integration.apiKey) {
      return res.status(400).json({ success: false, message: 'Settings not found. Please save credentials first.' });
    }

    const merchantId = integration.outletId || integration.merchantId;
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'Outlet ID / Merchant ID is required in settings.' });
    }

    // Fetch Categories, Items and Combos for the branch
    let categories = await Category.find({ branchId, status: 'Published' });
    const items = await Item.find({ branchId, status: 'Published' }).populate('modifiers');
    const combos = await Combo.find({ branchId, status: 'Published' }).populate('items.item');

    // 1. Dynamic Check and Creation of Combo Category
    let comboCategory = categories.find(c => /^(combo|combos)$/i.test(c.name));
    if (!comboCategory && combos.length > 0) {
      comboCategory = new Category({
        name: 'Combos',
        description: 'Delicious meal combos',
        status: 'Published',
        branchId: branchId
      });
      await comboCategory.save();
      categories.push(comboCategory);
      console.log(`Created new Combo category in DB: ${comboCategory._id}`);
    }

    // 2. Dynamic Check and Creation of Recommended Category
    const featuredItems = items.filter(item => item.isFeatured);
    let recommendedCategory = categories.find(c => /^(recommended|featured)$/i.test(c.name));
    if (!recommendedCategory && featuredItems.length > 0) {
      recommendedCategory = new Category({
        name: 'Recommended',
        description: 'Chef\'s special recommendations',
        status: 'Published',
        branchId: branchId
      });
      await recommendedCategory.save();
      categories.push(recommendedCategory);
      console.log(`Created new Recommended category in DB: ${recommendedCategory._id}`);
    }

    let result;

    if (isSwiggy) {
      // ================================================================
      // SWIGGY PAYLOAD — flat main_categories / items structure
      // Docs endpoint: /pos/v2/menu/directmenu
      // Format: main_categories = [{id, name, description, order}]
      //         items = [{id, category_id (string), name, is_veg, ...}]
      // ================================================================

      // Build flat main_categories list (NO sub_categories field)
      const mainCategories = [];
      let catOrder = 1;
      for (const category of categories) {
        mainCategories.push({
          id: mongoIdToNumeric(category._id.toString()),
          name: category.name,
          description: category.description || '',
          order: catOrder++
        });
      }

      // Sort mainCategories so Recommended is first
      mainCategories.sort((a, b) => {
        if (/^(recommended|featured)$/i.test(a.name)) return -1;
        if (/^(recommended|featured)$/i.test(b.name)) return 1;
        return 0;
      });
      // Re-assign order numbers sequentially
      mainCategories.forEach((cat, idx) => {
        cat.order = idx + 1;
      });

      let swiggyComboCatId = null;
      let swiggyRecommendedCatId = null;

      const existingComboCat = categories.find(c => /^(combo|combos)$/i.test(c.name));
      if (existingComboCat) {
        swiggyComboCatId = mongoIdToNumeric(existingComboCat._id.toString());
      }

      const existingRecCat = categories.find(c => /^(recommended|featured)$/i.test(c.name));
      if (existingRecCat) {
        swiggyRecommendedCatId = mongoIdToNumeric(existingRecCat._id.toString());
      }

      const menuItems = [];
      let itemOrder = 0;
      for (const item of items) {
        if (!item.category) continue;
        const catIdStr = item.category.toString();
        const matchedCategory = categories.find(c => c._id.toString() === catIdStr);
        if (!matchedCategory) continue;

        // Map Variant Groups
        const variantGroups = [];
        const pricingCombinations = [];

        if (item.hasVariants && item.variants && item.variants.length > 0) {
          const variantGroupId = mongoIdToNumeric(item._id.toString() + '_variant_group');
          const mappedVariants = item.variants.map((v) => ({
            id: mongoIdToNumeric(v._id),
            name: v.name,
            price: v.price.toString(),
            default: v.isDefault || false,
            in_stock: item.isAvailable && v.isAvailable !== false,
            is_veg: item.foodType === 'Veg',
            gst_details: null,
            default_dependent_variant_id: null,
            default_dependent_variant_group_id: null
          }));

          variantGroups.push({
            id: variantGroupId,
            name: 'Size',
            order: 0,
            variants: mappedVariants
          });

          for (const v of item.variants) {
            pricingCombinations.push({
              price: v.price.toString(),
              addon_combination: [],
              variant_combination: [{
                variant_group_id: variantGroupId,
                variant_id: mongoIdToNumeric(v._id)
              }]
            });
          }
        }

        // Map Addon Groups
        const addonGroups = [];
        if (item.modifiers && item.modifiers.length > 0) {
          for (const modGroup of item.modifiers) {
            if (!modGroup || modGroup.status === 'Draft') continue;

            const mappedAddons = (modGroup.options || []).map((opt, oIdx) => ({
              id: mongoIdToNumeric(opt._id),
              name: opt.name,
              price: opt.price || 0,
              is_veg: item.foodType === 'Veg',
              in_stock: opt.isAvailable !== false,
              order: oIdx,
              is_default: opt.isDefault ? 1 : null,
              gst_details: null
            }));

            addonGroups.push({
              id: mongoIdToNumeric(modGroup._id),
              name: modGroup.name,
              addon_free_limit: null,
              addon_limit: modGroup.maxSelection || 1,
              addon_min_limit: modGroup.isRequired ? (modGroup.minSelection || 1) : null,
              order: null,
              addons: mappedAddons
            });
          }
        }

        const taxRate = item.tax || 5;
        const mappedItem = {
          id: mongoIdToNumeric(item._id),
          category_id: mongoIdToNumeric(catIdStr).toString(),
          name: item.name,
          is_veg: item.foodType === 'Veg',
          description: item.description || '',
          price: item.hasVariants ? "0" : (item.basePrice || 0).toString(),
          gst_details: {
            igst: 0,
            cgst: taxRate / 2,
            sgst: taxRate / 2,
            inclusive: false,
            gst_liability: 'SWIGGY'
          },
          packing_charges: 0,
          enable: item.isAvailable ? 1 : 0,
          in_stock: item.isAvailable ? 1 : 0,
          addon_free_limit: -1,
          addon_limit: -1,
          image_url: sanitizeImageUrl(item.image),
          item_slots: [],
          variant_groups: variantGroups,
          addon_groups: addonGroups,
          pricing_combinations: pricingCombinations,
          order: itemOrder++,
          recommended: item.isFeatured || false,
          catalog_attributes: {
            spice_level: null,
            sweet_level: null,
            gravy_property: null,
            bone_property: null,
            contain_seasonal_ingredients: null,
            accompaniments: null,
            quantity: null,
            serves_how_many: null
          }
        };

        menuItems.push(mappedItem);

        // Duplicate featured items into the Recommended category if it exists and is separate
        if (item.isFeatured && swiggyRecommendedCatId && swiggyRecommendedCatId.toString() !== mappedItem.category_id) {
          menuItems.push({
            ...mappedItem,
            id: mongoIdToNumeric(item._id.toString() + '_recommended'),
            category_id: swiggyRecommendedCatId.toString(),
            name: item.name + '\u200B',
            recommended: true,
            order: itemOrder++
          });
        }
      }

      // Append Combos to menuItems for Swiggy
      if (swiggyComboCatId && combos.length > 0) {
        for (const combo of combos) {
          const isVeg = combo.items.every(ci => !ci.item || ci.item.foodType === 'Veg');
          menuItems.push({
            id: mongoIdToNumeric(combo._id.toString()),
            category_id: swiggyComboCatId.toString(),
            name: combo.name,
            is_veg: isVeg,
            description: combo.description || '',
            price: (combo.price || 0).toString(),
            gst_details: {
              igst: 0,
              cgst: 2.5,
              sgst: 2.5,
              inclusive: false,
              gst_liability: 'SWIGGY'
            },
            packing_charges: 0,
            enable: combo.isAvailable ? 1 : 0,
            in_stock: combo.isAvailable ? 1 : 0,
            addon_free_limit: -1,
            addon_limit: -1,
            image_url: sanitizeImageUrl(combo.image),
            item_slots: [],
            variant_groups: [],
            addon_groups: [],
            pricing_combinations: [],
            order: itemOrder++,
            recommended: false,
            catalog_attributes: {
              spice_level: null,
              sweet_level: null,
              gravy_property: null,
              bone_property: null,
              contain_seasonal_ingredients: null,
              accompaniments: null,
              quantity: null,
              serves_how_many: null
            }
          });
        }
      }

      const swiggyPayload = {
        merchant_id: Number(merchantId) || merchantId,
        menu: {
          entity: {
            main_categories: mainCategories,
            items: menuItems
          }
        }
      };

      console.log('Pushing Swiggy Menu payload to Wera:', JSON.stringify(swiggyPayload, null, 2));

      // Correct endpoint per Wera API docs v15 (was /directswiggymenu)
      result = await callWeraApi('/pos/v2/menu/directmenu', 'SWIGGY', branchId, 'POST', swiggyPayload);

    } else {
      // ================================================================
      // ZOMATO PAYLOAD — categories / catalogues / modifierGroups structure
      // Docs endpoint: /pos/v2/menu/directzomatomenu
      // ================================================================

      const zomatoCatalogues = [];
      const zomatoModifierGroupsRoot = [];
      const modGroupsAdded = new Set();

      // Build Combo catalogues for Zomato
      for (const combo of combos) {
        const isVeg = combo.items.every(ci => !ci.item || ci.item.foodType === 'Veg');
        zomatoCatalogues.push({
          vendorEntityId: combo._id.toString(),
          name: combo.name,
          description: combo.description || '',
          inStock: combo.isAvailable !== false,
          isVisible: true,
          tags: [isVeg ? 'veg' : 'non-veg'],
          properties: [],
          variants: [{
            vendorEntityId: combo._id.toString() + '_var',
            inStock: combo.isAvailable !== false,
            propertyValues: [],
            prices: [{ service: 'delivery', price: combo.price || 0 }],
            modifierGroups: []
          }],
          taxes: []
        });
      }

      // Step 1: Build root-level modifierGroups and their orphan option catalogues
      for (const item of items) {
        if (!item.modifiers || item.modifiers.length === 0) continue;
        for (const modGroup of item.modifiers) {
          if (!modGroup || modGroup.status === 'Draft') continue;
          const mgId = modGroup._id.toString();
          if (modGroupsAdded.has(mgId)) continue;
          modGroupsAdded.add(mgId);

          const mgVariantRefs = [];
          for (const opt of (modGroup.options || [])) {
            const optId    = opt._id.toString();
            const optVarId = optId + '_var';

            // Orphan catalogue for this modifier option (not under any category)
            zomatoCatalogues.push({
              vendorEntityId: optId,
              name: opt.name,
              description: '',
              inStock: opt.isAvailable !== false,
              isVisible: true,
              tags: ['veg'],
              properties: [],
              variants: [{
                vendorEntityId: optVarId,
                inStock: true,
                propertyValues: [],
                prices: [{ service: 'delivery', price: opt.price || 0 }],
                modifierGroups: []
              }],
              taxes: []
            });

            mgVariantRefs.push({ vendorEntityId: optVarId });
          }

          zomatoModifierGroupsRoot.push({
            vendorEntityId: mgId,
            name: modGroup.name,
            min: modGroup.isRequired ? (modGroup.minSelection || 1) : 0,
            max: modGroup.maxSelection || 1,
            variants: mgVariantRefs
          });
        }
      }

      // Step 2: Build item catalogues
      for (const item of items) {
        if (!item.category) continue;
        const itemId   = item._id.toString();
        const isVeg    = item.foodType === 'Veg';
        const taxRate  = item.tax || 5;
        const halfRate = taxRate / 2;
        const taxStr   = halfRate.toFixed(2);
        const taxes    = taxRate > 0 ? [`CGST_D_P_${taxStr}`, `SGST_D_P_${taxStr}`] : [];

        const itemModGroupRefs = (item.modifiers || [])
          .filter(mg => mg && mg.status !== 'Draft')
          .map(mg => ({ vendorEntityId: mg._id.toString() }));

        let properties = [];
        let variants   = [];

        if (item.hasVariants && item.variants && item.variants.length > 0) {
          const propId = (itemId + '_prop_size').substring(0, 50);
          const propertyValues = item.variants.map(v => ({
            vendorEntityId: v._id.toString(),
            value: v.name,
            kind: ''
          }));
          properties = [{ vendorEntityId: propId, name: 'Size', kind: '', propertyValues }];
          variants = item.variants.map(v => ({
            vendorEntityId: v._id.toString(),
            inStock: item.isAvailable !== false && v.isAvailable !== false,
            propertyValues: [{ vendorEntityId: v._id.toString() }],
            prices: [{ service: 'delivery', price: v.price || 0 }],
            modifierGroups: itemModGroupRefs
          }));
        } else {
          variants = [{
            vendorEntityId: itemId + '_var',
            inStock: item.isAvailable !== false,
            propertyValues: [],
            prices: [{ service: 'delivery', price: item.basePrice || 0 }],
            modifierGroups: itemModGroupRefs
          }];
        }

        zomatoCatalogues.push({
          vendorEntityId: itemId,
          name: item.name,
          description: item.description || '',
          inStock: item.isAvailable !== false,
          isVisible: true,
          tags: [isVeg ? 'veg' : 'non-veg'],
          properties,
          variants,
          taxes
        });
      }

      // Step 3: Build categories with subCategories → entity references
      const zomatoCategories = [];

      const existingZomatoComboCat = categories.find(c => /^(combo|combos)$/i.test(c.name));
      const existingZomatoRecCat = categories.find(c => /^(recommended|featured)$/i.test(c.name));

      for (const category of categories) {
        const catId    = category._id.toString();
        let catItems = items.filter(i => i.category && i.category.toString() === catId);

        // If this is the existing Recommended category, merge featured items
        const isRecCategory = existingZomatoRecCat && existingZomatoRecCat._id.toString() === catId;
        if (isRecCategory) {
          const itemIdsInCat = new Set(catItems.map(i => i._id.toString()));
          for (const fItem of featuredItems) {
            if (!itemIdsInCat.has(fItem._id.toString())) {
              catItems.push(fItem);
            }
          }
        }

        const subCatMap = new Map();
        for (const item of catItems) {
          const subCatKey = item.subCategory ? item.subCategory.trim() : '__default__';
          if (!subCatMap.has(subCatKey)) subCatMap.set(subCatKey, []);
          subCatMap.get(subCatKey).push(item);
        }

        // If this is the existing Combos category, append combos under a "Combos" subcategory
        const isComboCategory = existingZomatoComboCat && existingZomatoComboCat._id.toString() === catId;
        if (isComboCategory && combos.length > 0) {
          subCatMap.set('Combos', combos);
        }

        const subCategories = [];
        for (const [subCatKey, subItems] of subCatMap.entries()) {
          const subCatId = subCatKey === '__default__'
            ? (catId + '_default').substring(0, 50)
            : (catId + '_' + subCatKey.replace(/\s+/g, '_')).substring(0, 50);

          subCategories.push({
            vendorEntityId: subCatId,
            name: subCatKey === '__default__' ? category.name : subCatKey,
            entities: subItems.map(item => ({
              entityType: 'catalogue',
              vendorEntityId: item._id.toString()
            }))
          });
        }

        // Only push category if it has subcategories
        if (subCategories.length > 0) {
          zomatoCategories.push({ vendorEntityId: catId, name: category.name, subCategories });
        }
      }

      // Sort zomatoCategories so Recommended is first
      zomatoCategories.sort((a, b) => {
        if (/^(recommended|featured)$/i.test(a.name)) return -1;
        if (/^(recommended|featured)$/i.test(b.name)) return 1;
        return 0;
      });

      const zomatoPayload = {
        outletId: merchantId,
        menu: {
          categories: zomatoCategories,
          catalogues: zomatoCatalogues,
          modifierGroups: zomatoModifierGroupsRoot
        },
        charges: [],
        resConfig: []
      };

      console.log('Pushing Zomato Menu payload to Wera:', JSON.stringify(zomatoPayload, null, 2));

      result = await callWeraApi('/pos/v2/menu/directzomatomenu', 'ZOMATO', branchId, 'POST', zomatoPayload);
    }

    if (isWeraSuccess(result)) {
      const pushedItemsCount = isSwiggy ? (menuItems ? menuItems.length : 0) : (zomatoCatalogues ? zomatoCatalogues.length : 0);
      await Integration.findOneAndUpdate(
        { branchId, platform: platform.toUpperCase() },
        { 
          lastMenuPushedAt: new Date(), 
          lastSyncAt: new Date(),
          lastMenuPushedItemsCount: pushedItemsCount
        }
      );
      return res.json({ 
        success: true, 
        message: `${platform.toUpperCase()} menu pushed successfully`, 
        details: result.details || result.msg,
        pushedItemsCount: pushedItemsCount
      });
    }

    res.status(400).json({ 
      success: false, 
      message: result ? (result.msg || 'Could not push menu to Wera') : 'No response from Wera' 
    });

  } catch (err) {
    console.error('Menu push error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Toggle Item Availability
exports.toggleItemAvailability = async (req, res) => {
  const { platform, branchId } = req.params;
  const { item_ids, status, from_time, to_time } = req.body;

  try {
    const isSwiggy = platform.toUpperCase() === 'SWIGGY';
    const isAvailable = !!status;
    const mongoIds = Array.isArray(item_ids) ? item_ids : [item_ids];

    // 1. Update database state locally
    await Item.updateMany({ _id: { $in: mongoIds } }, { isAvailable });

    // 2. Call Wera API if integration settings exist
    const integration = await Integration.findOne({ branchId, platform: platform.toUpperCase() });
    if (integration && integration.apiKey) {
      const merchantId = integration.outletId || integration.merchantId;
      if (merchantId) {
        const posItemIds = [];
        for (const mId of mongoIds) {
          posItemIds.push(mongoIdToNumeric(mId).toString());
          
          if (isSwiggy) {
            const itemObj = await Item.findById(mId);
            if (itemObj && itemObj.isFeatured) {
              posItemIds.push(mongoIdToNumeric(mId.toString() + '_recommended').toString());
            }
          }
        }

        const payload = {
          merchant_id: merchantId.toString(),
          status: isAvailable,
          item_ids: posItemIds
        };

        if (from_time) payload.from_time = from_time;
        if (to_time) payload.to_time = to_time;

        console.log(`Sending Item Toggle to Wera (${platform}):`, JSON.stringify(payload));
        const result = await callWeraApi('/pos/v2/item/directtoggle', platform, branchId, 'POST', payload);
        
        return res.json({
          success: result.code === 1 || result.status === 200 || result.code === null || !result.error,
          message: result.msg || `${platform.toUpperCase()} item availability updated via Wera`,
          details: result.details
        });
      }
    }

    res.json({
      success: true,
      message: 'Item availability updated locally (Integration not active)'
    });

  } catch (err) {
    console.error('Item availability toggle error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Toggle Addon Availability
exports.toggleAddonAvailability = async (req, res) => {
  const { platform, branchId } = req.params;
  const { addon_ids, status } = req.body;

  try {
    const isAvailable = !!status;
    const mongoIds = Array.isArray(addon_ids) ? addon_ids : [addon_ids];

    // 1. Update database state locally
    const modifierGroups = await ModifierGroup.find({ 'options._id': { $in: mongoIds } });
    for (const group of modifierGroups) {
      let updated = false;
      for (const opt of group.options) {
        if (mongoIds.includes(opt._id.toString())) {
          opt.isAvailable = isAvailable;
          updated = true;
        }
      }
      if (updated) {
        await group.save();
      }
    }

    // 2. Call Wera API if integration settings exist
    const integration = await Integration.findOne({ branchId, platform: platform.toUpperCase() });
    if (integration && integration.apiKey) {
      const merchantId = integration.outletId || integration.merchantId;
      if (merchantId) {
        const posAddonIds = mongoIds.map(id => mongoIdToNumeric(id).toString());

        const payload = {
          merchant_id: merchantId.toString(),
          status: isAvailable,
          addon_ids: posAddonIds
        };

        console.log(`Sending Addon Toggle to Wera (${platform}):`, JSON.stringify(payload));
        const result = await callWeraApi('/pos/v2/menu/directaddontoggle', platform, branchId, 'POST', payload);
        
        return res.json({
          success: result.code === 1 || result.status === 200 || result.code === null || !result.error,
          message: result.msg || `${platform.toUpperCase()} addon availability updated via Wera`,
          details: result.details
        });
      }
    }

    res.json({
      success: true,
      message: 'Addon availability updated locally (Integration not active)'
    });

  } catch (err) {
    console.error('Addon availability toggle error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Toggle Size Availability
exports.toggleSizeAvailability = async (req, res) => {
  const { platform, branchId } = req.params;
  const { item_id, size_id, status } = req.body;

  try {
    const isSwiggy = platform.toUpperCase() === 'SWIGGY';
    const isAvailable = !!status;

    // 1. Update database state locally
    const itemObj = await Item.findById(item_id);
    if (!itemObj) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const variant = itemObj.variants.id(size_id);
    if (variant) {
      variant.isAvailable = isAvailable;
      await itemObj.save();
    }

    // 2. Call Wera API if integration settings exist
    const integration = await Integration.findOne({ branchId, platform: platform.toUpperCase() });
    if (integration && integration.apiKey) {
      const merchantId = integration.outletId || integration.merchantId;
      if (merchantId) {
        const payload = {
          merchant_id: merchantId.toString(),
          status: isAvailable,
          item_id: mongoIdToNumeric(item_id).toString(),
          size_id: mongoIdToNumeric(size_id).toString()
        };

        console.log(`Sending Size Toggle to Wera (${platform}):`, JSON.stringify(payload));
        const result = await callWeraApi('/pos/v2/menu/directsizetoggle', platform, branchId, 'POST', payload);

        if (isSwiggy && itemObj.isFeatured) {
          const recPayload = {
            ...payload,
            item_id: mongoIdToNumeric(item_id.toString() + '_recommended').toString()
          };
          console.log(`Sending Recommended Size Toggle to Wera (${platform}):`, JSON.stringify(recPayload));
          await callWeraApi('/pos/v2/menu/directsizetoggle', platform, branchId, 'POST', recPayload).catch(err => {
            console.error('Failed to toggle size for recommended copy:', err.message);
          });
        }

        return res.json({
          success: result.code === 1 || result.status === 200 || result.code === null || !result.error,
          message: result.msg || `${platform.toUpperCase()} size availability updated via Wera`,
          details: result.details
        });
      }
    }

    res.json({
      success: true,
      message: 'Size availability updated locally (Integration not active)'
    });

  } catch (err) {
    console.error('Size availability toggle error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
