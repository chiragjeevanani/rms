const Branch = require('../Models/Branch');

exports.createBranch = async (req, res) => {
  try {
    const { restaurantId, branchName, branchEmail, phone, address, city, state, pincode, gstNumber, managerName, openingTime, closingTime } = req.body;
    
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
      closingTime
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
