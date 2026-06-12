const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const Item = require('./Models/Item');
const Branch = require('./Models/Branch');

const distributeItems = async () => {
  await connectDB();
  try {
    const branches = await Branch.find();
    if (branches.length === 0) {
      console.log('No branches found');
      return;
    }

    const items = await Item.find();
    console.log(`Found ${items.length} items to update.`);

    for (let i = 0; i < items.length; i++) {
      // Set preparation time if missing
      if (!items[i].preparationTime || items[i].preparationTime === 0) {
        items[i].preparationTime = 15 + (i % 3) * 5; // 15, 20, 25 mins
      }
      
      await items[i].save();
      console.log(`Updated preparation time for item "${items[i].name}"`);
    }

    console.log(`Successfully updated preparation times for ${items.length} items.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distributeItems();
