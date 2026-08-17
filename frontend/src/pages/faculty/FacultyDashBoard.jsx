import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import FacultySideBar from '../../components/FacultySideBar';
import '../../components/css/FacultyDashboard.css';
import {
  FaUserCircle, FaListUl, FaHistory, FaChartLine, FaClock, 
  FaCheckCircle, FaExclamationTriangle, FaTachometerAlt, 
  FaClipboardList, FaCalendarAlt, FaPlay, FaPause
} from 'react-icons/fa';

/**
 * FacultyDashBoard Component
 * Main dashboard for faculty users showing accurate complaint statistics,
 * quick actions, and recent assignments with enhanced UX
 */
export default function FacultyDashBoard() {
  // State management
  const [facultyData, setFacultyData] = useState({
    _id: '', name: '', email: '', department: '', responsibleFor: []
  });
  
  const [dashboardData, setDashboardData] = useState({
    // Active complaints statistics
    assignedComplaints: 0,
    activeComplaints: 0,
    pendingComplaints: 0,
    acknowledgedComplaints: 0,
    inProgressComplaints: 0,
    onHoldComplaints: 0,
    
    // Historical statistics  
    totalHandled: 0,
    resolvedComplaints: 0,
    closedComplaints: 0,
    rejectedComplaints: 0,
    
    // Additional data
    categories: [],
    recentComplaints: [],
    statusCounts: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Extract faculty ID from JWT token
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

  // Quick action items configuration
  const quickActions = [
    {
      path: '/FacultyProfile',
      icon: FaUserCircle,
      title: 'My Profile',
      description: 'Manage your profile and responsible categories',
      color: '#2e7d32'
    },
    {
      path: '/FacultyViewComplaints', 
      icon: FaClipboardList,
      title: 'Assigned Complaints',
      description: 'View and process your assigned complaints',
      color: '#388e3c'
    },
    {
      path: '/FacultyHistory',
      icon: FaHistory,
      title: 'Complaint History', 
      description: 'Review all handled complaints history',
      color: '#4caf50'
    }
  ];

  // Load dashboard data on mount
  useEffect(() => {
    if (!token || !facultyId) {
      toast.error('Please log in to access dashboard');
      navigate('/FacultyAuth');
      return;
    }
    fetchAllData();
  }, [token, facultyId, navigate]);

  /**
   * Fetch all dashboard data from backend APIs with proper error handling
   */
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch faculty profile information
      const profileRes = await axios.get(
        `http://localhost:5000/auth/Faculty/FacultyProfile/${facultyId}`,
        { headers: { Authorization: token } }
      );
      
      const facultyInfo = profileRes.data;
      setFacultyData({
        _id: facultyInfo._id || facultyId,
        name: facultyInfo.name || 'Faculty Member',
        email: facultyInfo.email || '',
        department: facultyInfo.department || '',
        responsibleFor: facultyInfo.responsibleFor || []
      });

      // Parallel requests for complaint data
      const [activeRes, historyRes] = await Promise.all([
        axios.get(`http://localhost:5000/complain/viewcomplains/active/${facultyId}`, {
          headers: { Authorization: token }
        }),
        axios.get(`http://localhost:5000/complain/viewcomplains/history/${facultyId}`, {
          headers: { Authorization: token }
        })
      ]);

      const activeComplaints = Array.isArray(activeRes.data) ? activeRes.data : [];
      const handledComplaints = Array.isArray(historyRes.data) ? historyRes.data : [];

      // Filter only complaints handled by this faculty (not assigned to others)
      const myActiveComplaints = activeComplaints.filter(complaint => 
        !complaint.assignedToOther
      );

      // Calculate detailed statistics
      const statusCounts = {
        Pending: 0,
        Acknowledged: 0,
        'In Progress': 0,
        'On Hold': 0
      };

      myActiveComplaints.forEach(complaint => {
        if (complaint.status && statusCounts.hasOwnProperty(complaint.status)) {
          statusCounts[complaint.status]++;
        }
      });

      // Calculate historical statistics
      const historicalStats = handledComplaints.reduce((acc, complaint) => {
        switch (complaint.status) {
          case 'Resolved': acc.resolved++; break;
          case 'Closed': acc.closed++; break;
          case 'Rejected': acc.rejected++; break;
        }
        return acc;
      }, { resolved: 0, closed: 0, rejected: 0 });

      // Get 5 most recent active complaints
      const recentComplaints = [...myActiveComplaints]
        .sort((a, b) => new Date(b.ComplaintDateTime) - new Date(a.ComplaintDateTime))
        .slice(0, 5);

      setDashboardData({
        // Active complaints
        assignedComplaints: myActiveComplaints.length,
        activeComplaints: myActiveComplaints.length,
        pendingComplaints: statusCounts.Pending,
        acknowledgedComplaints: statusCounts.Acknowledged,
        inProgressComplaints: statusCounts['In Progress'],
        onHoldComplaints: statusCounts['On Hold'],
        
        // Historical data
        totalHandled: handledComplaints.length,
        resolvedComplaints: historicalStats.resolved,
        closedComplaints: historicalStats.closed,
        rejectedComplaints: historicalStats.rejected,
        
        // Additional data
        categories: facultyInfo.responsibleFor || [],
        recentComplaints,
        statusCounts
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if ([401, 403].includes(error.response?.status)) {
        localStorage.removeItem('token');
        toast.error('Session expired. Please log in again.');
        navigate('/FacultyAuth');
      } else {
        setError('Failed to load dashboard data. Please try again.');
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get color for complaint status badge
   */
  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': '#ffc107',
      'Acknowledged': '#17a2b8',
      'In Progress': '#fd7e14', 
      'On Hold': '#6f42c1',
      'Resolved': '#28a745',
      'Closed': '#6c757d',
      'Rejected': '#dc3545'
    };
    return statusColors[status] || '#6c757d';
  };

  /**
   * Format date string for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  /**
   * Get current time for header display
   */
  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="fdb-layout">
        <FacultySideBar />
        <div className="fdb-content">
          <div className="fdb-loading">
            <div className="fdb-spinner"></div>
            Loading Dashboard...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fdb-layout">
        <FacultySideBar />
        <div className="fdb-content">
          <div className="fdb-error">
            <FaExclamationTriangle />
            <p>{error}</p>
            <button onClick={fetchAllData} className="fdb-retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fdb-layout">
      <FacultySideBar />
      <div className="fdb-content">
        {/* Header Section */}
        <div className="fdb-header">
          <div className="fdb-welcome-section">
            <h1>
              <FaTachometerAlt />
              Welcome, {facultyData.name}
            </h1>
            <p>Faculty Dashboard - {facultyData.department}</p>
          </div>
          <div className="fdb-date-time">
            <span>{getCurrentTime()}</span>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="fdb-stats-section">
          <h2 className="fdb-section-title">
            <FaChartLine />
            Active Complaints Overview
          </h2>
          
          <div className="fdb-stats-grid">
            <div className="fdb-stat-card fdb-assigned">
              <FaClipboardList className="fdb-stat-icon" />
              <div className="fdb-stat-info">
                <h3>{dashboardData.assignedComplaints}</h3>
                <p>Total Assigned</p>
              </div>
            </div>
            
            <div className="fdb-stat-card fdb-pending">
              <FaClock className="fdb-stat-icon" />
              <div className="fdb-stat-info">
                <h3>{dashboardData.pendingComplaints}</h3>
                <p>Pending</p>
              </div>
            </div>
            
            <div className="fdb-stat-card fdb-progress">
              <FaPlay className="fdb-stat-icon" />
              <div className="fdb-stat-info">
                <h3>{dashboardData.inProgressComplaints}</h3>
                <p>In Progress</p>
              </div>
            </div>
            
            <div className="fdb-stat-card fdb-resolved">
              <FaCheckCircle className="fdb-stat-icon" />
              <div className="fdb-stat-info">
                <h3>{dashboardData.totalHandled}</h3>
                <p>Total Handled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="fdb-quick-actions">
          <h2 className="fdb-section-title">
            <FaListUl />
            Quick Actions
          </h2>
          
          <div className="fdb-action-cards">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link key={action.path} to={action.path} className="fdb-action-card">
                  <Icon className="fdb-card-icon" />
                  <div className="fdb-card-content">
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="fdb-recent-complaints">
          <div className="fdb-recent-header">
            <h2 className="fdb-recent-title">
              <FaCalendarAlt />
              Recent Assignments
            </h2>
            <Link to="/FacultyViewComplaints" className="fdb-view-all">
              View All
            </Link>
          </div>

          <div className="fdb-complaints-list">
            {dashboardData.recentComplaints.length === 0 ? (
              <div className="fdb-empty-state">
                <FaClipboardList className="fdb-empty-icon" />
                <h3 className="fdb-empty-title">No Recent Complaints</h3>
                <p className="fdb-empty-text">No complaints have been assigned to you recently.</p>
              </div>
            ) : (
              dashboardData.recentComplaints.map(complaint => (
                <div key={complaint._id} className="fdb-complaint-card">
                  <div className="fdb-complaint-header">
                    <h3 className="fdb-complaint-title">{complaint.ComplaintTitle}</h3>
                    <span 
                      className="fdb-status-badge"
                      style={{ backgroundColor: getStatusColor(complaint.status) }}
                    >
                      {complaint.status}
                    </span>
                  </div>
                  
                  <div className="fdb-complaint-meta">
                    <div className="fdb-meta-item">
                      <span className="fdb-meta-label">Student</span>
                      <span className="fdb-meta-value">{complaint.Name}</span>
                    </div>
                    <div className="fdb-meta-item">
                      <span className="fdb-meta-label">Type</span>
                      <span className="fdb-meta-value">{complaint.ProblemType}</span>
                    </div>
                    <div className="fdb-meta-item">
                      <span className="fdb-meta-label">Submitted</span>
                      <span className="fdb-meta-value">{formatDate(complaint.ComplaintDateTime)}</span>
                    </div>
                  </div>
                  
                  <div className="fdb-complaint-description">
                    <p>
                      {complaint.ProblemDescription.length > 100 
                        ? `${complaint.ProblemDescription.substring(0, 100)}...` 
                        : complaint.ProblemDescription
                      }
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
