const express = require('express');
const router = express.Router();
const { searchCustomers } = require('../Controllers/customerController');
const { protectAdminOrStaff } = require('../Middleware/authMiddleware');

router.get('/search', protectAdminOrStaff, searchCustomers);

module.exports = router;
