const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Staff = require('./Models/Staff');
const Role = require('./Models/Role');

dotenv.config();

const staffToSeed = [
  { name: 'Arjun Verma', email: 'arjun@rms-portal.com', role: 'Waiter', status: 'Active', pin: '1111' },
  { name: 'Zoya Khan', email: 'zoya@rms-portal.com', role: 'Chef', status: 'Active', pin: '2222' },
  { name: 'Kunal Shah', email: 'kunal@rms-portal.com', role: 'Manager', status: 'Active', pin: '3333' },
  { name: 'Riya Patel', email: 'riya@rms-portal.com', role: 'Waiter', status: 'Active', pin: '4444' },
  { name: 'Deepak Rao', email: 'deepak@rms-portal.com', role: 'Chef', status: 'Active', pin: '5555' }
];

const seedStaff = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Fetch all roles
    const allRoles = await Role.find();
    if (allRoles.length === 0) {
      console.warn('⚠️ No roles found. Please seed roles first.');
      process.exit(1);
    }

    for (const s of staffToSeed) {
      const existingRole = allRoles.find(r => r.name === s.role);
      if (!existingRole) {
        console.warn(`⚠️ Role ${s.role} not found. Skipping ${s.name}`);
        continue;
      }

      // Check if staff already exists
      const existingStaff = await Staff.findOne({ email: s.email });
      if (existingStaff) {
         console.log(`ℹ️ Staff ${s.email} already exists. Updating...`);
         existingStaff.role = existingRole._id;
         existingStaff.name = s.name;
         existingStaff.status = s.status;
         existingStaff.pin = s.pin;
         existingStaff.password = '123456';
         await existingStaff.save();
      } else {
         const newStaff = new Staff({
            ...s,
            role: existingRole._id,
            password: '123456'
         });
         await newStaff.save();
      }
    }

    console.log('✅ 5 Staff members successfully synchronized');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedStaff();
