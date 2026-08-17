const express = require('express');
const ensureAuthenticated = require('../Middlewares/Auth');
const StudentModel = require('../Models/Student');

const router = express.Router();

// GET current student's profile
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    // Use the user ID from the auth middleware
    const student = await StudentModel.findById(req.user._id).select('-password');
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Convert to object and add profileImageUrl
    const studentData = student.toObject();
    if (studentData.profileImage) {
      studentData.profileImageUrl = `http://localhost:5000/images/image/${studentData.profileImage}`;
    }

    res.json(studentData);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error retrieving profile' });
  }
});

// PUT update student's profile
router.put('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'email', 'course', 'year', 'mobile', 'address', 'batch'];
    const updates = {};
    
    // Filter only allowed updates
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Basic validation
    if (updates.name && !updates.name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const student = await StudentModel.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Convert to object and add profileImageUrl
    const studentData = student.toObject();
    if (studentData.profileImage) {
      studentData.profileImageUrl = `http://localhost:5000/images/image/${studentData.profileImage}`;
    }

    res.json(studentData);
  } catch (error) {
    console.error('Profile update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

module.exports = router;
