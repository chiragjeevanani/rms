const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  tableCode: {
    type: String,
    required: true,
    unique: true,
    trim: true // e.g. TB-001
  },
  capacity: {
    type: Number,
    required: true
  },
  area: {
    type: String,
    required: true,
    enum: ['AC Hall', 'Outdoor', 'Terrace', 'Lounge', 'Private Room', 'Garden', 'Bar Area'],
    default: 'AC Hall'
  },
  floor: {
    type: String,
    required: true,
    enum: ['Ground Floor', 'First Floor', 'Second Floor', 'Basement', 'Roof Top'],
    default: 'Ground Floor'
  },
  shape: {
    type: String,
    enum: ['Square', 'Round', 'Rectangle'],
    default: 'Square'
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Damaged', 'Occupied', 'Reserved'],
    default: 'Available'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Table', tableSchema);
