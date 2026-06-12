const mongoose = require('mongoose');
require('./Models/Order');
require('./Models/Table');

mongoose.connect('mongodb://mohammadrehan00121_db_user:pDpHQeQBSytoMlEE@ac-auecvgo-shard-00-00.z4xp6pz.mongodb.net:27017,ac-auecvgo-shard-00-01.z4xp6pz.mongodb.net:27017,ac-auecvgo-shard-00-02.z4xp6pz.mongodb.net:27017/RMS?ssl=true&replicaSet=atlas-2ijgc0-shard-0&authSource=admin&appName=Cluster0').then(async () => {
  const Order = mongoose.model('Order');
  const Table = mongoose.model('Table');
  const orders = await Order.find(); // find ALL orders
  let count = 0;
  for (let order of orders) {
    if (!order.branchId && order.tableName) {
      const t = await Table.findOne({ $or: [{ tableName: order.tableName }, { tableCode: order.tableName }] });
      if (t && t.branchId) {
        order.branchId = t.branchId;
        await order.save();
        count++;
      }
    }
  }
  console.log('Updated ' + count + ' orders.');
  process.exit(0);
});
