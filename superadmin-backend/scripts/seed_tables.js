const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../Config/db');
const Table = require('../Models/Table');

const seedTables = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing tables
    await Table.deleteMany({});
    console.log('Cleared existing tables');

    const areas = ['AC Hall', 'Outdoor', 'Terrace', 'Lounge', 'Private Room', 'Garden', 'Bar Area'];
    const floors = ['Ground Floor', 'First Floor', 'Second Floor', 'Basement', 'Roof Top'];
    const shapes = ['Square', 'Round', 'Rectangle'];
    
    const tables = [];

    for (let i = 1; i <= 50; i++) {
      const tableNumber = i.toString().padStart(3, '0');
      const area = areas[Math.floor(Math.random() * areas.length)];
      const floor = floors[Math.floor(Math.random() * floors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      // Determine capacity based on shape
      let capacity = 2;
      if (shape === 'Rectangle') capacity = 6;
      else if (shape === 'Round') capacity = 4;
      else capacity = 2;

      tables.push({
        tableName: `Table ${i}`,
        tableCode: `TB-${tableNumber}`,
        capacity: capacity,
        area: area,
        floor: floor,
        shape: shape,
        status: i % 10 === 0 ? 'Occupied' : i % 15 === 0 ? 'Reserved' : 'Available',
        notes: i % 7 === 0 ? 'Premium View' : i % 8 === 0 ? 'Quiet Corner' : '',
        isAvailable: i % 10 !== 0
      });
    }

    await Table.insertMany(tables);
    console.log('50 Tables seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedTables();
