const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory, bulkCreateCategories } = require('../Controllers/categoryController');
const { protectAdmin } = require('../Middleware/authMiddleware');

router.get('/', protectAdmin, getCategories);
router.post('/bulk', protectAdmin, bulkCreateCategories);
router.post('/', protectAdmin, createCategory);
router.put('/:id', protectAdmin, updateCategory);
router.delete('/:id', protectAdmin, deleteCategory);

module.exports = router;
