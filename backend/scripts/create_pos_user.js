const mongoose = require('mongoose');
require('dotenv').config();
const Staff = require('../Models/Staff');
const Role = require('../Models/Role');

const createPosUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to DB:', process.env.MONGODB_URL);

        let role = await Role.findOne({ name: 'Admin' });
        if (!role) {
            console.log('Creating Admin role...');
            role = new Role({ name: 'Admin', permissions: ['all'] });
            await role.save();
        }

        const email = 'admin@pos.com';
        let staff = await Staff.findOne({ email });

        if (staff) {
            console.log('User admin@pos.com exists, updating password to 123456...');
            staff.password = '123456';
            staff.role = role._id;
            await staff.save();
        } else {
            console.log('Creating user admin@pos.com / 123456...');
            staff = new Staff({
                name: 'POS Administrator',
                email: email,
                password: '123456',
                role: role._id,
                status: 'Active',
                pin: '1234'
            });
            await staff.save();
        }

        console.log('✅ PASS: admin@pos.com / 123456 logic executed.');
        process.exit(0);
    } catch (err) {
        console.error('❌ FAIL:', err);
        process.exit(1);
    }
};

createPosUser();
