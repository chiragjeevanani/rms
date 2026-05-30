const express = require('express');
const router = express.Router();
const { 
  getAllStock, 
  createStock, 
  updateStock, 
  deleteStock,
  getStockAnalytics,
  bulkCreateStock
} = require('../Controllers/stockController');
const { protectAdmin } = require('../Middleware/authMiddleware');

router.get('/', protectAdmin, getAllStock);
router.get('/reports/inventory', protectAdmin, getStockAnalytics);
router.post('/bulk', protectAdmin, bulkCreateStock);
router.post('/', protectAdmin, createStock);
router.put('/:id', protectAdmin, updateStock);
router.delete('/:id', protectAdmin, deleteStock);

module.exports = router;
