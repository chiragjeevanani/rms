const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImg: {
    type: String,
    default: '',
  },
  restaurantName: {
    type: String,
    default: 'Your Restaurant Name',
  },
  mobileNumber: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  theme: {
    mode: { type: String, default: 'light' },
    primaryColor: { type: String, default: '#2C2C2C' },
    borderRadius: { type: String, default: '2rem' },
    sidebarStyle: { type: String, default: 'solid' },
    fontFamily: { type: String, default: 'Outfit' }
  }
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
