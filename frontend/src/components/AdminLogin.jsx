import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleError, handleSuccess } from '../utils';

/**
 * AdminLogin Component
 * Handles admin authentication and navigation
 * Only stores token in localStorage
 */
function AdminLogin({ onShowRegister }) {
  const navigate = useNavigate();
  
  // Form state
  const [loginInfo, setLoginInfo] = useState({
    email: '',
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
    const { email, password } = loginInfo;

    // Validation
    if (!email || !password) {
      return handleError('Email and password are required');
    }

    setLoading(true);
    
    try {
      // API call
      const response = await fetch('http://localhost:5000/auth/AdminLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginInfo),
      });

      const result = await response.json();
      const { success, message, jwtToken, error } = result;

      if (success) {
        handleSuccess(message);
        // Only store token (fixed: removed extra data)
        localStorage.setItem('token', jwtToken);
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/AdminDashBoard');
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
      <h2 className="animation-admin" style={{ '--i': 0, '--j': 21 }}>Admin Login</h2>
      
      <form onSubmit={handleLogin}>
        <div className="input-box animation-admin" style={{ '--i': 1, '--j': 22 }}>
          <input
            type="email"
            name="email"
            value={loginInfo.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <label>Email</label>
          <i className="bx bxs-envelope"></i>
        </div>

        <div className="input-box animation-admin" style={{ '--i': 2, '--j': 23 }}>
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
          className="btn animation-admin" 
          disabled={loading}
          style={{ '--i': 3, '--j': 24 }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="logreg-link animation-admin" style={{ '--i': 4, '--j': 25 }}>
          <p>Don't have an account? 
            <a href="#" onClick={onShowRegister} className="register-link"> Sign Up</a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default AdminLogin;
