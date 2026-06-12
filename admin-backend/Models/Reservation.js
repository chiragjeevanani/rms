const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    default: 1
  },
  dateTime: {
    type: Date,
    required: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  },
  tableName: String,
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Seated', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  notes: String,
  source: {
    type: String,
    default: 'POS'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema);
