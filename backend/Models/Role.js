const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  description: { type: String },
  permissions: { type: [String], default: [] },
  status: { type: String, enum: ['Published', 'Draft'], default: 'Published' }
}, { timestamps: true });

// Unique within a branch
roleSchema.index({ branchId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
