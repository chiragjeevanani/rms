const mongoose = require('mongoose');

// Mirrors the 'admins' collection that superadmin uses to track all provisioned nodes
const centralAdminSchema = new mongoose.Schema({
  name:           { type: String },
  email:          { type: String, required: true, unique: true },
  password:       { type: String },
  restaurantName: { type: String },
  localDbName:    { type: String },
  localDbUrl:     { type: String },
  thirdPartyApi:  { type: Boolean, default: false },
  mobileNumber:   { type: String, default: '' },
  profileImg:     { type: String, default: '' },
  status:         { type: String, default: 'active' },
  branchLimit:    { type: Number, default: 5 },
  isSuperAdminDefault: { type: Boolean, default: false },
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('CentralAdmin', centralAdminSchema, 'admins');
