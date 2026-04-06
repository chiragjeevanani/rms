const express = require('express');
const router = express.Router();
const { getAllRoles, createRole, updateRole, deleteRole } = require('../Controllers/roleController');
const { protectAdmin } = require('../Middleware/authMiddleware');

router.get('/', getAllRoles);
router.post('/', protectAdmin, createRole);
router.put('/:id', protectAdmin, updateRole);
router.delete('/:id', protectAdmin, deleteRole);

module.exports = router;
