import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/css/Home.css';

/**
 * Home Component - Landing page with portal selection
 * Features a React icon header and three portal cards for navigation
 * Provides access to Admin, Faculty, and Student authentication pages
 */
function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Header section with React icon and title */}
      <header className="home-header">
        <div className="home-header-top">
          {/* React icon at the top */}
          <div className="home-react-icon">
            <i className='bx bxl-react'></i>
          </div>
          <h1>Complaint Management System</h1>
          <p className="subtitle">Choose your portal to get started</p>
        </div>
      </header>

      {/* Main content with portal selection cards */}
      <main className="home-main">
        
        {/* Admin Portal Card */}
        <div 
          className="portal-card admin-portal"
          onClick={() => navigate('/AdminAuth')}
          onKeyPress={e => { if (e.key === 'Enter') navigate('/AdminAuth'); }}
          tabIndex={0}
          role="button"
          aria-label="Enter Admin Portal"
        >
          <div className="icon-circle">
            <i className='bx bxs-user-badge'></i>
          </div>
          <h3>Admin Portal</h3>
          <p>Manage the system and oversee all complaint operations with full administrative control.</p>
          <button className="portal-btn" tabIndex={-1}>
            Enter Admin
          </button>
        </div>

        {/* Faculty Portal Card */}
        <div 
          className="portal-card faculty-portal"
          onClick={() => navigate('/FacultyAuth')}
          onKeyPress={e => { if (e.key === 'Enter') navigate('/FacultyAuth'); }}
          tabIndex={0}
          role="button"
          aria-label="Enter Faculty Portal"
        >
          <div className="icon-circle">
            <i className='bx bxs-graduation'></i>
          </div>
          <h3>Faculty Portal</h3>
          <p>Review, manage and resolve student complaints assigned to your department.</p>
          <button className="portal-btn" tabIndex={-1}>
            Enter Faculty
          </button>
        </div>

        {/* Student Portal Card */}
        <div 
          className="portal-card student-portal"
          onClick={() => navigate('/StudentAuth')}
          onKeyPress={e => { if (e.key === 'Enter') navigate('/StudentAuth'); }}
          tabIndex={0}
          role="button"
          aria-label="Enter Student Portal"
        >
          <div className="icon-circle">
            <i className='bx bxs-user-circle'></i>
          </div>
          <h3>Student Portal</h3>
          <p>Submit new complaints and track the status of your existing submissions.</p>
          <button className="portal-btn" tabIndex={-1}>
            Enter Student
          </button>
        </div>
      </main>

      {/* Footer with copyright information */}
      <footer className="home-footer">
        <p>&copy; 2025 Grievance App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
