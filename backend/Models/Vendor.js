const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  category: { type: String, default: 'Dry Grocery' },
  status: { type: String, enum: ['Active', 'Review Needed', 'Inactive'], default: 'Active' },
  rating: { type: Number, default: 4.0 },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
