const express = require('express');
const router = express.Router();
const swiggyController = require('../Controllers/swiggyController');

// Integration Management
router.post('/:branchId/settings', swiggyController.saveSettings);
router.post('/:branchId/test', swiggyController.testConnection);

// Webhooks
router.post('/webhook', swiggyController.orderWebhook);

module.exports = router;
