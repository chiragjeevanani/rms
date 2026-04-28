const Category = require('../Models/Category');

const getCategories = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const matchStage = req.query.branchId ? { $match: { branchId: new mongoose.Types.ObjectId(req.query.branchId) } } : { $match: {} };
    const categories = await Category.aggregate([
      matchStage,
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: 'category',
          as: 'items'
        }
      },
      {
        $project: {
          name: 1,
          image: 1,
          description: 1,
          status: 1,
          branchId: 1,
          createdAt: 1,
          itemCount: { $size: '$items' }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createCategory = async (req, res) => {
  const { name, image, description, status, branchId } = req.body;
  try {
    const newCategory = new Category({ name, image, description, status, branchId });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  const { name, image, description, status, branchId } = req.body;
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, image, description, status, branchId },
      { returnDocument: 'after' }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
