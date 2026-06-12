const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'CentralAdmin' },
  event: { type: String, required: true },
  payload: { type: Object, default: {} },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  error: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('SyncLog', syncLogSchema);
