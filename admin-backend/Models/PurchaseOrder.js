const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  vendor: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['Confirmed', 'Pending', 'Delivered'], default: 'Confirmed' },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
