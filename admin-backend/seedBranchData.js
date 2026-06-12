const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const Branch = require('./Models/Branch');
const Category = require('./Models/Category');
const Item = require('./Models/Item');
const Combo = require('./Models/Combo');
const ModifierGroup = require('./Models/ModifierGroup');

const seedData = async () => {
  await connectDB();
  
  try {
    const branches = await Branch.find();
    if (branches.length === 0) {
      console.log('No branches found. Run seedBranches.js first.');
      return;
    }

    // Clear existing data
    await Category.deleteMany({});
    await Item.deleteMany({});
    await Combo.deleteMany({});
    await ModifierGroup.deleteMany({});

    for (const branch of branches) {
      console.log(`Seeding data for branch: ${branch.branchName}`);

      // 1. Categories
      const cats = await Category.insertMany([
        { name: 'Starters', branchId: branch._id, status: 'Published' },
        { name: 'Main Course', branchId: branch._id, status: 'Published' }
      ]);

      // 2. Modifiers
      const mod = await ModifierGroup.create({
        name: 'Extra Toppings',
        branchId: branch._id,
        options: [
          { name: 'Cheese', price: 20 },
          { name: 'Jalapenos', price: 15 }
        ]
      });

      // 3. Items
      const items = await Item.insertMany([
        { 
          name: `${branch.city} Special Tikka`, 
          category: cats[0]._id, 
          basePrice: 250, 
          branchId: branch._id,
          foodType: 'Non-Veg',
          modifiers: [mod._id]
        },
        { 
          name: 'Paneer Butter Masala', 
          category: cats[1]._id, 
          basePrice: 320, 
          branchId: branch._id,
          foodType: 'Veg'
        },
        { 
          name: 'Dal Makhani', 
          category: cats[1]._id, 
          basePrice: 280, 
          branchId: branch._id,
          foodType: 'Veg'
        }
      ]);

      // 4. Combos
      await Combo.create({
        name: `${branch.city} Executive Thali`,
        price: 450,
        branchId: branch._id,
        items: [
          { item: items[1]._id, quantity: 1 },
          { item: items[2]._id, quantity: 1 }
        ]
      });
    }

    console.log('All branch data seeded successfully');
  } catch (error) {
    console.error('Error seeding branch data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
