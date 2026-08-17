import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import StudentSideBar from '../../components/StudentSideBar';
import '../../components/css/StudentDashBoard.css';

// React icons for consistent theming
import { 
  FaHome, FaUser, FaPen, FaQuestionCircle, FaStar, FaSearch,
  FaChartBar, FaClock, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';

/**
 * StudentDashBoard Component
 * Main dashboard for student users showing statistics, quick actions, and recent complaints
 * Features blue color theme and comprehensive data visualization
 */
function StudentDashBoard() {
  // Student profile information state
  const [student, setStudent] = useState({});
  
  // Dashboard statistics and data state
  const [dashboardData, setDashboardData] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    inProgressComplaints: 0,
    acknowledgedComplaints: 0,
    onHoldComplaints: 0,
    closedComplaints: 0,
    rejectedComplaints: 0,
    pendingInfoRequests: 0,
    pendingFeedbacks: 0,
    recentComplaints: []
  });
  
  // Loading state for data fetching
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation hook for routing
  const navigate = useNavigate();
  
  // Authentication token from localStorage
  const token = localStorage.getItem('token');

  // Effect hook for initial data loading and authentication check
  useEffect(() => {
    if (!token) {
      toast.error('Please log in to access dashboard');
      navigate('/StudentLogin');
      return;
    }
    loadDashboardData();
  }, [token, navigate]);

  /**
   * Load all dashboard data from backend APIs
   * Fetches student profile, complaints, info requests, and feedback data
   */
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Create axios config with authorization header
      const axiosConfig = {
        headers: { Authorization: token }
      };
      
      // Fetch student profile data first
      const profileRes = await axios.get('http://localhost:5000/auth/Student/profile', axiosConfig);
      const studentData = profileRes.data;
      setStudent(studentData);

      if (!studentData.username) {
        throw new Error('Username not found in profile data');
      }

      // Parallel requests for dashboard data with proper authentication headers
      const [complaintsRes, infoRequestsRes, feedbackRes] = await Promise.all([
        axios.get(`http://localhost:5000/complain/student/${studentData.username}`, axiosConfig)
          .catch(error => {
            console.warn('Failed to fetch complaints:', error);
            return { data: [] };
          }),
        axios.get(`http://localhost:5000/info-requests/student/${studentData.username}`, axiosConfig)
          .catch(error => {
            console.warn('Failed to fetch info requests:', error);
            return { data: [] };
          }),
        axios.get(`http://localhost:5000/feedback/student/${studentData.username}`, axiosConfig)
          .catch(error => {
            console.warn('Failed to fetch feedback requests:', error);
            return { data: [] };
          })
      ]);

      // Ensure data arrays exist and are valid
      const complaints = Array.isArray(complaintsRes.data) ? complaintsRes.data : [];
      const infoRequests = Array.isArray(infoRequestsRes.data) ? infoRequestsRes.data : [];
      const feedbackRequests = Array.isArray(feedbackRes.data) ? feedbackRes.data : [];

      // Calculate dashboard statistics with proper counts
      const stats = {
        totalComplaints: complaints.length,
        pendingComplaints: complaints.filter(c => c.status === 'Pending').length,
        acknowledgedComplaints: complaints.filter(c => c.status === 'Acknowledged').length,
        inProgressComplaints: complaints.filter(c => c.status === 'In Progress').length,
        onHoldComplaints: complaints.filter(c => c.status === 'On Hold').length,
        resolvedComplaints: complaints.filter(c => c.status === 'Resolved').length,
        closedComplaints: complaints.filter(c => c.status === 'Closed').length,
        rejectedComplaints: complaints.filter(c => c.status === 'Rejected').length,
        pendingInfoRequests: infoRequests.filter(r => !r.studentResponse && !r.isResolved).length,
        pendingFeedbacks: feedbackRequests.filter(f => !f.isSubmitted).length,
        // Get 3 most recent complaints
        recentComplaints: complaints
          .sort((a, b) => new Date(b.ComplaintDateTime) - new Date(a.ComplaintDateTime))
          .slice(0, 3)
      };

      setDashboardData(stats);
    } catch (error) {
      console.error('Dashboard load error:', error);
      
      // Handle different types of errors
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/StudentLogin');
      } else if (error.response?.status === 404) {
        toast.error('User data not found. Please contact support.');
      } else {
        toast.error('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get color for complaint status badge
   * @param {string} status - The complaint status
   * @returns {string} - Hex color code
   */
  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': '#ff9800',
      'Acknowledged': '#9c27b0',
      'In Progress': '#2196f3',
      'On Hold': '#f44336',
      'Resolved': '#4caf50',
      'Closed': '#6c757d',
      'Rejected': '#dc3545'
    };
    return statusColors[status] || '#757575';
  };

  /**
   * Format date string for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} - Truncated text
   */
  const truncateText = (text, maxLength = 100) => {
    if (!text || typeof text !== 'string') return 'No description provided';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  // Loading state UI
  if (isLoading) {
    return (
      <div className="sdb-layout">
        <StudentSideBar />
        <main className="sdb-content" role="main" aria-busy="true">
          <div className="sdb-loading" role="status" aria-live="assertive">
            <div className="sdb-spinner" aria-hidden="true"></div>
            <p>Loading Dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="sdb-layout">
      <StudentSideBar />
      <main className="sdb-content" role="main" aria-labelledby="sdb-page-title">
        {/* Header Section with Welcome Message and Date */}
        <header className="sdb-header">
          <div className="sdb-welcome-section">
            <h1 id="sdb-page-title" className="sdb-header-title">
              Welcome Back, {student.name || 'Student'}!
            </h1>
            <p className="sdb-header-subtitle">
              Here's your academic dashboard overview
            </p>
          </div>
          <div className="sdb-date-box" role="complementary" aria-label="Current date">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </header>

        {/* Quick Actions Section */}
        <section className="sdb-quick-actions" aria-labelledby="sdb-quick-title">
          <h2 id="sdb-quick-title" className="sdb-section-title">Quick Actions</h2>
          <div className="sdb-quick-cards">
            <Link 
              to="/StudentProfile" 
              className="sdb-card sdb-card-primary"
              aria-label="Update your profile information"
            >
              <div className="sdb-card-icon">
                <FaUser aria-hidden="true" />
              </div>
              <div className="sdb-card-content">
                <h3>Update Profile</h3>
                <p>Manage your profile and academic details</p>
              </div>
            </Link>

            <Link 
              to="/Complain" 
              className="sdb-card sdb-card-primary"
              aria-label="File a new complaint"
            >
              <div className="sdb-card-icon">
                <FaPen aria-hidden="true" />
              </div>
              <div className="sdb-card-content">
                <h3>File Complaint</h3>
                <p>Submit new complaints or issues</p>
              </div>
            </Link>

            <Link 
              to="/StudentInfoRequests" 
              className="sdb-card sdb-card-alert"
              aria-label="Respond to faculty information requests"
            >
              <div className="sdb-card-icon">
                <FaQuestionCircle aria-hidden="true" />
              </div>
              <div className="sdb-card-content">
                <h3>Info Requests</h3>
                <p>Respond to faculty information requests</p>
                {dashboardData.pendingInfoRequests > 0 && (
                  <span 
                    className="sdb-notification-badge" 
                    aria-label={`${dashboardData.pendingInfoRequests} pending requests`}
                  >
                    {dashboardData.pendingInfoRequests}
                  </span>
                )}
              </div>
            </Link>

            <Link 
              to="/StudentFeedback" 
              className="sdb-card sdb-card-alert"
              aria-label="Provide feedback on resolved cases"
            >
              <div className="sdb-card-icon">
                <FaStar aria-hidden="true" />
              </div>
              <div className="sdb-card-content">
                <h3>Feedback</h3>
                <p>Give feedback on resolved cases</p>
                {dashboardData.pendingFeedbacks > 0 && (
                  <span 
                    className="sdb-notification-badge" 
                    aria-label={`${dashboardData.pendingFeedbacks} pending feedback`}
                  >
                    {dashboardData.pendingFeedbacks}
                  </span>
                )}
              </div>
            </Link>

            <Link 
              to="/TrackComplaintStatus" 
              className="sdb-card sdb-card-primary"
              aria-label="Track complaint status and progress"
            >
              <div className="sdb-card-icon">
                <FaSearch aria-hidden="true" />
              </div>
              <div className="sdb-card-content">
                <h3>Track Status</h3>
                <p>Monitor your complaint progress</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Statistics Overview */}
        <section className="sdb-stats-overview" aria-labelledby="sdb-stats-title">
          <h2 id="sdb-stats-title" className="sdb-section-title">Statistics Overview</h2>
          <div className="sdb-stats-grid">
            <div className="sdb-stat-card sdb-total" role="group" aria-labelledby="sdb-total-label">
              <div className="sdb-stat-icon">
                <FaChartBar aria-hidden="true" />
              </div>
              <div className="sdb-stat-info">
                <h3 className="sdb-stat-number">{dashboardData.totalComplaints}</h3>
                <p id="sdb-total-label" className="sdb-stat-label">Total Complaints</p>
              </div>
            </div>

            <div className="sdb-stat-card sdb-pending" role="group" aria-labelledby="sdb-pending-label">
              <div className="sdb-stat-icon">
                <FaClock aria-hidden="true" />
              </div>
              <div className="sdb-stat-info">
                <h3 className="sdb-stat-number">{dashboardData.pendingComplaints}</h3>
                <p id="sdb-pending-label" className="sdb-stat-label">Pending</p>
              </div>
            </div>

            <div className="sdb-stat-card sdb-progress" role="group" aria-labelledby="sdb-progress-label">
              <div className="sdb-stat-icon">
                <FaExclamationTriangle aria-hidden="true" />
              </div>
              <div className="sdb-stat-info">
                <h3 className="sdb-stat-number">{dashboardData.inProgressComplaints}</h3>
                <p id="sdb-progress-label" className="sdb-stat-label">In Progress</p>
              </div>
            </div>

            <div className="sdb-stat-card sdb-resolved" role="group" aria-labelledby="sdb-resolved-label">
              <div className="sdb-stat-icon">
                <FaCheckCircle aria-hidden="true" />
              </div>
              <div className="sdb-stat-info">
                <h3 className="sdb-stat-number">{dashboardData.resolvedComplaints}</h3>
                <p id="sdb-resolved-label" className="sdb-stat-label">Resolved</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Complaints Section */}
        <section className="sdb-recent-complaints" aria-labelledby="sdb-recent-title">
          <div className="sdb-section-header">
            <h2 id="sdb-recent-title" className="sdb-section-title">Recent Complaints</h2>
            <Link 
              to="/TrackComplaintStatus" 
              className="sdb-view-all"
              aria-label="View all complaints"
            >
              View All
            </Link>
          </div>

          {dashboardData.recentComplaints.length === 0 ? (
            <div className="sdb-empty-state" role="status">
              <div className="sdb-empty-icon">📝</div>
              <h3 className="sdb-empty-title">No Recent Complaints</h3>
              <p className="sdb-empty-text">
                You haven't submitted any complaints yet. Click below to file your first complaint.
              </p>
              <Link to="/Complain" className="sdb-cta-btn">
                File Your First Complaint
              </Link>
            </div>
          ) : (
            <div className="sdb-recent-cards">
              {dashboardData.recentComplaints.map((complaint) => (
                <article 
                  key={complaint._id} 
                  className="sdb-complaint-card"
                  aria-labelledby={`complaint-title-${complaint._id}`}
                >
                  <header className="sdb-complaint-header">
                    <h4 id={`complaint-title-${complaint._id}`} className="sdb-complaint-title">
                      {complaint.ComplaintTitle || 'Untitled Complaint'}
                    </h4>
                    <span
                      className="sdb-status-badge"
                      style={{ backgroundColor: getStatusColor(complaint.status) }}
                      aria-label={`Status: ${complaint.status}`}
                    >
                      {(complaint.status || 'UNKNOWN').toUpperCase()}
                    </span>
                  </header>
                  <div className="sdb-complaint-info">
                    <span className="sdb-complaint-type">
                      <strong>Type:</strong> {complaint.ProblemType || 'Unknown'}
                    </span>
                    <span className="sdb-complaint-date">
                      <strong>Submitted:</strong> {formatDate(complaint.ComplaintDateTime)}
                    </span>
                  </div>
                  <p className="sdb-complaint-description">
                    {truncateText(complaint.ProblemDescription)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StudentDashBoard;
