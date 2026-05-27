const Combo = require('../Models/Combo');

// @desc    Get all combos
const getCombos = async (req, res) => {
  try {
    const filter = req.query.branchId ? { branchId: req.query.branchId } : {};
    const combos = await Combo.find(filter).populate('items.item').sort({ createdAt: -1 });
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

const Item = require('../Models/Item');

const bulkCreateCombos = async (req, res) => {
  const { combos } = req.body;
  if (!combos || !Array.isArray(combos)) {
    return res.status(400).json({ success: false, message: 'Invalid combos payload' });
  }

  try {
    const dbItems = await Item.find({});
    const itemsMap = {};
    dbItems.forEach(itm => {
      itemsMap[itm.name.toUpperCase().trim()] = itm._id;
    });

    const resolvedCombos = [];
    for (let i = 0; i < combos.length; i++) {
      const comboData = combos[i];
      if (!comboData.name || !comboData.name.trim()) continue;

      const itemsList = [];
      if (comboData.itemsRaw && typeof comboData.itemsRaw === 'string') {
        const itemParts = comboData.itemsRaw.split(';');
        itemParts.forEach(optStr => {
          const parts = optStr.split('|').map(p => p.trim());
          if (parts[0]) {
            const matchedItemId = itemsMap[parts[0].toUpperCase()];
            if (matchedItemId) {
              itemsList.push({
                item: matchedItemId,
                variant: parts[2] || '',
                quantity: Number(parts[1] || 1)
              });
            }
          }
        });
      }

      resolvedCombos.push({
        name: comboData.name.trim(),
        description: comboData.description ? comboData.description.trim() : '',
        price: Number(comboData.price || 0),
        originalPrice: Number(comboData.originalPrice || comboData.price || 0),
        preparationTime: Number(comboData.preparationTime || 20),
        image: comboData.image ? comboData.image.trim() : '',
        items: itemsList,
        sku: comboData.sku || `CMB-${Math.floor(100000 + Math.random() * 900000)}`,
        status: comboData.status || 'Published',
        branchId: comboData.branchId || req.query.branchId || null
      });
    }

    if (resolvedCombos.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid combos to import' });
    }

    const inserted = await Combo.insertMany(resolvedCombos);
    res.status(201).json({ success: true, message: `Successfully imported ${inserted.length} combos`, data: inserted });
  } catch (error) {
    console.error('Bulk import combos error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during import' });
  }
};

module.exports = {
  getCombos,
  getCombo,
  createCombo,
  updateCombo,
  deleteCombo,
  bulkCreateCombos
};
