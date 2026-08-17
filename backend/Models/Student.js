const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, default: '' },
  course: { type: String, default: '' },
  year: { type: String, default: '' },
  mobile: { type: String, default: '' },
  address: { type: String, default: '' },
  batch: { type: String, default: '' },
  profileImage: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
