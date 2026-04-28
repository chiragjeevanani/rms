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
    console.log(`Found ${items.length} items to distribute.`);

    const images = [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?w=500&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'
    ];

    const descriptions = [
      "A rich, creamy, and flavorful dish made with slow-cooked black lentils and spices.",
      "Traditional charcoal-grilled chicken marinated in yogurt and aromatic spices.",
      "Succulent cubes of paneer cooked in a velvety tomato and butter based gravy.",
      "Spiced and seasoned with secret house blends, grilled to perfection.",
      "Classic recipe with authentic herbs and fresh ingredients.",
      "A chef's special delight featuring seasonal flavors and textures."
    ];

    for (let i = 0; i < items.length; i++) {
      const branchIndex = i % branches.length;
      items[i].branchId = branches[branchIndex]._id;
      
      // Add price if missing
      if (!items[i].basePrice) {
        items[i].basePrice = 280 + (i * 20);
      }
      if (!items[i].originalPrice) {
        items[i].originalPrice = items[i].basePrice + 100;
      }
      
      // Add description if missing
      if (!items[i].description || items[i].description === '') {
        items[i].description = descriptions[i % descriptions.length];
      }

      // Add image if missing
      if (!items[i].image) {
        items[i].image = images[i % images.length];
      }
      
      await items[i].save();
      console.log(`Updated item "${items[i].name}" for branch "${branches[branchIndex].branchName}"`);
    }

    console.log(`Successfully updated and distributed ${items.length} items with full details.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distributeItems();
