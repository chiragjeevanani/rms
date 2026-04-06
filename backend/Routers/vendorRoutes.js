const express = require('express');
const router = express.Router();
const { getAllVendors, createVendor, updateVendor, deleteVendor } = require('../Controllers/vendorController');
const { protectAdmin } = require('../Middleware/authMiddleware');

router.get('/', getAllVendors);
router.post('/', protectAdmin, createVendor);
router.put('/:id', protectAdmin, updateVendor);
router.delete('/:id', protectAdmin, deleteVendor);

module.exports = router;
