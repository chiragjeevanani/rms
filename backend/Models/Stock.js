const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  unit: { type: String, enum: ['Kgs', 'Ltrs', 'Units', 'Boxes'], default: 'Kgs' },
  minLevel: { type: Number, required: true, default: 0 },
  category: { type: String, required: true },
  price: { type: Number, default: 0 },
  lastRestocked: { type: Date, default: Date.now },
  status: { type: String, enum: ['Published', 'Draft'], default: 'Published' }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
