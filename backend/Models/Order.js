const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'Combo' },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  image: String,
  modifiers: [{
    group: String,
    value: String
  }],
  kotId: Number, // To track which batch this item belonged to
  addedAt: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
  method: { 
    type: String, 
    enum: ['Cash', 'Card', 'UPI', 'Due', 'Other', 'Part'],
    required: true 
  },
  amount: { type: Number, required: true },
  transactionId: String,
  paidAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  tableName: {
    type: String,
    required: true
  },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  customer: {
    name: String,
    mobile: String,
    email: String,
    address: String,
    locality: String
  },
  items: [orderItemSchema],
  
  // Financials
  subTotal: { type: Number, required: true, default: 0 },
  tax: { type: Number, default: 0 },
  discount: {
    amount: { type: Number, default: 0 },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
    reason: String
  },
  serviceCharge: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  containerCharge: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  roundOff: { type: Number, default: 0 },
  
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  isBilled: { type: Boolean, default: false },
  orderType: {
    type: String,
    enum: ['Dine-In', 'Takeaway', 'Delivery'],
    default: 'Dine-In'
  },
  waiterName: {
    type: String,
    default: 'Customer App'
  },
  source: {
    type: String,
    default: 'POS Terminal'
  },
  
  // Payment & Splitting
  payments: [paymentSchema], // Supports multiple payment modes
  isSplit: { type: Boolean, default: false },
  splitDetails: [{
    customerName: String,
    amount: Number,
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
  }],
  
  prepStartedAt: Date,
  readyAt: Date,
  closedAt: Date,
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
