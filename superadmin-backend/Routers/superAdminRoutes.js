const express = require('express');
const router = express.Router();
const superAdminController = require('../Controllers/superAdminController');

router.post('/login', superAdminController.superAdminLogin);
router.get('/restaurants', superAdminController.getAllRestaurants);
router.post('/restaurants', superAdminController.createRestaurant);
router.patch('/restaurants/:email/toggle-api', superAdminController.toggleThirdPartyApi);
router.get('/global-admins', superAdminController.getGlobalAdmins);
router.get('/dashboard-stats', superAdminController.getDashboardStats);
router.post('/change-password', superAdminController.changeSuperAdminPassword);
router.put('/update-theme', superAdminController.updateSystemTheme);
router.put('/restaurants/:email', superAdminController.updateRestaurant);
router.delete('/restaurants/:email', superAdminController.deleteRestaurant);
router.post('/restaurants/:email/resend-credentials', superAdminController.resendCredentials);
router.get('/branches', superAdminController.getAllBranches);

router.post('/restaurants/:email/change-password', superAdminController.changeAdminPassword);

module.exports = router;
