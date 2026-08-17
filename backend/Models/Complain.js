const mongoose = require('mongoose');

const ComplainSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  UserName: { type: String, required: true },
  ComplaintTitle: { type: String, required: true },
  Email: { type: String, default: '' },
  ContactNumber: { type: String, default: '' },
  ProblemType: { type: String, required: true },
  ProblemDescription: { type: String, required: true },
  ComplaintDateTime: { type: Date, required: true, default: Date.now },
  attachment: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Acknowledged', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Rejected'],
    default: 'Pending'
  },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Complain', ComplainSchema);
