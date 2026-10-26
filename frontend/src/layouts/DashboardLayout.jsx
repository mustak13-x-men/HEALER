import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic header titles based on pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/patient')) return 'Patient Health Dashboard';
    if (path.includes('/dashboard/doctor')) return 'Doctor Clinical Overview';
    if (path.includes('/dashboard/admin')) return 'Administration & Analytics';
    if (path.includes('/doctors')) return 'Specialist Directory';
    if (path.includes('/book-appointment')) return 'Book Consultation';
    if (path.includes('/appointments')) return 'My Clinical Appointments';
    if (path.includes('/medications/reminders')) return 'Medication Reminders';
    if (path.includes('/medications')) return 'My Prescriptions & Regimens';
    if (path.includes('/chatbot')) return 'AI Health Assistant';
    if (path.includes('/notifications')) return 'Notification Center';
    if (path.includes('/profile')) return 'Profile & Health Record';
    return 'Healthcare Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} title={getPageTitle()} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
