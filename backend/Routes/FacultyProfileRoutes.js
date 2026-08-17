const express = require('express');
const ensureAuthenticated = require('../Middlewares/Auth');
const FacultyModel = require('../Models/Faculty');

const router = express.Router();

// Get faculty profile with all data
router.get('/FacultyProfile/:id', ensureAuthenticated, async (req, res) => {
  try {
    const faculty = await FacultyModel.findById(req.params.id).select('-password');
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    // Include profile image URL if exists
    const facultyData = faculty.toObject();
    if (facultyData.profileImage) {
      facultyData.profileImageUrl = `http://localhost:5000/images/image/${facultyData.profileImage}`;
    }

    res.json(facultyData);
  } catch (err) {
    console.error('Get faculty profile error:', err);
    res.status(500).json({ error: 'Server error fetching faculty profile' });
  }
});

// Update faculty profile
router.put('/FacultyProfile/:id', ensureAuthenticated, async (req, res) => {
  try {
    const updates = (({ name, email, department, responsibleFor, mobile, address }) =>
      ({ name, email, department, responsibleFor, mobile, address }))(req.body);

    // Basic validation
    if (!updates.name || !updates.name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!updates.email || !updates.email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const faculty = await FacultyModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    // Include profile image URL if exists
    const facultyData = faculty.toObject();
    if (facultyData.profileImage) {
      facultyData.profileImageUrl = `http://localhost:5000/images/image/${facultyData.profileImage}`;
    }

    res.json(facultyData);
  } catch (err) {
    console.error('Update faculty profile error:', err);
    res.status(500).json({ error: 'Server error updating faculty profile' });
  }
});

// Get faculty basic info for sidebar (lightweight endpoint)
router.get('/FacultyInfo/:id', ensureAuthenticated, async (req, res) => {
  try {
    const faculty = await FacultyModel.findById(req.params.id)
      .select('name email profileImage')
      .lean();

    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    // Include profile image URL if exists
    if (faculty.profileImage) {
      faculty.profileImageUrl = `http://localhost:5000/images/image/${faculty.profileImage}`;
    }

    res.json(faculty);
  } catch (err) {
    console.error('Get faculty info error:', err);
    res.status(500).json({ error: 'Server error fetching faculty info' });
  }
});

module.exports = router;
