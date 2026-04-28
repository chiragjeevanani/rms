const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./Config/db');
const Restaurant = require('./Models/Restaurant');
const Branch = require('./Models/Branch');

const seed = async () => {
  await connectDB();
  
  try {
    // 1. Create a dummy restaurant if not exists
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      restaurant = new Restaurant({
        name: 'RMS Global Foods',
        email: 'admin@rmsglobal.com',
        password: 'password123', // In real app, hash this
        status: 'active'
      });
      await restaurant.save();
      console.log('Dummy Restaurant Created');
    }

    // 2. Clear existing branches
    await Branch.deleteMany({});

    // 3. Add 3 branches
    const branches = [
      {
        restaurantId: restaurant._id,
        branchName: 'RMS Downtown - Mumbai',
        branchCode: 'BR-001',
        branchEmail: 'downtown.mum@rms.com',
        phone: '+91 9876543210',
        address: '123, Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        gstNumber: '27AAAAA0000A1Z5',
        managerName: 'Rahul Mehta',
        openingTime: '10:00',
        closingTime: '23:00',
        status: 'active'
      },
      {
        restaurantId: restaurant._id,
        branchName: 'RMS Express - Bangalore',
        branchCode: 'BR-002',
        branchEmail: 'express.blr@rms.com',
        phone: '+91 9876543211',
        address: '45, Indiranagar 100ft Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        gstNumber: '29BBBBB1111B1Z5',
        managerName: 'Suresh Kumar',
        openingTime: '08:00',
        closingTime: '22:00',
        status: 'active'
      },
      {
        restaurantId: restaurant._id,
        branchName: 'RMS Heritage - Delhi',
        branchCode: 'BR-003',
        branchEmail: 'heritage.del@rms.com',
        phone: '+91 9876543212',
        address: '78, Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        gstNumber: '07CCCCC2222C1Z5',
        managerName: 'Anita Sharma',
        openingTime: '11:00',
        closingTime: '00:00',
        status: 'active'
      }
    ];

    await Branch.insertMany(branches);
    console.log('3 Branches Seeded Successfully');

  } catch (error) {
    console.error('Seeding Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

seed();
