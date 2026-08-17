import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import FacultySideBar from '../../components/FacultySideBar';
import '../../components//css/FacultyHistory.css';
import {
  FaHistory, FaCheckCircle, FaTimes, FaBan, FaClipboardList,
  FaUser, FaCalendarAlt, FaImage, FaChartLine
} from 'react-icons/fa';

/**
 * FacultyHistory Component  
 * Shows completed complaints history with comprehensive statistics
 */
export default function FacultyHistory() {
  // State management
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [infoRequests, setInfoRequests] = useState({});
  const [lightbox, setLightbox] = useState({ show: false, src: '', title: '' });
  const [statistics, setStatistics] = useState({
    total: 0,
    resolved: 0,
    closed: 0,
    rejected: 0,
    averageResolutionTime: 0
  });

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

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

  // Filter options
  const filterOptions = [
    { key: 'All', label: 'All Completed', icon: FaHistory },
    { key: 'Resolved', label: 'Resolved', icon: FaCheckCircle },
    { key: 'Closed', label: 'Closed', icon: FaTimes },
    { key: 'Rejected', label: 'Rejected', icon: FaBan }
  ];

  // Load data on component mount
  useEffect(() => {
    if (!token || !facultyId) {
      toast.error('Please log in to access history');
      navigate('/FacultyAuth');
      return;
    }
    fetchHistory();
  }, [token, facultyId, navigate]);

  // Filter complaints when status filter changes
  useEffect(() => {
    filterComplaintsByStatus();
  }, [complaints, statusFilter]);

  /**
   * Fetch complaint history for this faculty member
   */
  const fetchHistory = async () => {
    try {
      setLoading(true);

      // Fetch completed complaints handled by this faculty
      const response = await axios.get(
        `http://localhost:5000/complain/viewcomplains/history/${facultyId}`,
        { headers: { Authorization: token } }
      );

      const complaintsData = Array.isArray(response.data) ? response.data : [];
      setComplaints(complaintsData);

      // Calculate comprehensive statistics
      const stats = complaintsData.reduce((acc, complaint) => {
        acc.total++;
        switch (complaint.status) {
          case 'Resolved': acc.resolved++; break;
          case 'Closed': acc.closed++; break;
          case 'Rejected': acc.rejected++; break;
        }

        // Calculate resolution time if both dates exist
        if (complaint.ComplaintDateTime && complaint.updatedAt) {
          const submitTime = new Date(complaint.ComplaintDateTime);
          const resolveTime = new Date(complaint.updatedAt);
          const timeDiff = resolveTime - submitTime;
          acc.totalResolutionTime += timeDiff;
          acc.resolutionCount++;
        }

        return acc;
      }, { 
        total: 0, resolved: 0, closed: 0, rejected: 0, 
        totalResolutionTime: 0, resolutionCount: 0 
      });

      // Calculate average resolution time in days
      stats.averageResolutionTime = stats.resolutionCount > 0 
        ? Math.round(stats.totalResolutionTime / (stats.resolutionCount * 24 * 60 * 60 * 1000))
        : 0;

      setStatistics(stats);

      // Fetch info requests for each complaint
      const infoRequestsPromises = complaintsData.map(complaint =>
        axios.get(`http://localhost:5000/info-requests/complaint/${complaint._id}`, {
          headers: { Authorization: token }
        }).catch(() => ({ data: [] }))
      );

      const infoRequestsResponses = await Promise.all(infoRequestsPromises);
      const infoRequestsMap = {};
      
      complaintsData.forEach((complaint, index) => {
        infoRequestsMap[complaint._id] = infoRequestsResponses[index].data || [];
      });

      setInfoRequests(infoRequestsMap);
    } catch (error) {
      console.error('Error fetching history:', error);
      if ([401, 403].includes(error.response?.status)) {
        localStorage.removeItem('token');
        toast.error('Session expired. Please log in again.');
        navigate('/FacultyAuth');
      } else {
        toast.error('Failed to load complaint history');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter complaints based on selected status
   */
  const filterComplaintsByStatus = () => {
    if (statusFilter === 'All') {
      setFilteredComplaints(complaints);
    } else {
      setFilteredComplaints(complaints.filter(c => c.status === statusFilter));
    }
  };

  /**
   * Get status color for badges
   */
  const getStatusColor = (status) => {
    const colors = {
      'Resolved': '#28a745',
      'Closed': '#6c757d', 
      'Rejected': '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  /**
   * Format date display
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

  // Loading state
  if (loading) {
    return (
      <div className="fh-layout">
        <FacultySideBar />
        <div className="fh-content">
          <div className="fh-loading">
            <div className="fh-spinner"></div>
            Loading History...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fh-layout">
      <FacultySideBar />
      <div className="fh-content">
        {/* Header */}
        <div className="fh-header">
          <div className="fh-header-content">
            <h1>
              <FaHistory />
              Complaint History
            </h1>
            <p>Review all complaints you have successfully handled and completed</p>

            {/* Comprehensive Statistics Overview */}
            <div className="fh-stats-overview">
              <div className="fh-stat-card fh-total">
                <FaClipboardList className="fh-stat-icon" />
                <div className="fh-stat-info">
                  <h3>{statistics.total}</h3>
                  <p>Total Handled</p>
                </div>
              </div>
              
              <div className="fh-stat-card fh-resolved">
                <FaCheckCircle className="fh-stat-icon" />
                <div className="fh-stat-info">
                  <h3>{statistics.resolved}</h3>
                  <p>Resolved</p>
                </div>
              </div>
              
              <div className="fh-stat-card fh-closed">
                <FaTimes className="fh-stat-icon" />
                <div className="fh-stat-info">
                  <h3>{statistics.closed}</h3>
                  <p>Closed</p>
                </div>
              </div>
              
              <div className="fh-stat-card fh-rejected">
                <FaBan className="fh-stat-icon" />
                <div className="fh-stat-info">
                  <h3>{statistics.rejected}</h3>
                  <p>Rejected</p>
                </div>
              </div>
              
              <div className="fh-stat-card fh-time">
                <FaChartLine className="fh-stat-icon" />
                <div className="fh-stat-info">
                  <h3>{statistics.averageResolutionTime}</h3>
                  <p>Avg Days</p>
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="fh-filters">
              {filterOptions.map(filter => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`fh-filter-btn ${statusFilter === filter.key ? 'fh-active' : ''}`}
                  >
                    <Icon />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="fh-complaints-list">
          {filteredComplaints.length === 0 ? (
            <div className="fh-empty-state">
              <FaHistory className="fh-empty-icon" />
              <h3>No History Found</h3>
              <p>No completed complaints match the selected filter</p>
            </div>
          ) : (
            filteredComplaints.map(complaint => (
              <div key={complaint._id} className="fh-complaint-card">
                {/* Card Header */}
                <div className="fh-card-header">
                  <div className="fh-complaint-title">
                    <FaCheckCircle className="fh-status-icon" />
                    <h3>{complaint.ComplaintTitle}</h3>
                  </div>
                  <span 
                    className="fh-status-badge"
                    style={{ backgroundColor: getStatusColor(complaint.status) }}
                  >
                    {complaint.status}
                  </span>
                </div>

                {/* Card Body */}
                <div className="fh-card-body">
                  {/* Complaint Meta */}
                  <div className="fh-complaint-meta">
                    <span className="fh-type-badge">{complaint.ProblemType}</span>
                    <div className="fh-dates">
                      <span><strong>Submitted:</strong> {formatDate(complaint.ComplaintDateTime)}</span>
                      <span><strong>Completed:</strong> {formatDate(complaint.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Student Information */}
                  <div className="fh-student-info">
                    <h4><FaUser /> Student Information</h4>
                    <div className="fh-student-details">
                      <p><strong>Name:</strong> {complaint.Name || 'Unknown'}</p>
                      <p><strong>Username:</strong> @{complaint.UserName || 'unknown'}</p>
                      <p><strong>Email:</strong> {complaint.Email || 'Not provided'}</p>
                      <p><strong>Contact:</strong> {complaint.ContactNumber || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="fh-description">
                    <strong>Description:</strong>
                    <p>{complaint.ProblemDescription}</p>
                  </div>

                  {/* Original Attachment */}
                  {complaint.attachment && (
                    <div className="fh-attachment-section">
                      <strong>Original Complaint Attachment:</strong>
                      <div className="fh-image-container">
                        <img
                          src={`http://localhost:5000/images/image/${complaint.attachment}`}
                          alt="Complaint attachment"
                          className="fh-attachment-image"
                          onClick={() => setLightbox({
                            show: true,
                            src: `http://localhost:5000/images/image/${complaint.attachment}`,
                            title: 'Complaint Attachment'
                          })}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div style={{ display: 'none', padding: '20px', textAlign: 'center' }}>
                          Unable to preview attachment
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Information Exchange History */}
                  {infoRequests[complaint._id] && infoRequests[complaint._id].length > 0 && (
                    <div className="fh-info-exchange">
                      <strong>Information Exchange History:</strong>
                      {infoRequests[complaint._id].map((req, index) => (
                        <div key={index} className="fh-exchange-item">
                          <div className="fh-faculty-request">
                            <span className="fh-exchange-label">Faculty Request:</span>
                            <p>{req.facultyMessage}</p>
                            <span className="fh-exchange-date">
                              {formatDate(req.createdAt)}
                            </span>
                          </div>
                          
                          {req.studentResponse && (
                            <div className="fh-student-response">
                              <span className="fh-exchange-label">Student Response:</span>
                              <p>{req.studentResponse}</p>
                              <span className="fh-exchange-date">
                                {formatDate(req.responseDate)}
                              </span>
                              
                              {req.responseAttachment && (
                                <div className="fh-response-attachment">
                                  <strong>Response Attachment:</strong>
                                  <div className="fh-image-container">
                                    <img
                                      src={`http://localhost:5000/images/image/${req.responseAttachment}`}
                                      alt="Response attachment"
                                      className="fh-attachment-image"
                                      onClick={() => setLightbox({
                                        show: true,
                                        src: `http://localhost:5000/images/image/${req.responseAttachment}`,
                                        title: 'Response Attachment'
                                      })}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lightbox for images */}
        {lightbox.show && (
          <div className="fh-lightbox-overlay" onClick={() => setLightbox({ show: false, src: '', title: '' })}>
            <div className="fh-lightbox-content" onClick={e => e.stopPropagation()}>
              <div className="fh-lightbox-header">
                <h4>{lightbox.title}</h4>
                <button
                  className="fh-lightbox-close"
                  onClick={() => setLightbox({ show: false, src: '', title: '' })}
                >
                  ×
                </button>
              </div>
              <img src={lightbox.src} alt={lightbox.title} className="fh-lightbox-image" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
