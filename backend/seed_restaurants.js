const mongoose = require('mongoose');
const Restaurant = require('./Models/Restaurant');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rms';

const seedRestaurants = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const restaurants = [
      { name: 'Royal Kitchen', email: 'admin@royalkitchen.com', password: '123', thirdPartyApi: true },
      { name: 'The Spice Route', email: 'admin@spiceroute.com', password: '123', thirdPartyApi: false },
      { name: 'Golden Dragon', email: 'admin@goldendragon.com', password: '123', thirdPartyApi: true },
      { name: 'Ocean Breeze', email: 'admin@oceanbreeze.com', password: '123', thirdPartyApi: false },
      { name: 'Urban Bites', email: 'admin@urbanbites.com', password: '123', thirdPartyApi: true },
    ];

    for (const res of restaurants) {
      const existing = await Restaurant.findOne({ email: res.email });
      if (!existing) {
        await Restaurant.create(res);
        console.log(`Added: ${res.name}`);
      } else {
        console.log(`Skipped (Exists): ${res.name}`);
      }
    }

    console.log('Seeding Completed Successfully');
    process.exit();
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedRestaurants();
