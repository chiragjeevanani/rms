const express = require('express');
const router = express.Router();
const { 
  getReservations, 
  createReservation, 
  updateReservationStatus 
} = require('../Controllers/reservationController');

router.get('/', getReservations);
router.post('/', createReservation);
router.patch('/:id/status', updateReservationStatus);

module.exports = router;
