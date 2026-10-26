import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDirectoryPage from './pages/DoctorDirectoryPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import AppointmentBookingPage from './pages/AppointmentBookingPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import MedicationManagementPage from './pages/MedicationManagementPage';
import MedicationReminderSettingsPage from './pages/MedicationReminderSettingsPage';
import AIChatbotPage from './pages/AIChatbotPage';
import NotificationsPage from './pages/NotificationsPage';
import UserProfilePage from './pages/UserProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ServerErrorPage from './pages/ServerErrorPage';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/error" element={<ServerErrorPage />} />
      </Route>

      {/* Authenticated Role-Protected Dashboard Layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboards by Specific Role */}
        <Route
          path="/dashboard/patient"
          element={
            <ProtectedRoute allowedRoles={['patient', 'admin']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/doctor"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Doctor Directory & Public Info */}
        <Route path="/doctors" element={<DoctorDirectoryPage />} />
        <Route path="/doctors/:id" element={<DoctorProfilePage />} />

        {/* Patient-Only Services: Appointment Booking, Medications, Medication Reminders */}
        <Route
          path="/book-appointment"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AppointmentBookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medications"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MedicationManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medications/reminders"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MedicationReminderSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* AI Health Assistant (Exclusively for Patients & Admins) */}
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute allowedRoles={['patient', 'admin']}>
              <AIChatbotPage />
            </ProtectedRoute>
          }
        />

        {/* Common Services */}
        <Route path="/appointments" element={<MyAppointmentsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
