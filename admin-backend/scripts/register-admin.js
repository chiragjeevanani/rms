require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../Models/Admin');

const registerAdmin = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL;
        if (!mongoUrl) {
            console.error('Error: MONGODB_URL is missing in .env');
            process.exit(1);
        }

        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB...');

        const email = 'multanirehan540@gmail.com';
        const password = '123';
        const name = 'Main Admin';

        let admin = await Admin.findOne({ email });
        if (admin) {
            console.log(`Admin with email ${email} already exists.`);
            // Update password just in case
            admin.password = password;
            await admin.save();
            console.log('Password updated for existing admin.');
        } else {
            admin = new Admin({ name, email, password });
            await admin.save();
            console.log(`✅ Admin registered successfully!`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
        }

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error registering admin:', error);
        process.exit(1);
    }
};

registerAdmin();
