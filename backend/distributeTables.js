const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const Table = require('./Models/Table');
const Branch = require('./Models/Branch');

const distributeTables = async () => {
  await connectDB();
  try {
    const branches = await Branch.find();
    if (branches.length === 0) {
      console.log('No branches found');
      return;
    }

    const tables = await Table.find();
    for (let i = 0; i < tables.length; i++) {
      tables[i].branchId = branches[i % branches.length]._id;
      await tables[i].save();
    }
    console.log(`Distributed ${tables.length} tables across ${branches.length} branches.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distributeTables();
