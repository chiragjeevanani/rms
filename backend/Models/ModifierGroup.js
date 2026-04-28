const mongoose = require('mongoose');

const modifierOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false }
});

const modifierGroupSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Size", "Extra Toppings"
  image: { type: String },
  selectionType: { 
    type: String, 
    enum: ['Single', 'Multiple'], 
    default: 'Single' 
  },
  isRequired: { type: Boolean, default: false },
  minSelection: { type: Number, default: 0 },
  maxSelection: { type: Number },
  options: [modifierOptionSchema],
  status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }
}, { timestamps: true });

module.exports = mongoose.model('ModifierGroup', modifierGroupSchema);
