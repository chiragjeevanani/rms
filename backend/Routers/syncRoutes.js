const express = require('express');
const router = express.Router();
const { syncQueueItems } = require('../Controllers/syncController');

router.post('/orders', syncQueueItems);

module.exports = router;
