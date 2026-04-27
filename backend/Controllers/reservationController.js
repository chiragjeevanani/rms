const Reservation = require('../Models/Reservation');
const Table = require('../Models/Table');

// @desc    Get all reservations
// @route   GET /api/reservations
const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('tableId')
      .sort({ dateTime: 1 });
    res.json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reservations' });
  }
};

// @desc    Create a new reservation
// @route   POST /api/reservations
const createReservation = async (req, res) => {
  try {
    const { tableId, status } = req.body;
    
    const newReservation = new Reservation(req.body);
    await newReservation.save();

    // If reservation is confirmed, we could optionally mark table as Reserved
    if (status === 'Confirmed' && tableId) {
      await Table.findByIdAndUpdate(tableId, { status: 'Reserved' });
      const io = req.app.get('socketio');
      if (io) io.emit('tableStatusChanged');
    }

    res.status(201).json({ success: true, data: newReservation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update reservation status
// @route   PATCH /api/reservations/:id/status
const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    const oldStatus = reservation.status;
    reservation.status = status;
    await reservation.save();

    // Handle Table Status Changes
    const io = req.app.get('socketio');
    
    if (status === 'Seated' && reservation.tableId) {
      // Mark table as Occupied
      await Table.findByIdAndUpdate(reservation.tableId, { status: 'Occupied' });
      if (io) io.emit('tableStatusChanged');
    } else if (status === 'Cancelled' || status === 'Completed') {
      // Free the table
      if (reservation.tableId) {
        await Table.findByIdAndUpdate(reservation.tableId, { status: 'Available' });
        if (io) io.emit('tableStatusChanged');
      }
    } else if (status === 'Confirmed' && reservation.tableId) {
       await Table.findByIdAndUpdate(reservation.tableId, { status: 'Reserved' });
       if (io) io.emit('tableStatusChanged');
    }

    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReservations,
  createReservation,
  updateReservationStatus
};
