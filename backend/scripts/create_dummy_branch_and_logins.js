const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../Config/db');
const Restaurant = require('../Models/Restaurant');
const Branch = require('../Models/Branch');
const Role = require('../Models/Role');
const Staff = require('../Models/Staff');

const createDummyBranchAndLogins = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    console.log('⚡ Connected to MongoDB');

    // 2. Find or Create default Restaurant
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      console.log('ℹ️ No Restaurant found. Initializing a default restaurant...');
      restaurant = new Restaurant({
        name: 'Royal Kitchen',
        email: 'admin@gmail.com',
        password: '123',
        branchLimit: 5,
        status: 'active',
        thirdPartyApi: false
      });
      await restaurant.save();
      console.log('✅ Default Restaurant Created: Royal Kitchen (admin@gmail.com)');
    } else {
      console.log(`✔ Restaurant found: ${restaurant.name} (${restaurant.email})`);
    }

    // 3. Create a unique Dummy Branch
    const branchName = 'Downtown Outlet';
    const branchEmail = 'downtown@royal-kitchen.com';
    let branch = await Branch.findOne({ branchEmail });

    if (branch) {
      console.log(`ℹ️ Branch with email ${branchEmail} already exists. Cleaning up older staff and roles for recreate...`);
      await Staff.deleteMany({ branchId: branch._id });
      await Role.deleteMany({ branchId: branch._id });
      console.log('🗑️ Previous branch staff and roles deleted.');
    } else {
      // Auto-generate branch code
      const count = await Branch.countDocuments();
      const branchCode = `BR-${(count + 1).toString().padStart(3, '0')}`;

      branch = new Branch({
        restaurantId: restaurant._id,
        branchName,
        branchCode,
        branchEmail,
        phone: '+91 9988776655',
        address: '123 Main Street, Downtown',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        managerName: 'Suresh Kumar',
        openingTime: '09:00',
        closingTime: '23:00',
        status: 'active',
        invoicePolicy: '1. Goods once sold cannot be returned.\n2. Standard terms and conditions apply.'
      });
      await branch.save();
      console.log(`✅ Branch Created: ${branch.branchName} (${branch.branchCode})`);
    }

    // 4. Create Branch Roles
    console.log('🔑 Provisioning Branch Roles...');
    
    const posRole = new Role({
      name: 'POS',
      branchId: branch._id,
      description: 'POS Terminal Cashier and Billing Operator',
      permissions: ['view_orders', 'manage_items', 'dine_in', 'takeaway', 'delivery', 'billing'],
      status: 'Published'
    });
    await posRole.save();

    const kdsRole = new Role({
      name: 'KDS',
      branchId: branch._id,
      description: 'Kitchen Display System Chef and Order Processing',
      permissions: ['view_orders', 'update_order_status'],
      status: 'Published'
    });
    await kdsRole.save();

    const waiterRole = new Role({
      name: 'Waiter',
      branchId: branch._id,
      description: 'Floor Service Order Taking Staff',
      permissions: ['view_orders', 'create_orders'],
      status: 'Published'
    });
    await waiterRole.save();

    console.log('✅ Roles Provisioned: POS, KDS, Waiter');

    // 5. Create Staff Logins (bcrypt is handled by pre-save hooks in Staff model)
    console.log('👥 Registering Staff Identities...');

    const posStaff = new Staff({
      name: 'Priya POS',
      email: 'pos@royal-kitchen.com',
      role: posRole._id,
      status: 'Active',
      pin: '2222',
      password: 'password123',
      branchId: branch._id
    });
    await posStaff.save();

    const kdsStaff = new Staff({
      name: 'Amit KDS',
      email: 'kds@royal-kitchen.com',
      role: kdsRole._id,
      status: 'Active',
      pin: '3333',
      password: 'password123',
      branchId: branch._id
    });
    await kdsStaff.save();

    const waiterStaff = new Staff({
      name: 'Rahul Waiter',
      email: 'waiter@royal-kitchen.com',
      role: waiterRole._id,
      status: 'Active',
      pin: '1111',
      password: 'password123',
      branchId: branch._id
    });
    await waiterStaff.save();

    console.log('✅ Operational Logins Registered Successfully!');
    console.log('\n==================================================');
    console.log('🎉 PROVISIONING SUCCESSFUL 🎉');
    console.log('==================================================');
    console.log(`Branch Name : ${branch.branchName}`);
    console.log(`Branch Code : ${branch.branchCode}`);
    console.log(`Restaurant  : ${restaurant.name}\n`);
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('--------------------------------------------------');
    console.log('1. POS Cashier Portal');
    console.log(`   - Name     : ${posStaff.name}`);
    console.log(`   - Email    : ${posStaff.email}`);
    console.log(`   - Password : password123`);
    console.log(`   - PIN      : ${posStaff.pin}`);
    console.log('2. KDS Kitchen Display Portal');
    console.log(`   - Name     : ${kdsStaff.name}`);
    console.log(`   - Email    : ${kdsStaff.email}`);
    console.log(`   - Password : password123`);
    console.log(`   - PIN      : ${kdsStaff.pin}`);
    console.log('3. Waiter Order Portal');
    console.log(`   - Name     : ${waiterStaff.name}`);
    console.log(`   - Email    : ${waiterStaff.email}`);
    console.log(`   - Password : password123`);
    console.log(`   - PIN      : ${waiterStaff.pin}`);
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Provisioning Failed:', error);
    process.exit(1);
  }
};

createDummyBranchAndLogins();
