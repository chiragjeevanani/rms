const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branchName: { type: String, required: true },
  branchCode: { type: String, required: true, unique: true },
  branchEmail: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  gstNumber: { type: String },
  managerName: { type: String },
  openingTime: { type: String },
  closingTime: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Branch', branchSchema);
