import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StudentSideBar from '../../components/StudentSideBar';
import '../../components/css/Complain.css';

// React icons for enhanced UI
import { 
  FaExclamationTriangle, FaEnvelope, FaPhone, FaList, FaFileAlt,
  FaUpload, FaTimes, FaPaperPlane, FaUser, FaInfoCircle
} from 'react-icons/fa';

/**
 * Complain Component
 * Allows students to file new complaints with attachments
 * Features comprehensive validation, clean UI, and user-friendly interface
 */
function Complain() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Problem category options for dropdown
  const problemTypes = [
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

  // Student profile state (read-only fields populated from API)
  const [student, setStudent] = useState({
    name: '',
    username: ''
  });

  // Form data state for editable fields (removed Name since it's read-only)
  const [formData, setFormData] = useState({
    ComplaintTitle: '',
    Email: '',
    ContactNumber: '',
    ProblemType: 'Other',
    ProblemDescription: ''
  });

  // File attachment state
  const [attachment, setAttachment] = useState(null);
  
  // Form validation errors state
  const [errors, setErrors] = useState({});
  
  // UI loading and submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load student profile and check authentication on component mount
  useEffect(() => {
    if (!token) {
      toast.error('Please log in to submit a complaint');
      navigate('/StudentLogin');
      return;
    }
    fetchStudentProfile();
  }, [navigate, token]);

  /**
   * Fetch student profile data from API for form auto-population
   * FIX: This function now properly sets the student name for form submission
   */
  const fetchStudentProfile = async () => {
    try {
      setIsLoading(true);
      
      // Call the student profile API
      const { data } = await axios.get('http://localhost:5000/auth/Student/profile', {
        headers: { Authorization: token }
      });
      
      // Set student info (read-only fields that will be displayed)
      setStudent({
        name: data.name ,
        username: data.username || 'unknown'
      });
      
      // Pre-fill editable contact information from profile
      setFormData(prev => ({
        ...prev,
        Email: data.email || '',
        ContactNumber: data.mobile || ''
      }));
      
    } catch (error) {
      console.error('Error fetching student data:', error);
      
      // Handle authentication errors
      if (error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/StudentLogin');
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Comprehensive form validation function
   * Validates all required and optional fields with appropriate error messages
   * @returns {boolean} - True if all validations pass
   */
  const validateForm = () => {
    const newErrors = {};

    // Complaint title validation - required field
    if (!formData.ComplaintTitle.trim()) {
      newErrors.ComplaintTitle = 'Complaint title is required';
    } else if (formData.ComplaintTitle.trim().length < 5) {
      newErrors.ComplaintTitle = 'Title must be at least 5 characters long';
    } else if (formData.ComplaintTitle.trim().length > 100) {
      newErrors.ComplaintTitle = 'Title must be less than 100 characters';
    }

    // Problem description validation - required field
    if (!formData.ProblemDescription.trim()) {
      newErrors.ProblemDescription = 'Problem description is required';
    } else if (formData.ProblemDescription.trim().length < 10) {
      newErrors.ProblemDescription = 'Description must be at least 10 characters long';
    } else if (formData.ProblemDescription.trim().length > 1000) {
      newErrors.ProblemDescription = 'Description must be less than 1000 characters';
    }

    // Email validation - optional but must be valid format if provided
    if (formData.Email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.Email.trim())) {
        newErrors.Email = 'Please enter a valid email address';
      }
    }

    // Contact number validation - optional but must be valid format if provided
    if (formData.ContactNumber.trim()) {
      const phoneRegex = /^[+\d\s\-()]{10,15}$/;
      if (!phoneRegex.test(formData.ContactNumber.trim())) {
        newErrors.ContactNumber = 'Please enter a valid contact number';
      }
    }

    // Problem type validation - required field
    if (!formData.ProblemType || formData.ProblemType === '') {
      newErrors.ProblemType = 'Please select a problem type';
    }

    // Update errors state and return validation result
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form input changes and clear field-specific errors
   * Updates form data and clears validation errors when user types
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update the specific form field
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing (improves UX)
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Handle file selection with validation for type and size
   * Validates file type (images only) and size (max 5MB)
   * @param {Event} e - File input change event
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    // Exit if no file selected
    if (!file) return;

    // Validate file type - only images allowed
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      e.target.value = ''; // Clear the file input
      return;
    }

    // Validate file size - maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      e.target.value = ''; // Clear the file input
      return;
    }

    // File is valid - store it and show success message
    setAttachment(file);
    toast.success('Image attached successfully');
  };

  /**
   * Remove selected attachment and clear file input
   * Resets the file attachment state and clears the file input element
   */
  const removeAttachment = () => {
    setAttachment(null);
    
    // Clear the file input element
    const fileInput = document.getElementById('attachment-input');
    if (fileInput) {
      fileInput.value = '';
    }
    
    toast.info('Attachment removed');
  };

  /**
   * Handle form submission with validation and API call
   * FIX: Now properly includes student name in the submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    // Check if student name is available (should be from profile)
    if (!student.name || student.name.trim() === '') {
      toast.error('Student name not available. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for multipart upload (handles files and form data)
      const formPayload = new FormData();
      
      // FIX: Add student name explicitly from profile data
      formPayload.append('Name', student.name.trim());
      
      // Add all other form data fields
      Object.entries(formData).forEach(([key, value]) => {
        formPayload.append(key, value.toString().trim());
      });

      // Add attachment file if present
      if (attachment) {
        formPayload.append('attachment', attachment);
      }

      // Debug log to verify name is being sent
      console.log('Submitting complaint with name:', student.name);

      // Submit complaint to API
      const response = await axios.post('http://localhost:5000/complain/register', formPayload, {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Success - show message and reset form
      toast.success('Complaint submitted successfully!');
      console.log('Complaint created:', response.data); // Debug log
      
      // Reset form while preserving contact information for user convenience
      setFormData({
        ComplaintTitle: '',
        Email: formData.Email, // Preserve email
        ContactNumber: formData.ContactNumber, // Preserve contact
        ProblemType: 'Other',
        ProblemDescription: ''
      });
      
      // Clear attachment and errors
      setAttachment(null);
      setErrors({});
      
      // Clear file input element
      const fileInput = document.getElementById('attachment-input');
      if (fileInput) {
        fileInput.value = '';
      }

      // Navigate back to dashboard after brief delay
      setTimeout(() => {
        navigate('/StudentDashBoard');
      }, 1500);
      
    } catch (error) {
      console.error('Submit error:', error);
      
      // Show appropriate error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to submit complaint. Please try again.';
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading spinner while fetching profile data
  if (isLoading) {
    return (
      <div className="complain-layout">
        <StudentSideBar />
        <main className="complain-content" role="main" aria-busy="true">
          <div className="complain-loading" role="status" aria-live="assertive">
            <div className="complain-spinner" aria-hidden="true"></div>
            <p>Loading complaint form...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="complain-layout">
      <StudentSideBar />
      
      <main className="complain-content" role="main" aria-labelledby="complain-page-title">
        {/* ====================================================================== */}
        {/* HEADER SECTION - Page title and description */}
        {/* ====================================================================== */}
        <header className="complain-header">
          <h1 id="complain-page-title" className="complain-title">
            <FaExclamationTriangle aria-hidden="true" />
            File a New Complaint
          </h1>
          <p className="complain-subtitle">
            Submit your complaint with detailed information for faster resolution
          </p>
        </header>

        {/* ====================================================================== */}
        {/* MAIN COMPLAINT FORM - All form sections */}
        {/* ====================================================================== */}
        <form className="complain-form" onSubmit={handleSubmit} noValidate>
          
          {/* Student Information Section - Read-only profile data */}
          <div className="form-section">
            <h2 className="section-title">
              <FaUser />
              Student Information
            </h2>
            <p className="section-subtitle">Your profile information (cannot be modified)</p>
            
            <div className="form-row">
              {/* Student Full Name - Read-only field */}
              <div className="form-group">
                <label htmlFor="student-name">Full Name</label>
                <input
                  id="student-name"
                  type="text"
                  value={student.name}
                  disabled
                  className="form-input readonly"
                  title="This information comes from your profile and cannot be changed here"
                />
              </div>

              {/* Student Username - Read-only field */}
              <div className="form-group">
                <label htmlFor="student-username">Username</label>
                <input
                  id="student-username"
                  type="text"
                  value={student.username}
                  disabled
                  className="form-input readonly"
                  title="This information comes from your profile and cannot be changed here"
                />
              </div>
            </div>
          </div>

          {/* Complaint Details Section - Main complaint information */}
          <div className="form-section">
            <h2 className="section-title">
              <FaExclamationTriangle />
              Complaint Details
            </h2>
            <p className="section-subtitle">Provide specific information about your complaint</p>

            {/* Complaint Title - Required field */}
            <div className="form-group full-width">
              <label htmlFor="complaint-title">
                Complaint Title *
              </label>
              <input
                id="complaint-title"
                type="text"
                name="ComplaintTitle"
                value={formData.ComplaintTitle}
                onChange={handleChange}
                required
                maxLength={100}
                className={`form-input ${errors.ComplaintTitle ? 'error' : ''}`}
                placeholder="Brief description of your complaint"
                aria-describedby={errors.ComplaintTitle ? "title-error" : "title-help"}
              />
              {/* Show error message if validation fails */}
              {errors.ComplaintTitle && (
                <span id="title-error" className="error-message" role="alert">
                  <FaInfoCircle aria-hidden="true" />
                  {errors.ComplaintTitle}
                </span>
              )}
              {/* Character count helper */}
              <small id="title-help" className="form-help">
                {formData.ComplaintTitle.length}/100 characters
              </small>
            </div>

            {/* Problem Category - Required dropdown */}
            <div className="form-group">
              <label htmlFor="problem-type">
                Problem Category *
              </label>
              <select
                id="problem-type"
                name="ProblemType"
                value={formData.ProblemType}
                onChange={handleChange}
                required
                className={`form-input ${errors.ProblemType ? 'error' : ''}`}
                aria-describedby={errors.ProblemType ? "type-error" : "type-help"}
              >
                <option value="">Select Category</option>
                {problemTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {/* Show error message if validation fails */}
              {errors.ProblemType && (
                <span id="type-error" className="error-message" role="alert">
                  <FaInfoCircle aria-hidden="true" />
                  {errors.ProblemType}
                </span>
              )}
              <small id="type-help" className="form-help">
                Select the category that best describes your problem
              </small>
            </div>

            {/* Problem Description - Required textarea */}
            <div className="form-group full-width">
              <label htmlFor="problem-description">
                Problem Description *
              </label>
              <textarea
                id="problem-description"
                name="ProblemDescription"
                value={formData.ProblemDescription}
                onChange={handleChange}
                required
                rows={6}
                maxLength={1000}
                className={`form-input textarea ${errors.ProblemDescription ? 'error' : ''}`}
                placeholder="Please provide detailed information about your complaint, including when it occurred, what happened, and any relevant details that might help in resolving the issue..."
                aria-describedby={errors.ProblemDescription ? "description-error" : "description-help"}
              />
              {/* Show error message if validation fails */}
              {errors.ProblemDescription && (
                <span id="description-error" className="error-message" role="alert">
                  <FaInfoCircle aria-hidden="true" />
                  {errors.ProblemDescription}
                </span>
              )}
              {/* Character count and guidance */}
              <small id="description-help" className="form-help">
                {formData.ProblemDescription.length}/1000 characters - Be as specific as possible
              </small>
            </div>
          </div>

          {/* Contact Information Section - Optional contact details */}
          <div className="form-section">
            <h2 className="section-title">
              <FaEnvelope />
              Contact Information
            </h2>
            <p className="section-subtitle">How can we reach you about this complaint? (Optional)</p>

            <div className="form-row">
              {/* Email Address - Optional field */}
              <div className="form-group">
                <label htmlFor="email">
                  <FaEnvelope aria-hidden="true" />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleChange}
                  className={`form-input ${errors.Email ? 'error' : ''}`}
                  placeholder="your.email@example.com"
                  aria-describedby={errors.Email ? "email-error" : "email-help"}
                />
                {/* Show error message if validation fails */}
                {errors.Email && (
                  <span id="email-error" className="error-message" role="alert">
                    <FaInfoCircle aria-hidden="true" />
                    {errors.Email}
                  </span>
                )}
                <small id="email-help" className="form-help">
                  For notifications about your complaint
                </small>
              </div>

              {/* Contact Number - Optional field */}
              <div className="form-group">
                <label htmlFor="contact-number">
                  <FaPhone aria-hidden="true" />
                  Contact Number
                </label>
                <input
                  id="contact-number"
                  type="tel"
                  name="ContactNumber"
                  value={formData.ContactNumber}
                  onChange={handleChange}
                  className={`form-input ${errors.ContactNumber ? 'error' : ''}`}
                  placeholder="+1 (555) 123-4567"
                  aria-describedby={errors.ContactNumber ? "contact-error" : "contact-help"}
                />
                {/* Show error message if validation fails */}
                {errors.ContactNumber && (
                  <span id="contact-error" className="error-message" role="alert">
                    <FaInfoCircle aria-hidden="true" />
                    {errors.ContactNumber}
                  </span>
                )}
                <small id="contact-help" className="form-help">
                  For urgent contact if needed
                </small>
              </div>
            </div>
          </div>

          {/* File Attachment Section - Optional image upload */}
          <div className="form-section">
            <h2 className="section-title">
              <FaUpload />
              Supporting Documentation
            </h2>
            <p className="section-subtitle">Upload an image to help illustrate your complaint (Optional)</p>

            <div className="form-group full-width">
              {/* Show upload area if no file selected */}
              {!attachment ? (
                <div className="file-upload-area">
                  <input
                    id="attachment-input"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="file-input"
                  />
                  <div className="file-upload-content">
                    <FaUpload className="file-upload-icon" />
                    <p className="file-upload-text">
                      Click to select an image file
                    </p>
                    <small className="form-help">
                      Supported formats: JPG, PNG, GIF (Max size: 5MB)
                    </small>
                  </div>
                </div>
              ) : (
                /* Show file preview if file selected */
                <div className="file-preview">
                  <div className="file-info">
                    <FaUpload className="file-icon" />
                    <div className="file-details">
                      <span className="file-name">{attachment.name}</span>
                      <span className="file-size">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  {/* Remove attachment button */}
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="file-remove-btn"
                    aria-label="Remove attachment"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions - Submit button and help text */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? (
                /* Show loading state while submitting */
                <>
                  <div className="btn-spinner" aria-hidden="true"></div>
                  Submitting...
                </>
              ) : (
                /* Show normal submit state */
                <>
                  <FaPaperPlane aria-hidden="true" />
                  Submit Complaint
                </>
              )}
            </button>
            <p className="submit-help">
              Review your information carefully before submitting
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}

export default Complain;
