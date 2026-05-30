const express = require('express');
const router = express.Router();
const {
  getCombos,
  getCombo,
  createCombo,
  updateCombo,
  deleteCombo,
  bulkCreateCombos
} = require('../Controllers/comboController');
const { protectAdmin } = require('../Middleware/authMiddleware');

router.post('/bulk', protectAdmin, bulkCreateCombos);

router.route('/')
  .get(protectAdmin, getCombos)
  .post(protectAdmin, createCombo);

router.route('/:id')
  .get(protectAdmin, getCombo)
  .put(protectAdmin, updateCombo)
  .delete(protectAdmin, deleteCombo);

module.exports = router;
