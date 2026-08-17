import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaEdit, FaSave, FaTimes, FaTrash, FaUserTie, FaChalkboardTeacher,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaList, 
  FaSpinner, FaUserCircle, FaInfoCircle,
  FaUser
} from 'react-icons/fa';
import AdminSideBar from '../../components/AdminSideBar';
import '../../components/css/ManageFaculty.css';

/**
 * ManageFaculty Component
 * Allows administrators to view, edit, and delete faculty members
 * Features comprehensive form validation and responsive design
 */
function ManageFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    department: '',
    responsibleFor: [],
    mobile: '',
    address: ''
  });

  const token = localStorage.getItem('token');

  // Available departments
  const departments = [
    'Computer Science',
    'Mechanical',
    'Electrical', 
    'Civil',
    'Electronics',
    'Chemical',
    'Information Technology',
    'MBA',
    'MCA',
    'BCA',
    'Diploma'
  ];

  // Available complaint categories
  const categories = [
    'Electrical',
    'Canteen',
    'Teacher',
    'Internet / WiFi',
    'Hostel / Accommodation',
    'Library',
    'Transportation',
    'Facility Maintenance',
    'Administration',
    'Security',
    'Exam / Results',
    'Other'
  ];

  // Load faculty data on mount
  useEffect(() => {
    if (!token) {
      toast.error('Please log in first');
      return;
    }
    fetchFaculty();
  }, [token]);

  /**
   * Fetch all faculty members
   */
  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/admin-manage/faculty', {
        headers: { Authorization: token }
      });
      setFaculty(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Fetch faculty error:', error);
      toast.error('Failed to fetch faculty members');
      setFaculty([]);
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

    // Department validation
    if (!editForm.department) {
      newErrors.department = 'Department is required';
    }

    // Mobile validation (optional)
    if (editForm.mobile.trim()) {
      const digitsOnly = editForm.mobile.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        newErrors.mobile = 'Mobile number must be at least 10 digits';
      }
    }

    // Responsible categories validation
    if (editForm.responsibleFor.length === 0) {
      newErrors.responsibleFor = 'Please select at least one category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Start editing a faculty member
   * @param {Object} member - Faculty member object
   */
  const startEditing = (member) => {
    setEditingId(member._id);
    setEditForm({
      name: member.name || '',
      email: member.email || '',
      department: member.department || '',
      responsibleFor: Array.isArray(member.responsibleFor) ? [...member.responsibleFor] : [],
      mobile: member.mobile || '',
      address: member.address || ''
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
      department: '',
      responsibleFor: [],
      mobile: '',
      address: ''
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
   * Handle responsible categories change
   * @param {string} categoryString - Comma-separated categories
   */
  const handleResponsibleChange = (categoryString) => {
    const categories = categoryString
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    setEditForm(prev => ({ ...prev, responsibleFor: categories }));
    
    if (errors.responsibleFor) {
      setErrors(prev => ({ ...prev, responsibleFor: '' }));
    }
  };

  /**
   * Update faculty member
   */
  const updateFaculty = async () => {
    if (!validateEditForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/admin-manage/faculty/${editingId}`,
        editForm,
        { headers: { Authorization: token } }
      );
      
      toast.success('Faculty member updated successfully');
      setEditingId(null);
      setErrors({});
      fetchFaculty();
    } catch (error) {
      console.error('Update faculty error:', error);
      toast.error(error.response?.data?.message || 'Failed to update faculty member');
    }
  };

  /**
   * Delete faculty member
   * @param {string} id - Faculty member ID
   * @param {string} name - Faculty member name
   */
  const deleteFaculty = async (id, name) => {
    if (!window.confirm(
      `Are you sure you want to delete ${name}?\n\nThis will also remove them from any assigned complaints. This action cannot be undone.`
    )) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/admin-manage/faculty/${id}`, {
        headers: { Authorization: token }
      });
      
      toast.success('Faculty member deleted successfully');
      fetchFaculty();
    } catch (error) {
      console.error('Delete faculty error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete faculty member');
    }
  };

  /**
   * Get faculty member's initials for avatar
   * @param {string} name - Faculty name
   * @returns {string} - Initials
   */
  const getInitials = (name) => {
    if (!name) return 'FA';
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="mf-layout">
        <AdminSideBar />
        <main className="mf-content" role="main" aria-busy="true">
          <div className="mf-loading" role="status" aria-live="assertive">
            <div className="mf-spinner" aria-hidden="true"></div>
            <p>Loading faculty data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mf-layout">
      <AdminSideBar />
      <main className="mf-content" role="main" aria-labelledby="faculty-title">
        {/* Header */}
        <header className="mf-header">
          <div className="mf-header-content">
            <h1 id="faculty-title">
              <FaChalkboardTeacher aria-hidden="true" />
              Manage Faculty
            </h1>
            <p>View, edit, and manage faculty members and their responsibilities</p>
          </div>
        </header>

        {/* Statistics */}
        <section className="mf-stats-section" aria-labelledby="stats-title">
          <div className="mf-stat-card">
            <h3 className="mf-stat-number">{faculty.length}</h3>
            <p className="mf-stat-label">Total Faculty</p>
          </div>
        </section>

        {/* Faculty Grid */}
        {faculty.length > 0 ? (
          <section className="mf-faculty-section" aria-labelledby="faculty-list-title">
            <h2 id="faculty-list-title" className="sr-only">Faculty Members List</h2>
            
            <div className="mf-faculty-grid">
              {faculty.map((member) => (
                <article key={member._id} className="mf-faculty-card">
                  {/* Card Header */}
                  <header className="mf-faculty-header">
                    <div className="mf-faculty-avatar">
                      {member.profileImageUrl ? (
                        <img
                          src={member.profileImageUrl}
                          alt={`${member.name} profile`}
                          className="mf-faculty-profile-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = getInitials(member.name);
                          }}
                        />
                      ) : (
                        getInitials(member.name)
                      )}
                    </div>
                    
                    <div className="mf-faculty-info">
                      <h3 className="mf-faculty-name">{member.name || 'Unknown'}</h3>
                      <p className="mf-faculty-email">{member.email || 'No email provided'}</p>
                      <p className="mf-faculty-dept">{member.department || 'No department'}</p>
                    </div>
                  </header>

                  {/* Card Body */}
                  {editingId === member._id ? (
                    <div className="mf-edit-form">
                      {/* Name Field */}
                      <div className="mf-form-group">
                        <label htmlFor={`name-${member._id}`}>
                          <FaUser aria-hidden="true" />
                          Full Name *
                        </label>
                        <input
                          id={`name-${member._id}`}
                          type="text"
                          value={editForm.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          required
                          maxLength={50}
                          className={errors.name ? 'error' : ''}
                          aria-describedby={errors.name ? `name-error-${member._id}` : ''}
                        />
                        {errors.name && (
                          <span id={`name-error-${member._id}`} className="mf-error-message" role="alert">
                            {errors.name}
                          </span>
                        )}
                      </div>

                      {/* Email Field */}
                      <div className="mf-form-group">
                        <label htmlFor={`email-${member._id}`}>
                          <FaEnvelope aria-hidden="true" />
                          Email Address *
                        </label>
                        <input
                          id={`email-${member._id}`}
                          type="email"
                          value={editForm.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          required
                          className={errors.email ? 'error' : ''}
                          aria-describedby={errors.email ? `email-error-${member._id}` : ''}
                        />
                        {errors.email && (
                          <span id={`email-error-${member._id}`} className="mf-error-message" role="alert">
                            {errors.email}
                          </span>
                        )}
                      </div>

                      {/* Department Field */}
                      <div className="mf-form-group">
                        <label htmlFor={`department-${member._id}`}>
                          <FaBuilding aria-hidden="true" />
                          Department *
                        </label>
                        <select
                          id={`department-${member._id}`}
                          value={editForm.department}
                          onChange={(e) => handleChange('department', e.target.value)}
                          required
                          className={errors.department ? 'error' : ''}
                          aria-describedby={errors.department ? `dept-error-${member._id}` : ''}
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                        {errors.department && (
                          <span id={`dept-error-${member._id}`} className="mf-error-message" role="alert">
                            {errors.department}
                          </span>
                        )}
                      </div>

                      {/* Mobile Field */}
                      <div className="mf-form-group">
                        <label htmlFor={`mobile-${member._id}`}>
                          <FaPhone aria-hidden="true" />
                          Mobile Number
                        </label>
                        <input
                          id={`mobile-${member._id}`}
                          type="tel"
                          value={editForm.mobile}
                          onChange={(e) => handleChange('mobile', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className={errors.mobile ? 'error' : ''}
                          aria-describedby={errors.mobile ? `mobile-error-${member._id}` : ''}
                        />
                        {errors.mobile && (
                          <span id={`mobile-error-${member._id}`} className="mf-error-message" role="alert">
                            {errors.mobile}
                          </span>
                        )}
                      </div>

                      {/* Address Field */}
                      <div className="mf-form-group">
                        <label htmlFor={`address-${member._id}`}>
                          <FaMapMarkerAlt aria-hidden="true" />
                          Address
                        </label>
                        <textarea
                          id={`address-${member._id}`}
                          value={editForm.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          rows={3}
                          maxLength={200}
                          placeholder="Enter complete address"
                        />
                        <small className="mf-help-text">
                          {editForm.address.length}/200 characters
                        </small>
                      </div>

                      {/* Responsible Categories */}
                      <div className="mf-form-group mf-full-width">
                        <label htmlFor={`responsible-${member._id}`}>
                          <FaList aria-hidden="true" />
                          Responsible Categories *
                        </label>
                        <input
                          id={`responsible-${member._id}`}
                          type="text"
                          value={editForm.responsibleFor.join(', ')}
                          onChange={(e) => handleResponsibleChange(e.target.value)}
                          placeholder="e.g., Electrical, Canteen, Library"
                          className={errors.responsibleFor ? 'error' : ''}
                          aria-describedby={errors.responsibleFor ? `resp-error-${member._id}` : `resp-help-${member._id}`}
                        />
                        {errors.responsibleFor && (
                          <span id={`resp-error-${member._id}`} className="mf-error-message" role="alert">
                            {errors.responsibleFor}
                          </span>
                        )}
                        <small id={`resp-help-${member._id}`} className="mf-help-text">
                          Available: {categories.join(', ')}
                        </small>
                      </div>

                      {/* Form Actions */}
                      <div className="mf-form-actions">
                        <button
                          onClick={updateFaculty}
                          className="mf-btn mf-btn-save"
                          type="button"
                          aria-label="Save faculty changes"
                        >
                          <FaSave aria-hidden="true" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="mf-btn mf-btn-cancel"
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
                      {/* Faculty Details */}
                      <div className="mf-faculty-details">
                        <div className="mf-detail-item">
                          <span className="mf-detail-label">Department</span>
                          <span className="mf-detail-value">
                            {member.department || 'Not specified'}
                          </span>
                        </div>
                        
                        <div className="mf-detail-item">
                          <span className="mf-detail-label">Mobile</span>
                          <span className="mf-detail-value">
                            {member.mobile || 'Not provided'}
                          </span>
                        </div>
                        
                        <div className="mf-detail-item">
                          <span className="mf-detail-label">Address</span>
                          <span className="mf-detail-value">
                            {member.address || 'Not provided'}
                          </span>
                        </div>
                        
                        <div className="mf-detail-item">
                          <span className="mf-detail-label">Responsible For</span>
                          <div className="mf-categories">
                            {Array.isArray(member.responsibleFor) && member.responsibleFor.length > 0 ? (
                              member.responsibleFor.map((category, index) => (
                                <span key={index} className="mf-category-tag">
                                  {category}
                                </span>
                              ))
                            ) : (
                              <span className="mf-detail-value">No categories assigned</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Faculty Actions */}
                      <div className="mf-faculty-actions">
                        <button
                          onClick={() => startEditing(member)}
                          className="mf-btn mf-btn-edit"
                          type="button"
                          aria-label={`Edit ${member.name} profile`}
                        >
                          <FaEdit aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteFaculty(member._id, member.name)}
                          className="mf-btn mf-btn-delete"
                          type="button"
                          aria-label={`Delete ${member.name} from system`}
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
          <div className="mf-empty-state">
            <FaUserTie className="mf-empty-icon" aria-hidden="true" />
            <h3 className="mf-empty-title">No Faculty Members</h3>
            <p className="mf-empty-text">
              No faculty members are registered in the system yet.
              Faculty members can register through the faculty registration portal.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ManageFaculty;