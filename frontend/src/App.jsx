import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AiDoctorPage from './pages/AiDoctorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BookAppointment from './pages/BookAppointment';
import CalendarPage from './pages/CalendarPage';
import PharmacyPage from './pages/PharmacyPage';
import PrescriptionPage from './pages/PrescriptionPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Patient Routes */}
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/ai-doctor" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AiDoctorPage />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['patient', 'admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/book-appointment" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <BookAppointment />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <CalendarPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PharmacyPage />
            </ProtectedRoute>
          } />
          <Route path="/prescription" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PrescriptionPage />
            </ProtectedRoute>
          } />

          {/* Doctor Routes */}
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
