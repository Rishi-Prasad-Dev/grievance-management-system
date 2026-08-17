const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const InfoRequestModel = require('../Models/InfoRequest');
const ComplainModel = require('../Models/Complain');

const router = express.Router();

// Multer storage configuration for info request response attachments
const responseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/info-request-responses/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `response_${req.params.id}_${Date.now()}${ext}`);
  }
});

const responseFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

const uploadResponse = multer({
  storage: responseStorage,
  fileFilter: responseFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Create info request (Faculty)
 * Creates a new information request from faculty to student
 */
router.post('/create', async (req, res) => {
  try {
    const { complaintId, facultyMessage } = req.body;

    if (!complaintId || !facultyMessage?.trim()) {
      return res.status(400).json({
        error: 'complaintId and facultyMessage are required'
      });
    }

    const complaint = await ComplainModel.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const infoRequest = new InfoRequestModel({
      complaintId,
      studentId: complaint.UserName,
      studentName: complaint.Name,
      facultyMessage: facultyMessage.trim()
    });

    await infoRequest.save();

    // Update complaint status to "On Hold"
    await ComplainModel.findByIdAndUpdate(complaintId, { status: 'On Hold' });

    res.status(201).json({
      success: true,
      message: 'Information request sent to student',
      requestId: infoRequest._id
    });
  } catch (error) {
    console.error('Create info request error:', error);
    res.status(500).json({ error: 'Server error creating information request' });
  }
});

/**
 * Get info requests for student (unresolved only)
 * Returns pending information requests for a specific student
 */
router.get('/student/:studentId', async (req, res) => {
  try {
    const requests = await InfoRequestModel.find({
      studentId: req.params.studentId,
      isResolved: false
    }).populate('complaintId').sort({ createdAt: -1 });

    // Filter out requests where complaint might have been deleted
    const validRequests = requests.filter(req => req.complaintId);

    res.json(validRequests);
  } catch (error) {
    console.error('Get student info requests error:', error);
    res.status(500).json({ error: 'Server error fetching information requests' });
  }
});

/**
 * Get all info requests for a specific complaint (for faculty/admin)
 * Returns all information requests related to a complaint
 */
router.get('/complaint/:complaintId', async (req, res) => {
  try {
    const requests = await InfoRequestModel.find({
      complaintId: req.params.complaintId
    }).populate('complaintId').sort({ createdAt: 1 });

    res.json(requests);
  } catch (error) {
    console.error('Get complaint info requests error:', error);
    res.status(500).json({ error: 'Server error fetching complaint information requests' });
  }
});

/**
 * Student responds to info request with optional image attachment
 * Processes student response to faculty information request
 */
router.patch('/respond/:id', uploadResponse.single('attachment'), async (req, res) => {
  try {
    const { studentResponse } = req.body;

    if (!studentResponse?.trim()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'studentResponse is required' });
    }

    const updateData = {
      studentResponse: studentResponse.trim(),
      responseDate: new Date(),
      isResolved: true
    };

    // Add attachment if provided
    if (req.file) {
      updateData.responseAttachment = req.file.filename;
    }

    const infoRequest = await InfoRequestModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('complaintId');

    if (!infoRequest) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Information request not found' });
    }

    // Update complaint status back to "In Progress"
    if (infoRequest.complaintId) {
      await ComplainModel.findByIdAndUpdate(infoRequest.complaintId._id, {
        status: 'In Progress'
      });
    }

    res.json({
      success: true,
      message: 'Response submitted successfully',
      infoRequest
    });
  } catch (error) {
    console.error('InfoRequest response error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Server error processing response' });
  }
});

/**
 * Delete info request (Admin only - for cleanup)
 * Removes an information request from the system
 */
router.delete('/:id', async (req, res) => {
  try {
    const infoRequest = await InfoRequestModel.findByIdAndDelete(req.params.id);
    if (!infoRequest) {
      return res.status(404).json({ error: 'Information request not found' });
    }

    // Delete attachment if exists
    if (infoRequest.responseAttachment) {
      const attachmentPath = path.join('uploads/info-request-responses/', infoRequest.responseAttachment);
      if (fs.existsSync(attachmentPath)) {
        fs.unlinkSync(attachmentPath);
      }
    }

    res.json({
      success: true,
      message: 'Information request deleted successfully'
    });
  } catch (error) {
    console.error('Delete info request error:', error);
    res.status(500).json({ error: 'Server error deleting information request' });
  }
});

module.exports = router;
