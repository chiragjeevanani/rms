const Role = require('../Models/Role');

const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate('branchId');
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, branchId, description, permissions, status } = req.body;
    
    // Check if role with same name exists for this branch
    const existingRole = await Role.findOne({ name, branchId });
    if (existingRole) {
      return res.status(400).json({ message: `Role "${name}" already exists for this branch.` });
    }

    const role = new Role({ name, branchId, description, permissions, status });
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A role with this name already exists.' });
    }
    res.status(400).json({ message: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    );
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole
};
