const express = require('express');
const router = express.Router();

const superAdminRoutes = require('./Routers/superAdminRoutes');

// Attach sub-routes to the main router
router.use('/superadmin', superAdminRoutes);

module.exports = router;
