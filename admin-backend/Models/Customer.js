const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  defaultDiscount: {
    type: { 
      type: String, 
      enum: ['percentage', 'flat'], 
      default: 'percentage' 
    },
    value: { type: Number, default: 0 }
  },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastVisit: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
