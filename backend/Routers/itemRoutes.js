const express = require('express');
const router = express.Router();
const { getItems, getItem, createItem, updateItem, deleteItem, addReview, bulkCreateItems } = require('../Controllers/itemController');
const { protectAdmin } = require('../Middleware/authMiddleware');

router.get('/', protectAdmin, getItems);
router.get('/:id', protectAdmin, getItem);
router.post('/bulk', protectAdmin, bulkCreateItems);
router.post('/:id/review', addReview);
router.post('/', protectAdmin, createItem);
router.put('/:id', protectAdmin, updateItem);
router.delete('/:id', protectAdmin, deleteItem);

module.exports = router;
