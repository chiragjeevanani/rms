const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: { type: [String], default: [] },
  status: { type: String, enum: ['Published', 'Draft'], default: 'Published' }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
