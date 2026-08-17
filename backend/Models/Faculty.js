const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String },
  responsibleFor: [{ type: String }],
  mobile: { type: String },
  address: { type: String },
  password: { type: String, required: true },
  profileImage: { 
    type: String, 
    default: '' // Will store the image filename/path
  }
}, { timestamps: true });

module.exports = mongoose.model('Faculty', FacultySchema);