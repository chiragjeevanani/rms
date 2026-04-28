const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const Stock = require('./Models/Stock');
const Branch = require('./Models/Branch');

const distributeStock = async () => {
  await connectDB();
  try {
    const branches = await Branch.find();
    if (branches.length === 0) {
      console.log('No branches found');
      return;
    }

    const stockItems = await Stock.find();
    console.log(`Found ${stockItems.length} stock items to distribute.`);

    for (let i = 0; i < stockItems.length; i++) {
      const branchIndex = i % branches.length;
      stockItems[i].branchId = branches[branchIndex]._id;
      await stockItems[i].save();
      console.log(`Assigned stock item "${stockItems[i].name}" to branch "${branches[branchIndex].branchName}"`);
    }

    console.log(`Successfully distributed ${stockItems.length} stock items across ${branches.length} branches.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distributeStock();
