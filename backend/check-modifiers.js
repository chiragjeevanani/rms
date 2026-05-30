const mongoose = require('mongoose');
require('dotenv').config();
const ModifierGroup = require('./Models/ModifierGroup');

async function run() {
  await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/rms');
  console.log('Connected to database.');
  const Branch = require('./Models/Branch');
  const branches = await Branch.find({});
  console.log(`Found ${branches.length} branches:`);
  branches.forEach(b => {
    console.log(`- ID: ${b._id}, Name: ${b.branchName}`);
  });
  
  const modifiers = await ModifierGroup.find({});
  console.log(`Found ${modifiers.length} modifiers:`);
  console.log(JSON.stringify(modifiers, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
