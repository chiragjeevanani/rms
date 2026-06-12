const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const Staff = require('./Models/Staff');
const Role = require('./Models/Role');
const Branch = require('./Models/Branch');

const distributeStaffAndRoles = async () => {
  await connectDB();
  try {
    const branches = await Branch.find();
    if (branches.length === 0) {
      console.log('No branches found');
      return;
    }

    // Distribute Roles first (Roles without branchId will be global, but user asked for branch-wise)
    const roles = await Role.find();
    for (let i = 0; i < roles.length; i++) {
      roles[i].branchId = branches[i % branches.length]._id;
      await roles[i].save();
    }
    console.log(`Distributed ${roles.length} roles.`);

    // Distribute Staff
    const staff = await Staff.find();
    for (let i = 0; i < staff.length; i++) {
      staff[i].branchId = branches[i % branches.length]._id;
      await staff[i].save();
    }
    console.log(`Distributed ${staff.length} staff across ${branches.length} branches.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distributeStaffAndRoles();
