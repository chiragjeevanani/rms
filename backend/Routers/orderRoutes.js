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
  getStaffDashboardSnapshot,
  registerToken
} = require('../Controllers/orderController');

const { protectAdmin, protectStaff } = require('../Middleware/authMiddleware');

router.post('/', createOrder);
router.post('/register-token', registerToken);
router.get('/', protectAdmin, getAllOrders);
router.get('/active', protectAdmin, getActiveOrders);
router.get('/completed', protectAdmin, getCompletedOrders);
router.get('/cancelled', protectAdmin, getCancelledOrders);
router.get('/analytics', protectAdmin, getKitchenAnalytics);
router.get('/reports/sales', protectAdmin, getSalesAnalytics);
router.get('/stats/staff/:staffName', getStaffDailyStats);
router.get('/stats/staff-snapshot', getStaffDashboardSnapshot);

router.put('/:orderId/settle', settleOrder);
router.put('/:id/status', updateOrderStatus);
router.put('/:orderId/item/:itemId/quantity', updateItemQuantity);
router.delete('/:orderId/item/:itemId', voidItem);

module.exports = router;
