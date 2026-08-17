import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  FaTrashAlt, FaEye, FaPaperclip, FaInfoCircle, FaDownload, 
  FaClipboardList, FaUserCircle, FaCalendarAlt, FaFlag, FaTimes, 
  FaExclamationTriangle, FaSpinner, FaSearch, FaUser, FaChartBar
} from "react-icons/fa";
import AdminSideBar from "../../components/AdminSideBar";
import "../../components/css/ViewComplaints.css";

/**
 * Simplified ViewComplaints Component
 * Essential complaint management with faculty tracking and basic filtering
 */
export default function ViewComplaints() {
  // Core state
  const [complaints, setComplaints] = useState([]);
  const [infoRequests, setInfoRequests] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showFacultyStatsModal, setShowFacultyStatsModal] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState(null);
  
  // Simple filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFaculty, setFilterFaculty] = useState('all');
  
  // Faculty stats
  const [facultyStats, setFacultyStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  const token = localStorage.getItem("token");

  const statusOptions = [
    'Pending', 'Acknowledged', 'In Progress', 'On Hold', 
    'Resolved', 'Closed', 'Rejected'
  ];

  // Load complaints on mount
  useEffect(() => {
    if (!token) {
      toast.error("Please log in first");
      return;
    }
    fetchComplaints();
  }, [token]);

  /**
   * Fetch complaints and info requests
   */
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/complain/viewcomplains", {
        headers: { Authorization: token },
      });

      const complaintsData = Array.isArray(data) ? data : [];
      setComplaints(complaintsData);

      // Fetch info requests
      const infoMap = {};
      if (complaintsData.length > 0) {
        await Promise.all(
          complaintsData.map(async (complaint) => {
            if (complaint?._id) {
              try {
                const res = await axios.get(
                  `http://localhost:5000/info-requests/complaint/${complaint._id}`,
                  { headers: { Authorization: token } }
                );
                if (Array.isArray(res.data) && res.data.length > 0) {
                  infoMap[complaint._id] = res.data;
                }
              } catch (error) {
                console.warn(`Failed to fetch info requests for complaint ${complaint._id}`);
              }
            }
          })
        );
      }
      setInfoRequests(infoMap);
    } catch (error) {
      console.error("Fetch complaints error:", error);
      toast.error("Failed to fetch complaints");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete complaint
   */
  const deleteComplaint = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await axios.delete(`http://localhost:5000/complain/viewcomplains/${id}`, {
        headers: { Authorization: token },
      });
      toast.success("Complaint deleted successfully");
      fetchComplaints();
    } catch (error) {
      console.error("Delete complaint error:", error);
      toast.error("Failed to delete complaint");
    }
  };

  /**
   * Update complaint status
   */
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/complain/viewcomplains/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: token } }
      );

      // Create feedback request for final statuses
      const finalStatuses = ['Resolved', 'Closed', 'Rejected'];
      if (finalStatuses.includes(newStatus)) {
        try {
          await axios.post(
            "http://localhost:5000/feedback/create-request",
            { complaintId: id },
            { headers: { Authorization: token } }
          );
        } catch (feedbackError) {
          console.warn("Failed to create feedback request:", feedbackError);
        }
      }

      toast.success(`Status updated to "${newStatus}"!`);
      fetchComplaints();
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status");
    }
  };

  /**
   * Fetch faculty stats
   */
  const fetchFacultyStats = async (facultyId, facultyName) => {
    setStatsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/feedback/stats/faculty/${facultyId}`, {
        headers: { Authorization: token }
      });
      
      setFacultyStats({
        ...res.data,
        facultyName,
        facultyId
      });
      setShowFacultyStatsModal(true);
    } catch (error) {
      console.error("Fetch faculty stats error:", error);
      toast.error("Failed to fetch faculty statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  /**
   * Utility functions
   */
  const getStatusColor = (status) => {
    const colors = {
      Pending: "#ff9800", Acknowledged: "#9c27b0", "In Progress": "#2196f3",
      "On Hold": "#f44336", Resolved: "#4caf50", Closed: "#757575", Rejected: "#f44336"
    };
    return colors[status] || "#757575";
  };

  const truncateString = (str, maxLength = 50) => {
    if (!str || typeof str !== "string") return "N/A";
    return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getStudentInitials = (name) => {
    if (!name) return 'ST';
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  const getFacultyInitials = (name) => {
    if (!name) return 'FA';
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  /**
   * Get unique faculty for filter
   */
  const getUniqueFaculty = () => {
    const facultySet = new Set();
    complaints.forEach(complaint => {
      if (complaint.lastUpdatedBy?.name) {
        facultySet.add(JSON.stringify({
          id: complaint.lastUpdatedBy._id,
          name: complaint.lastUpdatedBy.name
        }));
      }
    });
    return Array.from(facultySet).map(item => JSON.parse(item));
  };

  /**
   * Filter complaints
   */
  const getFilteredComplaints = () => {
    return complaints.filter(complaint => {
      const matchesSearch = !searchTerm || 
        complaint.ComplaintTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.lastUpdatedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
      
      const matchesFaculty = filterFaculty === 'all' || 
        (filterFaculty === 'unassigned' && !complaint.lastUpdatedBy) ||
        complaint.lastUpdatedBy?._id === filterFaculty;

      return matchesSearch && matchesStatus && matchesFaculty;
    }).sort((a, b) => new Date(b.ComplaintDateTime) - new Date(a.ComplaintDateTime));
  };

  const filteredComplaints = getFilteredComplaints();
  const uniqueFaculty = getUniqueFaculty();

  // Loading state
  if (loading) {
    return (
      <div className="vc-layout">
        <AdminSideBar />
        <div className="vc-content">
          <div className="vc-loading">
            <div className="vc-spinner"></div>
            Loading complaints...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vc-layout">
      <AdminSideBar />
      <div className="vc-content">
        {/* Header */}
        <div className="vc-header">
          <div className="vc-header-content">
            <h1>
              <FaClipboardList />
              Complaint Management
            </h1>
            <p>Track complaints and faculty assignments</p>
          </div>
        </div>

        {/* Simple Filters */}
        <div className="vc-filters-section">
          <div className="vc-filters-title">
            <FaSearch />
            Filters
          </div>

          {/* Search */}
          <div className="vc-search-box">
            <FaSearch className="vc-search-icon" />
            <input
              type="text"
              placeholder="Search complaints, students, or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="vc-search-input"
            />
          </div>

          {/* Filter Grid */}
          <div className="vc-filters-grid">
            <div className="vc-filter-group">
              <label className="vc-filter-label">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="vc-filter-select"
              >
                <option value="all">All Status ({complaints.length})</option>
                {statusOptions.map(status => {
                  const count = complaints.filter(c => c.status === status).length;
                  return count > 0 ? (
                    <option key={status} value={status}>{status} ({count})</option>
                  ) : null;
                })}
              </select>
            </div>

            <div className="vc-filter-group">
              <label className="vc-filter-label">Faculty</label>
              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="vc-filter-select"
              >
                <option value="all">All Faculty</option>
                <option value="unassigned">Unassigned ({complaints.filter(c => !c.lastUpdatedBy).length})</option>
                {uniqueFaculty.map(faculty => {
                  const count = complaints.filter(c => c.lastUpdatedBy?._id === faculty.id).length;
                  return (
                    <option key={faculty.id} value={faculty.id}>{faculty.name} ({count})</option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="vc-results-text">
            Showing {filteredComplaints.length} of {complaints.length} complaints
          </div>
        </div>

        {/* Complaints Table */}
        {filteredComplaints.length === 0 ? (
          <div className="vc-empty-state">
            <FaClipboardList className="vc-empty-icon" />
            <h2 className="vc-empty-title">No Complaints Found</h2>
            <p className="vc-empty-text">
              {searchTerm || filterStatus !== 'all' || filterFaculty !== 'all'
                ? 'No complaints match your current filters.'
                : 'No complaints to display.'}
            </p>
          </div>
        ) : (
          <div className="vc-table-container">
            <table className="vc-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Faculty</th>
                  <th>Attachments</th>
                  <th>Info Requests</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint, index) => (
                  <tr key={complaint._id || index}>
                    <td>{index + 1}</td>

                    {/* Student Info */}
                    <td>
                      <div className="vc-student-info">
                        <div className="vc-student-avatar">
                          {getStudentInitials(complaint.Name)}
                        </div>
                        <div>
                          <div className="vc-student-name">{complaint.Name || "Unknown"}</div>
                          <div className="vc-student-username">@{complaint.UserName || "unknown"}</div>
                        </div>
                      </div>
                    </td>

                    {/* Title */}
                    <td>
                      <div className="vc-complaint-title" title={complaint.ComplaintTitle}>
                        {truncateString(complaint.ComplaintTitle, 30)}
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="vc-type-badge">{complaint.ProblemType || "N/A"}</span>
                    </td>

                    {/* Date */}
                    <td className="vc-date-cell">
                      {complaint.ComplaintDateTime ? formatDate(complaint.ComplaintDateTime) : "N/A"}
                    </td>

                    {/* Status */}
                    <td>
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                        className="vc-status-select"
                        style={{ borderColor: getStatusColor(complaint.status) }}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>

                    {/* Faculty */}
                    <td>
                      {complaint.lastUpdatedBy ? (
                        <div className="vc-faculty-info">
                          <div className="vc-faculty-avatar">
                            {getFacultyInitials(complaint.lastUpdatedBy.name)}
                          </div>
                          <div className="vc-faculty-details">
                            <div className="vc-faculty-name">
                              {truncateString(complaint.lastUpdatedBy.name, 12)}
                            </div>
                            <button
                              className="vc-faculty-stats-btn"
                              onClick={() => fetchFacultyStats(
                                complaint.lastUpdatedBy._id, 
                                complaint.lastUpdatedBy.name
                              )}
                              disabled={statsLoading}
                            >
                              <FaChartBar />
                              Stats
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="vc-unassigned">
                          <FaUser />
                          Unassigned
                        </div>
                      )}
                    </td>

                    {/* Attachments */}
                    <td>
                      {complaint.attachment ? (
                        <div className="vc-attachment-actions">
                          <button
                            className="vc-btn vc-btn-attachment"
                            onClick={() => {
                              setAttachmentUrl(`http://localhost:5000/images/image/${complaint.attachment}`);
                              setShowAttachmentModal(true);
                            }}
                          >
                            <FaEye />
                          </button>
                          <button
                            className="vc-btn vc-btn-info"
                            onClick={() => {
                              const url = `http://localhost:5000/images/image/${complaint.attachment}`;
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = complaint.attachment;
                              link.click();
                            }}
                          >
                            <FaDownload />
                          </button>
                        </div>
                      ) : (
                        <span className="vc-no-attachment">None</span>
                      )}
                    </td>

                    {/* Info Requests */}
                    <td>
                      {(infoRequests[complaint._id]?.length ?? 0) > 0 ? (
                        <button
                          className="vc-btn vc-btn-info"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setShowInfoModal(true);
                          }}
                        >
                          <FaInfoCircle />
                          {infoRequests[complaint._id].length}
                        </button>
                      ) : (
                        <span className="vc-no-requests">None</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="vc-action-buttons">
                        <button
                          className="vc-btn vc-btn-view"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setShowDetailsModal(true);
                          }}
                        >
                          <FaEye />
                        </button>
                        <button
                          className="vc-btn vc-btn-delete"
                          onClick={() => deleteComplaint(complaint._id, complaint.ComplaintTitle)}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedComplaint && (
          <div className="vc-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="vc-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="vc-modal-header">
                <h2 className="vc-modal-title">Complaint Details</h2>
                <button className="vc-modal-close" onClick={() => setShowDetailsModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="vc-modal-body">
                <div className="vc-complaint-details">
                  <div className="vc-detail-section">
                    <h3 className="vc-detail-title">Basic Information</h3>
                    <div className="vc-detail-grid">
                      <div className="vc-detail-item">
                        <span className="vc-detail-label">Title</span>
                        <span className="vc-detail-value">{selectedComplaint.ComplaintTitle}</span>
                      </div>
                      <div className="vc-detail-item">
                        <span className="vc-detail-label">Category</span>
                        <span className="vc-detail-value">{selectedComplaint.ProblemType}</span>
                      </div>
                      <div className="vc-detail-item">
                        <span className="vc-detail-label">Status</span>
                        <span 
                          className="vc-status-badge"
                          style={{ backgroundColor: getStatusColor(selectedComplaint.status) }}
                        >
                          {selectedComplaint.status}
                        </span>
                      </div>
                      <div className="vc-detail-item">
                        <span className="vc-detail-label">Date Filed</span>
                        <span className="vc-detail-value">{formatDate(selectedComplaint.ComplaintDateTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="vc-detail-section">
                    <h3 className="vc-detail-title">Student Information</h3>
                    <div className="vc-detail-grid">
                      <div className="vc-detail-item">
                        <span className="vc-detail-label">Name</span>
                        <span className="vc-detail-value">{selectedComplaint.Name}</span>
                      </div>
                      <div className="vc-detail-item">
                        <span className="vc-detail-label">Username</span>
                        <span className="vc-detail-value">{selectedComplaint.UserName}</span>
                      </div>
                      <div className="vc-detail-item">
                        <span className="vc-detail-label">Email</span>
                        <span className="vc-detail-value">{selectedComplaint.Email || 'Not provided'}</span>
                      </div>
                      <div className="vc-detail-item">
                        <span className="vc-detail-label">Contact</span>
                        <span className="vc-detail-value">{selectedComplaint.ContactNumber || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedComplaint.lastUpdatedBy && (
                    <div className="vc-detail-section">
                      <h3 className="vc-detail-title">Assigned Faculty</h3>
                      <div className="vc-detail-grid">
                        <div className="vc-detail-item">
                          <span className="vc-detail-label">Name</span>
                          <span className="vc-detail-value">{selectedComplaint.lastUpdatedBy.name}</span>
                        </div>
                        <div className="vc-detail-item">
                          <span className="vc-detail-label">Email</span>
                          <span className="vc-detail-value">{selectedComplaint.lastUpdatedBy.email}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="vc-detail-section">
                    <h3 className="vc-detail-title">Problem Description</h3>
                    <p className="vc-detail-content">
                      {selectedComplaint.ProblemDescription || "No description provided"}
                    </p>
                  </div>

                  {selectedComplaint.attachment && (
                    <div className="vc-detail-section">
                      <h3 className="vc-detail-title">Attachment</h3>
                      <div className="vc-image-container">
                        <img
                          src={`http://localhost:5000/images/image/${selectedComplaint.attachment}`}
                          alt="Complaint attachment"
                          className="vc-attachment-image"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Requests Modal */}
        {showInfoModal && selectedComplaint && (
          <div className="vc-modal-overlay" onClick={() => setShowInfoModal(false)}>
            <div className="vc-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="vc-modal-header">
                <h2 className="vc-modal-title">Information Requests</h2>
                <button className="vc-modal-close" onClick={() => setShowInfoModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="vc-modal-body">
                {infoRequests[selectedComplaint._id]?.length > 0 ? (
                  <div className="vc-info-requests">
                    {infoRequests[selectedComplaint._id].map((request, index) => (
                      <div key={request._id || index} className="vc-info-request">
                        <div className="vc-request-message">
                          <strong className="vc-message-label">Faculty Request:</strong>
                          <p className="vc-message-content">{request.facultyMessage}</p>
                          <span className="vc-message-date">
                            Requested: {formatDate(request.createdAt)}
                          </span>
                        </div>

                        <div className="vc-response-message">
                          <strong className="vc-message-label">Student Response:</strong>
                          {request.isResolved ? (
                            <>
                              <p className="vc-message-content">{request.studentResponse}</p>
                              {request.responseAttachment && (
                                <img
                                  src={`http://localhost:5000/images/image/${request.responseAttachment}`}
                                  alt="Response attachment"
                                  className="vc-attachment-image"
                                  style={{ maxHeight: '200px' }}
                                />
                              )}
                              <span className="vc-message-date">
                                Responded: {formatDate(request.responseDate)}
                              </span>
                            </>
                          ) : (
                            <p className="vc-awaiting-response">Awaiting response...</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No information requests for this complaint.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Faculty Stats Modal */}
        {showFacultyStatsModal && facultyStats && (
          <div className="vc-modal-overlay" onClick={() => setShowFacultyStatsModal(false)}>
            <div className="vc-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="vc-modal-header">
                <h2 className="vc-modal-title">Faculty Performance</h2>
                <button className="vc-modal-close" onClick={() => setShowFacultyStatsModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="vc-modal-body">
                <div className="vc-faculty-stats">
                  <div className="vc-stats-header">
                    <div className="vc-faculty-avatar-large">
                      {getFacultyInitials(facultyStats.facultyName)}
                    </div>
                    <div>
                      <h3>{facultyStats.facultyName}</h3>
                      <p>Performance Statistics</p>
                    </div>
                  </div>

                  <div className="vc-stats-grid">
                    <div className="vc-stat-card">
                      <span className="vc-stat-number">{facultyStats.complaintsHandled}</span>
                      <span className="vc-stat-label">Complaints Handled</span>
                    </div>
                    <div className="vc-stat-card">
                      <span className="vc-stat-number">{facultyStats.totalFeedbacks}</span>
                      <span className="vc-stat-label">Feedback Received</span>
                    </div>
                    <div className="vc-stat-card">
                      <span className="vc-stat-number">{facultyStats.averageRating || 0}</span>
                      <span className="vc-stat-label">Average Rating</span>
                    </div>
                    <div className="vc-stat-card">
                      <span className="vc-stat-number">
                        {Math.round((facultyStats.averageRating / 5) * 100) || 0}%
                      </span>
                      <span className="vc-stat-label">Satisfaction</span>
                    </div>
                  </div>

                  {facultyStats.totalFeedbacks > 0 && (
                    <div className="vc-rating-distribution">
                      <h4>Rating Distribution</h4>
                      {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} className="vc-rating-bar-row">
                          <span className="vc-rating-label">{rating} Star{rating !== 1 ? 's' : ''}</span>
                          <div className="vc-rating-bar">
                            <div 
                              className="vc-rating-fill"
                              style={{ 
                                width: `${(facultyStats.ratingDistribution[rating] / facultyStats.totalFeedbacks) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="vc-rating-count">
                            {facultyStats.ratingDistribution[rating] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attachment Modal */}
        {showAttachmentModal && attachmentUrl && (
          <div className="vc-modal-overlay" onClick={() => setShowAttachmentModal(false)}>
            <div className="vc-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="vc-modal-header">
                <h2 className="vc-modal-title">Attachment</h2>
                <button className="vc-modal-close" onClick={() => setShowAttachmentModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="vc-modal-body">
                <div className="vc-image-container">
                  <img src={attachmentUrl} alt="Attachment" className="vc-attachment-image" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {statsLoading && (
          <div className="vc-modal-overlay">
            <div className="vc-loading">
              <div className="vc-spinner"></div>
              Loading statistics...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}