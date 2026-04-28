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
      // Set preparation time
      items[i].preparationTime = 15 + (i % 3) * 5;
      
      // Set SKU if missing
      if (!items[i].sku || items[i].sku.startsWith('ITM-')) {
        items[i].sku = `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`;
      }

      // Set Short Codes if missing
      if (!items[i].alphaShortCode) {
        const nameParts = items[i].name.split(' ');
        items[i].alphaShortCode = nameParts.map(p => p[0]).join('').toUpperCase().substring(0, 3);
      }
      if (!items[i].numericShortCode) {
        items[i].numericShortCode = 100 + i;
      }
      
      await items[i].save();
      console.log(`Updated SKU & Codes for item "${items[i].name}"`);
    }

    console.log(`Successfully updated ${items.length} items with full metadata.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distributeItems();
