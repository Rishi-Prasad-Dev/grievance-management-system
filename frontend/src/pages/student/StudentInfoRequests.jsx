import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import StudentSideBar from '../../components/StudentSideBar';
import '../../components/css/StudentInfoRequests.css';
// React icons for consistent theming
import { 
  FaQuestionCircle, FaReply, FaUpload, FaTimes, FaPaperPlane, 
  FaFileAlt, FaCalendarAlt, FaSpinner, FaInfoCircle 
} from 'react-icons/fa';

/**
 * StudentInfoRequests Component
 * Interface for students to respond to faculty information requests
 * Features blue color theme and file attachment support
 */
export default function StudentInfoRequests() {
  // State for information requests from faculty
  const [infoRequests, setInfoRequests] = useState([]);

  // User responses keyed by request ID
  const [responses, setResponses] = useState({});

  // File attachments keyed by request ID
  const [attachments, setAttachments] = useState({});

  // Loading and submission states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});

  // Authentication token
  const token = localStorage.getItem('token');

  /**
   * Extract username from JWT token payload
   * @returns {string|null} - Username or null if invalid token
   */
  const getUsernameFromToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const username = getUsernameFromToken();

  // Effect for initial data loading
  useEffect(() => {
    if (username && token) {
      fetchInfoRequests();
    } else {
      toast.error('Please log in to access information requests');
      setLoading(false);
    }
  }, [username, token]);

  /**
   * Fetch information requests for the current student
   */
  const fetchInfoRequests = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `http://localhost:5000/info-requests/student/${username}`,
        { headers: { Authorization: token } }
      );

      // Filter out already responded requests (double-check)
      const pendingRequests = Array.isArray(data)
        ? data.filter(req => !req.studentResponse)
        : [];
      setInfoRequests(pendingRequests);
    } catch (error) {
      console.error('Failed to load info requests:', error);
      toast.error('Failed to load information requests. Please try again.');
      setInfoRequests([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle response text change
   * @param {string} id - Request ID
   * @param {string} text - Response text
   */
  const handleResponseChange = (id, text) => {
    setResponses(prev => ({ ...prev, [id]: text }));
  };

  /**
   * Handle file attachment with validation
   * @param {string} id - Request ID
   * @param {File} file - Selected file
   */
  const handleAttachmentChange = (id, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setAttachments(prev => ({ ...prev, [id]: file }));
    toast.success('File attached successfully');
  };

  /**
   * Remove attachment for a specific request
   * @param {string} id - Request ID
   */
  const removeAttachment = (id) => {
    const hadAttachment = Boolean(attachments[id]);

    setAttachments(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Reset file input
    const fileInput = document.getElementById(`file-input-${id}`);
    if (fileInput) fileInput.value = '';

    // Only notify if there was an attachment
    if (hadAttachment) {
      toast.info('File attachment removed');
    }
  };

  /**
   * Submit response to faculty with optional attachment
   * @param {string} id - Request ID
   */
  const submitResponse = async (id) => {
    const responseText = responses[id]?.trim();
    if (!responseText) {
      toast.error('Please enter a response before submitting');
      return;
    }

    setSubmitting(prev => ({ ...prev, [id]: true }));

    try {
      const formData = new FormData();
      formData.append('studentResponse', responseText);

      if (attachments[id]) {
        formData.append('attachment', attachments[id]);
      }

      await axios.patch(
        `http://localhost:5000/info-requests/respond/${id}`,
        formData,
        { 
          headers: { 
            Authorization: token,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      toast.success('Response submitted successfully!');

      // Remove responded request from the list
      setInfoRequests(prev => prev.filter(req => req._id !== id));

      // Clear response and attachment data
      setResponses(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      // Silent cleanup of attachment without extra toast
      setAttachments(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      const fileInput = document.getElementById(`file-input-${id}`);
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Failed to submit response:', error);
      toast.error(error.response?.data?.error || 'Failed to submit response. Please try again.');
    } finally {
      setSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  /**
   * Get file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="sir-layout">
        <StudentSideBar />
        <main className="sir-content" role="main" aria-busy="true">
          <div className="sir-loading" role="status" aria-live="assertive">
            <div className="sir-spinner" aria-hidden="true"></div>
            <p>Loading information requests...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="sir-layout">
      <StudentSideBar />
      <main className="sir-content" role="main" aria-labelledby="requests-title">
        {/* Header */}
        <header className="sir-header">
          <h1 className="sir-title" id="requests-title">
            <FaQuestionCircle aria-hidden="true" />
            Information Requests
          </h1>
          <p className="sir-subtitle">
            Respond to faculty requests for additional information about your complaints
          </p>
        </header>

        {/* Requests Container */}
        {infoRequests.length === 0 ? (
          <section className="sir-empty-state" role="region" aria-labelledby="empty-title">
            <FaInfoCircle className="sir-empty-icon" aria-hidden="true" />
            <h2 className="sir-empty-title" id="empty-title">No Pending Requests</h2>
            <p className="sir-empty-text">
              You don't have any outstanding information requests at this time. 
              Faculty members will contact you here if they need additional details about your complaints.
            </p>
          </section>
        ) : (
          <div className="sir-requests-container">
            {infoRequests.map((request) => (
              <article 
                key={request._id} 
                className="sir-request-card"
                aria-labelledby={`request-title-${request._id}`}
              >
                {/* Card Header */}
                <header className="sir-card-header">
                  <div className="sir-complaint-info">
                    <h2 
                      className="sir-complaint-title" 
                      id={`request-title-${request._id}`}
                    >
                      {request.complaintId?.ComplaintTitle || 'Untitled Complaint'}
                    </h2>
                    <div className="sir-request-date">
                      <FaCalendarAlt aria-hidden="true" />
                      {formatDate(request.createdAt)}
                    </div>
                  </div>
                </header>

                {/* Card Body */}
                <div className="sir-card-body">
                  {/* Faculty Message */}
                  <section 
                    className="sir-faculty-message" 
                    aria-labelledby={`faculty-message-${request._id}`}
                  >
                    <h3 className="sir-message-label" id={`faculty-message-${request._id}`}>
                      <FaQuestionCircle aria-hidden="true" />
                      Faculty Request:
                    </h3>
                    <div className="sir-message-content">
                      <p>{request.facultyMessage}</p>
                    </div>
                  </section>

                  {/* Related Complaint Context */}
                  {request.complaintId && (
                    <section 
                      className="sir-complaint-context" 
                      aria-labelledby={`complaint-context-${request._id}`}
                    >
                      <h3 className="sir-context-label" id={`complaint-context-${request._id}`}>
                        <FaFileAlt aria-hidden="true" />
                        Related Complaint:
                      </h3>
                      <div className="sir-context-details">
                        <div className="sir-context-item">
                          <strong>Type:</strong>
                          <span>{request.complaintId.ProblemType || 'Not specified'}</span>
                        </div>
                        <div className="sir-context-item">
                          <strong>Submitted:</strong>
                          <span>{formatDate(request.complaintId.ComplaintDateTime)}</span>
                        </div>
                        <div className="sir-context-item full-width">
                          <strong>Description:</strong>
                          <p>{request.complaintId.ProblemDescription}</p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Response Form */}
                  <form 
                    className="sir-response-form" 
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitResponse(request._id);
                    }}
                  >
                    <fieldset className="sir-response-fieldset">
                      <legend className="sir-form-label">
                        <FaReply aria-hidden="true" />
                        Your Response
                      </legend>

                      {/* Text Response */}
                      <div className="sir-textarea-container">
                        <label 
                          htmlFor={`response-${request._id}`}
                          className="sir-textarea-label"
                        >
                          Response Message *
                        </label>
                        <textarea
                          id={`response-${request._id}`}
                          value={responses[request._id] || ''}
                          onChange={(e) => handleResponseChange(request._id, e.target.value)}
                          placeholder="Please provide the requested information..."
                          className="sir-textarea"
                          required
                          maxLength={1000}
                          aria-describedby={`response-help-${request._id}`}
                        />
                        <small id={`response-help-${request._id}`} className="sir-form-help">
                          {responses[request._id]?.length || 0}/1000 characters
                        </small>
                      </div>

                      {/* File Attachment */}
                      <div className="sir-attachment-container">
                        <label className="sir-attachment-label">
                          <FaUpload aria-hidden="true" />
                          Attach Image (Optional)
                        </label>
                        
                        {!attachments[request._id] ? (
                          <div className="sir-file-upload-area">
                            <input
                              type="file"
                              id={`file-input-${request._id}`}
                              accept="image/*"
                              onChange={(e) => handleAttachmentChange(request._id, e.target.files[0])}
                              className="sir-file-input"
                              aria-label="Choose image file to attach"
                            />
                            <div className="sir-file-upload-content">
                              <FaUpload className="sir-upload-icon" aria-hidden="true" />
                              <p className="sir-upload-text">
                                Click to choose an image or drag and drop
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="sir-file-preview">
                            <div className="sir-file-info">
                              <FaFileAlt className="sir-file-icon" aria-hidden="true" />
                              <div className="sir-file-details">
                                <div className="sir-file-name">{attachments[request._id].name}</div>
                                <div className="sir-file-size">
                                  {formatFileSize(attachments[request._id].size)}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(request._id)}
                              className="sir-remove-btn"
                              aria-label="Remove attached file"
                            >
                              <FaTimes aria-hidden="true" />
                            </button>
                          </div>
                        )}
                        <small className="sir-form-help">
                          Supported formats: JPG, PNG, GIF. Maximum size: 5MB
                        </small>
                      </div>

                      {/* Form Actions */}
                      <div className="sir-form-actions">
                        <button
                          type="submit"
                          disabled={submitting[request._id] || !responses[request._id]?.trim()}
                          className="sir-submit-btn"
                          aria-label="Submit response to faculty"
                        >
                          {submitting[request._id] ? (
                            <>
                              <FaSpinner className="sir-btn-spinner" aria-hidden="true" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <FaPaperPlane aria-hidden="true" />
                              Submit Response
                            </>
                          )}
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
