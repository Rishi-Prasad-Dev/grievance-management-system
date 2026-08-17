const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

require('dotenv').config();
require('./Models/db'); // mongoose.connect in this file

const app = express();
const PORT = process.env.PORT || 5000;

// Import routers
const authRouter = require('./Routes/AuthRouter');
const complainRouter = require('./Routes/ComplainRoutes');
const infoRequestRouter = require('./Routes/InfoRequestRoutes');
const feedbackRouter = require('./Routes/FeedbackRoutes');
const studentProfileRouter = require('./Routes/StudentProfileRoutes');
const adminProfileRouter = require('./Routes/AdminProfileRoutes');
const facultyProfileRouter = require('./Routes/FacultyProfileRoutes');
const adminManagementRouter = require('./Routes/AdminManagementRoutes');
const imageRouter = require('./Routes/ImageRoutes');

app.use(bodyParser.json());
app.use(cors());

// Serve static files middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route registrations
app.use('/auth', authRouter);
app.use('/complain', complainRouter);
app.use('/info-requests', infoRequestRouter);
app.use('/feedback', feedbackRouter);
app.use('/auth/Student', studentProfileRouter);
app.use('/auth/Admin', adminProfileRouter);
app.use('/auth/Faculty', facultyProfileRouter);
app.use('/admin-manage', adminManagementRouter);
app.use('/images', imageRouter);

// 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
