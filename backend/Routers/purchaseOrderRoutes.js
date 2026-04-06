const express = require('express');
const router = express.Router();
const { getAllOrders, createOrder, updateOrder, deleteOrder } = require('../Controllers/purchaseOrderController');
const { protectAdmin } = require('../Middleware/authMiddleware');

router.get('/', getAllOrders);
router.post('/', protectAdmin, createOrder);
router.put('/:id', protectAdmin, updateOrder);
router.delete('/:id', protectAdmin, deleteOrder);

module.exports = router;
