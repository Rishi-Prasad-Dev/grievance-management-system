import React, { useState } from 'react';
import AdminLogin from '../../components/AdminLogin';
import AdminRegister from '../../components/AdminRegister';
import '../../components/css/Style.css';

const AdminAuth = () => {
  const [isRegister, setIsRegister] = useState(false);

  const showRegister = () => setIsRegister(true);
  const showLogin = () => setIsRegister(false);

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>ADMIN</h1>
      <div className='center-container'>
        <div className={`wrapper admin${isRegister ? ' active' : ''}`}>
          <span className="big-animate-admin"></span>
          <span className="big-animate2-admin"></span>

          <div className="info-text login">
            <div className="animation-admin" style={{ '--i': 0, '--j': 0 }}>
              <h2>Welcome Back!</h2>
              <p>To keep connected with us please login with your email</p>
            </div>
          </div>

          <div className="info-text register">
            <div className="animation-admin" style={{ '--i': 0, '--j': 0 }}>
              <h2>Join Us!</h2>
              <p>Enter your name, email and password to create your account</p>
            </div>
          </div>

          <AdminLogin onShowRegister={showRegister} />
          <AdminRegister onShowLogin={showLogin} />
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
