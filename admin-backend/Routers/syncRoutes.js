const express = require('express');
const router = express.Router();
const { syncQueueItems } = require('../Controllers/syncController');
const {
  verifySyncToken,
  handleAdminCreated,
  handleAdminStatus,
  handleAdminPlan,
  handleAdminExpiry
} = require('../Controllers/tenantSyncController');

// Legacy POS sync
router.post('/orders', syncQueueItems);

// Multi-Tenant SaaS Sync Endpoints (Admin VPS)
router.post('/admin-created', verifySyncToken, handleAdminCreated);
router.post('/admin-status', verifySyncToken, handleAdminStatus);
router.post('/admin-plan', verifySyncToken, handleAdminPlan);
router.post('/admin-expiry', verifySyncToken, handleAdminExpiry);



module.exports = router;
