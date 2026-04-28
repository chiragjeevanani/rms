const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const Order = require('./Models/Order');
const Branch = require('./Models/Branch');

const distributeOrders = async () => {
  await connectDB();
  try {
    const branches = await Branch.find();
    if (branches.length === 0) {
      console.log('No branches found');
      return;
    }

    const orders = await Order.find();
    for (let i = 0; i < orders.length; i++) {
      orders[i].branchId = branches[i % branches.length]._id;
      await orders[i].save();
    }
    console.log(`Distributed ${orders.length} orders across ${branches.length} branches.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distributeOrders();
