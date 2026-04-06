const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Published', 'Draft'],
    default: 'Published',
  }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
