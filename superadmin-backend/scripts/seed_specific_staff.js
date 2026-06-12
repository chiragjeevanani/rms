const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../Config/db');
const Staff = require('../Models/Staff');
const Role = require('../Models/Role');

const seedSpecificStaff = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // 1. Ensure Roles exist
    const roleNames = ['Waiter', 'POS', 'KDS'];
    for (const name of roleNames) {
      const existing = await Role.findOne({ name });
      if (!existing) {
        await Role.create({ 
          name, 
          description: `${name} role for restaurant operations`,
          permissions: ['view_orders', 'manage_items'],
          status: 'Published'
        });
        console.log(`Created Role: ${name}`);
      }
    }

    const waiterRole = await Role.findOne({ name: 'Waiter' });
    const posRole = await Role.findOne({ name: 'POS' });
    const kdsRole = await Role.findOne({ name: 'KDS' });

    // 2. Add Staff
    const specificStaff = [
      { name: 'Rahul Waiter', email: 'waiter@rms.com', role: waiterRole._id, pin: '1111', password: 'password123', status: 'Active' },
      { name: 'Priya POS', email: 'pos@rms.com', role: posRole._id, pin: '2222', password: 'password123', status: 'Active' },
      { name: 'Amit KDS', email: 'kds@rms.com', role: kdsRole._id, pin: '3333', password: 'password123', status: 'Active' }
    ];

    for (const s of specificStaff) {
      const existing = await Staff.findOne({ email: s.email });
      if (existing) {
        // Update existing
        existing.name = s.name;
        existing.role = s.role;
        existing.pin = s.pin;
        existing.status = s.status;
        await existing.save();
        console.log(`Updated Staff: ${s.name}`);
      } else {
        await Staff.create(s);
        console.log(`Created Staff: ${s.name}`);
      }
    }

    console.log('3 Specific Staff members seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedSpecificStaff();
