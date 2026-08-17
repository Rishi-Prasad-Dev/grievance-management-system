import React, { useState } from 'react';
import { handleError, handleSuccess } from '../utils';

function StudentRegister({ onShowStudentLogin }) {
  const [signupInfo, setSignupInfo] = useState({
    name: '',
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, username, password } = signupInfo;
    if (!name || !username || !password) {
      return handleError('Name, username and password are required');
    }
    try {
      const response = await fetch('http://localhost:5000/auth/StudentRegister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupInfo),
      });

      const result = await response.json();
      const { success, message, error } = result;
      if (success) {
        handleSuccess(message);
        setTimeout(() => {
          if (onShowStudentLogin) onShowStudentLogin();
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
      <h2 className="animation-student" style={{ '--i': 17, '--j': 0 }}>
        REGISTER
      </h2>
      <form onSubmit={handleSignup} className="animation-student" noValidate>
        <div className="input-box animation-student" style={{ '--i': 18, '--j': 1 }}>
          <input
            type="text"
            name="name"
            value={signupInfo.name}
            onChange={handleChange}
            required
          />
          <label>Name</label>
          <i className="bx bxs-user"></i>
        </div>

        <div className="input-box animation-student" style={{ '--i': 19, '--j': 2 }}>
          <input
            type="text"
            name="username"
            value={signupInfo.username}
            onChange={handleChange}
            required
          />
          <label>Username(8 Digit Number)</label>
          <i className="bx bx-id-card"></i>
        </div>

        <div className="input-box animation-student" style={{ '--i': 20, '--j': 3 }}>
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

        <button type="submit" className="btn animation-student" style={{ '--i': 21, '--j': 4 }}>
          Register
        </button>

        <div className="logreg-link animation-student" style={{ '--i': 22, '--j': 5 }}>
          <p>
            Already have an account?{' '}
            <a
              href="Login"
              className="login-link"
              onClick={(e) => {
                e.preventDefault();
                if (onShowStudentLogin) onShowStudentLogin();
              }}
            >
              Login
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default StudentRegister;
