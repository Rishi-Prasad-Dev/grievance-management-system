const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ensureAuthenticated = require('../Middlewares/Auth');
const FacultyModel = require('../Models/Faculty');
const StudentModel = require('../Models/Student');
const AdminModel = require('../Models/Admin');

const router = express.Router();

// Storage configurations
const adminStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/admin-images/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `admin_${req.params.id}_${Date.now()}${ext}`);
  }
});

const studentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/student-images/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `student_${req.params.id}_${Date.now()}${ext}`);
  }
});

const facultyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/faculty-images/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `faculty_${req.params.id}_${Date.now()}${ext}`);
  }
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

const uploadAdminImage = multer({
  storage: adminStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadStudentImage = multer({
  storage: studentStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadFacultyImage = multer({
  storage: facultyStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// UNIFIED IMAGE SERVING ROUTE - Serves all images through /images/image/:filename
router.get('/image/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Check all possible image directories in priority order
  const possiblePaths = [
    path.resolve('uploads/admin-images/', filename),
    path.resolve('uploads/student-images/', filename),
    path.resolve('uploads/faculty-images/', filename),
    path.resolve('uploads/complaint-attachments/', filename),
    path.resolve('uploads/info-request-responses/', filename),
    path.resolve('uploads/attachments/', filename),
    path.resolve('uploads/', filename)
  ];
  
  for (const imagePath of possiblePaths) {
    if (fs.existsSync(imagePath)) {
      return res.sendFile(imagePath);
    }
  }
  
  res.status(404).json({ error: 'Image not found' });
});

// Admin Image Routes
router.post('/upload-admin-image/:id', ensureAuthenticated, uploadAdminImage.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    
    const admin = await AdminModel.findById(req.params.id);
    if (!admin) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Delete old image if exists
    if (admin.profileImage) {
      const oldPath = path.join('uploads/admin-images/', admin.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    admin.profileImage = req.file.filename;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin profile image updated',
      profileImage: req.file.filename,
      profileImageUrl: `http://localhost:5000/images/image/${req.file.filename}`
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Admin image upload error:', err);
    res.status(500).json({ error: 'Failed to upload admin image' });
  }
});

router.delete('/delete-admin-image/:id', ensureAuthenticated, async (req, res) => {
  try {
    const admin = await AdminModel.findById(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    
    if (admin.profileImage) {
      const imagePath = path.join('uploads/admin-images/', admin.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      admin.profileImage = '';
      await admin.save();
    }

    res.json({ success: true, message: 'Profile image deleted' });
  } catch (error) {
    console.error('Delete admin image error:', error);
    res.status(500).json({ error: 'Server error deleting profile image' });
  }
});

// Student Image Routes
router.post('/upload-student-image/:id', ensureAuthenticated, uploadStudentImage.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    
    const student = await StudentModel.findById(req.params.id);
    if (!student) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.profileImage) {
      const oldPath = path.join('uploads/student-images/', student.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    student.profileImage = req.file.filename;
    await student.save();

    res.json({
      success: true,
      message: 'Student profile image updated',
      profileImage: req.file.filename,
      profileImageUrl: `http://localhost:5000/images/image/${req.file.filename}`
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Student image upload error:', err);
    res.status(500).json({ error: 'Failed to upload student image' });
  }
});

router.delete('/delete-student-image/:id', ensureAuthenticated, async (req, res) => {
  try {
    const student = await StudentModel.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    if (student.profileImage) {
      const imagePath = path.join('uploads/student-images/', student.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      student.profileImage = '';
      await student.save();
    }

    res.json({ success: true, message: 'Profile image deleted' });
  } catch (error) {
    console.error('Delete student image error:', error);
    res.status(500).json({ error: 'Server error deleting profile image' });
  }
});

// Faculty Image Routes
router.post('/upload-faculty-image/:id', ensureAuthenticated, uploadFacultyImage.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    
    const faculty = await FacultyModel.findById(req.params.id);
    if (!faculty) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Faculty not found' });
    }

    if (faculty.profileImage) {
      const oldPath = path.join('uploads/faculty-images/', faculty.profileImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    faculty.profileImage = req.file.filename;
    await faculty.save();

    res.json({
      success: true,
      message: 'Faculty profile image updated',
      profileImage: req.file.filename,
      profileImageUrl: `http://localhost:5000/images/image/${req.file.filename}`
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Faculty image upload error:', err);
    res.status(500).json({ error: 'Failed to upload faculty image' });
  }
});

router.delete('/delete-faculty-image/:id', ensureAuthenticated, async (req, res) => {
  try {
    const faculty = await FacultyModel.findById(req.params.id);
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    
    if (faculty.profileImage) {
      const imagePath = path.join('uploads/faculty-images/', faculty.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      faculty.profileImage = '';
      await faculty.save();
    }

    res.json({
      success: true,
      message: 'Faculty profile image deleted'
    });
  } catch (err) {
    console.error('Faculty image delete error:', err);
    res.status(500).json({ error: 'Failed to delete faculty image' });
  }
});

// Complaint attachment serving (for backward compatibility)
router.get('/complaint-attachment/:filename', (req, res) => {
  const filePath = path.resolve('uploads/complaint-attachments/', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Attachment not found' });
  }
});

// Info request response attachment serving (for backward compatibility)
router.get('/response-attachment/:filename', (req, res) => {
  const filePath = path.resolve('uploads/info-request-responses/', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Attachment not found' });
  }
});

module.exports = router;
