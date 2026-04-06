const express = require('express');
const router = express.Router();
const { getItems, getItem, createItem, updateItem, deleteItem, addReview } = require('../Controllers/itemController');
const { protectAdmin } = require('../Middleware/authMiddleware');

router.get('/', getItems);
router.get('/:id', getItem);
router.post('/:id/review', addReview);
router.post('/', protectAdmin, createItem);
router.put('/:id', protectAdmin, updateItem);
router.delete('/:id', protectAdmin, deleteItem);

module.exports = router;
