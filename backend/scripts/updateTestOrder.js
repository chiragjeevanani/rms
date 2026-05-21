require('dotenv').config();
const connectDB = require('../Config/db');
const Order = require('../Models/Order');

async function run() {
  try {
    await connectDB();
    console.log('Database Connected.');

    const orderId = '59772243';
    const extOrderId = '238341599951212';

    // Find the order by weraOrderId or externalOrderId
    const order = await Order.findOne({ 
      $or: [
        { weraOrderId: orderId },
        { externalOrderId: extOrderId }
      ]
    });

    if (!order) {
      console.error(`❌ Order not found with Wera ID ${orderId} or Ext ID ${extOrderId}`);
      process.exit(1);
    }

    console.log('Found order:', order.orderNumber);

    // Update with exact customer-facing Swiggy details from the screenshot
    order.deliveryCharge = 72;
    order.tax = 35.46;
    order.discount = {
      amount: 73,
      type: 'fixed',
      reason: 'SWIGGYLOVE-ISDMJO'
    };
    order.platformFee = 17.58;
    order.welfareFee = 0.59;
    order.grandTotal = 503;

    // Save changes
    await order.save();
    console.log('✅ Order successfully updated with customer-facing details:');
    console.log({
      subTotal: order.subTotal,
      deliveryCharge: order.deliveryCharge,
      tax: order.tax,
      discount: order.discount,
      platformFee: order.platformFee,
      welfareFee: order.welfareFee,
      grandTotal: order.grandTotal
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run();
