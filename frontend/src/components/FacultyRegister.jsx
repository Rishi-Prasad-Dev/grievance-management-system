import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleError, handleSuccess } from '../utils';

function FacultyRegister({ onShowLogin }) {
  const [signupInfo, setSignupInfo] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password } = signupInfo;
    if (!name || !email || !password) return handleError('Name, email and password are required');
    try {
      const response = await fetch('http://localhost:5000/auth/FacultyRegister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupInfo),
      });
      const result = await response.json();

      if (!response.ok) {
        console.error('FacultyRegister error payload:', result);
        const details = result.error?.details?.[0]?.message || result.error?.message || result.message || 'Registration failed';
        return handleError(details);
      }

      handleSuccess(result.message);
      setTimeout(() => onShowLogin && onShowLogin(), 2000);

    } catch (err) {
      console.error('FacultyRegister fetch error:', err);
      handleError(err.message || 'Something went wrong during Registration');
    }
  };

  return (
    <div className="form-box register">
      <h2 className="animation-faculty" style={{ '--i': 17, '--j': 0 }}>REGISTER</h2>
      <form onSubmit={handleSignup} className="animation-faculty" noValidate>
        <div className="input-box animation-faculty" style={{ '--i': 18, '--j': 1 }}>
          <input type="text" name="name" value={signupInfo.name} onChange={handleChange} required />
          <label>Name</label>
          <i className="bx bxs-user"></i>
        </div>
        <div className="input-box animation-faculty" style={{ '--i': 19, '--j': 2 }}>
          <input type="email" name="email" value={signupInfo.email} onChange={handleChange} required />
          <label>Email</label>
          <i className="bx bxs-envelope"></i>
        </div>
        <div className="input-box animation-faculty" style={{ '--i': 20, '--j': 3 }}>
          <input type="password" name="password" value={signupInfo.password} onChange={handleChange} required />
          <label>Password</label>
          <i className="bx bxs-lock"></i>
        </div>
        <button type="submit" className="btn animation-faculty" style={{ '--i': 21, '--j': 4 }}>Register</button>
        <div className="logreg-link animation-faculty" style={{ '--i': 22, '--j': 5 }}>
          <p>
            Already have an account?{' '}
            <a href="Login" onClick={e => { e.preventDefault(); onShowLogin && onShowLogin(); }} className="login-link">Login</a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default FacultyRegister ;
