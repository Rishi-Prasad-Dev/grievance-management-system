import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FaTachometerAlt, FaClipboardList, FaUser, FaChalkboardTeacher,
  FaUsers, FaStar, FaSignOutAlt, FaUserCircle, FaSpinner
} from 'react-icons/fa';
import './css/AdminSideBar.css';

/**
 * AdminSideBar Component
 * Navigation sidebar for admin interface
 * Features profile display, navigation menu, and consistent error handling
 */
function AdminSideBar() {
  // State for admin profile data
  const [adminData, setAdminData] = useState({
    name: 'Admin',
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
   * Extract admin ID from JWT token payload
   * @returns {string|null} - Admin ID or null if invalid token
   */
  const getAdminIdFromToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload._id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Navigation items configuration
  const navItems = [
    {
      path: '/AdminDashBoard',
      icon: FaTachometerAlt,
      label: 'Dashboard',
      description: 'System overview and statistics'
    },
    {
      path: '/AdminProfile',
      icon: FaUser,
      label: 'My Profile',
      description: 'Manage your admin profile'
    },
    {
      path: '/ViewComplaints',
      icon: FaClipboardList,
      label: 'All Complaints',
      description: 'View and manage complaints'
    },
    {
      path: '/ManageFaculty',
      icon: FaChalkboardTeacher,
      label: 'Manage Faculty',
      description: 'Faculty administration'
    },
    {
      path: '/ManageStudents',
      icon: FaUsers,
      label: 'Manage Students',
      description: 'Student administration'
    },
    {
      path: '/AdminFeedback',
      icon: FaStar,
      label: 'System Feedback',
      description: 'Review user feedback'
    }
  ];

  // Load admin data on component mount
  useEffect(() => {
    if (!token) {
      navigate('/AdminAuth');
      return;
    }
    fetchAdminData();
  }, [token, navigate]);

  /**
   * Fetch admin profile data for sidebar display
   */
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setImageError(false);
      
      const adminId = getAdminIdFromToken();
      if (!adminId) {
        throw new Error('Invalid token');
      }

      const { data } = await axios.get(
        `http://localhost:5000/auth/Admin/AdminProfile/${adminId}`,
        { headers: { Authorization: token } }
      );

      setAdminData({
        name: data.name || 'Admin',
        email: data.email || '',
        profileImage: data.profileImage || '',
        profileImageUrl: data.profileImageUrl || 
          (data.profileImage ? `http://localhost:5000/images/image/${data.profileImage}` : '')
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      
      // Handle authentication errors
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        handleLogout();
      } else {
        // Set default data if fetch fails
        setAdminData({
          name: 'Admin',
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
      localStorage.removeItem('adminData');
      toast.success('Logged out successfully');
      setTimeout(() => {
        navigate('/AdminAuth');
      }, 1000);
    }
  };

  /**
   * Check if current path matches navigation link
   * @param {string} path - Navigation path to check
   * @returns {boolean} - True if path is active
   */
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  /**
   * Handle profile image loading error
   */
  const handleImageError = () => {
    setImageError(true);
  };

  /**
   * Get admin initials for fallback display
   * @param {string} name - Admin name
   * @returns {string} - Initials
   */
  const getAdminInitials = (name) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="ads-sidebar">
      {/* Profile Section */}
      <div className="ads-profile-section">
        <div className="ads-profile-image-container">
          {loading ? (
            <div className="ads-loading">
              <FaSpinner className="ads-loading-spinner" />
            </div>
          ) : adminData.profileImageUrl && !imageError ? (
            <img
              src={adminData.profileImageUrl}
              alt={`${adminData.name}'s profile`}
              className="ads-profile-image"
              onError={handleImageError}
            />
          ) : (
            <div className="ads-profile-placeholder">
              <FaUserCircle />
            </div>
          )}
        </div>
        
        <div className="ads-profile-info">
          <h3>{adminData.name}</h3>
          {adminData.email && <p>{adminData.email}</p>}
          <div className="ads-user-role">Administrator</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="ads-sidebar-nav">
        <ul className="ads-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`ads-nav-link ${isActiveLink(item.path) ? 'ads-active' : ''}`}
                  title={item.description}
                >
                  <Icon className="ads-nav-icon" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer with Logout */}
      <div className="ads-sidebar-footer">
        <button
          onClick={handleLogout}
          className="ads-logout-btn"
          title="Logout from admin portal"
        >
          <FaSignOutAlt className="ads-logout-icon" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSideBar;
