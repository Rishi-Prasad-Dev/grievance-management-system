import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaStar, FaComments, FaUser, FaChartBar, FaSpinner,
  FaClipboardList, FaSearch, FaTimes, FaUsers
} from 'react-icons/fa';
import AdminSideBar from '../../components/AdminSideBar';
import '../../components/css/AdminFeedback.css';

/**
 * Simplified AdminFeedback Component
 * Essential feedback management with faculty performance tracking
 */
function AdminFeedback() {
  // Core state
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterFaculty, setFilterFaculty] = useState('all');
  
  // Faculty stats modal
  const [showFacultyStatsModal, setShowFacultyStatsModal] = useState(false);
  const [selectedFacultyStats, setSelectedFacultyStats] = useState(null);
  const [facultyStatsLoading, setFacultyStatsLoading] = useState(false);
  
  const token = localStorage.getItem('token');

  // Load data on mount
  useEffect(() => {
    if (!token) {
      toast.error('Please log in first');
      return;
    }
    fetchFeedbacks();
    fetchStats();
  }, [token]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [feedbacks, searchTerm, filterRating, filterFaculty]);

  /**
   * Fetch all feedback data
   */
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/feedback/all', {
        headers: { Authorization: token }
      });
      setFeedbacks(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Fetch feedback error:', error);
      toast.error('Failed to fetch feedback data');
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch overall statistics
   */
  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/feedback/stats', {
        headers: { Authorization: token }
      });
      setStats(res.data || {
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  /**
   * Fetch faculty-specific statistics
   */
  const fetchFacultyStats = async (facultyId, facultyName) => {
    setFacultyStatsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/feedback/stats/faculty/${facultyId}`, {
        headers: { Authorization: token }
      });
      
      setSelectedFacultyStats({
        ...res.data,
        facultyName,
        facultyId
      });
      setShowFacultyStatsModal(true);
    } catch (error) {
      console.error('Fetch faculty stats error:', error);
      toast.error('Failed to fetch faculty statistics');
    } finally {
      setFacultyStatsLoading(false);
    }
  };

  /**
   * Get unique faculty from feedback data
   */
  const getUniqueFaculty = () => {
    const facultySet = new Set();
    feedbacks.forEach(feedback => {
      if (feedback.complaintId?.lastUpdatedBy?.name) {
        facultySet.add(JSON.stringify({
          id: feedback.complaintId.lastUpdatedBy._id,
          name: feedback.complaintId.lastUpdatedBy.name
        }));
      }
    });
    return Array.from(facultySet).map(item => JSON.parse(item));
  };

  /**
   * Apply filters to feedback list
   */
  const applyFilters = () => {
    let filtered = [...feedbacks];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.complaintId?.ComplaintTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.complaintId?.lastUpdatedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.comments?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Rating filter
    if (filterRating !== 'all') {
      const rating = parseInt(filterRating);
      filtered = filtered.filter(f => f.rating === rating);
    }

    // Faculty filter
    if (filterFaculty !== 'all') {
      if (filterFaculty === 'unassigned') {
        filtered = filtered.filter(f => !f.complaintId?.lastUpdatedBy);
      } else {
        filtered = filtered.filter(f => f.complaintId?.lastUpdatedBy?._id === filterFaculty);
      }
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.submittedDate || b.createdAt) - new Date(a.submittedDate || a.createdAt));

    setFilteredFeedbacks(filtered);
  };

  /**
   * Render star rating
   */
  const renderStars = (rating) => {
    return (
      <div className="af-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <FaStar
            key={star}
            className={`af-star ${star <= rating ? '' : 'af-empty'}`}
          />
        ))}
      </div>
    );
  };

  /**
   * Utility functions
   */
  const getStudentInitials = (name) => {
    if (!name) return 'ST';
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  const getFacultyInitials = (name) => {
    if (!name) return 'FA';
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Resolved': '#4caf50', 'Closed': '#757575', 'Rejected': '#f44336'
    };
    return colors[status] || '#757575';
  };

  const uniqueFaculty = getUniqueFaculty();

  // Loading state
  if (loading) {
    return (
      <div className="af-layout">
        <AdminSideBar />
        <div className="af-content">
          <div className="af-loading">
            <div className="af-spinner"></div>
            Loading feedback data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="af-layout">
      <AdminSideBar />
      <div className="af-content">
        {/* Header */}
        <div className="af-header">
          <h1>
            <FaStar />
            Student Feedback
          </h1>
          <p>View student feedback and faculty performance</p>
        </div>

        {/* Statistics */}
        <div className="af-stats-section">
          <div className="af-stats-grid">
            <div className="af-stat-card">
              <FaClipboardList className="af-stat-icon" />
              <span className="af-stat-number">{stats.totalFeedbacks}</span>
              <span className="af-stat-label">Total Feedback</span>
            </div>
            <div className="af-stat-card">
              <FaStar className="af-stat-icon" />
              <span className="af-stat-number">{stats.averageRating || 0}</span>
              <span className="af-stat-label">Average Rating</span>
            </div>
            <div className="af-stat-card">
              <FaUsers className="af-stat-icon" />
              <span className="af-stat-number">{uniqueFaculty.length}</span>
              <span className="af-stat-label">Faculty with Feedback</span>
            </div>
            <div className="af-stat-card">
              <FaChartBar className="af-stat-icon" />
              <span className="af-stat-number">
                {Math.round((stats.averageRating / 5) * 100) || 0}%
              </span>
              <span className="af-stat-label">Satisfaction Rate</span>
            </div>
          </div>
        </div>

        {/* Faculty Quick Access */}
        {uniqueFaculty.length > 0 && (
          <div className="af-faculty-section">
            <h2 className="af-section-title">
              <FaUsers />
              Faculty Performance
            </h2>
            <div className="af-faculty-grid">
              {uniqueFaculty.map(faculty => {
                const facultyFeedbacks = feedbacks.filter(f => 
                  f.complaintId?.lastUpdatedBy?._id === faculty.id
                );
                const avgRating = facultyFeedbacks.length > 0 
                  ? (facultyFeedbacks.reduce((sum, f) => sum + f.rating, 0) / facultyFeedbacks.length).toFixed(1)
                  : 0;
                
                return (
                  <div key={faculty.id} className="af-faculty-card">
                    <div className="af-faculty-header">
                      <div className="af-faculty-avatar">
                        {getFacultyInitials(faculty.name)}
                      </div>
                      <div className="af-faculty-info">
                        <span className="af-faculty-name">{faculty.name}</span>
                        <span className="af-faculty-stats-summary">
                          {facultyFeedbacks.length} reviews • {avgRating} ★
                        </span>
                      </div>
                    </div>
                    <button
                      className="af-faculty-stats-btn"
                      onClick={() => fetchFacultyStats(faculty.id, faculty.name)}
                      disabled={facultyStatsLoading}
                    >
                      <FaChartBar />
                      {facultyStatsLoading ? 'Loading...' : 'View Stats'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="af-filters-section">
          <div className="af-filters-title">
            <FaSearch />
            Filters
          </div>

          {/* Search */}
          <div className="af-search-box">
            <FaSearch className="af-search-icon" />
            <input
              type="text"
              placeholder="Search by student, complaint title, faculty, or comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="af-search-input"
            />
          </div>

          {/* Filter Grid */}
          <div className="af-filters-grid">
            <div className="af-filter-group">
              <label className="af-filter-label">Rating</label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="af-filter-select"
              >
                <option value="all">All Ratings ({feedbacks.length})</option>
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = feedbacks.filter(f => f.rating === rating).length;
                  return count > 0 ? (
                    <option key={rating} value={rating}>
                      {rating} Star{rating !== 1 ? 's' : ''} ({count})
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            <div className="af-filter-group">
              <label className="af-filter-label">Faculty</label>
              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="af-filter-select"
              >
                <option value="all">All Faculty</option>
                <option value="unassigned">
                  Unassigned ({feedbacks.filter(f => !f.complaintId?.lastUpdatedBy).length})
                </option>
                {uniqueFaculty.map(faculty => {
                  const count = feedbacks.filter(f => 
                    f.complaintId?.lastUpdatedBy?._id === faculty.id
                  ).length;
                  return (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="af-results-text">
            Showing {filteredFeedbacks.length} of {feedbacks.length} feedback entries
          </div>
        </div>

        {/* Feedback Display */}
        {filteredFeedbacks.length === 0 ? (
          <div className="af-empty-state">
            <FaStar className="af-empty-icon" />
            <h2 className="af-empty-title">No Feedback Found</h2>
            <p className="af-empty-text">
              {searchTerm || filterRating !== 'all' || filterFaculty !== 'all'
                ? 'No feedback matches your current filters.'
                : 'No student feedback has been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="af-feedback-grid">
            {filteredFeedbacks.map((feedback) => (
              <div key={feedback._id} className="af-feedback-card">
                {/* Card Header */}
                <div className="af-card-header">
                  <div className="af-complaint-info">
                    <h3 className="af-complaint-title">
                      {feedback.complaintId?.ComplaintTitle || 'Unknown Complaint'}
                    </h3>
                    <span 
                      className="af-status-badge"
                      style={{ backgroundColor: getStatusColor(feedback.complaintId?.status) }}
                    >
                      {feedback.complaintId?.status || 'Unknown'}
                    </span>
                  </div>
                  
                  {/* Student Info */}
                  <div className="af-student-info">
                    <div className="af-student-avatar">
                      {getStudentInitials(feedback.studentName)}
                    </div>
                    <span className="af-student-name">
                      {feedback.studentName || 'Unknown Student'}
                    </span>
                  </div>

                  {/* Faculty Info */}
                  {feedback.complaintId?.lastUpdatedBy && (
                    <div className="af-faculty-info">
                      <div className="af-faculty-avatar">
                        {getFacultyInitials(feedback.complaintId.lastUpdatedBy.name)}
                      </div>
                      <div className="af-faculty-details">
                        <span className="af-faculty-name">
                          Handled by: {feedback.complaintId.lastUpdatedBy.name}
                        </span>
                        <button
                          className="af-faculty-stats-btn-small"
                          onClick={() => fetchFacultyStats(
                            feedback.complaintId.lastUpdatedBy._id,
                            feedback.complaintId.lastUpdatedBy.name
                          )}
                          disabled={facultyStatsLoading}
                        >
                          <FaChartBar />
                          Stats
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="af-card-body">
                  {/* Rating Section */}
                  <div className="af-rating-section">
                    <div className="af-rating-title">
                      <FaStar />
                      Student Rating
                    </div>
                    <div className="af-stars-display">
                      {renderStars(feedback.rating)}
                      <span className="af-rating-value">{feedback.rating}/5</span>
                    </div>
                    <div className="af-rating-date">
                      Submitted: {formatDate(feedback.submittedDate || feedback.createdAt)}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="af-comments-section">
                    <div className="af-comments-title">
                      <FaComments />
                      Student Comments
                    </div>
                    <p className="af-comments-text">
                      {feedback.comments ? `"${feedback.comments}"` : (
                        <span className="af-no-comments">No additional comments provided</span>
                      )}
                    </p>
                  </div>

                  {/* Complaint Details */}
                  <div className="af-complaint-details">
                    <div className="af-details-title">Complaint Details</div>
                    <div className="af-complaint-type">
                      {feedback.complaintId?.ProblemType || 'Unknown Category'}
                    </div>
                    <div className="af-complaint-date">
                      Filed: {formatDate(feedback.complaintId?.ComplaintDateTime)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Faculty Statistics Modal */}
        {showFacultyStatsModal && selectedFacultyStats && (
          <div className="af-modal-overlay" onClick={() => setShowFacultyStatsModal(false)}>
            <div className="af-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="af-modal-header">
                <h2 className="af-modal-title">Faculty Performance</h2>
                <button
                  className="af-modal-close"
                  onClick={() => setShowFacultyStatsModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="af-modal-body">
                <div className="af-faculty-stats-detailed">
                  {/* Faculty Header */}
                  <div className="af-stats-header">
                    <div className="af-faculty-avatar-large">
                      {getFacultyInitials(selectedFacultyStats.facultyName)}
                    </div>
                    <div className="af-faculty-info-large">
                      <h3 className="af-faculty-name-large">{selectedFacultyStats.facultyName}</h3>
                      <p className="af-faculty-subtitle">Performance Metrics</p>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="af-stats-grid">
                    <div className="af-stat-card">
                      <FaClipboardList className="af-stat-icon" />
                      <span className="af-stat-number">{selectedFacultyStats.complaintsHandled}</span>
                      <span className="af-stat-label">Complaints Resolved</span>
                    </div>
                    <div className="af-stat-card">
                      <FaStar className="af-stat-icon" />
                      <span className="af-stat-number">{selectedFacultyStats.totalFeedbacks}</span>
                      <span className="af-stat-label">Feedback Received</span>
                    </div>
                    <div className="af-stat-card">
                      <FaChartBar className="af-stat-icon" />
                      <span className="af-stat-number">{selectedFacultyStats.averageRating || 0}</span>
                      <span className="af-stat-label">Average Rating</span>
                    </div>
                    <div className="af-stat-card">
                      <FaStar className="af-stat-icon" />
                      <span className="af-stat-number">
                        {Math.round((selectedFacultyStats.averageRating / 5) * 100) || 0}%
                      </span>
                      <span className="af-stat-label">Satisfaction Rate</span>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  {selectedFacultyStats.totalFeedbacks > 0 && (
                    <div className="af-rating-distribution">
                      <h4 className="af-distribution-title">
                        <FaStar />
                        Rating Distribution
                      </h4>
                      <div className="af-rating-bars">
                        {[5, 4, 3, 2, 1].map(rating => {
                          const count = selectedFacultyStats.ratingDistribution[rating] || 0;
                          const percentage = (count / selectedFacultyStats.totalFeedbacks) * 100;
                          return (
                            <div key={rating} className="af-rating-bar-row">
                              <span className="af-rating-label">{rating} Star{rating !== 1 ? 's' : ''}</span>
                              <div className="af-rating-bar">
                                <div 
                                  className="af-rating-fill"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="af-rating-count">
                                {count} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {facultyStatsLoading && (
          <div className="af-modal-overlay">
            <div className="af-loading">
              <div className="af-spinner"></div>
              Loading faculty stats...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminFeedback;