import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StudentSideBar from '../../components/StudentSideBar';
import '../../components/css/StudentProfile.css';
// React icons for consistent theming
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGraduationCap, 
  FaCalendarAlt, FaCamera, FaEdit, FaSave, FaTimes, FaUpload,
  FaSpinner, FaInfoCircle, FaTrash
} from 'react-icons/fa';

/**
 * StudentProfile Component
 * Profile management interface for students
 * Features blue color theme and comprehensive profile editing
 */
function StudentProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Course and year options
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

  const years = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Postgraduate'
  ];

  const batches = [
    '2021-2025',
    '2022-2026',
    '2023-2027',
    '2024-2028',
    '2025-2029'
  ];

  // Student profile state
  const [student, setStudent] = useState({
    name: '',
    username: '',
    email: '',
    course: '',
    year: '',
    mobile: '',
    address: '',
    batch: '',
    profileImage: '',
    profileImageUrl: '',
    _id: ''
  });

  // Original profile for reset functionality
  const [originalProfile, setOriginalProfile] = useState(null);

  // UI state
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Load profile on component mount
  useEffect(() => {
    if (!token) {
      toast.error('Please log in to access your profile');
      navigate('/StudentLogin');
      return;
    }
    fetchProfile();
  }, [navigate, token]);

  /**
   * Fetch student profile from API
   */
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setImageError(false); // Reset image error state
      
      const { data } = await axios.get('http://localhost:5000/auth/Student/profile', {
        headers: { Authorization: token }
      });

      const profileData = {
        name: data.name || '',
        username: data.username || '',
        email: data.email || '',
        course: data.course || '',
        year: data.year || '',
        mobile: data.mobile || '',
        address: data.address || '',
        batch: data.batch || '',
        profileImage: data.profileImage || '',
        profileImageUrl: data.profileImageUrl || '',
        _id: data._id || ''
      };

      setStudent(profileData);
      setOriginalProfile(profileData);
    } catch (error) {
      console.error('Profile fetch error:', error);
      
      if (error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/StudentLogin');
      } else {
        toast.error('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudent(prev => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Handle image file selection
   */
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);
    
    toast.success('Image selected. Click "Upload Image" to save.');
  };

  /**
   * Upload selected image
   */
  const uploadImage = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setImageLoading(true);
    const formData = new FormData();
    formData.append('profileImage', selectedFile);

    try {
      const { data } = await axios.post(
        `http://localhost:5000/images/upload-student-image/${student._id}`,
        formData,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setStudent(prev => ({
        ...prev,
        profileImage: data.profileImage,
        profileImageUrl: data.profileImageUrl
      }));

      setSelectedFile(null);
      setPreviewUrl(null);
      setImageError(false); // Reset image error
      toast.success('Profile image updated successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  /**
   * Delete profile image
   */
  const deleteImage = async () => {
    if (!student.profileImage) {
      toast.error('No profile image to delete');
      return;
    }

    if (!window.confirm('Are you sure you want to delete your profile image?')) {
      return;
    }

    setImageLoading(true);

    try {
      await axios.delete(
        `http://localhost:5000/images/delete-student-image/${student._id}`,
        { headers: { Authorization: token } }
      );

      setStudent(prev => ({
        ...prev,
        profileImage: '',
        profileImageUrl: ''
      }));

      setImageError(false); // Reset image error
      toast.success('Profile image deleted successfully!');
    } catch (error) {
      console.error('Image delete error:', error);
      toast.error('Failed to delete image');
    } finally {
      setImageLoading(false);
    }
  };

  /**
   * Validate form fields
   */
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!student.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (student.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!student.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(student.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Mobile validation (optional but must be valid if provided)
    if (student.mobile.trim()) {
      const phoneRegex = /^[+\d\s\-()]{10,15}$/;
      if (!phoneRegex.test(student.mobile.trim())) {
        newErrors.mobile = 'Please enter a valid mobile number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Save profile changes
   */
  const saveProfile = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors before saving');
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        name: student.name.trim(),
        email: student.email.trim(),
        course: student.course,
        year: student.year,
        mobile: student.mobile.trim(),
        address: student.address.trim(),
        batch: student.batch
      };

      const { data } = await axios.put(
        'http://localhost:5000/auth/Student/profile',
        updateData,
        { headers: { Authorization: token } }
      );

      const updatedProfile = { ...student, ...data };
      setStudent(updatedProfile);
      setOriginalProfile(updatedProfile);
      setEditing(false);
      setErrors({});
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cancel editing and reset form
   */
  const cancelEdit = () => {
    if (originalProfile) {
      setStudent({ ...originalProfile });
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditing(false);
    setErrors({});
  };

  /**
   * Get profile image URL
   */
  const getProfileImageUrl = () => {
    if (previewUrl) return previewUrl;
    if (!imageError && student.profileImageUrl) {
      return student.profileImageUrl;
    }
    return null;
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="sp-layout">
        <StudentSideBar />
        <main className="sp-content" role="main" aria-busy="true">
          <div className="sp-loading" role="status" aria-live="assertive">
            <div className="sp-spinner" aria-hidden="true"></div>
            <p>Loading your profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="sp-layout">
      <StudentSideBar />
      <main className="sp-content" role="main" aria-labelledby="profile-title">
        <div className="sp-container">
          {/* Header */}
          <header className="sp-header">
            <div className="sp-header-content">
              <h1 className="sp-title" id="profile-title">
                <FaUser aria-hidden="true" />
                Student Profile
              </h1>
              <p className="sp-subtitle">Manage your personal information and academic details</p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="sp-edit-btn"
                type="button"
                aria-label="Edit profile"
              >
                <FaEdit aria-hidden="true" />
                Edit Profile
              </button>
            )}
          </header>

          {/* Profile Image Section */}
          <section className="sp-image-section" aria-labelledby="image-section-title">
            <h2 className="sp-section-title" id="image-section-title">
              <FaCamera aria-hidden="true" />
              Profile Picture
            </h2>
            
            <div className="sp-image-container">
              <div className="sp-image-display">
                {getProfileImageUrl() ? (
                  <img
                    src={getProfileImageUrl()}
                    alt="Profile"
                    className="sp-profile-image"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <FaUser className="sp-image-placeholder" aria-hidden="true" />
                )}
              </div>

              {editing && (
                <div className="sp-image-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="sp-file-input"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="sp-btn sp-btn-secondary">
                    <FaCamera aria-hidden="true" />
                    Choose Image
                  </label>
                  
                  {selectedFile && (
                    <div className="sp-file-selected">
                      <p className="sp-file-info">Selected: {selectedFile.name}</p>
                      <button
                        onClick={uploadImage}
                        disabled={imageLoading}
                        className="sp-btn sp-btn-primary"
                        type="button"
                      >
                        {imageLoading ? (
                          <>
                            <FaSpinner className="sp-btn-spinner" aria-hidden="true" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FaUpload aria-hidden="true" />
                            Upload Image
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {student.profileImage && !selectedFile && (
                    <button
                      onClick={deleteImage}
                      disabled={imageLoading}
                      className="sp-btn sp-btn-danger"
                      type="button"
                    >
                      {imageLoading ? (
                        <>
                          <FaSpinner className="sp-btn-spinner" aria-hidden="true" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrash aria-hidden="true" />
                          Delete Image
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Form Section */}
          <form className="sp-form" onSubmit={saveProfile}>
            <fieldset className="sp-fieldset">
              <legend className="sp-legend">
                <FaUser aria-hidden="true" />
                Personal Information
              </legend>

              <div className="sp-form-grid">
                {/* Name */}
                <div className="sp-form-group">
                  <label className="sp-label">
                    <FaUser aria-hidden="true" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={student.name}
                    onChange={handleInputChange}
                    disabled={!editing}
                    required
                    maxLength={50}
                    className={`sp-input ${errors.name ? 'sp-error' : ''}`}
                    aria-describedby={errors.name ? "name-error" : "name-help"}
                  />
                  {errors.name && (
                    <span id="name-error" className="sp-error-message" role="alert">
                      <FaInfoCircle aria-hidden="true" />
                      {errors.name}
                    </span>
                  )}
                  <small className="sp-help-text">
                    Your full name as per academic records
                  </small>
                </div>

                {/* Username */}
                <div className="sp-form-group">
                  <label className="sp-label">
                    <FaUser aria-hidden="true" />
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={student.username}
                    disabled={true}
                    className="sp-input sp-readonly"
                    aria-describedby="username-help"
                  />
                  <small className="sp-help-text">
                    Username cannot be changed
                  </small>
                </div>

                {/* Email */}
                <div className="sp-form-group">
                  <label className="sp-label">
                    <FaEnvelope aria-hidden="true" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={student.email}
                    onChange={handleInputChange}
                    disabled={!editing}
                    required
                    className={`sp-input ${errors.email ? 'sp-error' : ''}`}
                    aria-describedby={errors.email ? "email-error" : "email-help"}
                  />
                  {errors.email && (
                    <span id="email-error" className="sp-error-message" role="alert">
                      <FaInfoCircle aria-hidden="true" />
                      {errors.email}
                    </span>
                  )}
                  <small className="sp-help-text">
                    Used for notifications and communication
                  </small>
                </div>

                {/* Course */}
                <div className="sp-form-group">
                  <label className="sp-label">
                    <FaGraduationCap aria-hidden="true" />
                    Course
                  </label>
                  <select
                    name="course"
                    value={student.course}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="sp-input"
                    aria-describedby="course-help"
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                  <small className="sp-help-text">
                    Your current academic program
                  </small>
                </div>

                {/* Year */}
                <div className="sp-form-group">
                  <label className="sp-label">
                    <FaCalendarAlt aria-hidden="true" />
                    Academic Year
                  </label>
                  <select
                    name="year"
                    value={student.year}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="sp-input"
                    aria-describedby="year-help"
                  >
                    <option value="">Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <small className="sp-help-text">
                    Your current academic year
                  </small>
                </div>

                {/* Batch */}
                <div className="sp-form-group">
                  <label className="sp-label">
                    <FaCalendarAlt aria-hidden="true" />
                    Batch
                  </label>
                  <select
                    name="batch"
                    value={student.batch}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="sp-input"
                    aria-describedby="batch-help"
                  >
                    <option value="">Select Batch</option>
                    {batches.map(batch => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
                  <small className="sp-help-text">
                    Your graduation batch year
                  </small>
                </div>

                {/* Mobile */}
                <div className="sp-form-group">
                  <label className="sp-label">
                    <FaPhone aria-hidden="true" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={student.mobile}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="+91 999 123 4567"
                    className={`sp-input ${errors.mobile ? 'sp-error' : ''}`}
                    aria-describedby={errors.mobile ? "mobile-error" : "mobile-help"}
                  />
                  {errors.mobile && (
                    <span id="mobile-error" className="sp-error-message" role="alert">
                      <FaInfoCircle aria-hidden="true" />
                      {errors.mobile}
                    </span>
                  )}
                  <small className="sp-help-text">
                    Optional: For emergency contact
                  </small>
                </div>

                {/* Address */}
                <div className="sp-form-group sp-full-width">
                  <label className="sp-label">
                    <FaMapMarkerAlt aria-hidden="true" />
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={student.address}
                    onChange={handleInputChange}
                    disabled={!editing}
                    rows={3}
                    maxLength={200}
                    placeholder="Enter your complete address"
                    className="sp-input"
                    aria-describedby="address-help"
                  />
                  <small className="sp-help-text">
                    {student.address.length}/200 characters - Optional home address
                  </small>
                </div>
              </div>
            </fieldset>

            {/* Form Actions */}
            {editing && (
              <div className="sp-form-actions">
                <button
                  type="submit"
                  disabled={saving}
                  className="sp-btn-save"
                  aria-label="Save profile changes"
                >
                  {saving ? (
                    <>
                      <FaSpinner className="sp-btn-spinner" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave aria-hidden="true" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="sp-btn-cancel"
                  aria-label="Cancel editing"
                >
                  <FaTimes aria-hidden="true" />
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

export default StudentProfile;
