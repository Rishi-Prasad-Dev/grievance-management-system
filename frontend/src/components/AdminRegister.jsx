import React, { useState } from 'react';
import { handleError, handleSuccess } from '../utils';

function AdminRegister({ onShowLogin }) {
  const [signupInfo, setSignupInfo] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password } = signupInfo;
    if (!name || !email || !password) {
      return handleError('Name, email and password are required');
    }
    try {
      const response = await fetch('http://localhost:5000/auth/AdminRegister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupInfo),
      });

      const result = await response.json();
      const { success, message, error } = result;
      if (success) {
        handleSuccess(message);
        setTimeout(() => {
          if (onShowLogin) onShowLogin();
        }, 2000);
      } else if (error) {
        const details = error?.details?.[0]?.message || error?.message || 'Registration failed';
        handleError(details);
      } else {
        handleError(message || 'Registration failed');
      }
    } catch (err) {
      handleError(err.message || 'Something went wrong during Registration');
    }
  };

  return (
    <div className="form-box register">
      <h2 className="animation-admin" style={{ '--i': 17, '--j': 0 }}>
        REGISTER
      </h2>
      <form onSubmit={handleSignup} className="animation-admin" noValidate>
        <div className="input-box animation-admin" style={{ '--i': 18, '--j': 1 }}>
          <input
            type="text"
            name="name"
            value={signupInfo.name}
            onChange={handleChange}
            required/>
          <label>Name</label>
          <i className="bx bxs-user"></i>
        </div>

        <div className="input-box animation-admin" style={{ '--i': 19, '--j': 2 }}>
          <input
            type="email"
            name="email"
            value={signupInfo.email}
            onChange={handleChange}
            required
          />
          <label>Email</label>
          <i className="bx bxs-envelope"></i>
        </div>

        <div className="input-box animation-admin" style={{ '--i': 20, '--j': 3 }}>
          <input
            type="password"
            name="password"
            value={signupInfo.password}
            onChange={handleChange}
            required
          />
          <label>Password</label>
          <i className="bx bxs-lock"></i>
        </div>

        <button type="submit" className="btn animation-admin" style={{ '--i': 21, '--j': 4 }}>
          Register
        </button>

        <div className="logreg-link animation-admin" style={{ '--i': 22, '--j': 5 }}>
          <p>
            Already have an account?{' '}
            <a href="Login"
              onClick={(e) => {
                e.preventDefault();
                if (onShowLogin) onShowLogin();
                }}
              className="login-link">Login
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default AdminRegister;
