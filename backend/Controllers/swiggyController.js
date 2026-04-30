const Integration = require('../Models/Integration');
const ExternalMapping = require('../Models/ExternalMapping');
const Order = require('../Models/Order');

// Phase 2: Save Credentials
exports.saveSettings = async (req, res) => {
  try {
    const { branchId } = req.params;
    const updateData = req.body;

    const integration = await Integration.findOneAndUpdate(
      { branchId, platform: 'SWIGGY' },
      { ...updateData, branchId, platform: 'SWIGGY' },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Swiggy credentials updated', data: integration });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Phase 2: Test Connection (Mock)
exports.testConnection = async (req, res) => {
  try {
    const { branchId } = req.params;
    const settings = await Integration.findOne({ branchId, platform: 'SWIGGY' });

    if (!settings || !settings.apiKey) {
      return res.status(400).json({ success: false, message: 'Settings not found' });
    }

    // In production, you would call Swiggy's health check API here
    // For now, we mock a successful handshake
    settings.isConnected = true;
    await settings.save();

    res.json({ success: true, connected: true, message: 'Handshake successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Phase 5: Swiggy Webhook (Order Ingestion)
exports.orderWebhook = async (req, res) => {
  try {
    const swiggyOrder = req.body;
    
    // 1. Identify Branch
    const settings = await Integration.findOne({ outletId: swiggyOrder.outlet_id });
    if (!settings) return res.status(404).json({ success: false, message: 'Outlet mapping failed' });

    // 2. Create Order in RMS
    // This is a simplified version - mapping logic would go here
    const newOrder = new Order({
      branchId: settings.branchId,
      customerName: swiggyOrder.customer?.name || 'Swiggy Customer',
      phoneNumber: swiggyOrder.customer?.phone || '0000000000',
      items: swiggyOrder.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: swiggyOrder.order_total,
      orderSource: 'SWIGGY',
      externalOrderId: swiggyOrder.order_id,
      status: 'PENDING'
    });

    await newOrder.save();

    // 3. Respond to Swiggy (Must be fast)
    res.json({ success: true, message: 'Order received by RMS' });
    
    console.log(`🛎️  New Swiggy Order: ${swiggyOrder.order_id} synced to Branch: ${settings.branchId}`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
