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
    const allStock = await Stock.find().sort({ name: 1 });
    
    const stats = {
      totalItems: allStock.length,
      lowStock: allStock.filter(s => s.quantity > 0 && s.quantity <= s.minLevel).length,
      outOfStock: allStock.filter(s => s.quantity === 0).length,
      totalValue: allStock.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0)
    };

    const categories = Array.from(new Set(allStock.map(s => s.category))).map(cat => ({
      name: cat,
      items: allStock.filter(s => s.category === cat).length,
      value: allStock.filter(s => s.category === cat).reduce((acc, curr) => acc + (curr.quantity * curr.price), 0)
    }));

    res.json({
      success: true,
      data: {
        stats,
        categories,
        items: allStock
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllStock,
  createStock,
  updateStock,
  deleteStock,
  getStockAnalytics
};
