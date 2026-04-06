const mongoose = require('mongoose');

const comboItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  variant: {
    type: String, // Name of the variant if applicable
  },
  quantity: {
    type: Number,
    default: 1
  }
});

const comboSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  preparationTime: { type: Number, default: 20 },
  image: { type: String },
  
  items: [comboItemSchema],
  
  status: { 
    type: String, 
    enum: ['Published', 'Draft'], 
    default: 'Published' 
  },
  isAvailable: { type: Boolean, default: true },
  sku: { type: String },
  
}, { timestamps: true });

module.exports = mongoose.model('Combo', comboSchema);
