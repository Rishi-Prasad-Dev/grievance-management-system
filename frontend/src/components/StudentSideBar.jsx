import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  BsHouseDoorFill,
  BsPersonFill,
  BsPenFill,
  BsQuestionCircleFill,
  BsStarFill,
  BsSearch,
  BsBoxArrowRight,
} from 'react-icons/bs';
import { FaUser, FaSpinner } from 'react-icons/fa';
import './css/StudentSidebar.css';

/**
 * StudentSideBar Component
 * Navigation sidebar for student interface
 * Features profile display, navigation menu, and consistent error handling
 */
function StudentSideBar() {
  // State for student profile data
  const [student, setStudent] = useState({
    name: 'Student',
    email: '',
    username: '',
    profileImage: '',
    profileImageUrl: ''
  });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Navigation hooks
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  // Navigation items configuration
  const navItems = [
    {
      path: '/StudentDashBoard',
      icon: BsHouseDoorFill,
      label: 'Dashboard',
      description: 'Overview and statistics'
    },
    {
      path: '/StudentProfile',
      icon: BsPersonFill,
      label: 'My Profile',
      description: 'Manage your profile'
    },
    {
      path: '/Complain',
      icon: BsPenFill,
      label: 'New Complaint',
      description: 'Submit a complaint'
    },
    {
      path: '/TrackComplaintStatus',
      icon: BsSearch,
      label: 'Track Status',
      description: 'Check complaint status'
    },
    {
      path: '/StudentInfoRequests',
      icon: BsQuestionCircleFill,
      label: 'Info Requests',
      description: 'Respond to faculty queries'
    },
    {
      path: '/StudentFeedback',
      icon: BsStarFill,
      label: 'Feedback',
      description: 'Rate and review system'
    }
  ];

  // Load student data on component mount
  useEffect(() => {
    if (!token) {
      navigate('/StudentAuth');
      return;
    }
    fetchStudentData();
  }, [token, navigate]);

  /**
   * Fetch student profile data for sidebar display
   */
  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setImageError(false);
      
      const { data } = await axios.get('http://localhost:5000/auth/Student/profile', {
        headers: { Authorization: token },
      });

      setStudent({
        name: data.name || 'Student',
        email: data.email || '',
        username: data.username || '',
        profileImage: data.profileImage || '',
        profileImageUrl: data.profileImageUrl || 
          (data.profileImage ? `http://localhost:5000/images/image/${data.profileImage}` : '')
      });
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        handleLogout();
      } else {
        // Set default data if fetch fails
        setStudent({
          name: 'Student',
          email: '',
          username: '',
          profileImage: '',
          profileImageUrl: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user logout with confirmation
   */
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('studentData');
      toast.success('Logged out successfully');
      setTimeout(() => {
        navigate('/StudentAuth');
      }, 1000);
    }
  };

  /**
   * Check if current path matches navigation link
   * @param {string} path - Navigation path to check
   * @returns {boolean} - True if path is active
   */
  const isActive = (path) => location.pathname === path;

  /**
   * Handle profile image loading error
   */
  const handleImageError = () => {
    setImageError(true);
  };

  /**
   * Get student initials for fallback display
   * @param {string} name - Student name
   * @returns {string} - Initials
   */
  const getStudentInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="ssb-sidebar">
      {/* Profile Section */}
      <div className="ssb-sidebar-profile">
        <div className="ssb-profile-image-container">
          {loading ? (
            <FaSpinner className="ssb-loading-spinner" />
          ) : student.profileImageUrl && !imageError ? (
            <img
              src={student.profileImageUrl}
              alt={`${student.name}'s profile`}
              className="ssb-profile-image"
              onError={handleImageError}
            />
          ) : (
            <div className="ssb-profile-placeholder">
              {getStudentInitials(student.name)}
            </div>
          )}
        </div>
        
        <div className="ssb-profile-info">
          <h3>{student.name}</h3>
          {student.email && <p>{student.email}</p>}
          <div className="ssb-user-role">Student</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="ssb-sidebar-nav">
        <ul className="ssb-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`ssb-link ${isActive(item.path) ? 'ssb-active' : ''}`}
                  title={item.description}
                >
                  <Icon className="ssb-nav-icon" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer with Logout */}
      <div className="ssb-sidebar-footer">
        <button
          onClick={handleLogout}
          className="ssb-logout-btn"
          title="Logout from student portal"
        >
          <BsBoxArrowRight className="ssb-logout-icon" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default StudentSideBar;
