const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getAllOrders, 
  getActiveOrders,
  getCompletedOrders,
  getCancelledOrders,
  settleOrder,
  updateOrderStatus, 
  voidItem,
  updateItemQuantity,
  getKitchenAnalytics,
  getSalesAnalytics,
  getStaffDailyStats,
  getStaffDashboardSnapshot
} = require('../Controllers/orderController');

const { protectAdmin, protectStaff } = require('../Middleware/authMiddleware');

router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/active', getActiveOrders);
router.get('/completed', getCompletedOrders);
router.get('/cancelled', getCancelledOrders);
router.get('/analytics', getKitchenAnalytics);
router.get('/reports/sales', protectStaff, getSalesAnalytics);
router.get('/stats/staff/:staffName', getStaffDailyStats);
router.get('/stats/staff-snapshot', getStaffDashboardSnapshot);

router.put('/:orderId/settle', settleOrder);
router.patch('/:id/status', updateOrderStatus);
router.put('/:orderId/item/:itemId/quantity', updateItemQuantity);
router.delete('/:orderId/item/:itemId', voidItem);

module.exports = router;
