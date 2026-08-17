const express = require('express');
const ensureAuthenticated = require('../Middlewares/Auth');
const AdminModel = require('../Models/Admin');

const router = express.Router();

// GET /auth/Admin/AdminProfile/:id
router.get('/AdminProfile/:id', ensureAuthenticated, async (req, res) => {
  try {
    const admin = await AdminModel.findById(req.params.id).select('-password');
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    // Convert to object and add profileImageUrl
    const adminData = admin.toObject();
    if (adminData.profileImage) {
      adminData.profileImageUrl = `http://localhost:5000/images/image/${adminData.profileImage}`;
    }

    res.json(adminData);
  } catch (err) {
    console.error('Get admin profile error:', err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /auth/Admin/AdminProfile/:id
router.put('/AdminProfile/:id', ensureAuthenticated, async (req, res) => {
  try {
    const updates = (({ name, email, mobile, address, department }) =>
      ({ name, email, mobile, address, department }))(req.body);

    // Basic validation
    if (!updates.name || !updates.name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!updates.email || !updates.email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const admin = await AdminModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    // Convert to object and add profileImageUrl
    const adminData = admin.toObject();
    if (adminData.profileImage) {
      adminData.profileImageUrl = `http://localhost:5000/images/image/${adminData.profileImage}`;
    }

    res.json(adminData);
  } catch (err) {
    console.error('Update admin profile error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
