const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  complaintId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Complain', 
    required: true 
  },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  comments: { type: String, default: '' },
  isSubmitted: { type: Boolean, default: false },
  submittedDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
