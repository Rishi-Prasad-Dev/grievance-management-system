import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaEdit, FaSave, FaTimes, FaTrash, FaUserGraduate, FaUsers,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaGraduationCap, 
  FaCalendarAlt, FaSpinner, FaUserCircle, FaInfoCircle
} from 'react-icons/fa';
import AdminSideBar from '../../components/AdminSideBar';
import '../../components/css/ManageStudents.css';

/**
 * ManageStudents Component
 * Allows administrators to view, edit, and delete student accounts
 * Features comprehensive form validation and responsive design
 */
function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    course: '',
    year: '',
    mobile: '',
    address: '',
    batch: ''
  });

  const token = localStorage.getItem('token');

  // Available courses
  const courses = [
    'B.Tech Computer Science',
    'B.Tech Mechanical',
    'B.Tech Electrical',
    'B.Tech Civil',
    'B.Tech Electronics',
    'B.Tech Chemical',
    'B.Tech IT',
    'MBA',
    'MCA',
    'BCA',
    'Diploma'
  ];

  // Available years
  const years = [
    '1st Year',
    '2nd Year', 
    '3rd Year',
    '4th Year',
    'Postgraduate'
  ];

  // Available batches
  const batches = [
    '2021-2025',
    '2022-2026',
    '2023-2027',
    '2024-2028',
    '2025-2029'
  ];

  // Load students data on mount
  useEffect(() => {
    if (!token) {
      toast.error('Please log in first');
      return;
    }
    fetchStudents();
  }, [token]);

  /**
   * Fetch all students
   */
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/admin-manage/students', {
        headers: { Authorization: token }
      });
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Fetch students error:', error);
      toast.error('Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate edit form
   * @returns {boolean} - True if form is valid
   */
  const validateEditForm = () => {
    const newErrors = {};

    // Name validation
    if (!editForm.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (editForm.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!editForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Course validation
    if (!editForm.course) {
      newErrors.course = 'Course is required';
    }

    // Year validation
    if (!editForm.year) {
      newErrors.year = 'Academic year is required';
    }

    // Mobile validation (optional)
    if (editForm.mobile.trim()) {
      const digitsOnly = editForm.mobile.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        newErrors.mobile = 'Mobile number must be at least 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Start editing a student
   * @param {Object} student - Student object
   */
  const startEditing = (student) => {
    setEditingId(student._id);
    setEditForm({
      name: student.name || '',
      email: student.email || '',
      course: student.course || '',
      year: student.year || '',
      mobile: student.mobile || '',
      address: student.address || '',
      batch: student.batch || ''
    });
    setErrors({});
  };

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      name: '',
      email: '',
      course: '',
      year: '',
      mobile: '',
      address: '',
      batch: ''
    });
    setErrors({});
  };

  /**
   * Handle form input changes
   * @param {string} field - Field name
   * @param {string} value - Field value
   */
  const handleChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Update student
   */
  const updateStudent = async () => {
    if (!validateEditForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/admin-manage/students/${editingId}`,
        editForm,
        { headers: { Authorization: token } }
      );
      
      toast.success('Student updated successfully');
      setEditingId(null);
      setErrors({});
      fetchStudents();
    } catch (error) {
      console.error('Update student error:', error);
      toast.error(error.response?.data?.message || 'Failed to update student');
    }
  };

  /**
   * Delete student
   * @param {string} id - Student ID
   * @param {string} name - Student name
   */
  const deleteStudent = async (id, name) => {
    if (!window.confirm(
      `Are you sure you want to delete ${name}?\n\nThis will also delete all their complaints and associated data. This action cannot be undone.`
    )) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/admin-manage/students/${id}`, {
        headers: { Authorization: token }
      });
      
      toast.success('Student and associated data deleted successfully');
      fetchStudents();
    } catch (error) {
      console.error('Delete student error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete student');
    }
  };

  /**
   * Get student's initials for avatar
   * @param {string} name - Student name
   * @returns {string} - Initials
   */
  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="ms-layout">
        <AdminSideBar />
        <main className="ms-content" role="main" aria-busy="true">
          <div className="ms-loading" role="status" aria-live="assertive">
            <div className="ms-spinner" aria-hidden="true"></div>
            <p>Loading students data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ms-layout">
      <AdminSideBar />
      <main className="ms-content" role="main" aria-labelledby="students-title">
        {/* Header */}
        <header className="ms-header">
          <div className="ms-header-content">
            <h1 id="students-title">
              <FaUsers aria-hidden="true" />
              Manage Students
            </h1>
            <p>View, edit, and manage student accounts and their information</p>
          </div>
        </header>

        {/* Statistics */}
        <section className="ms-stats-section" aria-labelledby="stats-title">
          <div className="ms-stat-card">
            <h3 className="ms-stat-number">{students.length}</h3>
            <p className="ms-stat-label">Total Students</p>
          </div>
        </section>

        {/* Students Grid */}
        {students.length > 0 ? (
          <section className="ms-students-section" aria-labelledby="students-list-title">
            <h2 id="students-list-title" className="sr-only">Students List</h2>
            
            <div className="ms-students-grid">
              {students.map((student) => (
                <article key={student._id} className="ms-student-card">
                  {/* Card Header */}
                  <header className="ms-student-header">
                    <div className="ms-student-avatar">
                      {student.profileImageUrl ? (
                        <img
                          src={student.profileImageUrl}
                          alt={`${student.name} profile`}
                          className="ms-student-profile-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = getInitials(student.name);
                          }}
                        />
                      ) : (
                        getInitials(student.name)
                      )}
                    </div>
                    
                    <div className="ms-student-info">
                      <h3 className="ms-student-name">{student.name || 'Unknown'}</h3>
                      <p className="ms-student-username">@{student.username || 'unknown'}</p>
                      <p className="ms-student-email">{student.email || 'No email provided'}</p>
                    </div>
                  </header>

                  {/* Card Body */}
                  {editingId === student._id ? (
                    <div className="ms-edit-form">
                      {/* Name Field */}
                      <div className="ms-form-group">
                        <label htmlFor={`name-${student._id}`}>
                          <FaUserGraduate aria-hidden="true" />
                          Full Name *
                        </label>
                        <input
                          id={`name-${student._id}`}
                          type="text"
                          value={editForm.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          required
                          maxLength={50}
                          className={errors.name ? 'error' : ''}
                          aria-describedby={errors.name ? `name-error-${student._id}` : ''}
                        />
                        {errors.name && (
                          <span id={`name-error-${student._id}`} className="ms-error-message" role="alert">
                            <FaInfoCircle aria-hidden="true" />
                            {errors.name}
                          </span>
                        )}
                      </div>

                      {/* Email Field */}
                      <div className="ms-form-group">
                        <label htmlFor={`email-${student._id}`}>
                          <FaEnvelope aria-hidden="true" />
                          Email Address *
                        </label>
                        <input
                          id={`email-${student._id}`}
                          type="email"
                          value={editForm.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          required
                          className={errors.email ? 'error' : ''}
                          aria-describedby={errors.email ? `email-error-${student._id}` : ''}
                        />
                        {errors.email && (
                          <span id={`email-error-${student._id}`} className="ms-error-message" role="alert">
                            <FaInfoCircle aria-hidden="true" />
                            {errors.email}
                          </span>
                        )}
                      </div>

                      {/* Course Field */}
                      <div className="ms-form-group">
                        <label htmlFor={`course-${student._id}`}>
                          <FaGraduationCap aria-hidden="true" />
                          Course *
                        </label>
                        <select
                          id={`course-${student._id}`}
                          value={editForm.course}
                          onChange={(e) => handleChange('course', e.target.value)}
                          required
                          className={errors.course ? 'error' : ''}
                          aria-describedby={errors.course ? `course-error-${student._id}` : ''}
                        >
                          <option value="">Select Course</option>
                          {courses.map(course => (
                            <option key={course} value={course}>{course}</option>
                          ))}
                        </select>
                        {errors.course && (
                          <span id={`course-error-${student._id}`} className="ms-error-message" role="alert">
                            <FaInfoCircle aria-hidden="true" />
                            {errors.course}
                          </span>
                        )}
                      </div>

                      {/* Year Field */}
                      <div className="ms-form-group">
                        <label htmlFor={`year-${student._id}`}>
                          <FaCalendarAlt aria-hidden="true" />
                          Academic Year *
                        </label>
                        <select
                          id={`year-${student._id}`}
                          value={editForm.year}
                          onChange={(e) => handleChange('year', e.target.value)}
                          required
                          className={errors.year ? 'error' : ''}
                          aria-describedby={errors.year ? `year-error-${student._id}` : ''}
                        >
                          <option value="">Select Year</option>
                          {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        {errors.year && (
                          <span id={`year-error-${student._id}`} className="ms-error-message" role="alert">
                            <FaInfoCircle aria-hidden="true" />
                            {errors.year}
                          </span>
                        )}
                      </div>

                      {/* Batch Field */}
                      <div className="ms-form-group">
                        <label htmlFor={`batch-${student._id}`}>
                          <FaGraduationCap aria-hidden="true" />
                          Batch
                        </label>
                        <select
                          id={`batch-${student._id}`}
                          value={editForm.batch}
                          onChange={(e) => handleChange('batch', e.target.value)}
                        >
                          <option value="">Select Batch</option>
                          {batches.map(batch => (
                            <option key={batch} value={batch}>{batch}</option>
                          ))}
                        </select>
                      </div>

                      {/* Mobile Field */}
                      <div className="ms-form-group">
                        <label htmlFor={`mobile-${student._id}`}>
                          <FaPhone aria-hidden="true" />
                          Mobile Number
                        </label>
                        <input
                          id={`mobile-${student._id}`}
                          type="tel"
                          value={editForm.mobile}
                          onChange={(e) => handleChange('mobile', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className={errors.mobile ? 'error' : ''}
                          aria-describedby={errors.mobile ? `mobile-error-${student._id}` : ''}
                        />
                        {errors.mobile && (
                          <span id={`mobile-error-${student._id}`} className="ms-error-message" role="alert">
                            <FaInfoCircle aria-hidden="true" />
                            {errors.mobile}
                          </span>
                        )}
                      </div>

                      {/* Address Field */}
                      <div className="ms-form-group ms-full-width">
                        <label htmlFor={`address-${student._id}`}>
                          <FaMapMarkerAlt aria-hidden="true" />
                          Address
                        </label>
                        <textarea
                          id={`address-${student._id}`}
                          value={editForm.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          rows={3}
                          maxLength={200}
                          placeholder="Enter complete address"
                        />
                        <small className="ms-help-text">
                          {editForm.address.length}/200 characters
                        </small>
                      </div>

                      {/* Form Actions */}
                      <div className="ms-form-actions">
                        <button
                          onClick={updateStudent}
                          className="ms-btn ms-btn-save"
                          type="button"
                          aria-label="Save student changes"
                        >
                          <FaSave aria-hidden="true" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="ms-btn ms-btn-cancel"
                          type="button"
                          aria-label="Cancel editing"
                        >
                          <FaTimes aria-hidden="true" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Student Details */}
                      <div className="ms-student-details">
                        <div className="ms-detail-item">
                          <span className="ms-detail-label">Course</span>
                          <span className="ms-detail-value">
                            {student.course || 'Not specified'}
                          </span>
                        </div>
                        
                        <div className="ms-detail-item">
                          <span className="ms-detail-label">Year</span>
                          <span className="ms-detail-value">
                            {student.year || 'Not specified'}
                          </span>
                        </div>
                        
                        <div className="ms-detail-item">
                          <span className="ms-detail-label">Batch</span>
                          <span className="ms-detail-value">
                            {student.batch || 'Not specified'}
                          </span>
                        </div>
                        
                        <div className="ms-detail-item">
                          <span className="ms-detail-label">Mobile</span>
                          <span className="ms-detail-value">
                            {student.mobile || 'Not provided'}
                          </span>
                        </div>
                        
                        <div className="ms-detail-item">
                          <span className="ms-detail-label">Address</span>
                          <span className="ms-detail-value">
                            {student.address || 'Not provided'}
                          </span>
                        </div>
                      </div>

                      {/* Student Actions */}
                      <div className="ms-student-actions">
                        <button
                          onClick={() => startEditing(student)}
                          className="ms-btn ms-btn-edit"
                          type="button"
                          aria-label={`Edit ${student.name} profile`}
                        >
                          <FaEdit aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteStudent(student._id, student.name)}
                          className="ms-btn ms-btn-delete"
                          type="button"
                          aria-label={`Delete ${student.name} from system`}
                        >
                          <FaTrash aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>
        ) : (
          <div className="ms-empty-state">
            <FaUserGraduate className="ms-empty-icon" aria-hidden="true" />
            <h3 className="ms-empty-title">No Students Found</h3>
            <p className="ms-empty-text">
              No students are registered in the system yet.
              Students can register through the student registration portal.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ManageStudents;