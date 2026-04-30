const express = require('express');
const router = express.Router();
const superAdminController = require('../Controllers/superAdminController');

router.post('/login', superAdminController.superAdminLogin);
router.get('/restaurants', superAdminController.getAllRestaurants);
router.post('/restaurants', superAdminController.createRestaurant);
router.patch('/restaurants/:email/toggle-api', superAdminController.toggleThirdPartyApi);
router.get('/global-admins', superAdminController.getGlobalAdmins);
router.post('/change-password', superAdminController.changeSuperAdminPassword);

module.exports = router;
