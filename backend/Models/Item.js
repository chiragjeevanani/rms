const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  sku: { type: String },
  isDefault: { type: Boolean, default: false }
});

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  subCategory: { type: String },
  description: { type: String },
  image: { type: String },
  
  foodType: { 
    type: String, 
    enum: ['Veg', 'Non-Veg', 'Egg'], 
    default: 'Veg' 
  },
  cuisineType: { type: String },
  
  hasVariants: { type: Boolean, default: false },
  basePrice: { type: Number },
  originalPrice: { type: Number },
  variants: [variantSchema],
  tax: { type: Number, default: 0 },
  
  modifiers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ModifierGroup' 
  }],
  
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number }, // in minutes
  
  sku: { type: String },
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  
  // Stock Management
  trackStock: { type: Boolean, default: false },
  stockCount: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 5 },
  
  status: { 
    type: String, 
    enum: ['Published', 'Draft'], 
    default: 'Published' 
  },
  reviews: [{
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
