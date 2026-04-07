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
router.get('/reports/sales', protectAdmin, getSalesAnalytics);
router.get('/stats/staff/:staffName', getStaffDailyStats);
router.get('/stats/staff-snapshot', getStaffDashboardSnapshot);

router.put('/:orderId/settle', settleOrder);
router.put('/:id/status', updateOrderStatus);
router.delete('/:orderId/item/:itemId', voidItem);

module.exports = router;
