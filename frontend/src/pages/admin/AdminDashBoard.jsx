import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaUsers, FaChalkboardTeacher, FaExclamationTriangle, 
  FaClipboardList, FaTachometerAlt, FaUserShield, FaCalendarAlt,
  FaClock, FaStar, FaUserCircle
} from 'react-icons/fa';
import AdminSideBar from '../../components/AdminSideBar';
import '../../components/css/AdminDashboard.css';

/**
 * AdminDashBoard Component
 * Provides comprehensive overview of the complaint management system
 * Displays key metrics, statistics, and recent activity
 */
function AdminDashBoard() {
  const [adminData, setAdminData] = useState({
    name: '',
    profileImage: '',
    profileImageUrl: ''
  });

  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalComplaints: 0,
    statusCounts: {},
    recentComplaints: [],
    systemStats: {
      activeUsers: 0,
      avgResolutionTime: 0,
      satisfactionRate: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Extract admin ID from JWT token
  const getAdminIdFromToken = () => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]))._id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Quick action items configuration
  const quickActions = [
    {
      path: '/AdminProfile',
      icon: FaUserShield,
      title: 'Admin Profile',
      description: 'View or update your administrator profile information',
      color: '#e91e63'
    },
    {
      path: '/ViewComplaints',
      icon: FaClipboardList,
      title: 'All Complaints',
      description: 'View, update status, and manage all student complaints',
      color: '#f44336'
    },
    {
      path: '/ManageFaculty',
      icon: FaChalkboardTeacher,
      title: 'Manage Faculty',
      description: 'Add, edit, or remove faculty members from the system',
      color: '#9c27b0'
    },
    {
      path: '/ManageStudents',
      icon: FaUsers,
      title: 'Manage Students',
      description: 'View, edit, or remove student accounts and their data',
      color: '#3f51b5'
    },
    {
      path: '/AdminFeedback',
      icon: FaStar,
      title: 'System Feedback',
      description: 'Review student feedback on resolved complaints',
      color: '#ff9800'
    }
  ];

  // Load dashboard data on mount
  useEffect(() => {
    if (!token) {
      toast.error('Please log in to access the admin dashboard');
      navigate('/AdminLogin');
      return;
    }
    fetchDashboardData();
  }, [token, navigate]);

  /**
   * Fetch all dashboard data
   */
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch admin profile data
      const adminId = getAdminIdFromToken();
      if (adminId) {
        try {
          const adminRes = await axios.get(
            `http://localhost:5000/auth/Admin/AdminProfile/${adminId}`,
            { headers: { Authorization: token } }
          );
          
          setAdminData({
            name: adminRes.data.name || 'Admin',
            profileImage: adminRes.data.profileImage || '',
            profileImageUrl: adminRes.data.profileImageUrl || 
              (adminRes.data.profileImage ? `http://localhost:5000/images/image/${adminRes.data.profileImage}` : '')
          });
        } catch (error) {
          console.warn('Failed to fetch admin profile:', error);
          setAdminData({ name: 'Admin', profileImage: '', profileImageUrl: '' });
        }
      }

      // Fetch dashboard statistics
      const statsRes = await axios.get(
        'http://localhost:5000/admin-manage/dashboard-stats',
        { headers: { Authorization: token } }
      );

      const data = statsRes.data;
      setDashboardData({
        totalStudents: data.totalStudents || 0,
        totalFaculty: data.totalFaculty || 0,
        totalComplaints: data.totalComplaints || 0,
        statusCounts: data.statusCounts || {},
        recentComplaints: data.recentComplaints || [],
        systemStats: {
          activeUsers: data.activeUsers || 0,
          avgResolutionTime: data.avgResolutionTime || 0,
          satisfactionRate: data.satisfactionRate || 0
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/AdminLogin');
      } else {
        setError('Failed to load dashboard data. Please try again.');
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get status badge color
   * @param {string} status - Complaint status
   * @returns {string} - Color hex code
   */
  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': '#ff9800',
      'Acknowledged': '#9c27b0',
      'In Progress': '#2196f3',
      'On Hold': '#f44336',
      'Resolved': '#4caf50',
      'Closed': '#757575',
      'Rejected': '#f44336'
    };
    return statusColors[status] || '#757575';
  };

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
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

  /**
   * Get current time for header
   * @returns {string} - Formatted current time
   */
  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="adb-layout">
        <AdminSideBar />
        <main className="adb-content" role="main" aria-busy="true">
          <div className="adb-loading" role="status" aria-live="assertive">
            <div className="adb-spinner" aria-hidden="true"></div>
            <p>Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="adb-layout">
        <AdminSideBar />
        <main className="adb-content" role="main">
          <div className="adb-error" role="alert">
            <FaExclamationTriangle aria-hidden="true" />
            <div>
              <h2>Dashboard Error</h2>
              <p>{error}</p>
              <button 
                onClick={fetchDashboardData}
                className="adb-retry-btn"
                type="button"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="adb-layout">
      <AdminSideBar />
      <main className="adb-content" role="main" aria-labelledby="dashboard-title">
        {/* Header */}
        <header className="adb-header">
          <div className="adb-welcome-section">
            <h1 id="dashboard-title">
              <FaTachometerAlt aria-hidden="true" />
              Welcome, {adminData.name}
            </h1>
            <p>Manage the complaint system and oversee operations</p>
          </div>
          <div className="adb-date-time">
            <span>{getCurrentTime()}</span>
          </div>
        </header>

        {/* Statistics Overview */}
        <section className="adb-stats-section" aria-labelledby="stats-title">
          <h2 className="adb-section-title" id="stats-title">
            <FaTachometerAlt aria-hidden="true" />
            System Overview
          </h2>
          
          <div className="adb-stats-grid">
            <div className="adb-stat-card adb-students">
              <FaUsers className="adb-stat-icon" aria-hidden="true" />
              <div className="adb-stat-info">
                <h3>{dashboardData.totalStudents}</h3>
                <p>Total Students</p>
              </div>
            </div>

            <div className="adb-stat-card adb-faculty">
              <FaChalkboardTeacher className="adb-stat-icon" aria-hidden="true" />
              <div className="adb-stat-info">
                <h3>{dashboardData.totalFaculty}</h3>
                <p>Total Faculty</p>
              </div>
            </div>

            <div className="adb-stat-card adb-complaints">
              <FaClipboardList className="adb-stat-icon" aria-hidden="true" />
              <div className="adb-stat-info">
                <h3>{dashboardData.totalComplaints}</h3>
                <p>Total Complaints</p>
              </div>
            </div>

            <div className="adb-stat-card adb-pending">
              <FaClock className="adb-stat-icon" aria-hidden="true" />
              <div className="adb-stat-info">
                <h3>{dashboardData.statusCounts['Pending'] || 0}</h3>
                <p>Pending Complaints</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="adb-quick-actions" aria-labelledby="actions-title">
          <h2 className="adb-section-title" id="actions-title">
            <FaUserShield aria-hidden="true" />
            Quick Actions
          </h2>
          
          <div className="adb-action-cards">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className="adb-action-card"
                  aria-label={`Navigate to ${action.title}`}
                >
                  <IconComponent 
                    className="adb-card-icon" 
                    style={{ color: action.color }}
                    aria-hidden="true" 
                  />
                  <div className="adb-card-content">
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Status Overview */}
        <section className="adb-status-overview" aria-labelledby="status-title">
          <h3 className="adb-status-title" id="status-title">
            <FaClipboardList aria-hidden="true" />
            Complaint Status Overview
          </h3>
          
          <div className="adb-status-grid">
            {Object.entries(dashboardData.statusCounts).map(([status, count]) => (
              <div key={status} className="adb-status-item">
                <div 
                  className="adb-status-color"
                  style={{ backgroundColor: getStatusColor(status) }}
                  aria-hidden="true"
                ></div>
                <div className="adb-status-info">
                  <span className="adb-status-name">{status}</span>
                  <span className="adb-status-count">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Complaints */}
        <section className="adb-recent-section" aria-labelledby="recent-title">
          <header className="adb-recent-header">
            <h3 className="adb-recent-title" id="recent-title">
              <FaClock aria-hidden="true" />
              Recent Complaints
            </h3>
            <Link to="/ViewComplaints" className="adb-view-all">
              View All Complaints
            </Link>
          </header>

          {dashboardData.recentComplaints.length > 0 ? (
            <div className="adb-complaints-list">
              {dashboardData.recentComplaints.slice(0, 5).map((complaint) => (
                <article key={complaint._id} className="adb-complaint-card">
                  <header className="adb-complaint-header">
                    <h4>{complaint.ComplaintTitle || 'Untitled Complaint'}</h4>
                    <span 
                      className="adb-status-badge"
                      style={{ backgroundColor: getStatusColor(complaint.status) }}
                    >
                      {complaint.status}
                    </span>
                  </header>
                  
                  <div className="adb-complaint-meta">
                    <div className="adb-meta-item">
                      <span className="adb-meta-label">Student</span>
                      <span className="adb-meta-value">
                        {complaint.Name || 'Unknown'} (@{complaint.UserName || 'unknown'})
                      </span>
                    </div>
                    <div className="adb-meta-item">
                      <span className="adb-meta-label">Type</span>
                      <span className="adb-meta-value">{complaint.ProblemType || 'N/A'}</span>
                    </div>
                    <div className="adb-meta-item">
                      <span className="adb-meta-label">Date</span>
                      <span className="adb-meta-value">{formatDate(complaint.ComplaintDateTime)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="adb-empty-state">
              <FaClipboardList className="adb-empty-icon" aria-hidden="true" />
              <h3 className="adb-empty-title">No Recent Complaints</h3>
              <p className="adb-empty-text">
                There are no recent complaints to display
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashBoard;