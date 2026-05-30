const Branch = require('../Models/Branch');

exports.createBranch = async (req, res) => {
  try {
    const { restaurantId, branchName, branchEmail, phone, address, city, state, pincode, gstNumber, managerName, openingTime, closingTime, invoicePolicy } = req.body;
    
    // Enforce branch creation limit
    const Restaurant = require('../Models/Restaurant');
    let targetLimit = 5;
    if (restaurantId) {
      const restaurant = await Restaurant.findById(restaurantId);
      if (restaurant) {
        targetLimit = restaurant.branchLimit !== undefined ? restaurant.branchLimit : 5;
      }
    } else {
      const restaurant = await Restaurant.findOne();
      if (restaurant) {
        targetLimit = restaurant.branchLimit !== undefined ? restaurant.branchLimit : 5;
      }
    }

    const branchCount = await Branch.countDocuments(restaurantId ? { restaurantId } : {});
    if (branchCount >= targetLimit) {
      return res.status(400).json({ success: false, message: `Branch creation limit reached. Maximum allowed is ${targetLimit}.` });
    }

    // Auto-generate Branch Code
    const count = await Branch.countDocuments();
    const branchCode = `BR-${(count + 1).toString().padStart(3, '0')}`;

    const newBranch = new Branch({
      restaurantId,
      branchName,
      branchCode,
      branchEmail,
      phone,
      address,
      city,
      state,
      pincode,
      gstNumber,
      managerName,
      openingTime,
      closingTime,
      invoicePolicy
    });

    await newBranch.save();
    res.status(201).json({ success: true, message: 'Branch created successfully', data: newBranch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBranches = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const query = restaurantId ? { restaurantId } : {};
    const branches = await Branch.find(query).populate('restaurantId', 'name');
    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBranch = await Branch.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Branch updated successfully', data: updatedBranch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    await Branch.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
