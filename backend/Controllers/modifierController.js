const ModifierGroup = require('../Models/ModifierGroup');

const getModifiers = async (req, res) => {
  try {
    const modifiers = await ModifierGroup.find().sort({ createdAt: -1 });
    res.json(modifiers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createModifier = async (req, res) => {
  try {
    const modifier = new ModifierGroup(req.body);
    await modifier.save();
    res.status(201).json(modifier);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateModifier = async (req, res) => {
  try {
    const modifier = await ModifierGroup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    );
    if (!modifier) return res.status(404).json({ message: 'Modifier not found' });
    res.json(modifier);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteModifier = async (req, res) => {
  try {
    const modifier = await ModifierGroup.findByIdAndDelete(req.params.id);
    if (!modifier) return res.status(404).json({ message: 'Modifier not found' });
    res.json({ message: 'Modifier deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getModifiers,
  createModifier,
  updateModifier,
  deleteModifier
};
