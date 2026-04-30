const mongoose = require('mongoose');

const ExternalMappingSchema = new mongoose.Schema({
  branchId: { type: String, required: true },
  platform: { type: String, enum: ['SWIGGY', 'ZOMATO'], default: 'SWIGGY' },
  entityType: { type: String, enum: ['ITEM', 'CATEGORY', 'ADDON', 'VARIANT'], required: true },
  internalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  externalId: { type: String, required: true },
  syncEnabled: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique mapping per branch and platform
ExternalMappingSchema.index({ branchId: 1, platform: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('ExternalMapping', ExternalMappingSchema);
