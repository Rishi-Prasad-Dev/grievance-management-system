import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'boxicons/css/boxicons.min.css';

import AdminDashBoard from './pages/admin/AdminDashBoard';
import Complain from './pages/student/Complain';
import StudentDashBoard from './pages/student/StudentDashBoard';
import RefreshHandler from './RefreshHandler';
import Home from './pages/Home';
import StudentAuth from './pages/student/StudentAuth';
import AdminAuth from './pages/admin/AdminAuth';
import ViewComplaints from './pages/admin/ViewComplaints';
import StudentProfile from './pages/student/StudentProfile';
import AdminProfile from './pages/admin/AdminProfile';
import FacultyAuth from './pages/faculty/FacultyAuth';
import FacultyDashBoard from './pages/faculty/FacultyDashBoard';
import FacultyProfile from './pages/faculty/FacultyProfile';
import FacultyViewComplaints from './pages/faculty/FacultyViewComplaints';
import StudentInfoRequests from './pages/student/StudentInfoRequests';
import StudentFeedback from './pages/student/StudentFeedback';
import AdminFeedback from './pages/admin/AdminFeedback';
import TrackComplaintStatus from './pages/student/TrackComplaintStatus';
import FacultyHistory from './pages/faculty/FacultyHistory';
import ManageFaculty from './pages/admin/ManageFaculty'; // New import
import ManageStudents from './pages/admin/ManageStudents'; // New import

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <BrowserRouter>
      <div className="App">
        <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/StudentLogin" element={<StudentAuth />} />
          <Route path="/AdminLogin" element={<AdminAuth />} />
          <Route path="/FacultyAuth" element={<FacultyAuth />} />
          <Route path="/AdminAuth" element={<AdminAuth />} />
          <Route path="/StudentAuth" element={<StudentAuth/>} />
          
          <Route path="/StudentDashBoard" element={
            isAuthenticated ? <StudentDashBoard /> : <Navigate to="/StudentLogin" />
          } />
          
          <Route path="/AdminDashBoard" element={
            isAuthenticated ? <AdminDashBoard /> : <Navigate to="/AdminLogin" />
          } />
          
          <Route path="/FacultyDashBoard" element={
            isAuthenticated ? <FacultyDashBoard /> : <Navigate to="/FacultyAuth" />
          } />
          
          <Route path="/Complain" element={<PrivateRoute><Complain /></PrivateRoute>} />
          <Route path="/ViewComplaints" element={<PrivateRoute><ViewComplaints /></PrivateRoute>} />
          <Route path="/StudentProfile" element={<PrivateRoute><StudentProfile /></PrivateRoute>} />
          <Route path="/AdminProfile" element={<PrivateRoute><AdminProfile /></PrivateRoute>} />
          <Route path="/FacultyProfile" element={<PrivateRoute><FacultyProfile /></PrivateRoute>} />
          <Route path="/FacultyViewComplaints" element={<PrivateRoute><FacultyViewComplaints /></PrivateRoute>} />
          <Route path="/StudentInfoRequests" element={<PrivateRoute><StudentInfoRequests /></PrivateRoute>} />
          <Route path="/StudentFeedback" element={<PrivateRoute><StudentFeedback /></PrivateRoute>} />
          <Route path="/AdminFeedback" element={<PrivateRoute><AdminFeedback /></PrivateRoute>} />
          <Route path="/TrackComplaintStatus" element={<PrivateRoute><TrackComplaintStatus /></PrivateRoute>} />
          <Route path="/FacultyHistory" element={<PrivateRoute><FacultyHistory /></PrivateRoute>} />
          
          <Route path="/ManageFaculty" element={<PrivateRoute><ManageFaculty /></PrivateRoute>} />
          <Route path="/ManageStudents" element={<PrivateRoute><ManageStudents /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

export default App;
