const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const Combo = require('./Models/Combo');
const Branch = require('./Models/Branch');

const distributeCombos = async () => {
  await connectDB();
  try {
    const branches = await Branch.find();
    if (branches.length === 0) {
      console.log('No branches found');
      return;
    }

    const combos = await Combo.find();
    console.log(`Found ${combos.length} combos to update.`);

    const highQualityImages = [
      '/uploads/mumbai_thali.png',
      '/uploads/bangalore_thali.png',
      '/uploads/delhi_thali.png'
    ];

    for (let i = 0; i < combos.length; i++) {
      const branchIndex = i % branches.length;
      combos[i].branchId = branches[branchIndex]._id;
      
      // Assign premium generated image
      combos[i].image = highQualityImages[i % highQualityImages.length];
      
      // Assign metadata
      combos[i].originalPrice = combos[i].price + 100;
      combos[i].alphaShortCode = combos[i].name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 3);
      combos[i].numericShortCode = 500 + i;
      
      await combos[i].save();
      console.log(`Updated combo "${combos[i].name}" with premium image`);
    }

    console.log(`Successfully updated ${combos.length} combos with premium images.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distributeCombos();
