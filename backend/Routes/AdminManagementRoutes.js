const express = require('express');
const ensureAuthenticated = require('../Middlewares/Auth');
const FacultyModel = require('../Models/Faculty');
const StudentModel = require('../Models/Student');
const ComplainModel = require('../Models/Complain');
const router = express.Router();

// Get all faculty members
router.get('/faculty', ensureAuthenticated, async (req, res) => {
  try {
    const faculty = await FacultyModel.find().select('-password').sort({ createdAt: -1 });
    res.json(faculty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all students
router.get('/students', ensureAuthenticated, async (req, res) => {
  try {
    const students = await StudentModel.find().select('-password').sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete faculty member
router.delete('/faculty/:id', ensureAuthenticated, async (req, res) => {
  try {
    const faculty = await FacultyModel.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    
    // Update complaints to remove faculty reference
    await ComplainModel.updateMany(
      { lastUpdatedBy: req.params.id },
      { $unset: { lastUpdatedBy: 1 } }
    );
    
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete student
router.delete('/students/:id', ensureAuthenticated, async (req, res) => {
  try {
    const student = await StudentModel.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Delete all complaints by this student
    await ComplainModel.deleteMany({ UserName: student.username });
    
    res.json({ message: 'Student and associated complaints deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update faculty
router.put('/faculty/:id', ensureAuthenticated, async (req, res) => {
  try {
    const updates = (({ name, email, department, responsibleFor, mobile, address }) =>
      ({ name, email, department, responsibleFor, mobile, address }))(req.body);
    
    const faculty = await FacultyModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');
    
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    
    res.json(faculty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update student
router.put('/students/:id', ensureAuthenticated, async (req, res) => {
  try {
    const updates = (({ name, email, course, year, mobile, address }) =>
      ({ name, email, course, year, mobile, address }))(req.body);
    
    const student = await StudentModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard statistics
router.get('/dashboard-stats', ensureAuthenticated, async (req, res) => {
  try {
    const totalStudents = await StudentModel.countDocuments();
    const totalFaculty = await FacultyModel.countDocuments();
    const totalComplaints = await ComplainModel.countDocuments();
    
    const complaintStats = await ComplainModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentComplaints = await ComplainModel.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    const statusCounts = {
      Pending: 0,
      Acknowledged: 0,
      'In Progress': 0,
      'On Hold': 0,
      Resolved: 0,
      Closed: 0,
      Rejected: 0
    };
    
    complaintStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });
    
    res.json({
      totalStudents,
      totalFaculty,
      totalComplaints,
      statusCounts,
      recentComplaints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
