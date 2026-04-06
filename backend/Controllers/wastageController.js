const Wastage = require('../Models/Wastage');

const getAllWastage = async (req, res) => {
  try {
    const wastage = await Wastage.find().sort({ createdAt: -1 });
    res.json(wastage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createWastage = async (req, res) => {
  try {
    const wastage = new Wastage(req.body);
    await wastage.save();
    res.status(201).json(wastage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateWastage = async (req, res) => {
  try {
    const wastage = await Wastage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!wastage) return res.status(404).json({ message: 'Wastage record not found' });
    res.json(wastage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteWastage = async (req, res) => {
  try {
    const wastage = await Wastage.findByIdAndDelete(req.params.id);
    if (!wastage) return res.status(404).json({ message: 'Wastage record not found' });
    res.json({ message: 'Wastage record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllWastage,
  createWastage,
  updateWastage,
  deleteWastage
};
