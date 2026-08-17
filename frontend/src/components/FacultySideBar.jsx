import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FaHome, FaUser, FaClipboardList, FaHistory,
  FaSignOutAlt, FaUserTie, FaSpinner, FaUserCircle
} from 'react-icons/fa';
import './css/FacultySideBar.css';

/**
 * FacultySideBar Component
 * Navigation sidebar for faculty interface
 * Features profile display, navigation menu, and consistent error handling
 */
export default function FacultySideBar() {
  // State for faculty profile data
  const [facultyData, setFacultyData] = useState({
    name: 'Faculty Member',
    email: '',
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

  /**
   * Extract faculty ID from JWT token payload
   * @returns {string|null} - Faculty ID or null if invalid token
   */
  const getFacultyIdFromToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload._id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const facultyId = getFacultyIdFromToken();

  // Navigation items configuration
  const navItems = [
    {
      path: '/FacultyDashBoard',
      icon: FaHome,
      label: 'Dashboard',
      description: 'View overview and statistics'
    },
    {
      path: '/FacultyProfile',
      icon: FaUser,
      label: 'My Profile',
      description: 'Manage your profile'
    },
    {
      path: '/FacultyViewComplaints',
      icon: FaClipboardList,
      label: 'Assigned Complaints',
      description: 'Handle assigned complaints'
    },
    {
      path: '/FacultyHistory',
      icon: FaHistory,
      label: 'History',
      description: 'View completed complaints'
    }
  ];

  // Load faculty data on component mount
  useEffect(() => {
    if (!token || !facultyId) {
      toast.error('Please log in to access the faculty portal');
      navigate('/FacultyAuth');
      return;
    }
    fetchFacultyInfo();
  }, [token, facultyId, navigate]);

  /**
   * Fetch faculty profile information for sidebar display
   */
  const fetchFacultyInfo = async () => {
    try {
      setLoading(true);
      setImageError(false);
      
      const { data } = await axios.get(
        `http://localhost:5000/auth/Faculty/FacultyProfile/${facultyId}`,
        { headers: { Authorization: token } }
      );

      setFacultyData({
        name: data.name || 'Faculty Member',
        email: data.email || '',
        profileImage: data.profileImage || '',
        profileImageUrl: data.profileImageUrl ||
          (data.profileImage ? `http://localhost:5000/images/image/${data.profileImage}` : '')
      });
    } catch (error) {
      console.error('Error fetching faculty info:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        handleLogout();
      } else {
        // Set default data if fetch fails
        setFacultyData({
          name: 'Faculty Member',
          email: '',
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
      localStorage.removeItem('facultyData');
      toast.success('Logged out successfully');
      setTimeout(() => {
        navigate('/FacultyAuth');
      }, 1000);
    }
  };

  /**
   * Check if current path matches navigation link
   * @param {string} path - Navigation path to check
   * @returns {boolean} - True if path is active
   */
  const isActive = (path) => {
    return location.pathname === path;
  };

  /**
   * Handle profile image loading error
   */
  const handleImageError = () => {
    setImageError(true);
  };

  /**
   * Get faculty initials for fallback display
   * @param {string} name - Faculty name
   * @returns {string} - Initials
   */
  const getFacultyInitials = (name) => {
    if (!name) return 'FM';
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="fss-sidebar">
      {/* Profile Section */}
      <div className="fss-profile-section">
        <div className="fss-profile-image-container">
          {loading ? (
            <div className="fss-loading">
              <FaSpinner className="fss-loading-spinner" />
            </div>
          ) : facultyData.profileImageUrl && !imageError ? (
            <img
              src={facultyData.profileImageUrl}
              alt={`${facultyData.name}'s profile`}
              className="fss-profile-image"
              onError={handleImageError}
            />
          ) : (
            <div className="fss-profile-placeholder">
              <FaUserTie />
            </div>
          )}
        </div>
        
        <div className="fss-profile-info">
          <h3>{facultyData.name}</h3>
          {facultyData.email && <p>{facultyData.email}</p>}
          <div className="fss-user-role">Faculty</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="fss-sidebar-nav">
        <ul className="fss-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`fss-nav-link ${isActive(item.path) ? 'fss-active' : ''}`}
                  title={item.description}
                >
                  <Icon className="fss-nav-icon" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer with Logout */}
      <div className="fss-sidebar-footer">
        <button
          onClick={handleLogout}
          className="fss-logout-btn"
          title="Logout from faculty portal"
        >
          <FaSignOutAlt className="fss-logout-icon" />
          Logout
        </button>
      </div>
    </div>
  );
}
