import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaEdit, FaSave, FaTimes, FaCamera, FaTrash, FaUser, 
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, 
  FaSpinner, FaUserShield
} from 'react-icons/fa';
import AdminSideBar from '../../components/AdminSideBar';
import '../../components/css/AdminProfile.css';

/**
 * AdminProfile Component
 * Allows administrators to view and edit their profile information
 * Includes image upload functionality and form validation
 */
export default function AdminProfile() {
  const [admin, setAdmin] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    department: '',
    profileImage: '',
    profileImageUrl: ''
  });

  const [originalAdmin, setOriginalAdmin] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('token');

  // Department options
  const departments = [
    'Administration',
    'Academic Affairs', 
    'Student Affairs',
    'Finance',
    'Human Resources',
    'IT Department',
    'Facilities Management',
    'Library',
    'Examination'
  ];

  // Extract admin ID from token
  const getAdminIdFromToken = () => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]))._id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Load profile on mount
  useEffect(() => {
    const adminId = getAdminIdFromToken();
    if (!adminId || !token) {
      toast.error('Please log in first');
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [token]);

  /**
   * Fetch admin profile data
   */
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const adminId = getAdminIdFromToken();
      
      const { data } = await axios.get(
        `http://localhost:5000/auth/Admin/AdminProfile/${adminId}`,
        { headers: { Authorization: token } }
      );

      const profileData = {
        name: data.name || '',
        email: data.email || '',
        mobile: data.mobile || '',
        address: data.address || '',
        department: data.department || '',
        profileImage: data.profileImage || '',
        profileImageUrl: data.profileImageUrl || 
          (data.profileImage ? `http://localhost:5000/images/image/${data.profileImage}` : '')
      };

      setAdmin(profileData);
      setOriginalAdmin(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate form fields
   * @returns {boolean} - True if form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!admin.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (admin.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!admin.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Mobile validation (optional)
    if (admin.mobile.trim()) {
      const digitsOnly = admin.mobile.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        newErrors.mobile = 'Mobile number must be at least 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form input changes
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdmin(prev => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  /**
   * Upload selected image
   */
  const handleImageUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    const adminId = getAdminIdFromToken();
    if (!adminId) return;

    setImageUploading(true);

    const formData = new FormData();
    formData.append('profileImage', selectedFile);

    try {
      const { data } = await axios.post(
        `http://localhost:5000/images/upload-admin-image/${adminId}`,
        formData,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setAdmin(prev => ({
        ...prev,
        profileImage: data.profileImage,
        profileImageUrl: `http://localhost:5000/images/image/${data.profileImage}`
      }));

      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success('Profile image updated successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  /**
   * Delete profile image
   */
  const handleImageDelete = async () => {
    if (!admin.profileImage) {
      toast.error('No profile image to delete');
      return;
    }

    if (!window.confirm('Are you sure you want to delete your profile image?')) {
      return;
    }

    const adminId = getAdminIdFromToken();
    if (!adminId) return;

    setImageUploading(true);

    try {
      await axios.delete(
        `http://localhost:5000/images/delete-admin-image/${adminId}`,
        { headers: { Authorization: token } }
      );

      setAdmin(prev => ({
        ...prev,
        profileImage: '',
        profileImageUrl: ''
      }));

      toast.success('Profile image deleted successfully!');
    } catch (error) {
      console.error('Image delete error:', error);
      toast.error('Failed to delete image');
    } finally {
      setImageUploading(false);
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

    const adminId = getAdminIdFromToken();
    if (!adminId) return;

    try {
      const updateData = {
        name: admin.name.trim(),
        email: admin.email.trim(),
        mobile: admin.mobile.trim(),
        address: admin.address.trim(),
        department: admin.department
      };

      const { data } = await axios.put(
        `http://localhost:5000/auth/Admin/AdminProfile/${adminId}`,
        updateData,
        { headers: { Authorization: token } }
      );

      setAdmin(prev => ({ ...prev, ...data }));
      setOriginalAdmin({ ...admin, ...data });
      setIsEditing(false);
      setErrors({});
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to update profile');
    }
  };

  /**
   * Cancel editing and reset form
   */
  const handleCancel = () => {
    if (originalAdmin) {
      setAdmin({ ...originalAdmin });
    }
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrors({});
  };

  // Loading state
  if (loading) {
    return (
      <div className="ap-layout">
        <AdminSideBar />
        <main className="ap-content" role="main" aria-busy="true">
          <div className="ap-loading" role="status" aria-live="assertive">
            <div className="ap-spinner" aria-hidden="true"></div>
            <p>Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ap-layout">
      <AdminSideBar />
      <main className="ap-content" role="main" aria-labelledby="profile-title">
        <div className="ap-container">
          {/* Header */}
          <header className="ap-header">
            <div className="ap-header-content">
              <h1 id="profile-title">
                <FaUserShield aria-hidden="true" />
                Administrator Profile
              </h1>
              <p>Manage your personal information and account settings</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="ap-edit-btn"
                type="button"
                aria-label="Edit profile"
              >
                <FaEdit aria-hidden="true" />
                Edit Profile
              </button>
            )}
          </header>

          {/* Profile Card */}
          <div className="ap-card">
            {/* Image Section */}
            <section className="ap-image-section" aria-labelledby="image-section-title">
              <h2 id="image-section-title">
                <FaCamera aria-hidden="true" />
                Profile Picture
              </h2>
              
              <div className="ap-image-container">
                <div className="ap-current-image">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="ap-image-preview"
                    />
                  ) : admin.profileImageUrl ? (
                    <img
                      src={admin.profileImageUrl}
                      alt="Current profile"
                      className="ap-image-preview"
                      onError={(e) => {
                        console.warn('Failed to load profile image');
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <FaUser className="ap-no-image" aria-hidden="true" />
                  )}
                </div>

                {isEditing && (
                  <div className="ap-image-controls">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="ap-btn ap-btn-secondary">
                      <FaCamera aria-hidden="true" />
                      Choose Image
                    </label>
                    
                    {selectedFile && (
                      <div className="ap-selected-file">
                        Selected: {selectedFile.name}
                      </div>
                    )}

                    {selectedFile && (
                      <button
                        onClick={handleImageUpload}
                        disabled={imageUploading}
                        className="ap-btn ap-btn-primary"
                        type="button"
                      >
                        {imageUploading ? (
                          <>
                            <FaSpinner className="ap-btn-spinner" aria-hidden="true" />
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

                    {admin.profileImage && !selectedFile && (
                      <button
                        onClick={handleImageDelete}
                        disabled={imageUploading}
                        className="ap-btn ap-btn-danger"
                        type="button"
                      >
                        {imageUploading ? (
                          <>
                            <FaSpinner className="ap-btn-spinner" aria-hidden="true" />
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
            <form className="ap-form" onSubmit={handleSave}>
              <fieldset className="ap-fieldset">
                <legend className="ap-legend">
                  <FaUser aria-hidden="true" />
                  Personal Information
                </legend>

                <div className="ap-form-grid">
                  {/* Name */}
                  <label className="ap-form-label">
                    <span>
                      <FaUser aria-hidden="true" />
                      Full Name *
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={admin.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                      maxLength={50}
                      className={errors.name ? 'error' : ''}
                      aria-describedby={errors.name ? "name-error" : "name-help"}
                    />
                    {errors.name && (
                      <span id="name-error" className="ap-error-message" role="alert">
                        {errors.name}
                      </span>
                    )}
                    <small id="name-help" className="ap-help-text">
                      Your full name as it appears on official documents
                    </small>
                  </label>

                  {/* Email */}
                  <label className="ap-form-label">
                    <span>
                      <FaEnvelope aria-hidden="true" />
                      Email Address *
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={admin.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                      className={errors.email ? 'error' : ''}
                      aria-describedby={errors.email ? "email-error" : "email-help"}
                    />
                    {errors.email && (
                      <span id="email-error" className="ap-error-message" role="alert">
                        {errors.email}
                      </span>
                    )}
                    <small id="email-help" className="ap-help-text">
                      Used for system notifications and login
                    </small>
                  </label>

                  {/* Mobile */}
                  <label className="ap-form-label">
                    <span>
                      <FaPhone aria-hidden="true" />
                      Mobile Number
                    </span>
                    <input
                      type="tel"
                      name="mobile"
                      value={admin.mobile}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="+91 999 123 4567"
                      className={errors.mobile ? 'error' : ''}
                      aria-describedby={errors.mobile ? "mobile-error" : "mobile-help"}
                    />
                    {errors.mobile && (
                      <span id="mobile-error" className="ap-error-message" role="alert">
                        {errors.mobile}
                      </span>
                    )}
                    <small id="mobile-help" className="ap-help-text">
                      Optional: For urgent administrative contact
                    </small>
                  </label>

                  {/* Department */}
                  <label className="ap-form-label">
                    <span>
                      <FaBuilding aria-hidden="true" />
                      Department
                    </span>
                    <select
                      name="department"
                      value={admin.department}
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
                    <small id="department-help" className="ap-help-text">
                      Your primary administrative department
                    </small>
                  </label>

                  {/* Address */}
                  <label className="ap-form-label ap-full-width">
                    <span>
                      <FaMapMarkerAlt aria-hidden="true" />
                      Address
                    </span>
                    <textarea
                      name="address"
                      value={admin.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={3}
                      maxLength={200}
                      placeholder="Enter your complete address"
                      aria-describedby="address-help"
                    />
                    <small id="address-help" className="ap-help-text">
                      {admin.address.length}/200 characters - Optional contact address
                    </small>
                  </label>
                </div>

                {/* Form Actions */}
                {isEditing && (
                  <div className="ap-form-actions">
                    <button
                      type="submit"
                      className="ap-btn ap-save-btn"
                      aria-label="Save profile changes"
                    >
                      <FaSave aria-hidden="true" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="ap-btn ap-cancel-btn"
                      aria-label="Cancel editing"
                    >
                      <FaTimes aria-hidden="true" />
                      Cancel
                    </button>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}