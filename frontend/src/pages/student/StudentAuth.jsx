import React, { useState } from 'react';
import StudentLogin from '../../components/StudentLogin';
import StudentRegister from '../../components/StudentRegister';
import '../../components/css/Style.css';

const StudentAuth = () => {
  const [isStudentRegister, setIsStudentRegister] = useState(false);

  const showStudentRegister = () => setIsStudentRegister(true);
  const showStudentLogin = () => setIsStudentRegister(false);

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>STUDENT</h1>
      <div className='center-container'>
        <div className={`wrapper student${isStudentRegister ? ' active' : ''}`}>
          <span className="big-animate-student"></span>
          <span className="big-animate2-student"></span>

          <div className="info-text login">
            <div className="animation-student" style={{ '--i': 0, '--j': 0 }}>
              <h2>Welcome Back!</h2>
              <p>To keep connected with us please login with your username</p>
            </div>
          </div>

          <div className="info-text register">
            <div className="animation-student" style={{ '--i': 0, '--j': 0 }}>
              <h2>Join Us!</h2>
              <p>Enter your name, username and password to create your account</p>
            </div>
          </div>

          <StudentLogin onShowStudentRegister={showStudentRegister} />
          <StudentRegister onShowStudentLogin={showStudentLogin} />
        </div>
      </div>
    </div>
  );
};

export default StudentAuth;
