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

const { protectAdmin, protectStaff, protectAdminOrStaff } = require('../Middleware/authMiddleware');

router.post('/', createOrder);
router.get('/', protectAdminOrStaff, getAllOrders);
router.get('/active', protectAdminOrStaff, getActiveOrders);
router.get('/completed', protectAdminOrStaff, getCompletedOrders);
router.get('/cancelled', protectAdminOrStaff, getCancelledOrders);
router.get('/analytics', protectAdminOrStaff, getKitchenAnalytics);
router.get('/reports/sales', protectAdminOrStaff, getSalesAnalytics);
router.get('/stats/staff/:staffName', getStaffDailyStats);
router.get('/stats/staff-snapshot', getStaffDashboardSnapshot);

router.put('/:orderId/settle', settleOrder);
router.put('/:id/status', updateOrderStatus);
router.put('/:orderId/item/:itemId/quantity', updateItemQuantity);
router.delete('/:orderId/item/:itemId', voidItem);

module.exports = router;
