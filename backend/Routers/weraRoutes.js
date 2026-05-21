const express = require('express');
const router = express.Router();
const weraController = require('../Controllers/weraController');

// Integration Management
router.get('/:platform/:branchId/settings', weraController.getSettings);
router.post('/:platform/:branchId/settings', weraController.saveSettings);
router.post('/:platform/:branchId/test', weraController.testConnection);

// Webhook
router.post('/webhook', weraController.orderWebhook);

// Outgoing Actions
router.post('/order/:orderId/accept', weraController.acceptOrder);
router.post('/order/:orderId/reject', weraController.rejectOrder);
router.post('/order/:orderId/food-ready', weraController.foodReady);
router.post('/order/:orderId/picked-up', weraController.orderPickedup);
router.post('/order/:orderId/call-support', weraController.callSupport);
router.get('/order/:orderId/delivery-agent', weraController.getDeliveryAgent);
router.get('/order/:orderId/customer-number', weraController.getCustomerNumber);

// Zomato Complaints
router.post('/complaint/:orderId/:complaintId/accept', weraController.acceptComplaint);
router.post('/complaint/:orderId/:complaintId/reject', weraController.rejectComplaint);

module.exports = router;
