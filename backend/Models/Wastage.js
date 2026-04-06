const mongoose = require('mongoose');

const wastageSchema = new mongoose.Schema({
  item: { type: String, required: true },
  quantity: { type: String, required: true },
  reason: { type: String, enum: ['Expired', 'Spoiled', 'Damaged', 'Kitchen Error'], default: 'Expired' },
  value: { type: Number, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Wastage', wastageSchema);
