const Item = require('../Models/Item');
const Category = require('../Models/Category');

const getItems = async (req, res) => {
  try {
    const filter = req.query.branchId ? { branchId: req.query.branchId } : {};
    const items = await Item.find(filter)
      .populate('category')
      .populate('modifiers')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('category')
      .populate('modifiers');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createItem = async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addReview = async (req, res) => {
  try {
    const { rating, comment, userName } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    item.reviews.push({ rating, comment, userName });
    await item.save();
    res.status(201).json(item.reviews[item.reviews.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const bulkCreateItems = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items must be an array' });
    }

    const resolvedItems = [];
    const categoriesMap = {};

    // Load existing categories
    const existingCategories = await Category.find({});
    existingCategories.forEach(cat => {
      categoriesMap[cat.name.toLowerCase().trim()] = cat._id;
    });

    for (const itemData of items) {
      if (!itemData.name) continue;
      
      let categoryId = null;
      const catName = (itemData.categoryName || 'General').trim();
      const catKey = catName.toLowerCase();

      if (categoriesMap[catKey]) {
        categoryId = categoriesMap[catKey];
      } else {
        // Create new category
        const newCat = new Category({ name: catName });
        await newCat.save();
        categoriesMap[catKey] = newCat._id;
        categoryId = newCat._id;
      }

      resolvedItems.push({
        name: itemData.name.toUpperCase().trim(),
        category: categoryId,
        basePrice: Number(itemData.price || 0),
        originalPrice: Number(itemData.originalPrice || itemData.price || 0),
        foodType: ['Veg', 'Non-Veg', 'Egg'].includes(itemData.foodType) ? itemData.foodType : 'Veg',
        preparationTime: Number(itemData.preparationTime || 20),
        sku: itemData.sku || `ITM-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'Published',
        branchId: itemData.branchId || req.query.branchId || null
      });
    }

    if (resolvedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid items to import' });
    }

    const inserted = await Item.insertMany(resolvedItems);
    res.status(201).json({ success: true, message: `Successfully imported ${inserted.length} items`, data: inserted });
  } catch (error) {
    console.error('Bulk import menu items error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during import' });
  }
};

module.exports = {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  addReview,
  bulkCreateItems
};
