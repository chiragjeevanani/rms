const express = require('express');
const router = express.Router();
const {
  getCombos,
  getCombo,
  createCombo,
  updateCombo,
  deleteCombo
} = require('../Controllers/comboController');

router.route('/')
  .get(getCombos)
  .post(createCombo);

router.route('/:id')
  .get(getCombo)
  .put(updateCombo)
  .delete(deleteCombo);

module.exports = router;
