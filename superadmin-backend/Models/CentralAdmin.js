const mongoose = require('mongoose');

// Mirrors the 'admins' collection in SuperAdmin database (unified camelCase registry)
const centralAdminSchema = new mongoose.Schema({
  adminId:                { type: String },
  email:                  { type: String, required: true, unique: true },
  dbUrl:                  { type: String },
  apiUrl:                 { type: String, default: '' },
  dbName:                 { type: String },
  branchLimit:            { type: Number, default: 0 },
  thirdPartyIntegration:  { type: Boolean, default: false },
  isActive:               { type: Boolean, default: false },
  createdAt:              { type: Date, default: Date.now },
  appType:                { type: String, enum: ['POS', 'KDS', 'Admin'], default: 'Admin' },
  name:                   { type: String },
  password:               { type: String },
  mobileNumber:           { type: String, default: '' },
  profileImg:             { type: String, default: '' },
  status:                 { type: String, default: 'inactive' },
  isSuperAdminDefault:    { type: Boolean, default: false },
  
  // Multi-Tenant SaaS Sync Fields
  vpsIp:                  { type: String, default: '' },
  syncToken:              { type: String, default: '' },
  plan:                   { type: String, default: 'Basic' },
  expiryDate:             { type: Date }
});

module.exports = mongoose.model('CentralAdmin', centralAdminSchema, 'admins');
