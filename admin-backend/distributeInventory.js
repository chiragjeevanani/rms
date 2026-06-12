const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const Vendor = require('./Models/Vendor');
const PurchaseOrder = require('./Models/PurchaseOrder');
const Wastage = require('./Models/Wastage');
const Branch = require('./Models/Branch');

const distributeInventoryData = async () => {
  await connectDB();
  try {
    const branches = await Branch.find();
    if (branches.length === 0) {
      console.log('No branches found');
      return;
    }

    // Distribute Vendors
    const vendors = await Vendor.find();
    for (let i = 0; i < vendors.length; i++) {
      vendors[i].branchId = branches[i % branches.length]._id;
      await vendors[i].save();
    }
    console.log(`Distributed ${vendors.length} vendors`);

    // Distribute Purchase Orders
    const orders = await PurchaseOrder.find();
    for (let i = 0; i < orders.length; i++) {
      orders[i].branchId = branches[i % branches.length]._id;
      await orders[i].save();
    }
    console.log(`Distributed ${orders.length} purchase orders`);

    // Distribute Wastage
    const wastage = await Wastage.find();
    for (let i = 0; i < wastage.length; i++) {
      wastage[i].branchId = branches[i % branches.length]._id;
      await wastage[i].save();
    }
    console.log(`Distributed ${wastage.length} wastage records`);

    console.log('Successfully distributed all inventory data across branches.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distributeInventoryData();
