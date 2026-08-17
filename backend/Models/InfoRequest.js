const mongoose = require('mongoose');

const InfoRequestSchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complain',
    required: true
  },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  facultyMessage: { type: String, required: true, trim: true },
  studentResponse: { type: String, default: '' },
  // New field for optional student attachment
  responseAttachment: { type: String, default: '' },
  isResolved: { type: Boolean, default: false },
  responseDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('InfoRequest', InfoRequestSchema);
