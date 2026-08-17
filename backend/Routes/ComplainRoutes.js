const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ComplainModel = require('../Models/Complain');
const FacultyModel = require('../Models/Faculty');
const FeedbackModel = require('../Models/Feedback');
const ensureAuthenticated = require('../Middlewares/Auth');

const router = express.Router();

// Configure multer for complaint attachments
const complainStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/complaint-attachments/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    const filename = `complaint_${Date.now()}${extension}`;
    cb(null, filename);
  }
});

const complainUpload = multer({
  storage: complainStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Helper function to create feedback request for finalized complaints
 * @param {string} complaintId - Complaint ID
 * @returns {boolean} - Success status
 */
const createFeedbackRequest = async (complaintId) => {
  try {
    const complaint = await ComplainModel.findById(complaintId);
    if (!complaint) return false;

    // Check if feedback request already exists
    const existingFeedback = await FeedbackModel.findOne({ complaintId });
    if (existingFeedback) return true; // Already exists, that's fine

    // Create new feedback request
    const feedback = new FeedbackModel({
      complaintId: complaint._id,
      studentId: complaint.UserName,
      studentName: complaint.Name
    });

    await feedback.save();
    return true;
  } catch (error) {
    console.error('Error creating feedback request:', error);
    return false;
  }
};

// Register complaint with optional image attachment
router.post('/register', ensureAuthenticated, complainUpload.single('attachment'), async (req, res) => {
  try {
    // Extract form data from request body
    const {
      Name,
      ComplaintTitle,
      Email,
      ContactNumber,
      ProblemType,
      ProblemDescription
    } = req.body;

    // Validate required fields
    if (!ComplaintTitle?.trim()) {
      if (req.file) fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(400).json({ error: 'Complaint title is required' });
    }

    if (!ProblemDescription?.trim()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Problem description is required' });
    }

    if (!ProblemType) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Problem type is required' });
    }

    // Get student name with fallbacks
    let studentName = 'Unknown';
    if (Name && Name.trim()) {
      studentName = Name.trim(); // First priority: from form
    } else if (req.user && req.user.name) {
      studentName = req.user.name; // Second priority: from JWT
    } else if (req.user && req.user.username) {
      studentName = req.user.username; // Third priority: username as fallback
    }

    // Create new complaint
    const complain = new ComplainModel({
      Name: studentName, // Use resolved name
      UserName: req.user.username || req.user._id,
      ComplaintTitle: ComplaintTitle.trim(),
      Email: Email?.trim() || req.user.email || '',
      ContactNumber: ContactNumber?.trim() || req.user.mobile || '',
      ProblemType: ProblemType,
      ProblemDescription: ProblemDescription.trim(),
      ComplaintDateTime: new Date(),
      attachment: req.file ? req.file.filename : '',
      status: 'Pending'
    });

    await complain.save();

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: {
        id: complain._id,
        title: complain.ComplaintTitle,
        name: complain.Name, // Include name in response
        status: complain.status,
        date: complain.ComplaintDateTime
      }
    });

  } catch (error) {
    console.error('Register complaint error:', error);
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Internal server error while submitting complaint',
      message: error.message
    });
  }
});

// Get all complaints (Admin)
router.get('/viewcomplains', ensureAuthenticated, async (req, res) => {
  try {
    const data = await ComplainModel.find().populate('lastUpdatedBy', 'name email').sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    console.error('View complaints error:', error);
    res.status(500).json({ error: 'Server error fetching complaints' });
  }
});

