const Customer = require('../Models/Customer');

// GET /api/customers/search?query=... or ?mobile=...
const searchCustomers = async (req, res) => {
  const { query, mobile } = req.query;
  try {
    let filter = {};
    if (mobile) {
      filter = { mobile: mobile.trim() };
    } else if (query) {
      filter = {
        $or: [
          { name: { $regex: query.trim(), $options: 'i' } },
          { mobile: { $regex: query.trim(), $options: 'i' } }
        ]
      };
    } else {
      return res.json([]);
    }

    const customers = await Customer.find(filter).limit(10);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal utility to upsert customer information during order actions
const upsertCustomerInternal = async (customerData, grandTotal = 0) => {
  if (!customerData || !customerData.mobile) return null;

  const { name, mobile, discountType, discountValue } = customerData;
  const cleanMobile = mobile.trim();

  try {
    let customer = await Customer.findOne({ mobile: cleanMobile });

    if (customer) {
      if (name) customer.name = name;
      if (discountType && discountValue !== undefined) {
        customer.defaultDiscount = {
          type: discountType,
          value: Number(discountValue)
        };
      }
      customer.totalOrders += 1;
      customer.totalSpent += Number(grandTotal || 0);
      customer.lastVisit = new Date();
      await customer.save();
    } else {
      customer = new Customer({
        name: name || 'Guest Customer',
        mobile: cleanMobile,
        defaultDiscount: {
          type: discountType || 'percentage',
          value: Number(discountValue || 0)
        },
        totalOrders: 1,
        totalSpent: Number(grandTotal || 0),
        lastVisit: new Date()
      });
      await customer.save();
    }
    return customer;
  } catch (err) {
    console.error('Failed to upsert customer:', err);
    return null;
  }
};

module.exports = {
  searchCustomers,
  upsertCustomerInternal
};
