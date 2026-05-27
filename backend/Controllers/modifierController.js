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

const bulkCreateModifiers = async (req, res) => {
  const { modifiers } = req.body;
  if (!modifiers || !Array.isArray(modifiers)) {
    return res.status(400).json({ success: false, message: 'Invalid modifiers payload' });
  }

  try {
    const resolvedModifiers = [];
    for (let i = 0; i < modifiers.length; i++) {
      const modData = modifiers[i];
      if (!modData.name || !modData.name.trim()) continue;

      // Parse options: "Cheese|30|default;Extra Veggies|50"
      const options = [];
      if (modData.optionsRaw && typeof modData.optionsRaw === 'string') {
        const optionParts = modData.optionsRaw.split(';');
        optionParts.forEach(optStr => {
          const parts = optStr.split('|').map(p => p.trim());
          if (parts[0]) {
            options.push({
              name: parts[0],
              price: Number(parts[1] || 0),
              isDefault: parts[2] === 'default' || parts[2] === 'yes' || parts[2] === 'true',
              isAvailable: true
            });
          }
        });
      }

      resolvedModifiers.push({
        name: modData.name.trim(),
        selectionType: ['Single', 'Multiple'].includes(modData.selectionType) ? modData.selectionType : 'Single',
        isRequired: modData.isRequired === true || modData.isRequired === 'true' || modData.isRequired === 'yes',
        minSelection: Number(modData.minSelection || 0),
        maxSelection: modData.maxSelection ? Number(modData.maxSelection) : 1,
        options,
        status: modData.status || 'Published',
        branchId: modData.branchId || req.query.branchId || null
      });
    }

    if (resolvedModifiers.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid modifiers to import' });
    }

    const inserted = await ModifierGroup.insertMany(resolvedModifiers);
    res.status(201).json({ success: true, message: `Successfully imported ${inserted.length} modifiers`, data: inserted });
  } catch (error) {
    console.error('Bulk import modifiers error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during import' });
  }
};

module.exports = {
  getModifiers,
  createModifier,
  updateModifier,
  deleteModifier,
  bulkCreateModifiers
};