// Delete complaint (Admin)
router.delete('/viewcomplains/:id', ensureAuthenticated, async (req, res) => {
  try {
    const complaint = await ComplainModel.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Delete attachment file if it exists
    if (complaint.attachment) {
      const attachmentPath = path.join('uploads/complaint-attachments/', complaint.attachment);
      if (fs.existsSync(attachmentPath)) {
        fs.unlinkSync(attachmentPath);
      }
    }

    // Delete associated feedback request if it exists
    await FeedbackModel.findOneAndDelete({ complaintId: req.params.id });

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get complaints for a given student
router.get('/student/:username', ensureAuthenticated, async (req, res) => {
  try {
    const complaints = await ComplainModel.find({ UserName: req.params.username })
      .populate('lastUpdatedBy', 'name email')
      .sort({ updatedAt: -1 });
    
    res.json(complaints);
  } catch (error) {
    console.error('Get student complaints error:', error);
    res.status(500).json({ error: 'Server error fetching student complaints' });
  }
});

/**
 * Get complaints assigned to faculty (by category) - DASHBOARD ROUTE
 * Returns all complaints in faculty's responsibility area (for dashboard statistics)
 */
router.get('/viewcomplains/responsible/:facultyId', ensureAuthenticated, async (req, res) => {
  try {
    const faculty = await FacultyModel.findById(req.params.facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Get categories this faculty is responsible for
    const categories = faculty.responsibleFor.map(c => c.toUpperCase());
    
    // Find all complaints of these categories for dashboard statistics
    const allComplaints = await ComplainModel.find({
      ProblemType: { $in: categories }
    }).populate('lastUpdatedBy', 'name email').sort({ updatedAt: -1 });

    const myComplaints = [];
    const othersComplaints = [];

    allComplaints.forEach(complaint => {
      if (!complaint.lastUpdatedBy || complaint.lastUpdatedBy._id.toString() === req.params.facultyId) {
        myComplaints.push(complaint);
      } else if (complaint.lastUpdatedBy && complaint.lastUpdatedBy._id.toString() !== req.params.facultyId) {
        othersComplaints.push({
          ...complaint.toObject(),
          assignedToOther: true,
          assignedFaculty: complaint.lastUpdatedBy
        });
      }
    });

    res.json([...myComplaints, ...othersComplaints]);
  } catch (error) {
    console.error('Get faculty complaints error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get active complaints that faculty can handle (excluding resolved/closed/rejected)
 * Query parameter: includeOthers=true to show complaints handled by other faculty
 */
router.get('/viewcomplains/active/:facultyId', ensureAuthenticated, async (req, res) => {
  try {
    const includeOthers = req.query.includeOthers === 'true';
    
    const faculty = await FacultyModel.findById(req.params.facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Get categories this faculty is responsible for
    const categories = faculty.responsibleFor || [];
    
    // Create case-insensitive regex patterns for matching
    const categoryRegexes = categories.map(category => 
      new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    );
    
    // Find complaints excluding final statuses
    const excludedStatuses = ['Resolved', 'Closed', 'Rejected'];
    
    let queryCondition = { status: { $nin: excludedStatuses } };
    
    // Add category filter if faculty has responsibilities
    if (categories.length > 0) {
      queryCondition.$or = categoryRegexes.map(regex => ({ ProblemType: regex }));
    }
    
    const allComplaints = await ComplainModel.find(queryCondition)
      .populate('lastUpdatedBy', 'name email')
      .sort({ ComplaintDateTime: -1 });

    let filteredComplaints = [];

    if (includeOthers) {
      // Include all complaints with assignment info
      filteredComplaints = allComplaints.map(complaint => {
        const complaintObj = complaint.toObject();
        
        if (complaint.lastUpdatedBy && 
            complaint.lastUpdatedBy._id.toString() !== req.params.facultyId) {
          complaintObj.assignedToOther = true;
          complaintObj.assignedFaculty = complaint.lastUpdatedBy;
        } else {
          complaintObj.assignedToOther = false;
        }
        
        return complaintObj;
      });
    } else {
      // Only show unassigned or own complaints, plus all pending
      filteredComplaints = allComplaints.filter(complaint => 
        !complaint.lastUpdatedBy || 
        complaint.lastUpdatedBy._id.toString() === req.params.facultyId ||
        complaint.status === 'Pending'
      );
    }

    res.json(filteredComplaints);
    
  } catch (error) {
    console.error('Get active complaints error:', error);
    res.status(500).json({ error: 'Server error fetching active complaints' });
  }
});

/**
 * Get complaints history - complaints that have been resolved/closed by this faculty
 * Includes all attachments and info requests
 */
router.get('/viewcomplains/history/:facultyId', ensureAuthenticated, async (req, res) => {
  try {
    const complaints = await ComplainModel.find({
      lastUpdatedBy: req.params.facultyId,
      status: { $in: ['Resolved', 'Closed', 'Rejected'] }
    }).populate('lastUpdatedBy', 'name email').sort({ updatedAt: -1 });

    res.json(complaints);
  } catch (error) {
    console.error('Get history complaints error:', error);
    res.status(500).json({ error: 'Server error fetching history complaints' });
  }
});

// Update complaint status (Faculty version)
router.patch('/:id/status', ensureAuthenticated, async (req, res) => {
  try {
    const { status, facultyId } = req.body;
    const validStatuses = ['Pending', 'Acknowledged', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Rejected'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const existingComplaint = await ComplainModel.findById(req.params.id);
    if (!existingComplaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check if complaint is already being handled by another faculty
    if (existingComplaint.lastUpdatedBy &&
        existingComplaint.lastUpdatedBy.toString() !== facultyId &&
        existingComplaint.status !== 'Pending') {
      const otherFaculty = await FacultyModel.findById(existingComplaint.lastUpdatedBy);
      return res.status(409).json({
        error: `This complaint is currently being handled by ${otherFaculty ? otherFaculty.name : 'another faculty member'}`
      });
    }

    const update = { status };
    
    // Set faculty as lastUpdatedBy for active statuses
    if (['Acknowledged', 'In Progress', 'On Hold'].includes(status)) {
      update.lastUpdatedBy = facultyId;
    }

    // Keep the same faculty for closure statuses
    if (['Resolved', 'Closed', 'Rejected'].includes(status) && existingComplaint.lastUpdatedBy) {
      update.lastUpdatedBy = existingComplaint.lastUpdatedBy;
    }

    const complaint = await ComplainModel.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('lastUpdatedBy', 'name email');

    // Create feedback request for final statuses
    if (['Resolved', 'Closed', 'Rejected'].includes(status)) {
      const feedbackCreated = await createFeedbackRequest(req.params.id);
      if (!feedbackCreated) {
        console.warn(`Failed to create feedback request for complaint ${req.params.id}`);
      }
    }

    res.json({
      success: true,
      message: `Status updated to "${status}" successfully`,
      complaint
    });
  } catch (error) {
    console.error('Update complaint status (faculty) error:', error);
    res.status(500).json({ error: 'Server error updating status' });
  }
});

// Update complaint status (Admin version)
router.patch('/viewcomplains/:id/status', ensureAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Acknowledged', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Rejected'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const update = { status };
    
    // Reset lastUpdatedBy if setting to Pending
    if (status === 'Pending') {
      update.lastUpdatedBy = null;
    }

    const complaint = await ComplainModel.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('lastUpdatedBy', 'name email');
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Create feedback request for final statuses
    if (['Resolved', 'Closed', 'Rejected'].includes(status)) {
      const feedbackCreated = await createFeedbackRequest(req.params.id);
      if (!feedbackCreated) {
        console.warn(`Failed to create feedback request for complaint ${req.params.id}`);
      }
    }

    res.json({
      success: true,
      message: `Status updated to "${status}" successfully`,
      complaint
    });
  } catch (error) {
    console.error('Update complaint status (admin) error:', error);
    res.status(500).json({ error: 'Server error updating status' });
  }
});

// Serve complaint attachment files through unified route
router.get('/attachment/:filename', (req, res) => {
  const filePath = path.resolve('uploads/complaint-attachments/', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router;
