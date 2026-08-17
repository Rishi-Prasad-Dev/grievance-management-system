import React, { useState } from 'react';
import FacultyLogin from '../../components/FacultyLogin';
import FacultyRegister from '../../components/FacultyRegister';
import '../../components/css/Style.css';

const FacultyAuth = () => {
  const [isRegister, setIsRegister] = useState(false);

  const showRegister = () => setIsRegister(true);
  const showLogin = () => setIsRegister(false);

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>FACULTY</h1>
      <div className='center-container'>
        <div className={`wrapper faculty${isRegister ? ' active' : ''}`}>
          <span className="big-animate-faculty"></span>
          <span className="big-animate2-faculty"></span>

          <div className="info-text login">
            <div className="animation-faculty" style={{ '--i': 0, '--j': 0 }}>
              <h2>Welcome Back!</h2>
              <p>To keep connected with us please login with your email</p>
            </div>
          </div>

          <div className="info-text register">
            <div className="animation-faculty" style={{ '--i': 0, '--j': 0 }}>
              <h2>Join Us!</h2>
              <p>Enter your name, email and password to create your account</p>
            </div>
          </div>

          <FacultyLogin onShowRegister={showRegister} />
          <FacultyRegister onShowLogin={showLogin} />
        </div>
      </div>
    </div>
  );
};

export default FacultyAuth;
