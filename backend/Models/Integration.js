const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema({
  branchId: { type: String, required: true, unique: true },
  platform: { type: String, enum: ['SWIGGY', 'ZOMATO'], default: 'SWIGGY' },
  apiKey: { type: String },
  merchantId: { type: String },
  outletId: { type: String },
  baseUrl: { type: String, default: 'https://api.swiggy.com' },
  isConnected: { type: Boolean, default: false },
  lastSyncAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Integration', IntegrationSchema);
