const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const Category = require('./Models/Category');
const Branch = require('./Models/Branch');

const distribute = async () => {
  await connectDB();
  try {
    const branches = await Branch.find();
    if (branches.length === 0) {
      console.log('No branches found');
      return;
    }

    const categories = await Category.find();
    console.log(`Found ${categories.length} categories to distribute.`);

    const images = [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?w=400&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80',
      'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80',
      'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=400&q=80'
    ];

    for (let i = 0; i < categories.length; i++) {
      const branchIndex = i % branches.length;
      categories[i].branchId = branches[branchIndex]._id;
      // Add a placeholder image if not present
      if (!categories[i].image) {
        categories[i].image = images[i % images.length];
      }
      await categories[i].save();
      console.log(`Assigned category "${categories[i].name}" to branch "${branches[branchIndex].branchName}" with image.`);
    }

    console.log(`Successfully re-distributed ${categories.length} categories with images.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

distribute();
