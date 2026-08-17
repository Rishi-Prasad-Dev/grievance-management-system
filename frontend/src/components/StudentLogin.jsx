import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleError, handleSuccess } from '../utils';

/**
 * StudentLogin Component
 * Handles student authentication and navigation
 * Only stores token in localStorage
 */
function StudentLogin({ onShowStudentRegister }) {
  const navigate = useNavigate();
  
  // Form state
  const [loginInfo, setLoginInfo] = useState({
    username: '',
    password: '',
  });
  
  // UI state
  const [loading, setLoading] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    const { username, password } = loginInfo;

    // Validation
    if (!username || !password) {
      return handleError('Username and password are required');
    }

    setLoading(true);
    
    try {
      // API call
      const response = await fetch('http://localhost:5000/auth/StudentLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginInfo),
      });

      const result = await response.json();
      const { success, message, jwtToken, error } = result;

      if (success) {
        handleSuccess(message);
        // Only store token (fixed: removed all extra localStorage items)
        localStorage.setItem('token', jwtToken);
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/StudentDashBoard');
        }, 1500);
      } else if (error) {
        const details = error?.details?.[0]?.message || error?.message || 'Login failed';
        handleError(details);
      } else {
        handleError(message || 'Login failed');
      }
    } catch (err) {
      handleError(err.message || 'Something went wrong during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-box login">
      <h2 className="animation-student" style={{ '--i': 0, '--j': 21 }}>Student Login</h2>
      
      <form onSubmit={handleLogin}>
        <div className="input-box animation-student" style={{ '--i': 1, '--j': 22 }}>
          <input
            type="text"
            name="username"
            value={loginInfo.username}
            onChange={handleChange}
            required
            autoComplete="username"
          />
          <label>Username</label>
          <i className="bx bxs-user"></i>
        </div>

        <div className="input-box animation-student" style={{ '--i': 2, '--j': 23 }}>
          <input
            type="password"
            name="password"
            value={loginInfo.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          <label>Password</label>
          <i className="bx bxs-lock-alt"></i>
        </div>

        <button 
          type="submit" 
          className="btn animation-student" 
          disabled={loading}
          style={{ '--i': 3, '--j': 24 }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="logreg-link animation-student" style={{ '--i': 4, '--j': 25 }}>
          <p>Don't have an account? 
            <a href="#" onClick={onShowStudentRegister} className="register-link"> Sign Up</a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default StudentLogin;
