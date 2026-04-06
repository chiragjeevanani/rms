const express = require('express');
const router = express.Router();
const { getAllWastage, createWastage, updateWastage, deleteWastage } = require('../Controllers/wastageController');
const { protectAdmin } = require('../Middleware/authMiddleware');

router.get('/', getAllWastage);
router.post('/', protectAdmin, createWastage);
router.put('/:id', protectAdmin, updateWastage);
router.delete('/:id', protectAdmin, deleteWastage);

module.exports = router;
