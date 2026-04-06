
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Admin = require('../Models/Admin');
const Staff = require('../Models/Staff');
const Role = require('../Models/Role');

const seedCredentials = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/rms');
        console.log('Database synchronization active...');

        // 1. Seed Admin
        const adminEmail = 'admin@gmail.com';
        const adminPass = '123';
        let admin = await Admin.findOne({ email: adminEmail });
        if (!admin) {
            admin = new Admin({ name: 'Operational Admin', email: adminEmail, password: adminPass });
            await admin.save();
            console.log('✅ Admin credentials recalibrated: admin@gmail.com / 123');
        } else {
            admin.password = adminPass;
            await admin.save();
             console.log('✅ Admin credentials updated: admin@gmail.com / 123');
        }

        // 2. Ensure Roles exist
        let kitchenRole = await Role.findOne({ name: 'Kitchen' });
        if (!kitchenRole) {
            kitchenRole = await Role.create({ name: 'Kitchen', description: 'Kitchen Display System Access' });
        }
        let posRole = await Role.findOne({ name: 'POS' });
        if (!posRole) {
            posRole = await Role.create({ name: 'POS', description: 'POS Terminal Access' });
        }

        // 3. Seed Kitchen Staff
        const kitchenEmail = 'kitchen@gmail.com';
        const kitchenPass = '123';
        let kitchenStaff = await Staff.findOne({ email: kitchenEmail });
        if (!kitchenStaff) {
            kitchenStaff = new Staff({ 
                name: 'Kitchen Node', 
                email: kitchenEmail, 
                password: kitchenPass,
                role: kitchenRole._id,
                pin: '1234'
            });
            await kitchenStaff.save();
            console.log('✅ Kitchen credentials recalibrated: kitchen@gmail.com / 123');
        } else {
            kitchenStaff.password = kitchenPass;
            await kitchenStaff.save();
            console.log('✅ Kitchen credentials updated: kitchen@gmail.com / 123');
        }

        console.log('Security synchronization complete.');
        process.exit(0);
    } catch (error) {
        console.error('Synchronization fatal error:', error);
        process.exit(1);
    }
};

seedCredentials();
