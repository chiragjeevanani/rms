const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema({
  branchId: { type: String, required: true },
  platform: { type: String, enum: ['SWIGGY', 'ZOMATO'], default: 'SWIGGY' },
  apiKey: { type: String },
  merchantId: { type: String },
  outletId: { type: String },
  baseUrl: { type: String, default: 'https://pos.werafoods.com' },
  isConnected: { type: Boolean, default: false },
  lastSyncAt: { type: Date }
}, { timestamps: true });

// Ensure unique platform configuration per branch
IntegrationSchema.index({ branchId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('Integration', IntegrationSchema);
