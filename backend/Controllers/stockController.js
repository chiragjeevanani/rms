const Stock = require('../Models/Stock');

const getAllStock = async (req, res) => {
  try {
    const stock = await Stock.find().sort({ name: 1 });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createStock = async (req, res) => {
  try {
    const stock = new Stock(req.body);
    await stock.save();
    res.status(201).json(stock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const stock = await Stock.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    );
    if (!stock) return res.status(404).json({ message: 'Stock item not found' });
    res.json(stock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock item not found' });
    res.json({ message: 'Stock item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getStockAnalytics = async (req, res) => {
  try {
    const { branchId } = req.query;
    const Stock = require('../Models/Stock');
    const Item = require('../Models/Item');
    const Combo = require('../Models/Combo');
    const Wastage = require('../Models/Wastage');
    
    const filter = {};
    if (branchId && branchId !== 'all') {
      filter.branchId = branchId;
    }

    const [allRawStock, allItems, allCombos, allWastage] = await Promise.all([
      Stock.find(filter).sort({ name: 1 }),
      Item.find({ ...filter, trackStock: true }).populate('category').sort({ name: 1 }),
      Combo.find({ ...filter, trackStock: true }).sort({ name: 1 }),
      Wastage.find(filter).sort({ createdAt: -1 }).limit(50)
    ]);
    
    // Normalize Item and Combo data
    const formattedItems = allItems.map(i => ({
      _id: i._id,
      name: i.name,
      quantity: i.stockCount || 0,
      unit: 'Units',
      minLevel: i.minStockLevel || 0,
      category: i.category?.name || 'Menu Item',
      price: i.hasVariants && i.variants.length > 0 
        ? Math.min(...i.variants.map(v => v.price)) 
        : (i.basePrice || 0),
      sku: i.sku,
      type: 'Item'
    }));

    const formattedCombos = allCombos.map(c => ({
      _id: c._id,
      name: c.name,
      quantity: c.stockCount || 0,
      unit: 'Units',
      minLevel: c.minStockLevel || 0,
      category: 'Combo Matrix',
      price: c.price || 0,
      sku: c.sku,
      type: 'Combo'
    }));

    const allStock = [
      ...allRawStock.map(s => ({ ...s.toObject(), type: 'Raw' })),
      ...formattedItems,
      ...formattedCombos
    ];
    
    const stats = {
      totalItems: allStock.length,
      lowStock: allStock.filter(s => s.quantity > 0 && s.quantity <= s.minLevel).length,
      outOfStock: allStock.filter(s => s.quantity === 0).length,
      totalValue: allStock.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0),
      wastageValue: allWastage.reduce((acc, curr) => acc + (curr.value || 0), 0)
    };

    const categories = Array.from(new Set(allStock.map(s => s.category))).map(cat => ({
      name: cat,
      items: allStock.filter(s => s.category === cat).length,
      value: allStock.filter(s => s.category === cat).reduce((acc, curr) => acc + (curr.quantity * curr.price), 0)
    }));

    // Wastage trends (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const wastageMatch = { createdAt: { $gte: sevenDaysAgo } };
    if (branchId && branchId !== 'all') {
      const mongoose = require('mongoose');
      wastageMatch.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const wastageTrends = await Wastage.aggregate([
      { $match: wastageMatch },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          value: { $sum: "$value" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const trends = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const match = wastageTrends.find(t => t._id === dateStr);
      trends.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateStr,
        value: match ? match.value : 0
      });
    }

    res.json({
      success: true,
      data: {
        stats,
        categories,
        items: allStock,
        wastage: {
          items: allWastage.slice(0, 10),
          trends
        }
      }
    });
  } catch (error) {
    console.error('Inventory analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllStock,
  createStock,
  updateStock,
  deleteStock,
  getStockAnalytics
};
