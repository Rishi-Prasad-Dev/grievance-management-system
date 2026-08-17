import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudentSideBar from '../../components/StudentSideBar';
import '../../components/css/TrackComplaintStatus.css';

/**
 * Track complaint status for the *logged-in* student only
 */
export default function TrackComplaintStatus() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  // Extract student username from JWT
  const getStudentUsernameFromToken = () => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).username; // token has username property
    } catch {
      return null;
    }
  };

  const studentUsername = getStudentUsernameFromToken();

  // ---------------- FETCH ----------------
  useEffect(() => {
    if (studentUsername && token) {
      fetchComplaints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentUsername, token]);

  const fetchComplaints = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/complain/student/${studentUsername}`,
        { headers: { Authorization: token } }
      );
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load complaints. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Build status badge class
  const statusClass = (status) =>
    `tcs-status tcs-status-${status.toLowerCase().replace(/\s+/g, '-')}`;

  // ---------------- RENDER ----------------
  return (
    <div className="tcs-layout">
      <div className="tcs-sidebar">
        <StudentSideBar />
      </div>

      <main className="tcs-content" aria-label="Track Complaint Status">
        <h1 className="tcs-title">🔍 Your Complaint Status</h1>

        {loading && <div className="tcs-loading">Loading complaints...</div>}

        {error && (
          <div className="tcs-error">
            {error}
            <button className="tcs-retry-btn" onClick={fetchComplaints}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && complaints.length === 0 && (
          <div className="tcs-empty">
            <span className="tcs-empty-icon" aria-hidden="true">
              📝
            </span>
            <h2 className="tcs-empty-title">No complaints found</h2>
            <p className="tcs-empty-text">
              You haven't submitted any complaints.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          complaints.length > 0 &&
          complaints.map((c) => (
            <section
              key={c._id}
              className="tcs-card"
              aria-label={`Complaint ${c.ComplaintTitle}`}
            >
              <h2 className="tcs-card-title">{c.ComplaintTitle}</h2>
              <p>
                <strong>Category:</strong> {c.ProblemType}
              </p>
              <p>
                <strong>Description:</strong> {c.ProblemDescription}
              </p>
              <p>
                <strong>Email:</strong> {c.Email || 'N/A'}
              </p>
              <p>
                <strong>Contact Number:</strong> {c.ContactNumber || 'N/A'}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={statusClass(c.status)}>{c.status}</span>
              </p>
              <p>
                <strong>Submitted On:</strong>{' '}
                {new Date(c.ComplaintDateTime).toLocaleDateString()}
              </p>
              <p>
                <strong>Last Updated:</strong>{' '}
                {new Date(c.updatedAt).toLocaleDateString()}
              </p>
            </section>
          ))}

        {/* STATUS LEGEND */}
        <aside className="tcs-legend" aria-label="Status Legend">
          <h2 className="tcs-legend-title">Status Guide</h2>
          <ul className="tcs-legend-list">
            <li>
              <span className="tcs-badge tcs-badge-pending"></span> Pending
            </li>
            <li>
              <span className="tcs-badge tcs-badge-acknowledged"></span>{' '}
              Acknowledged
            </li>
            <li>
              <span className="tcs-badge tcs-badge-in-progress"></span>{' '}
              In Progress
            </li>
            <li>
              <span className="tcs-badge tcs-badge-on-hold"></span> On Hold
            </li>
            <li>
              <span className="tcs-badge tcs-badge-resolved"></span> Resolved
            </li>
            <li>
              <span className="tcs-badge tcs-badge-closed"></span> Closed
            </li>
            <li>
              <span className="tcs-badge tcs-badge-rejected"></span> Rejected
            </li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
