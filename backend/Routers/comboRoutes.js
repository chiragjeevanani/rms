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
  .get(getCombos)
  .post(createCombo);

router.route('/:id')
  .get(getCombo)
  .put(updateCombo)
  .delete(deleteCombo);

module.exports = router;
