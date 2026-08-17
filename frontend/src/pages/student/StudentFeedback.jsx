import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import StudentSideBar from '../../components/StudentSideBar';
import '../../components/css/StudentFeedback.css';
import { FaStar, FaPaperPlane, FaSpinner, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';

/**
 * StudentFeedback Component
 * Interface for students to provide feedback on resolved complaints
 * Features blue color theme and star rating system
 * Fixed: Resolves "feedback already submitted" error
 */
export default function StudentFeedback() {
  // State for feedback requests
  const [feedbackRequests, setFeedbackRequests] = useState([]);

  // State for form data - keyed by feedback request ID
  const [feedbackData, setFeedbackData] = useState({});

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

  // Load feedback requests on component mount
  useEffect(() => {
    if (username && token) {
      fetchFeedbackRequests();
    } else {
      toast.error('Please log in to access feedback requests');
      setLoading(false);
    }
  }, [username, token]);

  /**
   * Fetch feedback requests for the current student
   * Fixed: Better filtering and error handling
   */
  const fetchFeedbackRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching feedback requests for username:', username);
      
      const { data } = await axios.get(
        `http://localhost:5000/feedback/student/${username}`,
        { headers: { Authorization: token } }
      );

      console.log('Raw feedback requests data:', data);

      // Filter for valid, unsubmitted requests with populated complaint data
      const validRequests = Array.isArray(data) ? data.filter(req => {
        const isValid = req.complaintId && 
                       !req.isSubmitted && 
                       req.complaintId.ComplaintTitle; // Ensure complaint is populated
        
        console.log('Request validation:', {
          id: req._id,
          hasComplaint: !!req.complaintId,
          isSubmitted: req.isSubmitted,
          hasTitle: req.complaintId?.ComplaintTitle,
          isValid
        });
        
        return isValid;
      }) : [];

      console.log('Filtered valid requests:', validRequests);
      setFeedbackRequests(validRequests);

    } catch (error) {
      console.error('Failed to load feedback requests:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        return;
      }
      
      toast.error('Failed to load feedback requests. Please try again.');
      setFeedbackRequests([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle rating change for a specific feedback request
   * @param {string} requestId - Feedback request ID
   * @param {number} rating - Rating value (1-5)
   */
  const handleRatingChange = (requestId, rating) => {
    console.log('Rating changed:', { requestId, rating });
    setFeedbackData(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        rating
      }
    }));
  };

  /**
   * Handle comments change for a specific feedback request
   * @param {string} requestId - Feedback request ID
   * @param {string} comments - Comments text
   */
  const handleCommentsChange = (requestId, comments) => {
    setFeedbackData(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        comments
      }
    }));
  };

  /**
   * Submit feedback for a specific request
   * Fixed: Better validation and error handling
   * @param {string} requestId - Feedback request ID
   */
  const submitFeedback = async (requestId) => {
    const feedback = feedbackData[requestId];
    
    // Validate rating
    if (!feedback?.rating || feedback.rating < 1 || feedback.rating > 5) {
      toast.error('Please provide a rating between 1 and 5 stars');
      return;
    }

    // Find the request to get complaint info
    const request = feedbackRequests.find(req => req._id === requestId);
    if (!request) {
      toast.error('Feedback request not found');
      return;
    }

    console.log('Submitting feedback:', {
      requestId,
      rating: feedback.rating,
      comments: feedback.comments?.trim() || '',
      complaintId: request.complaintId?._id
    });

    setSubmitting(prev => ({ ...prev, [requestId]: true }));

    try {
      // Use PATCH method with correct endpoint
      const response = await axios.patch(
        `http://localhost:5000/feedback/submit/${requestId}`,
        {
          rating: parseInt(feedback.rating), // Ensure rating is a number
          comments: feedback.comments?.trim() || '',
          // Include complaint ID for verification
          complaintId: request.complaintId._id
        },
        { 
          headers: { 
            Authorization: token,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('Feedback submission response:', response.data);
      toast.success('Feedback submitted successfully!');

      // Remove submitted feedback from the list
      setFeedbackRequests(prev => prev.filter(req => req._id !== requestId));

      // Clear feedback data for this request
      setFeedbackData(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });

      // Refresh the list to ensure consistency
      setTimeout(() => {
        fetchFeedbackRequests();
      }, 1000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || error.response?.data?.message;
        if (errorMsg && errorMsg.toLowerCase().includes('already submitted')) {
          toast.error('This feedback has already been submitted. Refreshing the list...');
          // Remove from local state if already submitted
          setFeedbackRequests(prev => prev.filter(req => req._id !== requestId));
          setTimeout(() => fetchFeedbackRequests(), 500);
        } else {
          toast.error(errorMsg || 'Invalid feedback data. Please check your input.');
        }
      } else if (error.response?.status === 404) {
        toast.error('Feedback request not found. Refreshing the list...');
        setTimeout(() => fetchFeedbackRequests(), 500);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        toast.error('Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(prev => ({ ...prev, [requestId]: false }));
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
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  /**
   * Get status badge color based on complaint status
   * @param {string} status - Complaint status
   * @returns {string} - Background color
   */
  const getStatusBadgeColor = (status) => {
    const colors = {
      'Resolved': '#4caf50',
      'Closed': '#757575',
      'Rejected': '#f44336'
    };
    return colors[status] || '#757575';
  };

  /**
   * Get rating description text
   * @param {number} rating - Rating value
   * @returns {string} - Description text
   */
  const getRatingDescription = (rating) => {
    const descriptions = {
      1: 'Very Poor',
      2: 'Poor',
      3: 'Average',
      4: 'Good',
      5: 'Excellent'
    };
    return descriptions[rating] || '';
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="sf-layout">
        <StudentSideBar />
        <main className="sf-content" role="main" aria-busy="true">
          <div className="sf-loading" role="status" aria-live="assertive">
            <div className="sf-spinner" aria-hidden="true"></div>
            <p>Loading feedback requests...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="sf-layout">
      <StudentSideBar />
      <main className="sf-content" role="main" aria-labelledby="feedback-title">
        {/* Header */}
        <header className="sf-header">
          <h1 id="feedback-title">
            <FaStar aria-hidden="true" />
            System Feedback
          </h1>
          <p>Rate your experience with resolved complaints and help us improve our services</p>
        </header>

        {/* Feedback Requests */}
        {feedbackRequests.length === 0 ? (
          <section className="sf-empty-state" role="region" aria-labelledby="empty-title">
            <FaInfoCircle className="sf-empty-icon" aria-hidden="true" />
            <h2 className="sf-empty-title" id="empty-title">No Pending Feedback</h2>
            <p className="sf-empty-text">
              You don't have any complaints awaiting feedback at this time. 
              Feedback requests are created when your complaints are resolved, closed, or rejected.
            </p>
          </section>
        ) : (
          <div className="sf-requests-container">
            {feedbackRequests.map((request) => (
              <article 
                key={request._id} 
                className="sf-request-card"
                aria-labelledby={`complaint-title-${request._id}`}
              >
                {/* Card Header */}
                <header className="sf-card-header">
                  <div className="sf-complaint-info">
                    <h2 
                      className="sf-complaint-title" 
                      id={`complaint-title-${request._id}`}
                    >
                      {request.complaintId?.ComplaintTitle || 'Untitled Complaint'}
                    </h2>
                    <div className="sf-completion-date">
                      <FaCalendarAlt aria-hidden="true" />
                      Completed: {formatDate(request.complaintId?.updatedAt)}
                    </div>
                  </div>
                  <div 
                    className="sf-status-badge"
                    style={{ backgroundColor: getStatusBadgeColor(request.complaintId?.status) }}
                  >
                    {request.complaintId?.status || 'Unknown'}
                  </div>
                </header>

                {/* Card Body */}
                <div className="sf-card-body">
                  {/* Status Message */}
                  <div className="sf-status-message">
                    <FaInfoCircle aria-hidden="true" />
                    Your complaint has been {request.complaintId?.status?.toLowerCase()}. 
                    Please share your feedback to help us improve our services.
                  </div>

                  {/* Complaint Details */}
                  <section 
                    className="sf-complaint-details" 
                    aria-labelledby={`details-title-${request._id}`}
                  >
                    <h3 className="sf-details-label" id={`details-title-${request._id}`}>
                      <FaInfoCircle aria-hidden="true" />
                      Complaint Details
                    </h3>
                    
                    <div className="sf-detail-grid">
                      <div className="sf-detail-item">
                        <strong>Problem Type:</strong>
                        <span>{request.complaintId?.ProblemType || 'Not specified'}</span>
                      </div>
                      <div className="sf-detail-item">
                        <strong>Submitted:</strong>
                        <span>{formatDate(request.complaintId?.ComplaintDateTime)}</span>
                      </div>
                      <div className="sf-detail-item sf-full-width">
                        <strong>Description:</strong>
                        <p className="sf-description">
                          {request.complaintId?.ProblemDescription || 'No description provided'}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Feedback Form */}
                  <form 
                    className="sf-feedback-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitFeedback(request._id);
                    }}
                  >
                    <fieldset className="sf-feedback-fieldset">
                      <legend className="sf-form-title">
                        <FaStar aria-hidden="true" />
                        Your Feedback
                      </legend>

                      {/* Rating Section */}
                      <div className="sf-rating-container">
                        <label className="sf-rating-label">
                          Overall Satisfaction *
                        </label>
                        <div className="sf-star-rating" role="radiogroup" aria-label="Rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRatingChange(request._id, star)}
                              className={`sf-star-btn ${
                                (feedbackData[request._id]?.rating || 0) >= star ? 'sf-star-filled' : ''
                              }`}
                              role="radio"
                              aria-checked={feedbackData[request._id]?.rating === star}
                              aria-label={`${star} star${star > 1 ? 's' : ''}`}
                            >
                              ★
                            </button>
                          ))}
                          {feedbackData[request._id]?.rating && (
                            <span className="sf-rating-text">
                              {getRatingDescription(feedbackData[request._id].rating)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div className="sf-comments-container">
                        <label 
                          htmlFor={`comments-${request._id}`}
                          className="sf-comments-label"
                        >
                          Additional Comments (Optional)
                        </label>
                        <textarea
                          id={`comments-${request._id}`}
                          value={feedbackData[request._id]?.comments || ''}
                          onChange={(e) => handleCommentsChange(request._id, e.target.value)}
                          placeholder="Please share any additional thoughts about your experience..."
                          className="sf-textarea"
                          maxLength={500}
                          rows={4}
                          aria-describedby={`comments-help-${request._id}`}
                        />
                        <small id={`comments-help-${request._id}`} className="sf-form-help">
                          {feedbackData[request._id]?.comments?.length || 0}/500 characters
                        </small>
                      </div>

                      {/* Form Actions */}
                      <div className="sf-form-actions">
                        <button
                          type="submit"
                          disabled={
                            submitting[request._id] || 
                            !feedbackData[request._id]?.rating ||
                            feedbackData[request._id]?.rating < 1 ||
                            feedbackData[request._id]?.rating > 5
                          }
                          className="sf-submit-btn"
                          aria-label="Submit feedback"
                        >
                          {submitting[request._id] ? (
                            <>
                              <FaSpinner className="sf-btn-spinner" aria-hidden="true" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <FaPaperPlane aria-hidden="true" />
                              Submit Feedback
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
