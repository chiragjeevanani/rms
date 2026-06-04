const Table = require('../Models/Table');
const jwt = require('jsonwebtoken');
const getAdminBranchFilter = require('../Utils/getAdminBranchIds');

// @desc    Get all tables
// @route   GET /api/table
const getTables = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (decoded.role === 'admin') {
          req.admin = decoded;
        }
      } catch (err) {
        // Safe check fallback - ignore invalid/expired tokens for public endpoints
      }
    }

    const { filter } = await getAdminBranchFilter(req);
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
    const { tableName, tableCode, branchId } = req.body;
    if (!branchId) {
      return res.status(400).json({ message: 'Branch ID is required' });
    }
    const existingTable = await Table.findOne({ tableName, branchId });
    if (existingTable) {
      return res.status(400).json({ message: 'Table name already exists in this branch' });
    }
    if (tableCode) {
      const existingCode = await Table.findOne({ tableCode, branchId });
      if (existingCode) {
        return res.status(400).json({ message: 'Table code already exists in this branch' });
      }
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
    const { tableName, tableCode, branchId } = req.body;
    const currentTable = await Table.findById(req.params.id);
    if (!currentTable) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const targetBranch = branchId || currentTable.branchId;

    if (tableName && (tableName !== currentTable.tableName || (branchId && branchId !== currentTable.branchId.toString()))) {
      const existingTable = await Table.findOne({ tableName, branchId: targetBranch });
      if (existingTable && existingTable._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Table name already exists in this branch' });
      }
    }

    if (tableCode && (tableCode !== currentTable.tableCode || (branchId && branchId !== currentTable.branchId.toString()))) {
      const existingCode = await Table.findOne({ tableCode, branchId: targetBranch });
      if (existingCode && existingCode._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Table code already exists in this branch' });
      }
    }

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
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
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (decoded.role === 'admin') {
          req.admin = decoded;
        }
      } catch (err) {
        // Ignore invalid tokens
      }
    }

    const { filter } = await getAdminBranchFilter(req);
    const isAvailable = status === 'Available';
    await Table.updateMany(filter, { status, isAvailable });
    
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
