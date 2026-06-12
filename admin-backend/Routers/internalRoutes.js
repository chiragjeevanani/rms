const express = require('express');
const router = express.Router();
const internalController = require('../Controllers/internalController');

// Internal API synchronization endpoint
router.post('/sync-admin', internalController.syncAdmin);

module.exports = router;
