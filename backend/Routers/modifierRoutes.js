const express = require('express');
const router = express.Router();
const { getModifiers, createModifier, updateModifier, deleteModifier } = require('../Controllers/modifierController');
const { protectAdmin } = require('../Middleware/authMiddleware');

router.get('/', getModifiers);
router.post('/', protectAdmin, createModifier);
router.put('/:id', protectAdmin, updateModifier);
router.delete('/:id', protectAdmin, deleteModifier);

module.exports = router;
