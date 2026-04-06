const express = require('express');
const router = express.Router();
const tableController = require('../Controllers/tableController');

// All endpoints for tables
router.get('/', tableController.getTables);
router.post('/', tableController.addTable);
router.put('/:id', tableController.updateTable);
router.patch('/:id/status', tableController.updateTableStatus);
router.delete('/:id', tableController.deleteTable);

module.exports = router;
