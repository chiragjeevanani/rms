const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const ModifierGroup = require('./Models/ModifierGroup');
const Branch = require('./Models/Branch');

const distributeModifiers = async () => {
  await connectDB();
  try {
    const branches = await Branch.find();
    if (branches.length === 0) {
      console.log('No branches found');
      return;
    }

    const modifiers = await ModifierGroup.find();
    console.log(`Found ${modifiers.length} modifiers to distribute.`);

    for (let i = 0; i < modifiers.length; i++) {
      const branchIndex = i % branches.length;
      modifiers[i].branchId = branches[branchIndex]._id;
      await modifiers[i].save();
      console.log(`Assigned modifier "${modifiers[i].name}" to branch "${branches[branchIndex].branchName}"`);
    }

    console.log(`Successfully distributed ${modifiers.length} modifiers across ${branches.length} branches.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distributeModifiers();
