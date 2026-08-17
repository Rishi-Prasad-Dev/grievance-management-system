import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaEdit, FaSave, FaTimes, FaCamera, FaTrash, FaUser, 
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, 
  FaSpinner, FaUserTie, FaInfoCircle, FaList
} from 'react-icons/fa';
import FacultySideBar from '../../components/FacultySideBar';
import '../../components/css/FacultyProfile.css';

/**
 * FacultyProfile Component
 * Allows faculty members to view and edit their profile information
 * Includes image upload functionality and category management
 */
export default function FacultyProfile() {
  const [faculty, setFaculty] = useState({
    name: '',
    email: '',
    department: '',
    responsibleFor: [],
    mobile: '',
    address: '',
    profileImage: '',
    profileImageUrl: ''
  });

  const [originalFaculty, setOriginalFaculty] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('token');

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

  // Extract faculty ID from token
  const getFacultyIdFromToken = () => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]))._id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const facultyId = getFacultyIdFromToken();

  // Load profile on mount
  useEffect(() => {
    if (!facultyId || !token) {
      toast.error('Please log in first');
      setLoading(false);
      return;
    }
    fetchFacultyProfile();
  }, [token, facultyId]);

  /**
   * Validate form fields
   * @returns {boolean} - True if form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!faculty.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (faculty.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!faculty.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(faculty.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Mobile validation (optional)
    if (faculty.mobile.trim()) {
      const digitsOnly = faculty.mobile.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        newErrors.mobile = 'Mobile number must be at least 10 digits';
      }
    }

    // Categories validation
    if (faculty.responsibleFor.length === 0) {
      newErrors.categories = 'Please select at least one category you are responsible for';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Fetch faculty profile data
   */
  const fetchFacultyProfile = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `http://localhost:5000/auth/Faculty/FacultyProfile/${facultyId}`,
        { headers: { Authorization: token } }
      );

      const profileData = {
        name: data.name || '',
        email: data.email || '',
        department: data.department || '',
        responsibleFor: Array.isArray(data.responsibleFor) ? data.responsibleFor : [],
        mobile: data.mobile || '',
        address: data.address || '',
        profileImage: data.profileImage || '',
        profileImageUrl: data.profileImageUrl || 
          (data.profileImage ? `http://localhost:5000/images/image/${data.profileImage}` : '')
      };

      setFaculty(profileData);
      setOriginalFaculty(profileData);
    } catch (error) {
      console.error('Fetch profile error:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle image file selection
   * @param {Event} e - File input change event
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
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  /**
   * Upload selected image
   */
  const handleImageUpload = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setImageLoading(true);
    const formData = new FormData();
    formData.append('profileImage', selectedImage);

    try {
      const { data } = await axios.post(
        `http://localhost:5000/images/upload-faculty-image/${facultyId}`,
        formData,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setFaculty(prev => ({
        ...prev,
        profileImage: data.profileImage,
        profileImageUrl: `http://localhost:5000/images/image/${data.profileImage}`
      }));

      setSelectedImage(null);
      setPreviewUrl(null);
      toast.success('Profile image updated successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setImageLoading(false);
    }
  };

  /**
   * Delete profile image
   */
  const handleImageDelete = async () => {
    if (!faculty.profileImage) {
      toast.error('No profile image to delete');
      return;
    }

    if (!window.confirm('Are you sure you want to delete your profile image?')) {
      return;
    }

    setImageLoading(true);

    try {
      await axios.delete(
        `http://localhost:5000/images/delete-faculty-image/${facultyId}`,
        { headers: { Authorization: token } }
      );

      setFaculty(prev => ({
        ...prev,
        profileImage: '',
        profileImageUrl: ''
      }));

      toast.success('Profile image deleted successfully!');
    } catch (error) {
      console.error('Image delete error:', error);
      toast.error('Failed to delete image');
    } finally {
      setImageLoading(false);
    }
  };

  /**
   * Toggle category selection
   * @param {string} category - Category to toggle
   */
  const toggleCategory = (category) => {
    if (!isEditing) return;

    setFaculty(prev => {
      const responsibleFor = prev.responsibleFor.includes(category)
        ? prev.responsibleFor.filter(cat => cat !== category)
        : [...prev.responsibleFor, category];
      
      return { ...prev, responsibleFor };
    });

    // Clear category error when user selects categories
    if (errors.categories) {
      setErrors(prev => ({ ...prev, categories: '' }));
    }
  };

  /**
   * Handle form input changes
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFaculty(prev => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Save profile changes
   * @param {Event} e - Form submit event
   */
  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      const updateData = {
        name: faculty.name.trim(),
        email: faculty.email.trim(),
        department: faculty.department,
        responsibleFor: faculty.responsibleFor,
        mobile: faculty.mobile.trim(),
        address: faculty.address.trim()
      };

      const { data } = await axios.put(
        `http://localhost:5000/auth/Faculty/FacultyProfile/${facultyId}`,
        updateData,
        { headers: { Authorization: token } }
      );

      setFaculty(prev => ({ ...prev, ...data }));
      setOriginalFaculty({ ...faculty, ...data });
      setIsEditing(false);
      setErrors({});
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  /**
   * Cancel editing and reset form
   */
  const handleCancel = () => {
    if (originalFaculty) {
      setFaculty({ ...originalFaculty });
    }
    setIsEditing(false);
    setSelectedImage(null);
    setPreviewUrl(null);
    setErrors({});
  };

  // Loading state
  if (loading) {
    return (
      <div className="fp-layout">
        <FacultySideBar />
        <main className="fp-content" role="main" aria-busy="true">
          <div className="fp-loading" role="status" aria-live="assertive">
            <div className="fp-spinner" aria-hidden="true"></div>
            <p>Loading Profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fp-layout">
      <FacultySideBar />
      <main className="fp-content" role="main" aria-labelledby="profile-title">
        <div className="fp-container">
          {/* Header */}
          <header className="fp-header">
            <div className="fp-header-content">
              <h1 id="profile-title">
                <FaUserTie aria-hidden="true" />
                Faculty Profile
              </h1>
              <p>Manage your personal information and responsible categories</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="fp-edit-btn"
                type="button"
                aria-label="Edit profile"
              >
                <FaEdit aria-hidden="true" />
                Edit Profile
              </button>
            )}
          </header>

          {/* Profile Card */}
          <div className="fp-card">
            {/* Image Section */}
            <section className="fp-image-section" aria-labelledby="image-section-title">
              <h2 id="image-section-title">
                <FaCamera aria-hidden="true" />
                Profile Picture
              </h2>
              
              <div className="fp-image-container">
                <div className="fp-current-image">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="fp-image-preview"
                    />
                  ) : faculty.profileImageUrl ? (
                    <img
                      src={faculty.profileImageUrl}
                      alt="Current profile"
                      className="fp-image-preview"
                      onError={(e) => {
                        console.warn('Failed to load profile image');
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <FaUserTie className="fp-no-image" aria-hidden="true" />
                  )}
                </div>

                {isEditing && (
                  <div className="fp-image-controls">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="fp-btn fp-btn-secondary">
                      <FaCamera aria-hidden="true" />
                      Choose Image
                    </label>
                    
                    {selectedImage && (
                      <div className="fp-selected-file">
                        Selected: {selectedImage.name}
                      </div>
                    )}

                    {selectedImage && (
                      <button
                        onClick={handleImageUpload}
                        disabled={imageLoading}
                        className="fp-btn fp-btn-primary"
                        type="button"
                      >
                        {imageLoading ? (
                          <>
                            <FaSpinner className="fp-btn-spinner" aria-hidden="true" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FaCamera aria-hidden="true" />
                            Upload Image
                          </>
                        )}
                      </button>
                    )}

                    {faculty.profileImage && !selectedImage && (
                      <button
                        onClick={handleImageDelete}
                        disabled={imageLoading}
                        className="fp-btn fp-btn-danger"
                        type="button"
                      >
                        {imageLoading ? (
                          <>
                            <FaSpinner className="fp-btn-spinner" aria-hidden="true" />
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
            <form className="fp-form" onSubmit={handleSave}>
              <fieldset className="fp-fieldset">
                <legend className="fp-legend">
                  <FaUser aria-hidden="true" />
                  Personal Information
                </legend>

                <div className="fp-form-grid">
                  {/* Name */}
                  <label className="fp-form-label">
                    <span>
                      <FaUser aria-hidden="true" />
                      Full Name *
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={faculty.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                      maxLength={50}
                      className={errors.name ? 'error' : ''}
                      aria-describedby={errors.name ? "name-error" : "name-help"}
                    />
                    {errors.name && (
                      <span id="name-error" className="fp-error-message" role="alert">
                        <FaInfoCircle aria-hidden="true" />
                        {errors.name}
                      </span>
                    )}
                    <small id="name-help" className="fp-help-text">
                      Your full name as it appears on official documents
                    </small>
                  </label>

                  {/* Email */}
                  <label className="fp-form-label">
                    <span>
                      <FaEnvelope aria-hidden="true" />
                      Email Address *
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={faculty.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                      className={errors.email ? 'error' : ''}
                      aria-describedby={errors.email ? "email-error" : "email-help"}
                    />
                    {errors.email && (
                      <span id="email-error" className="fp-error-message" role="alert">
                        <FaInfoCircle aria-hidden="true" />
                        {errors.email}
                      </span>
                    )}
                    <small id="email-help" className="fp-help-text">
                      Used for system notifications and login
                    </small>
                  </label>

                  {/* Department */}
                  <label className="fp-form-label">
                    <span>
                      <FaBuilding aria-hidden="true" />
                      Department
                    </span>
                    <select
                      name="department"
                      value={faculty.department}
                      onChange={handleChange}
                      disabled={!isEditing}
                      aria-describedby="department-help"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <small id="department-help" className="fp-help-text">
                      Your primary academic department
                    </small>
                  </label>

                  {/* Mobile */}
                  <label className="fp-form-label">
                    <span>
                      <FaPhone aria-hidden="true" />
                      Mobile Number
                    </span>
                    <input
                      type="tel"
                      name="mobile"
                      value={faculty.mobile}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="+91 999 123 4567"
                      className={errors.mobile ? 'error' : ''}
                      aria-describedby={errors.mobile ? "mobile-error" : "mobile-help"}
                    />
                    {errors.mobile && (
                      <span id="mobile-error" className="fp-error-message" role="alert">
                        <FaInfoCircle aria-hidden="true" />
                        {errors.mobile}
                      </span>
                    )}
                    <small id="mobile-help" className="fp-help-text">
                      Optional: For urgent contact purposes
                    </small>
                  </label>

                  {/* Address */}
                  <label className="fp-form-label fp-full-width">
                    <span>
                      <FaMapMarkerAlt aria-hidden="true" />
                      Address
                    </span>
                    <textarea
                      name="address"
                      value={faculty.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={3}
                      maxLength={200}
                      placeholder="Enter your complete address"
                      aria-describedby="address-help"
                    />
                    <small id="address-help" className="fp-help-text">
                      {faculty.address.length}/200 characters - Optional contact address
                    </small>
                  </label>
                </div>
              </fieldset>

              {/* Categories Section */}
              <section className="fp-categories-section" aria-labelledby="categories-title">
                <h3 id="categories-title">
                  <FaList aria-hidden="true" />
                  Responsible Categories *
                </h3>
                <p>Select the complaint categories you are responsible for handling</p>
                
                {errors.categories && (
                  <div className="fp-error-message" role="alert">
                    <FaInfoCircle aria-hidden="true" />
                    {errors.categories}
                  </div>
                )}

                <div className="fp-categories-grid">
                  {categories.map(category => (
                    <div
                      key={category}
                      className={`fp-category-item ${
                        faculty.responsibleFor.includes(category) ? 'fp-selected' : ''
                      } ${!isEditing ? 'fp-disabled' : ''}`}
                      onClick={() => toggleCategory(category)}
                      role="button"
                      tabIndex={isEditing ? 0 : -1}
                      aria-pressed={faculty.responsibleFor.includes(category)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleCategory(category);
                        }
                      }}
                    >
                      <span>{category}</span>
                      {faculty.responsibleFor.includes(category) && (
                        <span className="fp-checkmark">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Form Actions */}
              {isEditing && (
                <div className="fp-form-actions">
                  <button
                    type="submit"
                    className="fp-btn fp-save-btn"
                    aria-label="Save profile changes"
                  >
                    <FaSave aria-hidden="true" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="fp-btn fp-cancel-btn"
                    aria-label="Cancel editing"
                  >
                    <FaTimes aria-hidden="true" />
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}