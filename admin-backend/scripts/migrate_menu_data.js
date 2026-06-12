const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('../Models/Item');
const Combo = require('../Models/Combo');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to Database...');

    // 1. Migrate Items
    const items = await Item.find();
    console.log(`Processing ${items.length} Items...`);
    
    for (const item of items) {
      let updated = false;
      
      // Handle Preparation Time
      if (item.preparationTime === undefined || item.preparationTime === null) {
        item.preparationTime = 20;
        updated = true;
      }
      
      // Handle Original Price
      if (item.originalPrice === undefined || item.originalPrice === null) {
        item.originalPrice = item.basePrice || 0;
        updated = true;
      }
      
      // Handle Variants (if any)
      if (item.hasVariants && item.variants && item.variants.length > 0) {
        item.variants.forEach(variant => {
          if (variant.originalPrice === undefined || variant.originalPrice === null) {
            variant.originalPrice = variant.price || 0;
            updated = true;
          }
        });
      }

      if (updated) {
        await item.save();
        console.log(`Updated Item: ${item.name}`);
      }
    }

    // 2. Migrate Combos
    const combos = await Combo.find();
    console.log(`Processing ${combos.length} Combos...`);
    
    for (const combo of combos) {
      let updated = false;
      
      // Handle Preparation Time
      if (combo.preparationTime === undefined || combo.preparationTime === null) {
        combo.preparationTime = 20;
        updated = true;
      }
      
      // Handle Original Price
      if (combo.originalPrice === undefined || combo.originalPrice === null) {
        combo.originalPrice = combo.price || 0;
        updated = true;
      }

      if (updated) {
        await combo.save();
        console.log(`Updated Combo: ${combo.name}`);
      }
    }

    console.log('Migration Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration Failed:', error);
    process.exit(1);
  }
};

migrate();
