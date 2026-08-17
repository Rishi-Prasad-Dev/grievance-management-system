import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import FacultySideBar from '../../components/FacultySideBar';
import '../../components/css/FacultyViewComplaints.css';
import {
  FaClipboardList,
  FaClock,
  FaCheck,
  FaPlay,
  FaPause,
  FaUsers,     
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaImage,
  FaPaperPlane,
  FaTimes,
  FaSpinner,
} from 'react-icons/fa';

/**
 * FacultyViewComplaints Component
 * Shows assigned complaints with statistics and management capabilities
 */
export default function FacultyViewComplaints() {
  // ---------------- STATE ----------------
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [infoRequests, setInfoRequests] = useState({});
  const [lightbox, setLightbox] = useState({ show: false, src: '', title: '' });
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    acknowledged: 0,
    inProgress: 0,
    onHold: 0,
  });

  // Form states
  const [activeInfoForm, setActiveInfoForm] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [sendingInfo, setSendingInfo] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // ---------------- HELPERS ----------------
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
    { key: 'All', label: 'All Complaints', icon: FaClipboardList },
    { key: 'Pending', label: 'Pending', icon: FaClock },
    { key: 'Acknowledged', label: 'Acknowledged', icon: FaCheck },
    { key: 'In Progress', label: 'In Progress', icon: FaPlay },
    { key: 'On Hold', label: 'On Hold', icon: FaPause },
    { key: 'Handled', label: 'Handled', icon: FaUsers },
  ];

  // ---------------- SIDE-EFFECTS ----------------
  useEffect(() => {
    if (!token || !facultyId) {
      toast.error('Please log in to access complaints');
      navigate('/FacultyAuth');
      return;
    }
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, facultyId]);

  // Re-filter whenever data or selected filter changes
  useEffect(() => {
    filterComplaintsByStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints, statusFilter]);

  // ---------------- DATA FETCH ----------------
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      // includeOthers=true lets backend tag “assignedToOther” complaints
      const res = await axios.get(
        `http://localhost:5000/complain/viewcomplains/active/${facultyId}?includeOthers=true`,
        { headers: { Authorization: token } }
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setComplaints(data);

      // quick stats
      const stats = data.reduce(
        (acc, c) => {
          acc.total++;
          switch (c.status) {
            case 'Pending':
              acc.pending++;
              break;
            case 'Acknowledged':
              acc.acknowledged++;
              break;
            case 'In Progress':
              acc.inProgress++;
              break;
            case 'On Hold':
              acc.onHold++;
              break;
            default:
              break;
          }
          return acc;
        },
        { total: 0, pending: 0, acknowledged: 0, inProgress: 0, onHold: 0 }
      );
      setStatistics(stats);

      // fetch info-requests for every complaint
      const reqPromises = data.map((c) =>
        axios
          .get(`http://localhost:5000/info-requests/complaint/${c._id}`, {
            headers: { Authorization: token },
          })
          .catch(() => ({ data: [] }))
      );
      const reqResults = await Promise.all(reqPromises);
      const map = {};
      data.forEach((c, idx) => {
        map[c._id] = reqResults[idx].data || [];
      });
      setInfoRequests(map);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      if ([401, 403].includes(err.response?.status)) {
        localStorage.removeItem('token');
        toast.error('Session expired. Please log in again.');
        navigate('/FacultyAuth');
      } else {
        toast.error('Failed to load complaints');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FILTER LOGIC ----------------
  const filterComplaintsByStatus = () => {
    if (statusFilter === 'All') {
      setFilteredComplaints(complaints);
    } else if (statusFilter === 'Handled') {
      // complaints handled by OTHER faculty with same category (assignedToOther flag)
      setFilteredComplaints(complaints.filter((c) => c.assignedToOther));
    } else {
      setFilteredComplaints(complaints.filter((c) => c.status === statusFilter));
    }
  };

  // ---------------- ACTIONS ----------------
  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/complain/${complaintId}/status`,
        { status: newStatus, facultyId },
        { headers: { Authorization: token } }
      );
      toast.success(`Status updated to ${newStatus}`);
      fetchComplaints();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const sendInfoRequest = async (complaintId) => {
    if (!infoMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    try {
      setSendingInfo(true);
      await axios.post(
        'http://localhost:5000/info-requests/create',
        { complaintId, facultyMessage: infoMessage },
        { headers: { Authorization: token } }
      );
      toast.success('Information request sent to student');
      setActiveInfoForm(null);
      setInfoMessage('');
      fetchComplaints();
    } catch (err) {
      console.error('Send info request error:', err);
      toast.error('Failed to send information request');
    } finally {
      setSendingInfo(false);
    }
  };

  // ---------------- UI HELPERS ----------------
  const getStatusColor = (status) => {
    const colors = {
      Pending: '#ffc107',
      Acknowledged: '#17a2b8',
      'In Progress': '#fd7e14',
      'On Hold': '#6f42c1',
      Resolved: '#28a745',
      Closed: '#6c757d',
      Rejected: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // ---------------- RENDER ----------------
  if (loading) {
    return (
      <div className="fvc-layout">
        <FacultySideBar />
        <main className="fvc-content" role="main" aria-busy="true">
          <div className="fvc-loading" role="status" aria-live="assertive">
            <div className="fvc-spinner" aria-hidden="true"></div>
            <p>Loading complaints...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fvc-layout">
      <FacultySideBar />
      <main className="fvc-content" aria-labelledby="complaints-title">
        {/* HEADER */}
        <header className="fvc-header">
          <div className="fvc-header-content">
            <h1 id="complaints-title">
              <FaClipboardList /> Complaints Dashboard
            </h1>
            <p>Manage and respond to complaints assigned to your department</p>
          </div>

          {/* FILTERS */}
          <div className="fvc-filters">
            {filterOptions.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`fvc-filter-btn ${
                  statusFilter === key ? 'fvc-active' : ''
                }`}
                onClick={() => setStatusFilter(key)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* COMPLAINTS GRID */}
        <section className="fvc-complaints-grid">
          {filteredComplaints.length === 0 && (
            <div className="fvc-empty-state">
              <p className="fvc-empty-icon">📭</p>
              <h3>No complaints match the selected filter</h3>
              <p>Try a different filter option.</p>
            </div>
          )}

          {filteredComplaints.map((c) => (
            <article
              key={c._id}
              className="fvc-complaint-card"
              aria-labelledby={`complaint-${c._id}`}
            >
              {/* CARD HEADER */}
              <header className="fvc-card-header">
                <h3 id={`complaint-${c._id}`}>{c.ComplaintTitle}</h3>
                <span
                  className="fvc-status-badge"
                  style={{ background: getStatusColor(c.status) }}
                >
                  {statusFilter === 'Handled' ? 'Handled' : c.status}
                </span>
              </header>

              {/* CARD BODY */}
              <div className="fvc-card-body">
                {/* Meta */}
                <div className="fvc-complaint-meta">
                  <span className="fvc-type-badge">{c.ProblemType}</span>
                  <span className="fvc-date">
                    <FaCalendarAlt /> {formatDate(c.ComplaintDateTime)}
                  </span>
                </div>

                {/* Description */}
                <div className="fvc-description">
                  <strong>Description</strong>
                  <p>{c.ProblemDescription}</p>
                </div>

                {/* Assigned notice when handled by other faculty */}
                {c.assignedToOther && (
                  <div className="fvc-assigned-notice">
                    Already handled by {c.assignedFaculty?.name || 'another faculty'}
                  </div>
                )}
              </div>

              {/* CARD FOOTER – hide for handled complaints */}
              {!c.assignedToOther && (
                <footer className="fvc-card-footer">
                  <div className="fvc-status-section">
                    <label htmlFor={`status-${c._id}`}>Update Status:</label>
                    <select
                      id={`status-${c._id}`}
                      className="fvc-status-select"
                      value={c.status}
                      onChange={(e) => handleStatusChange(c._id, e.target.value)}
                    >
                      {[
                        'Pending',
                        'Acknowledged',
                        'In Progress',
                        'On Hold',
                        'Resolved',
                        'Closed',
                        'Rejected',
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* INFO REQUEST FORM TOGGLE */}
                  {activeInfoForm === c._id ? (
                    <form
                      className="fvc-info-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendInfoRequest(c._id);
                      }}
                    >
                      <h4>Request Additional Information</h4>
                      <textarea
                        className="fvc-message-textarea"
                        placeholder="Enter message for student..."
                        value={infoMessage}
                        onChange={(e) => setInfoMessage(e.target.value)}
                        maxLength={500}
                        required
                      ></textarea>
                      <div className="fvc-form-actions">
                        <button
                          type="submit"
                          className="fvc-btn-send"
                          disabled={sendingInfo}
                        >
                          {sendingInfo ? <FaSpinner className="spin" /> : <FaPaperPlane />}
                          Send
                        </button>
                        <button
                          type="button"
                          className="fvc-btn-cancel"
                          onClick={() => {
                            setActiveInfoForm(null);
                            setInfoMessage('');
                          }}
                        >
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="fvc-btn-send"
                      onClick={() => setActiveInfoForm(c._id)}
                    >
                      <FaPaperPlane /> Ask for Info
                    </button>
                  )}
                </footer>
              )}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
