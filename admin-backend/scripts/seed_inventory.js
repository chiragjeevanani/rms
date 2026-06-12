const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Stock = require('../Models/Stock');
const Vendor = require('../Models/Vendor');
const PurchaseOrder = require('../Models/PurchaseOrder');
const Wastage = require('../Models/Wastage');

const connectDB = require('../Config/db');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedInventory = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await Stock.deleteMany({});
    await Vendor.deleteMany({});
    
    await PurchaseOrder.deleteMany({});
    await Wastage.deleteMany({});

    // 1. Seed Vendors
    const vendors = [
      { name: 'Fresh Farms Ltd', contact: 'John Smith', phone: '+1 234 567 8901', email: 'sales@freshfarms.com', category: 'Vegetables', status: 'Active', rating: 4.8 },
      { name: 'Prime Meats Co', contact: 'Sarah Jones', phone: '+1 234 567 8902', email: 'sarah@primemeats.com', category: 'Meat & Poultry', status: 'Active', rating: 4.5 },
      { name: 'Global Grains', contact: 'Mike Wilson', phone: '+1 234 567 8903', email: 'mike@globalgrains.com', category: 'Dry Grocery', status: 'Review Needed', rating: 3.9 },
      { name: 'Dairy Delight', contact: 'Emily Brown', phone: '+1 234 567 8904', email: 'orders@dairydelight.com', category: 'Dairy', status: 'Active', rating: 4.2 },
      { name: 'Ocean Catch', contact: 'David Lee', phone: '+1 234 567 8905', email: 'david@oceancatch.com', category: 'Seafood', status: 'Inactive', rating: 4.1 },
      { name: 'Spice Route', contact: 'Anita Roy', phone: '+1 234 567 8906', email: 'anita@spiceroute.com', category: 'Spices', status: 'Active', rating: 4.9 },
      { name: 'BakeWell Supplies', contact: 'Chris Evans', phone: '+1 234 567 8907', email: 'chris@bakewell.com', category: 'Bakery', status: 'Active', rating: 4.6 }
    ];
    await Vendor.insertMany(vendors);
    console.log('Vendors seeded');

    // 2. Seed Stock
    const stocks = [
      { name: 'Basmati Rice', quantity: 250, unit: 'Kgs', minLevel: 50, category: 'Dry Grocery', price: 120, status: 'Published' },
      { name: 'Chicken Breast', quantity: 45, unit: 'Kgs', minLevel: 10, category: 'Meat & Poultry', price: 350, status: 'Published' },
      { name: 'Whole Milk', quantity: 80, unit: 'Ltrs', minLevel: 20, category: 'Dairy', price: 60, status: 'Published' },
      { name: 'Refined Oil', quantity: 120, unit: 'Ltrs', minLevel: 30, category: 'Dry Grocery', price: 150, status: 'Published' },
      { name: 'Onions', quantity: 15, unit: 'Kgs', minLevel: 20, category: 'Vegetables', price: 40, status: 'Published' },
      { name: 'Tomatoes', quantity: 8, unit: 'Kgs', minLevel: 15, category: 'Vegetables', price: 30, status: 'Published' },
      { name: 'Flour (Maida)', quantity: 300, unit: 'Kgs', minLevel: 50, category: 'Dry Grocery', price: 45, status: 'Published' },
      { name: 'Sugar', quantity: 100, unit: 'Kgs', minLevel: 20, category: 'Dry Grocery', price: 50, status: 'Published' },
      { name: 'Butter', quantity: 12, unit: 'Kgs', minLevel: 5, category: 'Dairy', price: 550, status: 'Published' },
      { name: 'Salmon Fillet', quantity: 5, unit: 'Kgs', minLevel: 8, category: 'Seafood', price: 1200, status: 'Published' },
      { name: 'Salt', quantity: 50, unit: 'Kgs', minLevel: 10, category: 'Dry Grocery', price: 20, status: 'Published' },
      { name: 'Black Pepper', quantity: 10, unit: 'Kgs', minLevel: 2, category: 'Spices', price: 800, status: 'Published' },
      { name: 'Cinnamon Sticks', quantity: 5, unit: 'Kgs', minLevel: 1, category: 'Spices', price: 1200, status: 'Published' },
      { name: 'Potatoes', quantity: 180, unit: 'Kgs', minLevel: 50, category: 'Vegetables', price: 25, status: 'Published' },
      { name: 'Eggs', quantity: 1200, unit: 'Units', minLevel: 200, category: 'Dairy', price: 6, status: 'Published' }
    ];
    await Stock.insertMany(stocks);
    console.log('Stock seeded');

    // 3. Seed Purchase Orders
    const pos = [
      { poNumber: 'PO-2024-001', vendor: 'Fresh Farms Ltd', amount: 15000, date: '2024-04-20', status: 'Delivered' },
      { poNumber: 'PO-2024-002', vendor: 'Prime Meats Co', amount: 45000, date: '2024-04-22', status: 'Delivered' },
      { poNumber: 'PO-2024-003', vendor: 'Dairy Delight', amount: 8000, date: '2024-04-25', status: 'Confirmed' },
      { poNumber: 'PO-2024-004', vendor: 'Global Grains', amount: 12000, date: '2024-04-26', status: 'Pending' },
      { poNumber: 'PO-2024-005', vendor: 'Spice Route', amount: 25000, date: '2024-04-26', status: 'Confirmed' },
      { poNumber: 'PO-2024-006', vendor: 'Ocean Catch', amount: 35000, date: '2024-04-24', status: 'Delivered' },
      { poNumber: 'PO-2024-007', vendor: 'BakeWell Supplies', amount: 5000, date: '2024-04-27', status: 'Pending' },
      { poNumber: 'PO-2024-008', vendor: 'Fresh Farms Ltd', amount: 7500, date: '2024-04-27', status: 'Confirmed' },
      { poNumber: 'PO-2024-009', vendor: 'Prime Meats Co', amount: 18000, date: '2024-04-21', status: 'Delivered' },
      { poNumber: 'PO-2024-010', vendor: 'Global Grains', amount: 9000, date: '2024-04-23', status: 'Delivered' }
    ];
    await PurchaseOrder.insertMany(pos);
    console.log('Purchase Orders seeded');

    // 4. Seed Wastage
    const wastages = [
      { item: 'Chicken Breast', quantity: '2 Kgs', reason: 'Spoiled', value: 700, date: '2024-04-22' },
      { item: 'Whole Milk', quantity: '5 Ltrs', reason: 'Expired', value: 300, date: '2024-04-23' },
      { item: 'Tomatoes', quantity: '3 Kgs', reason: 'Spoiled', value: 90, date: '2024-04-24' },
      { item: 'Salmon Fillet', quantity: '0.5 Kgs', reason: 'Kitchen Error', value: 600, date: '2024-04-25' },
      { item: 'Eggs', quantity: '24 Units', reason: 'Damaged', value: 144, date: '2024-04-25' },
      { item: 'Basmati Rice', quantity: '1 Kgs', reason: 'Kitchen Error', value: 120, date: '2024-04-26' },
      { item: 'Refined Oil', quantity: '2 Ltrs', reason: 'Damaged', value: 300, date: '2024-04-26' },
      { item: 'Onions', quantity: '1 Kgs', reason: 'Spoiled', value: 40, date: '2024-04-27' },
      { item: 'Potatoes', quantity: '2 Kgs', reason: 'Spoiled', value: 50, date: '2024-04-27' },
      { item: 'Butter', quantity: '0.5 Kgs', reason: 'Kitchen Error', value: 275, date: '2024-04-27' }
    ];
    await Wastage.insertMany(wastages);
    console.log('Wastage records seeded');

    console.log('Inventory Seeding Completed Successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedInventory();
