const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, default: '' },
  address: { type: String, default: '' },
  department: { type: String, default: '' },
  profileImage: { type: String, default: '' } // Added profile image field
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);