const express = require('express');
const router = express.Router();

// Import all sub-routes here
const adminRoutes = require('./Routers/adminRoutes');
const categoryRoutes = require('./Routers/categoryRoutes');
const itemRoutes = require('./Routers/itemRoutes');
const modifierRoutes = require('./Routers/modifierRoutes');
const comboRoutes = require('./Routers/comboRoutes');
const roleRoutes = require('./Routers/roleRoutes');
const staffRoutes = require('./Routers/staffRoutes');
const attendanceRoutes = require('./Routers/attendanceRoutes');
const stockRoutes = require('./Routers/stockRoutes');
const vendorRoutes = require('./Routers/vendorRoutes');
const purchaseOrderRoutes = require('./Routers/purchaseOrderRoutes');
const orderRoutes = require('./Routers/orderRoutes');
const wastageRoutes = require('./Routers/wastageRoutes');
const tableRoutes = require('./Routers/tableRoutes');
const reservationRoutes = require('./Routes/reservationRoutes');
const superAdminRoutes = require('./Routers/superAdminRoutes');
const branchRoutes = require('./Routers/branchRoutes');
const swiggyRoutes = require('./Routers/swiggyRoutes');

// Attach sub-routes to the main router
router.use('/admin', adminRoutes);
router.use('/superadmin', superAdminRoutes);
router.use('/integrations/swiggy', swiggyRoutes);
router.use('/category', categoryRoutes);
router.use('/item', itemRoutes);
router.use('/modifier', modifierRoutes);
router.use('/combo', comboRoutes);
router.use('/role', roleRoutes);
router.use('/staff', staffRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/stock', stockRoutes);
router.use('/vendor', vendorRoutes);
router.use('/order', purchaseOrderRoutes);
router.use('/orders', orderRoutes);
router.use('/wastage', wastageRoutes);
router.use('/table', tableRoutes);
router.use('/reservations', reservationRoutes);
router.use('/branches', branchRoutes);

module.exports = router;
