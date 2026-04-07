const Combo = require('../Models/Combo');

// @desc    Get all combos
const getCombos = async (req, res) => {
  try {
    const combos = await Combo.find().populate('items.item').sort({ createdAt: -1 });
    res.json({ success: true, data: combos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single combo
const getCombo = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id).populate('items.item');
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });
    res.json({ success: true, data: combo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create new combo
const createCombo = async (req, res) => {
  try {
    const combo = new Combo(req.body);
    await combo.save();
    res.status(201).json({ success: true, data: combo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update combo
const updateCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    );
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });
    res.json({ success: true, data: combo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete combo
const deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndDelete(req.params.id);
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });
    res.json({ success: true, message: 'Combo deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getCombos,
  getCombo,
  createCombo,
  updateCombo,
  deleteCombo
};
