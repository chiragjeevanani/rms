const Table = require('../Models/Table');

// @desc    Get all tables
// @route   GET /api/table
const getTables = async (req, res) => {
  try {
    const filter = req.query.branchId ? { branchId: req.query.branchId } : {};
    const tables = await Table.find(filter).sort({ tableName: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tables' });
  }
};

// @desc    Add a new table
// @route   POST /api/table
const addTable = async (req, res) => {
  try {
    const { tableName } = req.body;
    const existingTable = await Table.findOne({ tableName });
    if (existingTable) {
      return res.status(400).json({ message: 'Table name already exists' });
    }

    const newTable = new Table(req.body);
    await newTable.save();
    res.status(201).json(newTable);
  } catch (error) {
    res.status(500).json({ message: 'Error adding table' });
  }
};

// @desc    Update a table details
// @route   PUT /api/table/:id
const updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: 'Error updating table' });
  }
};

// @desc    Remove a table
// @route   DELETE /api/table/:id
const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json({ message: 'Table removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing table' });
  }
};

// @route   PATCH /api/table/:id/status
const updateTableStatus = async (req, res) => {
    const { status } = req.body;
    try {
      const table = await Table.findById(req.params.id);
      if (!table) return res.status(404).json({ message: 'Table not found' });
      
      table.status = status;
      table.isAvailable = (status === 'Available');
      await table.save();

      // Emit real-time update
      const io = req.app.get('socketio');
      if (io) io.emit('tableStatusChanged', { tableId: table._id, status });

      res.json(table);
    } catch (error) {
      res.status(500).json({ message: 'Error updating status' });
    }
};

const bulkUpdateTables = async (req, res) => {
  const { status } = req.body;
  try {
    const isAvailable = status === 'Available';
    await Table.updateMany({}, { status, isAvailable });
    
    const io = req.app.get('socketio');
    if (io) io.emit('tableStatusChanged');
    
    res.json({ message: `All tables set to ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Error in bulk update' });
  }
};

module.exports = {
  getTables,
  addTable,
  updateTable,
  deleteTable,
  updateTableStatus,
  bulkUpdateTables
};
